import * as vscode from 'vscode';
import {
  FALLBACK_TERMINAL_NAME,
  appendBoundedOutput,
  buildExtensionSettingsQuery,
  buildTerminalName,
  createDisposableRegistry,
  isGrokCliCommand,
  normalizeTerminalName,
  resolveCliCommandSetting,
  resolveTerminalCwd,
  shouldShowMissingGrokGuidance,
} from './command-utils.js';

const SETTINGS_NAMESPACE = 'grokBuildLauncher';
const OFFICIAL_INSTALLATION_URL = 'https://docs.x.ai/build/overview';
const MAX_CAPTURED_SHELL_OUTPUT = 8 * 1024;
const SHELL_INTEGRATION_TIMEOUT_MS = 3000;

let terminalSequence = 1;

/**
 * Owns the listeners and timers created by each launch.
 *
 * They must never be pushed onto `context.subscriptions`, which VS Code only clears on
 * deactivate and which would therefore grow without bound across launches.
 */
const launchResources = createDisposableRegistry<vscode.Terminal>();

function collectShellExecutionOutput(execution: vscode.TerminalShellExecution): Promise<string> {
  return (async () => {
    let output = '';

    try {
      for await (const chunk of execution.read()) {
        output = appendBoundedOutput(output, chunk, MAX_CAPTURED_SHELL_OUTPUT);

        if (output.length >= MAX_CAPTURED_SHELL_OUTPUT) {
          break;
        }
      }
    } catch {
      return output;
    }

    return output;
  })();
}

async function openExtensionSettings(context: vscode.ExtensionContext): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.openSettings', buildExtensionSettingsQuery(context.extension.id));
}

async function openGrokInstallInstructions(): Promise<void> {
  await vscode.env.openExternal(vscode.Uri.parse(OFFICIAL_INSTALLATION_URL));
}

function executeCommandWithOptionalShellIntegration(
  terminal: vscode.Terminal,
  command: string,
  onShellExecutionEnd?: (event: vscode.TerminalShellExecutionEndEvent, output: string) => void | Promise<void>,
): void {
  let executionStarted = false;
  let fallbackHandle: ReturnType<typeof setTimeout> | undefined;

  const fallbackTimer: vscode.Disposable = {
    dispose: () => {
      if (fallbackHandle !== undefined) {
        clearTimeout(fallbackHandle);
        fallbackHandle = undefined;
      }
    },
  };

  const startExecution = (shellIntegration: vscode.TerminalShellIntegration) => {
    if (executionStarted) {
      return;
    }

    executionStarted = true;
    launchResources.release(terminal, shellIntegrationListener);
    launchResources.release(terminal, fallbackTimer);

    if (!onShellExecutionEnd) {
      shellIntegration.executeCommand(command);
      return;
    }

    let execution: vscode.TerminalShellExecution | undefined;
    let outputPromise: Promise<string> | undefined;

    const executionListener = vscode.window.onDidEndTerminalShellExecution(async (endEvent) => {
      if (endEvent.terminal !== terminal || (execution && endEvent.execution !== execution)) {
        return;
      }

      launchResources.release(terminal, executionListener);
      const output = outputPromise ? await outputPromise : '';
      await onShellExecutionEnd(endEvent, output);
    });

    launchResources.track(terminal, executionListener);

    execution = shellIntegration.executeCommand(command);
    outputPromise = collectShellExecutionOutput(execution);
  };

  const shellIntegrationListener = vscode.window.onDidChangeTerminalShellIntegration((event) => {
    if (event.terminal !== terminal) {
      return;
    }

    startExecution(event.shellIntegration);
  });

  launchResources.track(terminal, shellIntegrationListener);
  launchResources.track(terminal, fallbackTimer);

  fallbackHandle = setTimeout(() => {
    fallbackHandle = undefined;

    if (terminal.shellIntegration) {
      startExecution(terminal.shellIntegration);
      return;
    }

    executionStarted = true;
    launchResources.release(terminal, shellIntegrationListener);
    launchResources.release(terminal, fallbackTimer);

    if (terminal.exitStatus !== undefined) {
      return;
    }

    terminal.sendText(command, true);
  }, SHELL_INTEGRATION_TIMEOUT_MS);

  if (terminal.shellIntegration) {
    startExecution(terminal.shellIntegration);
  }
}

async function handleMissingGrok(): Promise<void> {
  const selection = await vscode.window.showWarningMessage(
    'Grok Build CLI was not found. Install it using the official xAI documentation.',
    'Open Installation Guide',
  );

  if (selection === 'Open Installation Guide') {
    await openGrokInstallInstructions();
  }
}

function watchForMissingGrok(terminal: vscode.Terminal, cliCommand: string): void {
  const handleShellExecutionEnd = isGrokCliCommand(cliCommand)
    ? async (endEvent: vscode.TerminalShellExecutionEndEvent, output: string) => {
      if (shouldShowMissingGrokGuidance(cliCommand, endEvent.exitCode, output)) {
        await handleMissingGrok();
      }
    }
    : undefined;

  executeCommandWithOptionalShellIntegration(
    terminal,
    cliCommand,
    handleShellExecutionEnd,
  );
}

export function activate(context: vscode.ExtensionContext): void {
  const openCliCommand = vscode.commands.registerCommand('grokBuildLauncher.openCli', async () => {
    if (!vscode.workspace.isTrusted) {
      const selection = await vscode.window.showWarningMessage(
        'Grok Build Launcher runs terminal commands in the current workspace. Trust this workspace before launching Grok Build CLI.',
        'Manage Workspace Trust',
        'Open Settings',
      );

      if (selection === 'Manage Workspace Trust') {
        await vscode.commands.executeCommand('workbench.trust.manage');
      } else if (selection === 'Open Settings') {
        await openExtensionSettings(context);
      }

      return;
    }

    const configuration = vscode.workspace.getConfiguration(SETTINGS_NAMESPACE);
    const cliCommand = resolveCliCommandSetting(configuration.inspect<string>('cliCommand'), 'grok');
    const configuredTerminalName = configuration.get<string>('terminalName', FALLBACK_TERMINAL_NAME);
    const terminalBaseName = normalizeTerminalName(configuredTerminalName, FALLBACK_TERMINAL_NAME);
    const terminalName = buildTerminalName(configuredTerminalName, terminalSequence, FALLBACK_TERMINAL_NAME);

    if (!cliCommand) {
      void vscode.window.showErrorMessage('Set "grokBuildLauncher.cliCommand" to the command that starts Grok Build CLI.');
      return;
    }

    terminalSequence += 1;
    const cwd = resolveTerminalCwd(vscode.window.activeTextEditor, vscode.workspace);

    const terminal = vscode.window.createTerminal({
      name: terminalName,
      location: { viewColumn: vscode.ViewColumn.Beside },
      cwd,
    });
    terminal.show();
    watchForMissingGrok(terminal, cliCommand);
    void vscode.window.setStatusBarMessage(`Started ${terminalBaseName}`, 2500);
  });

  const openSettingsCommand = vscode.commands.registerCommand('grokBuildLauncher.openSettings', async () => {
    await openExtensionSettings(context);
  });

  const terminalCloseListener = vscode.window.onDidCloseTerminal((closedTerminal) => {
    launchResources.releaseAll(closedTerminal);
  });

  context.subscriptions.push(
    openCliCommand,
    openSettingsCommand,
    terminalCloseListener,
    { dispose: () => launchResources.dispose() },
  );
}

export function deactivate(): void {
  launchResources.dispose();
}
