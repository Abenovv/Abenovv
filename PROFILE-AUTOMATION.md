# Profile maintenance

Node 24 or newer. The scheduled workflow refreshes public GitHub data at 00:23 and 12:23 UTC (05:23 and 17:23 in Asia/Qyzylorda), renders the profile, validates the result and commits changed generated assets. No extra token is needed beyond the workflow token.

`node scripts/refresh.mjs` fetches public data. `node scripts/render.mjs` rebuilds from existing data. `node --test scripts/profile.test.mjs`, `node scripts/validate.mjs` and `python3 scripts/validate-svg.py` validate it. A failed refresh preserves the last published data.

The snake uses a locally generated closed grid route with four visible segments. Each consecutive move is to a neighboring cell; the loop closes inside the grid. No clipping, masks, hidden overflow or off-grid movement is used. All actual calendar dates are included. Language icons follow code bytes in owned public original repositories. Only Quiz maker is featured.

The approved portrait is `assets/portrait-refined-transparent.png`. Regenerate offline with `npm ci` and `node scripts/portrait-braille.mjs <local-photo-path>`. The source photograph stays private and outside this repository. PNG is retained because it displays reliably in GitHub; unused binary assets and drafts are removed.
