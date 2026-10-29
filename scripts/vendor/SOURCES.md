# Generator sources

Retrieved 30 October 2026 from the two repositories explicitly requested by the profile owner.

## GitAscii — Igorcbraz

Source: https://github.com/Igorcbraz/GitAscii/tree/456d4cfaf6ee8a04724c0d17cf17206360f51e7e

GPL-3.0-or-later; full license in `gitascii/LICENSE`. Corresponding source is included here, not a closed binary. The local profile scripts which combine these renderers carry the same license.

Original paths: `src/engine/ascii/converter.ts`, `src/engine/core/xmlUtils.ts`, `src/features/widgets/renderers/TerminalInfoRenderer.ts`, `src/features/widgets/renderers/LanguagesRenderer.ts`.

Changes dated 30 October 2026: replace alias imports with local paths, erase unused type-only imports for direct Node 24 execution, correct the stats label from Commits to Contrib (the source value counts all contributions). Rendering calls are made by `scripts/render.mjs`; portrait conversion uses the original canvas converter with a local Canvas adapter. No synthetic face generator is used for this portrait.

## Profile Readme Generator — Mauro de Souza

Source: https://github.com/maurodesouza/profile-readme-generator/tree/10cf0a2f3bfb1672b23c7d4966673d184b26a4b4

MIT; full license in `profile-readme-generator/LICENSE.md`.

Original `src/features/socials/parser.ts` is adapted to resolve local icon URLs and the social section identifier. Unchanged original icons from `src/assets/icons/social/{linkedin,telegram,gmail,youtube,instagram}/default.svg` live under `assets/socials`. The scheduled snake setup adapts `src/features/snake/parser.ts`: corrected cron, pinned actions, blue palette, one ordinary output commit instead of a pages action/extra output branch.
