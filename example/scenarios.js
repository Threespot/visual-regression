/**
 * Per-site visual regression scenarios.
 *
 * Copy this file to `visual-regression/scenarios.js` in your site repo
 * and edit the list. 10–20 paths covering all templates and key
 * components is a reasonable target.
 *
 * Two supported forms:
 *
 *   1. Array of scenarios (canonical, minimal):
 *
 *      module.exports = [
 *        { label: 'Homepage', path: '/' },
 *        { label: 'Block Reference', path: '/block-reference/' },
 *      ];
 *
 *   2. Object with overrides (for sites that need custom viewports,
 *      site-wide masks, or pre-screenshot setup):
 *
 *      module.exports = {
 *        scenarios: [ ... ],
 *        viewports: [ { label: 'kiosk', width: 1920, height: 1080 } ],
 *        masks: ['.relative-time'],
 *        beforeScreenshot: async (page, { scenario, viewport }) => { ... },
 *      };
 *
 * Each scenario may also set its own `masks`, `beforeScreenshot`,
 * `threshold`, or `maxDiffPixelRatio`.
 */

module.exports = [
  { label: 'Homepage', path: '/' },
  { label: 'Block Reference', path: '/block-reference/' },
  { label: 'Typography Sample', path: '/typography-sample/' },
  { label: 'Color Palette', path: '/color-palette/' },
  { label: 'Layout Examples', path: '/layout-examples/' },
  { label: 'Form Examples', path: '/form-examples/' },
  { label: 'Single Post', path: '/sample-post/' },
  { label: 'News Archive', path: '/news/' },
  { label: '404', path: '/this-page-does-not-exist/' },
];
