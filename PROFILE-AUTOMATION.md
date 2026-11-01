# Profile refresh

The [Refresh profile workflow](https://github.com/Abenovv/Abenovv/actions/workflows/refresh-profile.yml) runs at **00:23 and 12:23 UTC**, approximately **05:23 and 17:23 Asia/Qyzylorda**. GitHub may delay schedules or disable them after 60 days without repository activity. Actions → Run workflow refreshes immediately.

It uses the automatic repository GITHUB_TOKEN, not a personal token or extra secret. The runtime uses Node 24 built-ins and the licensed vendored renderers; no npm install is needed in Actions.

## Approved design

The profile uses native rectangular tables for the full portrait/introduction and the compact Affaan-style project entry. Only Quiz maker is featured. The separate banner, social rows, product screenshots and coursework showcase are absent. Biography, name, project descriptions and education remain readable native text.

The full supplied portrait is converted through GitAscii without cropping, at the original 433:577 ratio. Its code-light sweep plays once. The blue contribution snake repeats. Both have reduced-motion alternatives; image links include content hashes to refresh GitHub/browser caches when assets change.

Mauro's technology parser renders the compact icon row. The six languages supplied by the owner are sorted on every refresh by owned-public-repository language bytes, excluding forks and this profile repository. Byte volume is not a claim about proficiency. C++ remains the owner's stated language and sorts last when not present in public sources.

## Data and editing

- `content/about.html`: short introduction and availability.
- `content/background.html`: education/community disclosure.
- `content/projects.json`: the selected project, description, focus text and Download action.
- `scripts/render.mjs`: native GitHub profile layout and asset URLs.
- `scripts/showcase-assets.mjs`: compact focus strip, real stars/forks badges, desktop/mobile metrics.
- `assets/profile-data.json`: public profile, repositories, language totals and rolling-year calendar.

The existing refresh validates API data and dates, retries temporary network errors up to three times, regenerates data-dependent assets and commits changes normally. Failed refreshes preserve the last successful publication. Counts are fetched from the real selected repository; missing projects/forks/invalid values fail instead of inventing metrics.

Legacy unused artwork/source files are retained for history and are not shown in the current README. Rebuilds read only the selected current content files.

```sh
npm run refresh
npm test
npm run check
python3 scripts/validate-svg.py
```

## Replacing the portrait locally

The original photograph stays outside the repository. Published portrait assets contain the owner's approved ASCII interpretation. The current source frame is recorded in `assets/portrait-proof.json`; validation checks the approved uncropped frame and proportions.

For an intentionally approved replacement, use Node 24, install the locked development dependencies locally, then run:

```sh
npm ci --ignore-scripts
node scripts/portrait-full.mjs /exact/local/path/to/approved-photo.png
npm run render
```

If a new photograph has different dimensions, deliberately update the portrait-frame assertions. The older `portrait.mjs` utility produces legacy assets and is not used by the current design or Actions.

## Sources and licenses

- GitAscii canvas/language renderers: GPL-3.0-or-later; corresponding reviewed source and license are included under `scripts/vendor/gitascii`.
- Mauro de Souza's Profile README Generator: MIT technology parser under `scripts/vendor/profile-readme-generator/techs.ts`; see its license and `scripts/vendor/SOURCES.md`.
- Portfolio Builder informed the evidence-based profile content and design review; it is not a runtime dependency.
- Contribution animation uses the official pinned Platane/snk action with the approved blue palette.
- Devicon language assets and MIT license are retained under `assets/vendor/devicon`.
- Software licensing does not license the profile owner's identity or photograph for reuse.
