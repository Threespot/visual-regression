# @threespot/visual-regression

Playwright-based cross-browser visual regression testing for Threespot client sites.

Runs locally on demand — not in CI. Compares two live URLs (e.g. local vs. production, or staging vs. production). No reference screenshots are committed to the repo; the deployed site is the implicit baseline.

## Why Playwright

- **Cross-browser by default.** Chromium, Firefox, and WebKit (Safari's engine) run from one config — same matrix Threespot QAs against.
- **Same tool covers future E2E needs.** If functional tests are added later, no second tool to adopt.
- **Active development.** Microsoft is actively investing in Playwright.

See the architecture doc for the longer rationale (BackstopJS was considered and rejected).

## Package manager

This package is pinned to **Yarn 4** (via Corepack's `packageManager` field). Consumer sites are expected to use Yarn 4 as well. Enable Corepack once per machine:

```sh
corepack enable
```

After that, `yarn` resolves to the version pinned in each repo's `package.json`.

## Per-site setup

Install as a dev dependency:

```sh
yarn add --dev github:threespot/visual-regression#v0.1.0
```

Add scripts to the site's `package.json`. Setting `VRT_TEST_URL` here gives devs a sensible default so day-to-day invocation is just `yarn vrt:test`:

```json
{
  "scripts": {
    "vrt:test": "VRT_TEST_URL=http://acme-site.lndo.site vrt test",
    "vrt:report": "vrt report"
  }
}
```

Add the report directories to `.gitignore`:

```
visual-regression/playwright-report/
visual-regression/test-results/
```

Create `visual-regression/scenarios.js` — see `example/scenarios.js` in this package for a starting point:

```js
module.exports = [
  { label: 'Homepage', path: '/' },
  { label: 'Block Reference', path: '/block-reference/' },
  // 10–20 paths covering all templates and key components
];
```

Install the Playwright browsers once per machine:

```sh
yarn playwright install
```

## Running tests

```sh
# Pre-deploy gut-check: local vs. production
VRT_BASELINE_URL=https://acme.org yarn vrt:test

# Staging review: local vs. multidev
VRT_BASELINE_URL=https://staging-acme.pantheonsite.io yarn vrt:test

# Change verification: production vs. multidev (no local server needed)
VRT_BASELINE_URL=https://acme.org \
VRT_TEST_URL=https://staging-acme.pantheonsite.io \
yarn vrt:test
```

Both `VRT_BASELINE_URL` and `VRT_TEST_URL` are required. The site's `package.json` script supplies the default `VRT_TEST_URL`; override it on the command line for the two-remote mode.

### Narrowing scope

```sh
yarn vrt:test                                                  # full matrix
yarn vrt:test --browser=chrome                                 # only Chromium
yarn vrt:test --browser=firefox
yarn vrt:test --browser=safari                                 # WebKit
yarn vrt:test --browser=chrome,firefox                         # multiple browsers
yarn vrt:test --viewport=phone                                 # only mobile viewport
yarn vrt:test --scenario=Homepage                              # only one scenario
yarn vrt:test --browser=chrome --viewport=desktop --scenario=Homepage
```

Flags compose. Unknown values error with the list of valid options. (Yarn 4 forwards extra args to the script without the `--` separator npm requires.)

### Opening the report

```sh
yarn vrt:report
```

## HTTP Basic Auth (Pantheon "Lock Icon" environments)

Most Pantheon environments are publicly accessible, but pre-production environments (dev, test, multidev) can be protected with Pantheon's [Security: Lock Environment](https://docs.pantheon.io/guides/secure-development/security-tool) feature, which puts the whole site behind HTTP Basic Auth. When that's enabled, every request — page loads, image requests, and the warm-up fetches the runner does at the start — needs to send an `Authorization: Basic …` header or it gets a 401 and the test fails.

The package supports this via environment variables. The feature is dormant unless both are set:

```sh
VRT_BASELINE_URL=https://acme.org \
VRT_TEST_URL=https://staging-acme.pantheonsite.io \
VRT_HTTP_USER=pantheon \
VRT_HTTP_PASS='the-shared-password' \
yarn vrt:test
```

When set, credentials are forwarded to both Playwright (via [`httpCredentials`](https://playwright.dev/docs/api/class-testoptions#test-options-http-credentials)) and the warm-up `fetch()` calls.

### Restricting auth to one environment

The common Pantheon case is "production is open, staging is locked." Sending the multidev password to production is harmless but feels wrong. Set `VRT_HTTP_ORIGIN` to restrict credentials to a single origin:

```sh
VRT_BASELINE_URL=https://acme.org \
VRT_TEST_URL=https://staging-acme.pantheonsite.io \
VRT_HTTP_USER=pantheon \
VRT_HTTP_PASS='the-shared-password' \
VRT_HTTP_ORIGIN=https://staging-acme.pantheonsite.io \
yarn vrt:test
```

Credentials are only sent when the request URL's origin matches `VRT_HTTP_ORIGIN`. Production fetches go unauthenticated.

### Pantheon sandbox "Deterrence" warning

Pantheon shows a one-time interstitial ("This website is hosted in a sandbox environment…") on `*.pantheonsite.io` URLs before letting the user through. Clicking the button sets a `Deterrence-Bypass=1` cookie. Without it, the very first page load — i.e. every Playwright test — would screenshot the warning page instead of the real one.

The runner pre-seeds that cookie automatically on any URL whose hostname ends in `.pantheonsite.io`. No configuration needed; custom production domains are untouched.

### Stashing the credentials in `package.json`

Don't commit passwords to git. The pragmatic pattern: keep credentials in a per-developer `.env` file (gitignored) and source it before running, or put them in the shell's keychain integration. A second `vrt:test-locked` script with the env vars baked in is fine if the password isn't sensitive — but Pantheon's Lock Icon credentials usually are.

```jsonc
{
  "scripts": {
    "vrt:test": "VRT_TEST_URL=http://acme-site.lndo.site vrt test"
    // For sites with the Pantheon Lock Icon enabled on the test environment,
    // pass credentials via env vars at the command line, e.g.:
    //
    //   VRT_HTTP_USER=pantheon VRT_HTTP_PASS=… yarn vrt:test
    //
    // Or use a wrapper script that reads from .env / 1Password / your keychain.
  }
}
```

Opens the HTML report from the last run. Failed scenarios show baseline, test, and diff images side by side as attachments.

## Standard viewports

| label    | width | height |
|----------|-------|--------|
| phone    | 375   | 812    |
| tablet   | 768   | 1024   |
| desktop  | 1440  | 900    |

Override in `scenarios.js` for unusual cases (kiosk displays, etc.).

## WordPress defaults

Applied automatically before every screenshot:

- Animations and transitions disabled
- WordPress admin bar hidden
- Wait for web fonts to load (`document.fonts.ready`)
- Wait for all images to finish loading
- Layout-settling delay (500 ms)

Use `masks` (site-wide or per-scenario) for dynamic content that survives the defaults — relative timestamps, rotating quotes, random featured posts:

```js
module.exports = {
  masks: ['.relative-time', '.rotating-quote'],
  scenarios: [
    { label: 'Homepage', path: '/', masks: ['.featured-posts'] },
    { label: 'News Archive', path: '/news/' },
  ],
};
```

For setup steps (login, dismissing a banner, etc.), use `beforeScreenshot`:

```js
module.exports = {
  beforeScreenshot: async (page) => {
    await page.locator('.cookie-banner .dismiss').click().catch(() => {});
  },
  scenarios: [ /* ... */ ],
};
```

## When to run

Documented here so the tool actually gets used:

- After significant CSS or template changes
- Before merging branches that touch shared components
- Before deploying to staging for client review
- After updating any of the shared `@threespot/*` packages
- After WordPress core or major plugin updates
- After a deploy — verify production matches local expectations

## Caveats worth knowing

- **WebKit on Linux/macOS ≠ Safari proper.** Playwright bundles WebKit, the rendering engine; not Safari itself. Catches most Safari layout issues but real Safari QA still belongs in manual review.
- **Network warm-up adds time.** The package hits every URL once at the start of a run to wake sleeping Pantheon environments; subsequent requests are fast.
- **Content parity matters.** If local has fixtures and the baseline has client content, every page will diff. Pull live content via Terminus before testing, or use a dedicated multidev with stable test content.
- **Cross-browser cost.** 3 browsers × 3 viewports × 15 scenarios = 135 screenshots per run. Parallelized but slow. Use `--browser=chrome` during iteration; full matrix before deploys.

## Output

- `visual-regression/playwright-report/` — HTML report (gitignored)
- `visual-regression/test-results/` — per-test artifacts (gitignored)

## Configuration reference

### `scenarios.js`

Exports either an array of scenarios or an object:

```js
module.exports = {
  scenarios: [ /* required */ ],
  viewports: [ /* optional — overrides the standard three */ ],
  masks: [ /* optional — selectors masked on every scenario */ ],
  beforeScreenshot: async (page, { scenario, viewport }) => { /* optional */ },
};
```

Per-scenario fields:

| field              | type                                          | notes                                     |
|--------------------|-----------------------------------------------|-------------------------------------------|
| `label`            | string                                        | required, also the test name              |
| `path`             | string                                        | required, joined onto baseline + test URL |
| `masks`            | string[]                                      | selectors masked in addition to shared    |
| `beforeScreenshot` | `async (page, { scenario, viewport }) => {}`  | extra per-scenario setup                  |
| `threshold`        | number                                        | pixelmatch threshold (default 0.1)        |
| `maxDiffPixelRatio`| number                                        | acceptable ratio of differing pixels (default 0.01) |

### Environment variables

| variable             | required        | purpose                                                                |
|----------------------|-----------------|------------------------------------------------------------------------|
| `VRT_BASELINE_URL`   | yes             | baseline environment URL                                               |
| `VRT_TEST_URL`       | yes             | environment under test                                                 |
| `VRT_VIEWPORTS`      | no (set by CLI) | comma-separated viewport filter                                        |
| `VRT_SCENARIOS`      | no (set by CLI) | comma-separated scenario label filter                                  |
| `VRT_HTTP_USER`      | no              | HTTP Basic Auth username (Pantheon "Lock Icon" environments)           |
| `VRT_HTTP_PASS`      | no              | HTTP Basic Auth password — required alongside `VRT_HTTP_USER`          |
| `VRT_HTTP_ORIGIN`    | no              | restrict auth to a single origin (e.g. only the multidev, not prod)    |
