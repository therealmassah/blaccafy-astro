# Blaccafy Astro

Site Astro converti depuis l'export Aura Builder.

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Déploiement Cloudflare Pages

Le workflow GitHub `/.github/workflows/deploy.yml` publie automatiquement sur chaque push vers `main`.

Secrets requis dans GitHub Actions:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT_NAME`

## Structure

- `src/components/` : header, hero, backdrop, footer
- `src/layouts/` : layout global
- `src/styles/global.css` : tokens et styles partagés
- `DESIGN-SYSTEM.md` : règles visuelles de référence
