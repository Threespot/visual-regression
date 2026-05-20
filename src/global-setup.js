const { loadScenariosConfig } = require('./scenarios');
const { warmupUrls } = require('./warmup');

module.exports = async () => {
  const baseline = process.env.VRT_BASELINE_URL;
  const test = process.env.VRT_TEST_URL;

  if (!baseline || !test) {
    throw new Error(
      'VRT_BASELINE_URL and VRT_TEST_URL must both be set. ' +
        'See @threespot/visual-regression README.'
    );
  }

  const { scenarios } = loadScenariosConfig();

  const urls = scenarios.flatMap((s) => [
    joinUrl(baseline, s.path),
    joinUrl(test, s.path),
  ]);

  await warmupUrls(urls);
};

function joinUrl(base, p) {
  const baseTrimmed = base.replace(/\/+$/, '');
  const pathPrefixed = p.startsWith('/') ? p : `/${p}`;
  return baseTrimmed + pathPrefixed;
}

module.exports.joinUrl = joinUrl;
