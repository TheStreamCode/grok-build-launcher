const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const extensionSource = fs.readFileSync(path.resolve(__dirname, '../src/extension.ts'), 'utf8');

test('missing Grok CLI only offers the official installation documentation', () => {
  assert.match(extensionSource, /https:\/\/docs\.x\.ai\/build\/overview/);
  assert.match(extensionSource, /Grok Build CLI was not found\. Install it using the official xAI documentation\./);
  assert.match(extensionSource, /'Open Installation Guide'/);
  assert.doesNotMatch(extensionSource, /startGuidedInstall|autoInstall|buildGrokInstallPromptScript/);
});
