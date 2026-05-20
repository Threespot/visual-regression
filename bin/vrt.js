#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const { parseFlags, FlagError } = require('../src/flags');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(PACKAGE_ROOT, 'playwright.config.js');

function resolvePlaywrightCli() {
  const pkgPath = require.resolve('@playwright/test/package.json');
  const pkg = require(pkgPath);
  const binEntry = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin && pkg.bin.playwright;
  if (!binEntry) {
    throw new Error('Could not locate the playwright CLI in @playwright/test.');
  }
  return path.join(path.dirname(pkgPath), binEntry);
}

function printUsage() {
  process.stderr.write(
    [
      'Usage: vrt <command> [options]',
      '',
      'Commands:',
      '  test     Run the visual regression test suite',
      '  report   Open the HTML report from the last run',
      '',
      'Test options:',
      '  --browser=chrome|firefox|safari     (comma-separated list accepted)',
      '  --viewport=phone|tablet|desktop     (comma-separated list accepted)',
      '  --scenario=<label>                  (comma-separated list accepted)',
      '',
      'Required environment variables (for `vrt test`):',
      '  VRT_BASELINE_URL   URL of the baseline environment (e.g. production)',
      '  VRT_TEST_URL       URL of the environment being tested (e.g. local or staging)',
      '',
    ].join('\n')
  );
}

function runTest(rawArgs) {
  let flags;
  try {
    flags = parseFlags(rawArgs);
  } catch (err) {
    if (err instanceof FlagError) {
      process.stderr.write(`vrt: ${err.message}\n`);
      process.exit(2);
    }
    throw err;
  }

  const missing = [];
  if (!process.env.VRT_BASELINE_URL) missing.push('VRT_BASELINE_URL');
  if (!process.env.VRT_TEST_URL) missing.push('VRT_TEST_URL');
  if (missing.length) {
    process.stderr.write(
      `vrt: missing required environment variable(s): ${missing.join(', ')}\n` +
        'See `vrt --help` for usage.\n'
    );
    process.exit(2);
  }

  const env = { ...process.env };
  if (flags.viewports) env.VRT_VIEWPORTS = flags.viewports.join(',');
  if (flags.scenarios) env.VRT_SCENARIOS = flags.scenarios.join(',');

  const playwrightArgs = [resolvePlaywrightCli(), 'test', '--config', CONFIG_PATH];
  if (flags.browsers) {
    for (const project of flags.browsers) {
      playwrightArgs.push('--project', project);
    }
  }

  const result = spawnSync(process.execPath, playwrightArgs, {
    stdio: 'inherit',
    env,
  });
  process.exit(result.status ?? 1);
}

function runReport() {
  const result = spawnSync(process.execPath, [resolvePlaywrightCli(), 'show-report'], {
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}

const [command, ...rest] = process.argv.slice(2);

if (!command || command === '--help' || command === '-h' || command === 'help') {
  printUsage();
  process.exit(command ? 0 : 1);
}

switch (command) {
  case 'test':
    runTest(rest);
    break;
  case 'report':
    runReport();
    break;
  default:
    process.stderr.write(`vrt: unknown command "${command}"\n`);
    printUsage();
    process.exit(2);
}
