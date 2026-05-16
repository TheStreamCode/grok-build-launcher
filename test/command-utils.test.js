const test = require('node:test');
const assert = require('node:assert/strict');

const {
  FALLBACK_CLI_COMMAND,
  FALLBACK_TERMINAL_NAME,
  buildExtensionSettingsQuery,
  buildTerminalName,
  extractExecutable,
  normalizeCliCommand,
  normalizeTerminalName,
  resolveCliCommandSetting,
  resolveTerminalCwd,
  shouldPromptToInstallGrok,
} = require('../out/command-utils.js');

test('default command and terminal name match Grok Build branding', () => {
  assert.equal(FALLBACK_CLI_COMMAND, 'grok');
  assert.equal(FALLBACK_TERMINAL_NAME, 'Grok Build');
});

test('normalizeCliCommand trims configured values', () => {
  assert.equal(normalizeCliCommand('  grok --help  '), 'grok --help');
});

test('normalizeCliCommand falls back when value is undefined', () => {
  assert.equal(normalizeCliCommand(undefined), 'grok');
});

test('normalizeCliCommand preserves blank commands for runtime validation', () => {
  assert.equal(normalizeCliCommand('   '), '');
});

test('resolveCliCommandSetting uses global values and ignores workspace-controlled commands', () => {
  assert.equal(
    resolveCliCommandSetting({ defaultValue: 'grok', globalValue: 'grok --safe', workspaceValue: 'malicious-command' }),
    'grok --safe',
  );
});

test('resolveCliCommandSetting falls back to the default when no global value exists', () => {
  assert.equal(resolveCliCommandSetting({ defaultValue: 'grok', workspaceValue: 'malicious-command' }), 'grok');
});

test('resolveCliCommandSetting preserves a blank global value for validation', () => {
  assert.equal(resolveCliCommandSetting({ defaultValue: 'grok', globalValue: '   ', workspaceValue: 'grok' }), '');
});

test('normalizeTerminalName falls back when value is blank', () => {
  assert.equal(normalizeTerminalName('   '), 'Grok Build');
});

test('buildTerminalName uses the base name for the first terminal', () => {
  assert.equal(buildTerminalName('  Grok Build  ', 1), 'Grok Build');
});

test('buildTerminalName appends the sequence after the first terminal', () => {
  assert.equal(buildTerminalName('Grok Build', 3), 'Grok Build 3');
});

test('buildExtensionSettingsQuery targets the current extension id', () => {
  assert.equal(buildExtensionSettingsQuery('mikesoft.vscode-grok-build-launcher'), '@ext:mikesoft.vscode-grok-build-launcher');
});

test('extractExecutable returns the first token for simple commands', () => {
  assert.equal(extractExecutable('grok --version'), 'grok');
});

test('extractExecutable preserves quoted Windows paths with spaces', () => {
  assert.equal(
    extractExecutable('"C:\\Users\\Test User\\.grok\\bin\\grok.exe" --help'),
    'C:\\Users\\Test User\\.grok\\bin\\grok.exe',
  );
});

test('shouldPromptToInstallGrok detects PowerShell command-not-found output', () => {
  const output = "grok: The term 'grok' is not recognized as a name of a cmdlet, function, script file, or executable program.";

  assert.equal(shouldPromptToInstallGrok('grok', 1, output), true);
});

test('shouldPromptToInstallGrok detects POSIX command-not-found exit codes', () => {
  assert.equal(shouldPromptToInstallGrok('grok', 127, ''), true);
});

test('shouldPromptToInstallGrok detects missing agent alias as installable', () => {
  assert.equal(shouldPromptToInstallGrok('agent', 127, ''), true);
});

test('shouldPromptToInstallGrok ignores custom wrapper commands', () => {
  assert.equal(shouldPromptToInstallGrok('custom-grok-wrapper', 1, 'custom-grok-wrapper: command not found'), false);
});

test('shouldPromptToInstallGrok ignores unrelated Grok runtime failures', () => {
  assert.equal(shouldPromptToInstallGrok('grok', 1, 'Error: authentication failed'), false);
  assert.equal(shouldPromptToInstallGrok('grok', 1, 'Error: model not found'), false);
});

test('shouldPromptToInstallGrok ignores missing project files from an installed CLI', () => {
  assert.equal(shouldPromptToInstallGrok('grok', 1, 'Error: no such file or directory, open "/workspace/AGENTS.md"'), false);
});

test('shouldPromptToInstallGrok ignores non-command-not-found exit codes', () => {
  assert.equal(shouldPromptToInstallGrok('grok', 2, 'grok: command not found'), false);
});

test('resolveTerminalCwd uses the active editor workspace when available', () => {
  const workspace = {
    workspaceFolders: [
      { uri: 'workspace-a' },
      { uri: 'workspace-b' },
    ],
    getWorkspaceFolder(uri) {
      return uri === 'file-b' ? { uri: 'workspace-b' } : undefined;
    },
  };

  const activeEditor = {
    document: {
      uri: 'file-b',
    },
  };

  assert.equal(resolveTerminalCwd(activeEditor, workspace), 'workspace-b');
});

test('resolveTerminalCwd falls back to the first workspace when active editor is outside the workspace', () => {
  const workspace = {
    workspaceFolders: [
      { uri: 'workspace-a' },
      { uri: 'workspace-b' },
    ],
    getWorkspaceFolder() {
      return undefined;
    },
  };

  const activeEditor = {
    document: {
      uri: 'external-file',
    },
  };

  assert.equal(resolveTerminalCwd(activeEditor, workspace), 'workspace-a');
});

test('resolveTerminalCwd returns undefined when no workspace is open', () => {
  const workspace = {
    workspaceFolders: undefined,
    getWorkspaceFolder() {
      return undefined;
    },
  };

  assert.equal(resolveTerminalCwd(undefined, workspace), undefined);
});
