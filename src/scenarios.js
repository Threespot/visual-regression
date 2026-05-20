const fs = require('fs');
const path = require('path');

const SCENARIOS_FILE = path.join(process.cwd(), 'visual-regression', 'scenarios.js');

function loadScenariosConfig() {
  if (!fs.existsSync(SCENARIOS_FILE)) {
    throw new Error(
      `No scenarios file found at ${SCENARIOS_FILE}. ` +
        'Create one — see @threespot/visual-regression README for the format.'
    );
  }

  const raw = require(SCENARIOS_FILE);

  if (Array.isArray(raw)) {
    return { scenarios: raw };
  }
  if (raw && Array.isArray(raw.scenarios)) {
    return raw;
  }

  throw new Error(
    `${SCENARIOS_FILE} must export an array of scenarios, or an object with a "scenarios" array.`
  );
}

module.exports = { loadScenariosConfig, SCENARIOS_FILE };
