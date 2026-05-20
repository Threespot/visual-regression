const { test, expect } = require('@playwright/test');
const defaultViewports = require('../src/viewports');
const { applyWordPressDefaults } = require('../src/defaults');
const { compareScreenshots } = require('../src/compare');
const { loadScenariosConfig } = require('../src/scenarios');
const { joinUrl } = require('../src/global-setup');

const BASELINE_URL = process.env.VRT_BASELINE_URL;
const TEST_URL = process.env.VRT_TEST_URL;

if (!BASELINE_URL || !TEST_URL) {
  throw new Error('VRT_BASELINE_URL and VRT_TEST_URL must both be set.');
}

const config = loadScenariosConfig();
const allScenarios = config.scenarios;
const allViewports = config.viewports || defaultViewports;
const sharedMasks = config.masks || [];
const beforeScreenshot = config.beforeScreenshot;

const viewportFilter = parseFilter(process.env.VRT_VIEWPORTS);
const scenarioFilter = parseFilter(process.env.VRT_SCENARIOS);

const activeViewports = allViewports.filter((v) => !viewportFilter || viewportFilter.has(v.label));
const activeScenarios = allScenarios.filter((s) => !scenarioFilter || scenarioFilter.has(s.label));

function parseFilter(value) {
  if (!value) return null;
  return new Set(value.split(',').map((s) => s.trim()).filter(Boolean));
}

async function capture(page, baseUrl, scenario, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(joinUrl(baseUrl, scenario.path), { waitUntil: 'networkidle' });
  await applyWordPressDefaults(page);

  if (typeof beforeScreenshot === 'function') {
    await beforeScreenshot(page, { scenario, viewport });
  }
  if (typeof scenario.beforeScreenshot === 'function') {
    await scenario.beforeScreenshot(page, { scenario, viewport });
  }

  const maskSelectors = [...sharedMasks, ...(scenario.masks || [])];
  const maskLocators = maskSelectors.map((sel) => page.locator(sel));

  return await page.screenshot({ fullPage: true, mask: maskLocators });
}

for (const scenario of activeScenarios) {
  for (const viewport of activeViewports) {
    test(`${scenario.label} @ ${viewport.label}`, async ({ page }, testInfo) => {
      const baselineBuf = await capture(page, BASELINE_URL, scenario, viewport);
      const testBuf = await capture(page, TEST_URL, scenario, viewport);

      await testInfo.attach('baseline', { body: baselineBuf, contentType: 'image/png' });
      await testInfo.attach('test', { body: testBuf, contentType: 'image/png' });

      const result = compareScreenshots(baselineBuf, testBuf, {
        threshold: scenario.threshold,
        maxDiffPixelRatio: scenario.maxDiffPixelRatio,
      });

      if (result.diffBuffer) {
        await testInfo.attach('diff', { body: result.diffBuffer, contentType: 'image/png' });
      }

      const message = result.reason
        ? `${result.reason}\n  baseline: ${joinUrl(BASELINE_URL, scenario.path)}\n  test:     ${joinUrl(TEST_URL, scenario.path)}`
        : 'ok';
      expect(result.passed, message).toBeTruthy();
    });
  }
}
