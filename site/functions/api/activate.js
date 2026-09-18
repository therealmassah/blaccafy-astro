const defaultActivationUrl = 'https://navidrome-wrapper.blaccflagg.com/activate';

export async function onRequestPost({ request, env }) {
  const body = await request.text();
  const response = await fetch(env.NAVIDROME_ACTIVATION_URL || defaultActivationUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8'
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
