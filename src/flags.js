const BROWSER_ALIASES = {
  chrome: 'chromium',
  chromium: 'chromium',
  firefox: 'firefox',
  safari: 'webkit',
  webkit: 'webkit',
};

const VIEWPORT_NAMES = ['phone', 'tablet', 'desktop'];

function parseFlags(args) {
  const flags = {};

  for (const arg of args) {
    if (!arg.startsWith('--')) continue;

    const eq = arg.indexOf('=');
    if (eq === -1) continue;

    const key = arg.slice(2, eq);
    const value = arg.slice(eq + 1);
    if (value === '') continue;

    const values = value.split(',').map((v) => v.trim()).filter(Boolean);

    if (key === 'browser') {
      flags.browsers = values.map((v) => {
        const project = BROWSER_ALIASES[v.toLowerCase()];
        if (!project) {
          throw new FlagError(
            `Unknown browser: "${v}". Valid options: ${Object.keys(BROWSER_ALIASES).join(', ')}`
          );
        }
        return project;
      });
    } else if (key === 'viewport') {
      flags.viewports = values.map((v) => {
        if (!VIEWPORT_NAMES.includes(v)) {
          throw new FlagError(
            `Unknown viewport: "${v}". Valid options: ${VIEWPORT_NAMES.join(', ')}`
          );
        }
        return v;
      });
    } else if (key === 'scenario') {
      flags.scenarios = values;
    } else {
      throw new FlagError(`Unknown flag: --${key}`);
    }
  }

  return flags;
}

class FlagError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FlagError';
  }
}

module.exports = { parseFlags, FlagError, BROWSER_ALIASES, VIEWPORT_NAMES };
