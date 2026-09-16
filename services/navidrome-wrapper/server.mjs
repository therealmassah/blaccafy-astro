import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const config = {
  port: Number(process.env.PORT || 8787),
  baseUrl: (process.env.NAVIDROME_BASE_URL || '').replace(/\/$/, ''),
  botUsername: process.env.NAVIDROME_BOT_USERNAME || '',
  botPassword: process.env.NAVIDROME_BOT_PASSWORD || '',
  loginPath: process.env.NAVIDROME_LOGIN_PATH || '/auth/login',
  userListPath: process.env.NAVIDROME_USER_LIST_PATH || '/api/user?_end=15&_order=ASC&_sort=userName&_start=0',
  sharedSecret: process.env.WRAPPER_SHARED_SECRET || '',
  activationBaseUrl: (process.env.NAVIDROME_ACTIVATION_BASE_URL || '').replace(/\/$/, ''),
  clientUniqueId: process.env.NAVIDROME_CLIENT_UNIQUE_ID || crypto.randomUUID(),
  libraryMapJson: process.env.NAVIDROME_LIBRARY_MAP_JSON || '{}',
  activationTokenTtlMs: Number(process.env.NAVIDROME_ACTIVATION_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000),
  activationStatePath: process.env.NAVIDROME_ACTIVATION_STATE_PATH || '/app/data/navidrome-activation-state.json'
};

if (!config.baseUrl) {
  console.warn('NAVIDROME_BASE_URL is missing');
}

