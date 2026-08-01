import * as vscode from 'vscode';
import {
  FALLBACK_TERMINAL_NAME,
  appendBoundedOutput,
  buildExtensionSettingsQuery,
  buildTerminalName,
  isGrokCliCommand,
  normalizeTerminalName,
  resolveCliCommandSetting,
  resolveTerminalCwd,
  shouldShowMissingGrokGuidance,
} from './command-utils.js';

const SETTINGS_NAMESPACE = 'grokBuildLauncher';
const OFFICIAL_INSTALLATION_URL = 'https://docs.x.ai/build/overview';
const MAX_CAPTURED_SHELL_OUTPUT = 8 * 1024;

let terminalSequence = 1;

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
  context: vscode.ExtensionContext,
  onShellExecutionEnd?: (event: vscode.TerminalShellExecutionEndEvent, output: string) => void | Promise<void>,
): void {
  let executionStarted = false;

  const startExecution = (shellIntegration: vscode.TerminalShellIntegration) => {
    if (executionStarted) {
      return;
    }

    executionStarted = true;
    shellIntegrationListener.dispose();
    clearTimeout(fallbackHandle);

    let execution: vscode.TerminalShellExecution | undefined;
    let outputPromise: Promise<string> | undefined;

    const executionListener = onShellExecutionEnd
      ? vscode.window.onDidEndTerminalShellExecution(async (endEvent) => {
        if (endEvent.terminal !== terminal || (execution && endEvent.execution !== execution)) {
          return;
        }

        executionListener?.dispose();
        const output = outputPromise ? await outputPromise : '';
        await onShellExecutionEnd(endEvent, output);
      })
      : undefined;

    if (executionListener) {
      context.subscriptions.push(executionListener);
    }

    execution = shellIntegration.executeCommand(command);
    if (executionListener) {
      outputPromise = collectShellExecutionOutput(execution);
    }
  };

  const shellIntegrationListener = vscode.window.onDidChangeTerminalShellIntegration((event) => {
    if (event.terminal !== terminal) {
      return;
    }

    startExecution(event.shellIntegration);
  });

  const fallbackHandle = setTimeout(() => {
    if (terminal.shellIntegration) {
      startExecution(terminal.shellIntegration);
      return;
    }

    executionStarted = true;
    shellIntegrationListener.dispose();
    terminal.sendText(command, true);
  }, 3000);

  if (terminal.shellIntegration) {
    startExecution(terminal.shellIntegration);
    return;
  }

  context.subscriptions.push(
    shellIntegrationListener,
    { dispose: () => clearTimeout(fallbackHandle) },
  );
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

function watchForMissingGrok(terminal: vscode.Terminal, cliCommand: string, context: vscode.ExtensionContext): void {
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
    context,
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
    watchForMissingGrok(terminal, cliCommand, context);
    void vscode.window.setStatusBarMessage(`Started ${terminalBaseName}`, 2500);
  });

  const openSettingsCommand = vscode.commands.registerCommand('grokBuildLauncher.openSettings', async () => {
    await openExtensionSettings(context);
  });

  context.subscriptions.push(openCliCommand, openSettingsCommand);
}

export function deactivate(): void {
}
