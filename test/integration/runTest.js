const path = require('node:path');
const { runTests } = require('@vscode/test-electron');

const DEFAULT_VSCODE_TEST_VERSION = '1.103.0';

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, '..', '..');
  const extensionTestsPath = path.resolve(__dirname, 'suite');
  const vscodeVersion = process.env.VSCODE_TEST_VERSION?.trim() || DEFAULT_VSCODE_TEST_VERSION;
  const cachePath = process.env.VSCODE_TEST_CACHE_PATH?.trim() || undefined;

  try {
    await runTests({
      version: vscodeVersion,
      cachePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions'],
    });
  } catch (error) {
    console.error('VS Code integration tests failed.');
    throw error;
  }
}

main();
