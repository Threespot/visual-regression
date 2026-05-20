const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const DEFAULT_THRESHOLD = 0.1;
const DEFAULT_MAX_DIFF_PIXEL_RATIO = 0.01;

function compareScreenshots(baselineBuffer, testBuffer, options = {}) {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const maxDiffPixelRatio = options.maxDiffPixelRatio ?? DEFAULT_MAX_DIFF_PIXEL_RATIO;

  const baseline = PNG.sync.read(baselineBuffer);
  const test = PNG.sync.read(testBuffer);

  if (baseline.width !== test.width || baseline.height !== test.height) {
    return {
      passed: false,
      reason: `Size mismatch — baseline ${baseline.width}x${baseline.height}, test ${test.width}x${test.height}`,
      numDiffPixels: null,
      diffRatio: null,
      diffBuffer: null,
    };
  }

  const { width, height } = baseline;
  const diff = new PNG({ width, height });
  const numDiffPixels = pixelmatch(
    baseline.data,
    test.data,
    diff.data,
    width,
    height,
    { threshold }
  );

  const diffRatio = numDiffPixels / (width * height);
  const passed = diffRatio <= maxDiffPixelRatio;

  return {
    passed,
    reason: passed
      ? null
      : `${numDiffPixels} pixels differ (${(diffRatio * 100).toFixed(3)}% of image)`,
    numDiffPixels,
    diffRatio,
    diffBuffer: PNG.sync.write(diff),
  };
}

module.exports = {
  compareScreenshots,
  DEFAULT_THRESHOLD,
  DEFAULT_MAX_DIFF_PIXEL_RATIO,
};
