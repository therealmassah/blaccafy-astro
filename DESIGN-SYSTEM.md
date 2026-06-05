# Design System

## Positionnement

Blaccafy doit sentir le coffre privé, pas la landing page générique. Ambiance nocturne, luxe brut, musique rare, accès fermé.

## Couleurs

- `--bg`: `#030303`
- `--text`: `#e7e5e4`
- `--text-bright`: `#fffaf0`
- `--primary`: `#d946ef`
- `--accent`: `#d4af37`
- `--gradient-start`: `#5f0f2f`
- `--gradient-mid`: `#b0124b`
- `--gradient-end`: `#d4af37`

Règle:
- Fond noir profond.
- Accents or + fuchsia + bordeaux pour les CTA et les titres.
- Les dégradés servent à marquer la rareté, pas à décorer partout.

## Typographies

- `Inter`: base UI, lecture, CTA, textes courants.
- `IBM Plex Serif`: usage éditorial si tu ajoutes des sections plus narratives.
- `IBM Plex Mono`: usage technique, metadata, labels, logs.

Règle:
- Titres très lourds.
- Sous-titres nets.
- Corps de texte aéré et lisible.

## Espacements

- Section hero: `pt-32 pb-16`
- Carte principale: `p-8`
- Cartes secondaires: `p-6`
- Pilules: `px-4 py-2`
- Réseau de cartes: `gap-4`

Règle:
- Beaucoup d’air autour des éléments centraux.
- Les blocs secondaires restent compacts.
- Le rythme doit rester premium, pas dense.

## Surfaces

- `glass-panel` pour les cartes, nav et footer.
- Bordure blanche faible.
- Blur fort.
- Ombre douce mais présente.

## Composants

- `SiteHeader`: navigation fixe.
- `AnimatedBackdrop`: canvas Three.js + overlay + notes flottantes.
- `HeroSection`: titre, pitch, CTA, badges, cartes de preuve.
- `SiteFooter`: fermeture simple et cohérente.

## CTA

- Bouton principal en dégradé vertical.
- Effet de balayage au survol.
- Léger lift au hover.

## Motifs visuels

- Glow animé sur les tags.
- Beat indicator dans le header.
- Backdrop cosmique sombre en mouvement.

## Règles de cohérence

- Ne change pas le fond noir profond.
- Ne remplace pas les dégradés par des couleurs plates.
- Garde les cartes glassmorphism.
- Garde le contraste élevé entre fond et contenu.
- Réutilise les mêmes espacements et rayons.