let sessionCache = null;
let activationStateCache = null;
let activationStateLoadPromise = null;
let activationUseLock = Promise.resolve();

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function text(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function sha256Base64Url(value) {
  return crypto.createHash('sha256').update(value).digest('base64url');
}

function hmacBase64Url(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function encodeTokenPayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeTokenPayload(encoded) {
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
}

function defaultActivationState() {
  return { usedNonces: {}, pendingNonces: {} };
}

async function loadActivationState() {
  if (activationStateCache) return activationStateCache;
  if (!activationStateLoadPromise) {
    activationStateLoadPromise = (async () => {
      try {
        const raw = await fs.readFile(config.activationStatePath, 'utf8');
        const parsed = JSON.parse(raw);
        const usedNonces = parsed?.usedNonces && typeof parsed.usedNonces === 'object' ? parsed.usedNonces : {};
        const pendingNonces = parsed?.pendingNonces && typeof parsed.pendingNonces === 'object' ? parsed.pendingNonces : {};
        activationStateCache = { usedNonces, pendingNonces };
      } catch (error) {
        if (error && error.code !== 'ENOENT') {
          console.warn(`Failed to read activation state: ${error.message}`);
        }
        activationStateCache = defaultActivationState();
      }
      return activationStateCache;
    })();
  }

  return activationStateLoadPromise;
}

async function saveActivationState(state) {
  activationStateCache = state;
  const dir = path.dirname(config.activationStatePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(config.activationStatePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

async function withActivationLock(work) {
  const run = activationUseLock.then(work, work);
  activationUseLock = run.then(() => undefined, () => undefined);
  return run;
}

function cleanupActivationState(state) {
  const now = Date.now();
  for (const [nonce, expiresAt] of Object.entries(state.usedNonces || {})) {
    if (Number(expiresAt) && Number(expiresAt) < now) {
      delete state.usedNonces[nonce];
    }
  }

  for (const [nonce, expiresAt] of Object.entries(state.pendingNonces || {})) {
    if (Number(expiresAt) && Number(expiresAt) < now) {
      delete state.pendingNonces[nonce];
    }
  }
}

function createActivationToken(plan) {
  if (!config.sharedSecret) {
    throw new Error('WRAPPER_SHARED_SECRET is required to create activation tokens');
  }

  const issuedAt = Date.now();
  const payload = {
    navidromeUser: plan.navidromeUser,
    email: plan.email,
    issuedAt,
    expiresAt: issuedAt + config.activationTokenTtlMs,
    nonce: sha256Base64Url(`${plan.navidromeUser}:${plan.email}:${issuedAt}:${crypto.randomUUID()}`)
  };
  const encoded = encodeTokenPayload(payload);
  const signature = hmacBase64Url(config.sharedSecret, encoded);
  return `${encoded}.${signature}`;
}

function verifyActivationToken(token) {
  if (!config.sharedSecret) {
    throw new Error('WRAPPER_SHARED_SECRET is required to verify activation tokens');
  }

  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature) {
    throw new Error('Invalid activation token');
  }

  const expected = hmacBase64Url(config.sharedSecret, encoded);
  if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    throw new Error('Invalid activation token');
  }

  const payload = decodeTokenPayload(encoded);
  if (!payload?.navidromeUser || !payload?.email || !payload?.expiresAt) {
    throw new Error('Invalid activation token payload');
  }

  if (payload.expiresAt < Date.now()) {
    throw new Error('Activation token expired');
  }

  return payload;
}

async function reserveActivationToken(token, payload) {
  return withActivationLock(async () => {
    const state = await loadActivationState();
    cleanupActivationState(state);

    if (state.usedNonces[payload.nonce]) {
      throw new Error('Activation token already used');
    }

    if (state.pendingNonces[payload.nonce]) {
      throw new Error('Activation token already in use');
    }

    state.pendingNonces[payload.nonce] = payload.expiresAt;
    await saveActivationState(state);
    return payload;
  });
}

async function commitActivationToken(payload) {
  return withActivationLock(async () => {
    const state = await loadActivationState();
    cleanupActivationState(state);
    delete state.pendingNonces[payload.nonce];
    state.usedNonces[payload.nonce] = payload.expiresAt;
    await saveActivationState(state);
  });
}

async function releaseActivationToken(payload) {
  return withActivationLock(async () => {
    const state = await loadActivationState();
    cleanupActivationState(state);
    delete state.pendingNonces[payload.nonce];
    await saveActivationState(state);
  });
}

function buildActivationUrl(token) {
  const path = `/activate?token=${encodeURIComponent(token)}`;
  return config.activationBaseUrl ? `${config.activationBaseUrl}${path}` : path;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function requireSharedSecret(req) {
  if (!config.sharedSecret) return false;
  const token = req.headers['x-blaccafy-token'];
  if (typeof token !== 'string' || !token) return false;

  const expected = Buffer.from(config.sharedSecret);
  const received = Buffer.from(token);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

function parseCookies(setCookieHeader) {
  if (!setCookieHeader) return '';
  const values = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return values.map((cookie) => cookie.split(';')[0]).join('; ');
}

async function request(path, options = {}, authToken = '') {
  const url = new URL(path, config.baseUrl);
  const headers = new Headers(options.headers || {});
  if (authToken) headers.set('x-nd-authorization', `Bearer ${authToken}`);
  if (!headers.has('x-nd-client-unique-id')) headers.set('x-nd-client-unique-id', config.clientUniqueId);
  if (sessionCache?.cookie && !headers.has('Cookie')) headers.set('Cookie', sessionCache.cookie);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
    redirect: 'manual'
  });

  const contentType = response.headers.get('content-type') || '';
  let body = null;
  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    body
  };
}

async function login() {
  if (sessionCache && sessionCache.expiresAt > Date.now()) return sessionCache.token;
  if (!config.botUsername || !config.botPassword) {
    throw new Error('Navidrome bot credentials are missing');
  }

  const result = await request(config.loginPath, {
    method: 'POST',
    body: JSON.stringify({ username: config.botUsername, password: config.botPassword })
  });

  if (!result.ok) {
    throw new Error(`Navidrome login failed: ${result.status}`);
  }

  const token = result.body?.token || result.body?.accessToken || result.body?.jwt;
  if (!token) {
    throw new Error('Navidrome login did not return an auth token');
  }

  const cookie = parseCookies(result.headers.get('set-cookie'));

  sessionCache = {
    token,
    cookie,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000
  };

  return token;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

function extractLibraryIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item && typeof item === 'object') return item.id ?? item.libraryId ?? item.value;
      return item;
    })
    .filter(Boolean)
    .map(String);
}

function loadLibraryMap() {
  try {
    const parsed = JSON.parse(config.libraryMapJson);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    const raw = config.libraryMapJson.trim();
    const body = raw.replace(/^\{/, '').replace(/\}$/, '').trim();
    if (!body) return {};

    const map = {};
    for (const entry of body.split(',')) {
      const [key, ...valueParts] = entry.split(':');
      if (!key || valueParts.length === 0) continue;
      const mapKey = key.trim();
      const mapValue = valueParts.join(':').trim();
      if (mapKey) map[mapKey] = mapValue;
    }
    return map;
  }
}

