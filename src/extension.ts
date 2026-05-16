import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';
import {
  FALLBACK_TERMINAL_NAME,
  buildExtensionSettingsQuery,
  buildTerminalName,
  normalizeCliCommand,
  normalizeTerminalName,
  resolveCliCommandSetting,
  resolveTerminalCwd,
  shouldPromptToInstallGrok,
} from './command-utils.js';
import {
  buildGrokInstallPromptCommand,
  buildGrokInstallPromptMessage,
  buildGrokInstallPromptScript,
  buildQuotedCommandPath,
  getDefaultGrokExecutablePath,
} from './install-utils.js';

const SETTINGS_NAMESPACE = 'grokBuildLauncher';
const NEWS_URL = 'https://x.ai/news/grok-build-cli';

let terminalSequence = 1;

function collectShellExecutionOutput(execution: vscode.TerminalShellExecution): Promise<string> {
  return (async () => {
    let output = '';

    try {
      for await (const chunk of execution.read()) {
        output += chunk;
      }
    } catch {
      return output;
    }

    return output;
  })();
}

function writeGrokInstallPromptScript(): string {
  const scriptPath = path.join(os.tmpdir(), `grok-build-launcher-install-${process.pid}-${Date.now()}.js`);
  fs.writeFileSync(scriptPath, buildGrokInstallPromptScript(), 'utf8');

  return scriptPath;
}

async function openExtensionSettings(context: vscode.ExtensionContext): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.openSettings', buildExtensionSettingsQuery(context.extension.id));
}

async function openGrokInstallInstructions(): Promise<void> {
  await vscode.env.openExternal(vscode.Uri.parse(NEWS_URL));
}

async function updateCommandToInstalledPathIfAvailable(): Promise<void> {
  const configuration = vscode.workspace.getConfiguration(SETTINGS_NAMESPACE);
  if (!configuration.get<boolean>('preferAbsoluteInstalledPath', true)) {
    return;
  }

  const executablePath = getDefaultGrokExecutablePath(process.platform, process.env, os.homedir());
  if (!fs.existsSync(executablePath)) {
    return;
  }

  const quotedPath = buildQuotedCommandPath(executablePath);
  await configuration.update('cliCommand', quotedPath, vscode.ConfigurationTarget.Global);
  void vscode.window.showInformationMessage(
    `Grok Build CLI was installed. The launcher command now uses ${quotedPath}. Restart VS Code if existing terminals do not see the updated PATH.`,
  );
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
    outputPromise = collectShellExecutionOutput(execution);
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

function startGuidedInstall(context: vscode.ExtensionContext): void {
  const installTerminal = vscode.window.createTerminal({
    name: 'Install Grok Build',
    location: vscode.TerminalLocation.Panel,
  });
  const installCommand = buildGrokInstallPromptCommand(writeGrokInstallPromptScript());

  installTerminal.show();
  executeCommandWithOptionalShellIntegration(
    installTerminal,
    installCommand,
    context,
    async (event) => {
      if (event.exitCode === 0) {
        await updateCommandToInstalledPathIfAvailable();
      }
    },
  );
}

async function handleMissingGrok(context: vscode.ExtensionContext): Promise<void> {
  const configuration = vscode.workspace.getConfiguration(SETTINGS_NAMESPACE);
  const autoInstall = configuration.get<boolean>('autoInstall', true);

  if (!autoInstall) {
    const selection = await vscode.window.showWarningMessage(
      `${buildGrokInstallPromptMessage()} Install it manually or enable guided install in settings.`,
      'Open Settings',
      'Open xAI Instructions',
    );

    if (selection === 'Open Settings') {
      await openExtensionSettings(context);
    } else if (selection === 'Open xAI Instructions') {
      await openGrokInstallInstructions();
    }

    return;
  }

  const selection = await vscode.window.showWarningMessage(
    `${buildGrokInstallPromptMessage()} Install it now with the official xAI installer?`,
    { modal: true },
    'Install',
    'Open xAI Instructions',
    'Open Settings',
  );

  if (selection === 'Install') {
    startGuidedInstall(context);
  } else if (selection === 'Open xAI Instructions') {
    await openGrokInstallInstructions();
  } else if (selection === 'Open Settings') {
    await openExtensionSettings(context);
  }
}

function watchForMissingGrok(terminal: vscode.Terminal, cliCommand: string, context: vscode.ExtensionContext): void {
  executeCommandWithOptionalShellIntegration(
    terminal,
    cliCommand,
    context,
    async (endEvent, output) => {
      if (shouldPromptToInstallGrok(cliCommand, endEvent.exitCode, output)) {
        await handleMissingGrok(context);
      }
    },
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
