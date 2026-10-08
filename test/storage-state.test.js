const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { resolveStorageState, loadStorageStateCookies, cookiesForHost } = require('../src/storage-state');

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

const NOW = 1000;
const names = (cookies) => cookies.map((c) => c.name);

test('cookiesForHost keeps a cookie whose domain is the exact host', () => {
  const cookies = [{ name: 'a', domain: 'example.org', expires: NOW + 10 }];
  assert.deepEqual(names(cookiesForHost(cookies, 'example.org', NOW)), ['a']);
});

test('cookiesForHost matches a subdomain against a dot-domain', () => {
  const cookies = [{ name: 'a', domain: '.example.org' }];
  assert.deepEqual(names(cookiesForHost(cookies, 'www.example.org', NOW)), ['a']);
  assert.deepEqual(names(cookiesForHost(cookies, 'example.org', NOW)), ['a']);
});

test('cookiesForHost drops unrelated hosts and suffix-only matches', () => {
  const cookies = [{ name: 'a', domain: 'example.org' }];
  assert.deepEqual(cookiesForHost(cookies, 'other.test', NOW), []);
  assert.deepEqual(cookiesForHost(cookies, 'notexample.org', NOW), []);
});

test('cookiesForHost drops expired cookies', () => {
  const cookies = [
    { name: 'old', domain: 'example.org', expires: NOW - 1 },
    { name: 'edge', domain: 'example.org', expires: NOW },
    { name: 'live', domain: 'example.org', expires: NOW + 1 },
  ];
  assert.deepEqual(names(cookiesForHost(cookies, 'example.org', NOW)), ['live']);
});

test('cookiesForHost keeps session cookies (-1 or no expires)', () => {
  const cookies = [
    { name: 'neg', domain: 'example.org', expires: -1 },
    { name: 'none', domain: 'example.org' },
  ];
  assert.deepEqual(names(cookiesForHost(cookies, 'example.org', NOW)), ['neg', 'none']);
});

test('cookiesForHost ignores case', () => {
  const cookies = [{ name: 'a', domain: '.Example.ORG' }];
  assert.deepEqual(names(cookiesForHost(cookies, 'WWW.example.org', NOW)), ['a']);
});