function resolveLibraryIds(names) {
  const map = loadLibraryMap();
  const ids = [];
  for (const name of names) {
    const id = map[name];
    if (id === undefined || id === null || id === '') {
      throw new Error(`Missing Navidrome library mapping for: ${name}`);
    }
    ids.push(id);
  }
  return ids;
}

function uniqueIds(ids) {
  return [...new Set(ids.map((id) => String(id)))];
}

function normalizeEmailCandidates(email) {
  const raw = String(email || '').trim().toLowerCase();
  if (!raw) return [];

  const localPart = raw.split('@')[0] || raw;
  const plusStrippedLocalPart = localPart.replace(/\+.+$/, '');

  return [...new Set([raw, localPart, plusStrippedLocalPart].filter(Boolean))];
}

function normalizeNavidromeUser(userName, email) {
  const source = String(userName || email || 'blaccafy-user').toLowerCase();
  const safe = source
    .replace(/@.*/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'blaccafy-user';

  if (safe.length <= 32) return safe;

  return `${safe.slice(0, 23).replace(/-+$/g, '')}-${sha256Base64Url(safe).slice(0, 8).toLowerCase()}`;
}

function matchesActivationIdentity(user, email) {
  const candidates = normalizeEmailCandidates(email);
  const userEmails = [user?.email, user?.userName, user?.username]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  return userEmails.some((value) => candidates.includes(value));
}

async function listUsers(cookie) {
  const result = await request(config.userListPath, { method: 'GET' }, cookie);
  if (!result.ok) throw new Error(`Failed to list users: ${result.status}`);
  if (Array.isArray(result.body)) return result.body;
  if (Array.isArray(result.body?.data)) return result.body.data;
  if (Array.isArray(result.body?.items)) return result.body.items;
  return [];
}

async function getUserById(cookie, id) {
  const result = await request(`/api/user/${encodeURIComponent(id)}`, { method: 'GET' }, cookie);
  if (!result.ok) throw new Error(`Failed to read user ${id}: ${result.status}`);
  return result.body;
}

async function createUser(cookie, payload) {
  const result = await request('/api/user', {
    method: 'POST',
    body: JSON.stringify({
      isAdmin: false,
      userName: payload.navidromeUser,
      name: payload.email.split('@')[0],
      email: payload.email,
      password: crypto.randomUUID()
    })
  }, cookie);

  if (!result.ok) throw new Error(`Failed to create user: ${result.status}`);
  return result.body;
}

async function updateUser(cookie, user, payload) {
  const result = await request(`/api/user/${encodeURIComponent(user.id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      id: user.id,
      userName: payload.navidromeUser,
      name: user.name || payload.email.split('@')[0],
      email: payload.email,
      isAdmin: false,
      libraryIds: payload.libraryIds,
      ...(payload.password ? { password: payload.password } : {})
    })
  }, cookie);

  if (!result.ok) throw new Error(`Failed to update user: ${result.status}`);
  return result.body;
}

async function updatePassword(cookie, user, password) {
  const result = await request(`/api/user/${encodeURIComponent(user.id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      id: user.id,
      userName: user.userName || user.username,
      name: user.name,
      email: user.email,
      isAdmin: false,
      libraryIds: extractLibraryIds(user.libraries ?? user.libraryIds ?? []),
      password
    })
  }, cookie);

  if (!result.ok) throw new Error(`Failed to update password: ${result.status}`);
  return result.body;
}

async function createActivationForEmail(email) {
  const cookie = await login();
  const users = await listUsers(cookie);
  const user = users.find((entry) => matchesActivationIdentity(entry, email));

  if (!user) {
    throw new Error('User not found');
  }

  const token = createActivationToken({
    action: 'grant',
    navidromeUser: user.userName || user.username || user.id,
    email: user.email || email
  });

  return {
    ok: true,
    status: 'token-issued',
    user: user.userName || user.username || user.id,
    activationToken: token,
    activationUrl: buildActivationUrl(token)
  };
}

