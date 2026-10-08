const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { resolveStorageState, loadStorageStateCookies } = require('../src/storage-state');

function tempFile(name, contents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vrt-state-'));
  const file = path.join(dir, name);
  if (contents !== undefined) fs.writeFileSync(file, contents);
  return file;
}

test('a scenario without storageState and no site default is logged out', () => {
  assert.equal(resolveStorageState({ path: '/' }, {}, '/site'), null);
});

test('the site-wide default applies, resolved from the working directory', () => {
  assert.equal(resolveStorageState({ path: '/' }, { storageState: '.auth/a.json' }, '/site'), '/site/.auth/a.json');
});

test("a scenario's own storageState wins over the default", () => {
  assert.equal(resolveStorageState({ storageState: 'b.json' }, { storageState: 'a.json' }, '/site'), '/site/b.json');
});

test('storageState: null opts a scenario out of the default', () => {
  assert.equal(resolveStorageState({ storageState: null }, { storageState: 'a.json' }, '/site'), null);
});

test('an absolute path is kept', () => {
  assert.equal(resolveStorageState({ storageState: '/abs/s.json' }, {}, '/site'), '/abs/s.json');
});

test('cookies are read from a Playwright storage-state file', () => {
  const cookies = [{ name: 'SESSx', value: 'v', domain: 'example.test', path: '/' }];
  const file = tempFile('s.json', JSON.stringify({ cookies, origins: [] }));
  assert.deepEqual(loadStorageStateCookies(file), cookies);
});

test('a missing file names the path and appends the hint', () => {
  const file = tempFile('missing.json');
  assert.throws(() => loadStorageStateCookies(file, 'Run: yarn auth:save'), {
    message: `storageState file not found: ${file}. Run: yarn auth:save`,
  });
});

test('a missing file without a hint ends at the path', () => {
  const file = tempFile('missing.json');
  assert.throws(() => loadStorageStateCookies(file), { message: `storageState file not found: ${file}.` });
});

test('malformed JSON is reported', () => {
  const file = tempFile('bad.json', '{nope');
  assert.throws(() => loadStorageStateCookies(file, 'hint'), { message: `storageState file is not valid JSON: ${file}. hint` });
});

test('a file without a cookies array is reported', () => {
  const file = tempFile('empty.json', JSON.stringify({ origins: [] }));
  assert.throws(() => loadStorageStateCookies(file), { message: `storageState file has no cookies array: ${file}.` });
});
