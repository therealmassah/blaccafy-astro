# Navidrome Wrapper

Internal wrapper for Blaccafy Navidrome provisioning.

## Endpoints

- `GET /health`
- `POST /execute`
- `POST /activate/start`
- `POST /activate`

## Required env

- `NAVIDROME_BASE_URL`
- `NAVIDROME_BOT_USERNAME`
- `NAVIDROME_BOT_PASSWORD`
- `NAVIDROME_LIBRARY_MAP_JSON`
- `WRAPPER_SHARED_SECRET`

## Notes

- The wrapper keeps Navidrome secrets out of n8n.
- Activation tokens are one-time and persisted under `/app/data`.
- Collector drops should use a dedicated Navidrome library per drop. The current live Collector #001 uses `Blaccafy Collector`; future drops should pass `collectorId` so the access workflow can pick the right library.