async function executePlan(plan) {
  plan = {
    ...plan,
    navidromeUser: normalizeNavidromeUser(plan.navidromeUser, plan.email)
  };

  const cookie = await login();
  const users = await listUsers(cookie);
  const existing = users.find((user) => user.userName === plan.navidromeUser || user.username === plan.navidromeUser);
  const activationToken = ['grant', 'update'].includes(plan.action) ? createActivationToken(plan) : null;

  if (!existing && ['revoke', 'expire'].includes(plan.action)) {
    return {
      ok: true,
      status: 'noop',
      user: plan.navidromeUser,
      librariesAdded: [],
      librariesRemoved: normalizeArray(plan.librariesToRemove),
      message: 'User not found, nothing to revoke'
    };
  }

  let user = existing;
  if (!user) {
    user = await createUser(cookie, plan);
  }

  const currentIds = extractLibraryIds(user.libraries ?? user.libraryIds ?? []);
  const assigned = normalizeArray(plan.librariesAssigned);
  const toRemove = normalizeArray(plan.librariesToRemove);
  const addIds = resolveLibraryIds(assigned);
  const removeIds = resolveLibraryIds(toRemove);
  const finalIds = uniqueIds([...currentIds, ...addIds].filter((id) => !removeIds.map(String).includes(String(id))));

  if (['grant', 'update', 'revoke', 'expire'].includes(plan.action) || !existing) {
    user = await updateUser(cookie, user, { ...plan, libraryIds: finalIds });
  }

  const verified = await getUserById(cookie, user.id);

  return {
    ok: true,
    status: 'applied',
    user: plan.navidromeUser,
    librariesAdded: assigned,
    librariesRemoved: toRemove,
    appliedLibraryIds: finalIds,
    verifiedLibraries: extractLibraryIds(verified.libraries ?? verified.libraryIds ?? []),
    ...(activationToken ? { activationToken, activationUrl: buildActivationUrl(activationToken) } : {}),
    message: 'Access applied successfully'
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true, service: 'navidrome-wrapper' });
    }

    if (req.method === 'POST' && url.pathname === '/execute') {
      if (!requireSharedSecret(req)) {
        return json(res, 401, { ok: false, error: 'Unauthorized' });
      }

      const body = await readJson(req);
      let plan = body.plan ?? body;
      if (typeof plan === 'string') {
        try {
          plan = JSON.parse(plan);
        } catch {
        }
      }
      const required = ['action', 'level', 'email', 'navidromeUser'];
      const missing = required.filter((key) => !plan[key]);
      if (missing.length) {
        return json(res, 400, { ok: false, error: `Missing fields: ${missing.join(', ')}` });
      }

      const result = await executePlan({
        action: plan.action,
        level: plan.level,
        email: plan.email,
        navidromeUser: plan.navidromeUser,
        librariesAssigned: normalizeArray(plan.librariesAssigned),
        librariesToRemove: normalizeArray(plan.librariesToRemove),
        keepSuggested: normalizeArray(plan.keepSuggested)
      });

      return json(res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/activate') {
      const body = await readJson(req);
      const token = body.token || url.searchParams.get('token');
      const password = String(body.password || body.newPassword || '').trim();

      if (!token) {
        return json(res, 400, { ok: false, error: 'Missing token' });
      }

      if (password.length < 12) {
        return json(res, 400, { ok: false, error: 'Password must be at least 12 characters long' });
      }

      const payload = verifyActivationToken(token);
      try {
        await reserveActivationToken(token, payload);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const status = message === 'Activation token already used' || message === 'Activation token already in use' ? 409 : 400;
        return json(res, status, { ok: false, error: message });
      }

      try {
        const cookie = await login();
        const users = await listUsers(cookie);
        const user = users.find((entry) => entry.userName === payload.navidromeUser || entry.username === payload.navidromeUser);

        if (!user) {
          throw new Error('User not found');
        }

        await updatePassword(cookie, user, password);
        await commitActivationToken(payload);

        return json(res, 200, {
          ok: true,
          status: 'password-updated',
          user: payload.navidromeUser,
          message: 'Password updated successfully'
        });
      } catch (error) {
        await releaseActivationToken(payload);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return json(res, message === 'User not found' ? 404 : 500, { ok: false, error: message });
      }
    }

    if (req.method === 'POST' && url.pathname === '/activate/start') {
      if (!requireSharedSecret(req)) {
        return json(res, 401, { ok: false, error: 'Unauthorized' });
      }

      const body = await readJson(req);
      const email = String(body.email || url.searchParams.get('email') || '').trim();
      if (!email) {
        return json(res, 400, { ok: false, error: 'Missing email' });
      }

      try {
        const result = await createActivationForEmail(email);
        return json(res, 200, result);
      } catch (error) {
        return json(res, 404, { ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return json(res, 404, { ok: false, error: 'Not found' });
  } catch (error) {
    return json(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

server.listen(config.port, () => {
  console.log(`Navidrome wrapper listening on ${config.port}`);
});
