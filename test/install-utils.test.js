const test = require('node:test');
const assert = require('node:assert/strict');

const {
  GROK_INSTALL_URL,
  buildGrokInstallPromptCommand,
  buildGrokInstallPromptMessage,
  buildGrokInstallPromptScript,
  buildQuotedCommandPath,
  getDefaultGrokBinDir,
  getDefaultGrokExecutablePath,
  hasPathEntry,
  appendPathEntry,
} = require('../out/install-utils.js');

test('GROK_INSTALL_URL points to the official xAI installer', () => {
  assert.equal(GROK_INSTALL_URL, 'https://x.ai/cli/install.sh');
});

test('buildGrokInstallPromptMessage is concise and explicit', () => {
  assert.equal(buildGrokInstallPromptMessage(), 'Grok Build CLI was not found.');
});

test('buildGrokInstallPromptCommand runs a generated node script path safely', () => {
  const command = buildGrokInstallPromptCommand('C:\\Temp\\grok install prompt.js');

  assert.equal(command, 'node "C:\\Temp\\grok install prompt.js"');
  assert.doesNotMatch(command, /node -e/);
});

test('getDefaultGrokBinDir resolves Windows user bin directory', () => {
  assert.equal(
    getDefaultGrokBinDir('win32', { USERPROFILE: 'C:\\Users\\Ada' }, '/ignored'),
    'C:\\Users\\Ada\\.grok\\bin',
  );
});

test('getDefaultGrokBinDir resolves POSIX user bin directory', () => {
  assert.equal(
    getDefaultGrokBinDir('darwin', {}, '/Users/ada'),
    '/Users/ada/.grok/bin',
  );
});

test('getDefaultGrokExecutablePath resolves platform executable names', () => {
  assert.equal(
    getDefaultGrokExecutablePath('win32', { USERPROFILE: 'C:\\Users\\Ada' }, '/ignored'),
    'C:\\Users\\Ada\\.grok\\bin\\grok.exe',
  );
  assert.equal(
    getDefaultGrokExecutablePath('linux', {}, '/home/ada'),
    '/home/ada/.grok/bin/grok',
  );
});

test('buildQuotedCommandPath quotes paths with spaces and escapes embedded quotes', () => {
  assert.equal(buildQuotedCommandPath('C:\\Users\\Ada Lovelace\\.grok\\bin\\grok.exe'), '"C:\\Users\\Ada Lovelace\\.grok\\bin\\grok.exe"');
  assert.equal(buildQuotedCommandPath('/Users/ada/.grok/bin/grok'), '"/Users/ada/.grok/bin/grok"');
});

test('hasPathEntry detects Windows path entries case-insensitively', () => {
  assert.equal(hasPathEntry('C:\\Tools;C:\\Users\\Ada\\.grok\\bin', 'c:\\users\\ada\\.grok\\bin', ';', true), true);
});

test('hasPathEntry detects POSIX path entries exactly', () => {
  assert.equal(hasPathEntry('/usr/local/bin:/Users/ada/.grok/bin', '/Users/ada/.grok/bin', ':', false), true);
  assert.equal(hasPathEntry('/usr/local/bin:/Users/ada/.grok/bin', '/users/ada/.grok/bin', ':', false), false);
});

test('appendPathEntry avoids duplicates and appends missing entries', () => {
  assert.equal(appendPathEntry('C:\\Tools', 'C:\\Users\\Ada\\.grok\\bin', ';', true), 'C:\\Tools;C:\\Users\\Ada\\.grok\\bin');
  assert.equal(appendPathEntry('C:\\Tools;C:\\Users\\Ada\\.grok\\bin', 'c:\\users\\ada\\.grok\\bin', ';', true), 'C:\\Tools;C:\\Users\\Ada\\.grok\\bin');
});

test('buildGrokInstallPromptScript uses the official installer and configures PATH on all supported platforms', () => {
  const script = buildGrokInstallPromptScript();

  assert.match(script, /https:\/\/x\.ai\/cli\/install\.sh/);
  assert.match(script, /Git\\\\bin\\\\bash\.exe/);
  assert.match(script, /SetEnvironmentVariable\('Path'/);
  assert.match(script, /\.zprofile/);
  assert.match(script, /\.bashrc/);
  assert.match(script, /fish_add_path \$HOME\/\.grok\/bin/);
  assert.match(script, /Run 'grok' or 'agent' to get started/);
});
