const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createDisposableRegistry } = require('../out/command-utils.js');

const extensionSource = fs.readFileSync(path.resolve(__dirname, '../src/extension.ts'), 'utf8');

function createFakeDisposable() {
  const disposable = {
    disposeCount: 0,
    dispose() {
      disposable.disposeCount += 1;
    },
  };

  return disposable;
}

test('createDisposableRegistry disposes tracked resources when a key is released', () => {
  const registry = createDisposableRegistry();
  const terminal = { id: 'terminal-1' };
  const listener = createFakeDisposable();
  const timer = createFakeDisposable();

  registry.track(terminal, listener);
  registry.track(terminal, timer);
  assert.equal(registry.size(), 1);

  registry.releaseAll(terminal);

  assert.equal(listener.disposeCount, 1);
  assert.equal(timer.disposeCount, 1);
  assert.equal(registry.size(), 0);
});

test('createDisposableRegistry forgets a key once its last resource is released', () => {
  const registry = createDisposableRegistry();
  const terminal = { id: 'terminal-1' };
  const listener = createFakeDisposable();
  const timer = createFakeDisposable();

  registry.track(terminal, listener);
  registry.track(terminal, timer);

  registry.release(terminal, listener);
  assert.equal(listener.disposeCount, 1);
  assert.equal(registry.size(), 1);

  registry.release(terminal, timer);
  assert.equal(timer.disposeCount, 1);
  assert.equal(registry.size(), 0);
});

test('createDisposableRegistry never disposes the same resource twice', () => {
  const registry = createDisposableRegistry();
  const terminal = { id: 'terminal-1' };
  const listener = createFakeDisposable();

  registry.track(terminal, listener);
  registry.release(terminal, listener);
  registry.release(terminal, listener);
  registry.releaseAll(terminal);

  assert.equal(listener.disposeCount, 1);
});

test('createDisposableRegistry keeps resources of other terminals isolated', () => {
  const registry = createDisposableRegistry();
  const firstTerminal = { id: 'terminal-1' };
  const secondTerminal = { id: 'terminal-2' };
  const firstListener = createFakeDisposable();
  const secondListener = createFakeDisposable();

  registry.track(firstTerminal, firstListener);
  registry.track(secondTerminal, secondListener);

  registry.releaseAll(firstTerminal);

  assert.equal(firstListener.disposeCount, 1);
  assert.equal(secondListener.disposeCount, 0);
  assert.equal(registry.size(), 1);
});

test('createDisposableRegistry does not retain state across repeated launches', () => {
  const registry = createDisposableRegistry();

  for (let launch = 0; launch < 100; launch += 1) {
    const terminal = { id: `terminal-${launch}` };
    registry.track(terminal, createFakeDisposable());
    registry.track(terminal, createFakeDisposable());
    registry.releaseAll(terminal);
  }

  assert.equal(registry.size(), 0);
});

test('createDisposableRegistry disposes every remaining resource on shutdown', () => {
  const registry = createDisposableRegistry();
  const firstListener = createFakeDisposable();
  const secondListener = createFakeDisposable();

  registry.track({ id: 'terminal-1' }, firstListener);
  registry.track({ id: 'terminal-2' }, secondListener);

  registry.dispose();

  assert.equal(firstListener.disposeCount, 1);
  assert.equal(secondListener.disposeCount, 1);
  assert.equal(registry.size(), 0);
});

test('createDisposableRegistry continues teardown when a resource throws', () => {
  const registry = createDisposableRegistry();
  const terminal = { id: 'terminal-1' };
  const failing = {
    dispose() {
      throw new Error('dispose failed');
    },
  };
  const listener = createFakeDisposable();

  registry.track(terminal, failing);
  registry.track(terminal, listener);

  registry.releaseAll(terminal);

  assert.equal(listener.disposeCount, 1);
  assert.equal(registry.size(), 0);
});

test('extension registers exactly one aggregated context.subscriptions push', () => {
  const pushes = extensionSource.match(/context\.subscriptions\.push\(/g) ?? [];

  assert.equal(pushes.length, 1);
  assert.match(extensionSource, /export function activate\(context: vscode\.ExtensionContext\): void \{[\s\S]*context\.subscriptions\.push\(/);
});

test('per-launch listeners and timers are owned by the launch registry', () => {
  assert.match(extensionSource, /const launchResources = createDisposableRegistry<vscode\.Terminal>\(\)/);
  assert.match(extensionSource, /launchResources\.track\(terminal, shellIntegrationListener\)/);
  assert.match(extensionSource, /launchResources\.track\(terminal, fallbackTimer\)/);
  assert.match(extensionSource, /launchResources\.track\(terminal, executionListener\)/);
  assert.match(extensionSource, /vscode\.window\.onDidCloseTerminal\(\(closedTerminal\) => \{\s*launchResources\.releaseAll\(closedTerminal\);/);
  assert.match(extensionSource, /export function deactivate\(\): void \{\s*launchResources\.dispose\(\);/);
});

test('the shell-integration fallback never writes to a terminal that already exited', () => {
  assert.match(extensionSource, /if \(terminal\.exitStatus !== undefined\) \{\s*return;\s*\}\s*\n\s*terminal\.sendText\(command, true\);/);
});

test('shell execution output is only collected when a handler consumes it', () => {
  assert.match(extensionSource, /if \(!onShellExecutionEnd\) \{\s*shellIntegration\.executeCommand\(command\);\s*return;\s*\}/);

  const collectCalls = extensionSource.match(/collectShellExecutionOutput\(/g) ?? [];
  assert.equal(collectCalls.length, 2);
});
