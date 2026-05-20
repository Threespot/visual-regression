const viewports = require('./viewports');
const { applyWordPressDefaults } = require('./defaults');
const { compareScreenshots } = require('./compare');
const { loadScenariosConfig } = require('./scenarios');

module.exports = {
  viewports,
  applyWordPressDefaults,
  compareScreenshots,
  loadScenariosConfig,
};
