# Profile refresh

The [Refresh profile workflow](https://github.com/Abenovv/Abenovv/actions/workflows/refresh-profile.yml) rebuilds the dashboard and blue contribution snake twice daily: **00:23 and 12:23 UTC**, approximately **05:23 and 17:23 Asia/Qyzylorda**. GitHub can delay scheduled runs; the dashboard displays its data date. Use **Run workflow** for an immediate refresh. GitHub may disable scheduled workflows after 60 days of repository inactivity; re-enable it from Actions if that happens.

The job uses only the automatic, short-lived repository `GITHUB_TOKEN`. No personal access token, GitAscii account, GitHub App installation, paid plan, or extra secret is needed. GitAscii renderers run locally within the job; no portrait is uploaded to a third-party editor.

Data: GitHub public profile and all pages of owned public repositories; non-fork stars; language byte counts from owned public non-forks (this generated profile excluded); rolling-year contribution calendar. The chart normalizes its five displayed languages. It describes repository code, not skill levels. The six hand-picked language icons are the user's stated languages.

The workflow fetches the calendar directly through GitHub GraphQL and Platane/snk. Anonymous local previews use the public Contributions API. API errors, missing dates, or stale data fail the refresh and preserve the last committed assets. Every refresh is an ordinary Git commit and can be reviewed or reverted.

Temporary network/server failures are retried up to three times. Permanent API errors stop the job. Generated dashboards have separate desktop, tablet, and phone layouts. The blue snake switches to the static calendar for `prefers-reduced-motion`; clicking it also opens that static view. All assets remain self-contained.

Generated image URLs include their content hash. When data or rendering changes, the README receives a new image URL so browser/GitHub caches request the new version. The workflow renders the final embeds after the snake generator finishes, keeping both versions current.

## Local commands

Node 24 is required. Runtime refresh/render/test scripts use Node built-ins and the vendored TypeScript renderers; no dependency install is needed in Actions.

```sh
npm run refresh
npm test
npm run check
python scripts/validate-svg.py
```

The original portrait stays off-repository. `assets/portrait-ascii.json` stores the derived ASCII lines. To replace it locally, install the locked development dependencies with `npm ci --ignore-scripts`, then run `node scripts/portrait.mjs /exact/path/to/photo.jpg` and `npm run render`. Preview rasterization uses the development-only resvg package.

## Source and licenses

Edit `content/project.html` and `content/background.html` for the expandable profile sections. They are explicit sources; rebuilds do not scrape content from the generated README. The project preview uses its public native Obsidian screenshot and links to the current `Inside Obsidian` section.

- GitAscii GPL-3.0-or-later renderer code: pinned revision `456d4cfaf6ee8a04724c0d17cf17206360f51e7e`. See `scripts/vendor/gitascii/LICENSE` and `SOURCES.md`. Local renderer/adapters are also GPL-3.0-or-later.
- Mauro de Souza's Profile Readme Generator MIT social-section parser and five original social SVGs: pinned revision `10cf0a2f3bfb1672b23c7d4966673d184b26a4b4`. See `scripts/vendor/profile-readme-generator/LICENSE.md`.
- Scheduled snake uses the official Platane/snk SVG action pinned to `d8f6715049803e982ee5ff501b6b9b7d5deeb09b` with custom blue colors, adapted from Mauro's workflow template.
- Devicon language SVG originals and MIT license remain under `assets/vendor/devicon`.
- Portrait and personal biography remain the profile owner's content; software licensing does not license their identity or photograph for reuse.
