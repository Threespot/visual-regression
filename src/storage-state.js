const fs = require('fs');
const path = require('path');

// Logged-in scenarios: cookies from a Playwright storage-state file
// (https://playwright.dev/docs/auth), applied before the page's first load.
// Only `cookies` is used; `origins` (localStorage) is ignored.

/**
 * The storage-state file for a scenario: its own `storageState`, or the
 * site-wide default. `storageState: null` on a scenario opts it out.
 *
 * @returns {string|null} absolute path, or null for a logged-out scenario
 */
function resolveStorageState(scenario, config = {}, cwd = process.cwd()) {
  const value = Object.prototype.hasOwnProperty.call(scenario, 'storageState')
    ? scenario.storageState
    : config.storageState;
  if (value === null || value === undefined || value === '') return null;
  return path.resolve(cwd, value);
}

/**
 * The cookies in a storage-state file. Throws with the path and the site's
 * hint (e.g. the command that creates the file) when it can't be used.
 */
function loadStorageStateCookies(file, hint) {
  const suffix = hint ? ` ${hint}` : '';
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    throw new Error(`storageState file not found: ${file}.${suffix}`);
  }

  let state;
  try {
    state = JSON.parse(text);
  } catch {
    throw new Error(`storageState file is not valid JSON: ${file}.${suffix}`);
  }

  if (!state || !Array.isArray(state.cookies)) {
    throw new Error(`storageState file has no cookies array: ${file}.${suffix}`);
  }
  return state.cookies;
}

module.exports = { resolveStorageState, loadStorageStateCookies };
