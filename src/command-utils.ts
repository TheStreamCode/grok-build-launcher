const FALLBACK_CLI_COMMAND = 'grok';
const FALLBACK_TERMINAL_NAME = 'Grok Build';

type WorkspaceFolderLike<T> = { uri: T };
type WorkspaceLike<T> = {
  workspaceFolders?: readonly WorkspaceFolderLike<T>[];
  getWorkspaceFolder(uri: T): WorkspaceFolderLike<T> | undefined;
};
type ActiveEditorLike<T> = { document: { uri: T } };
type ConfigurationInspectionLike<T> = {
  defaultValue?: T;
  globalValue?: T;
};

type DisposableLike = { dispose(): void };

export type DisposableRegistry<TKey> = {
  /** Registers a resource that belongs to the given key. */
  track(key: TKey, disposable: DisposableLike): void;
  /** Disposes a single tracked resource and forgets it. */
  release(key: TKey, disposable: DisposableLike): void;
  /** Disposes every resource tracked for the key and forgets the key. */
  releaseAll(key: TKey): void;
  /** Disposes every tracked resource for every key. */
  dispose(): void;
  /** Returns how many keys still hold tracked resources. */
  size(): number;
};

/**
 * Creates a keyed registry for short-lived resources.
 *
 * Extension hosts only clear `context.subscriptions` on deactivate, so per-invocation
 * listeners and timers must be owned here and released when their key goes away.
 */
export function createDisposableRegistry<TKey>(): DisposableRegistry<TKey> {
  const entries = new Map<TKey, Set<DisposableLike>>();

  function disposeSafely(disposable: DisposableLike): void {
    try {
      disposable.dispose();
    } catch {
      // Teardown must continue even when one resource fails to dispose.
    }
  }

  function track(key: TKey, disposable: DisposableLike): void {
    const tracked = entries.get(key);

    if (tracked) {
      tracked.add(disposable);
      return;
    }

    entries.set(key, new Set([disposable]));
  }

  function release(key: TKey, disposable: DisposableLike): void {
    const tracked = entries.get(key);

    if (!tracked || !tracked.delete(disposable)) {
      return;
    }

    if (tracked.size === 0) {
      entries.delete(key);
    }

    disposeSafely(disposable);
  }

  function releaseAll(key: TKey): void {
    const tracked = entries.get(key);

    if (!tracked) {
      return;
    }

    entries.delete(key);

    for (const disposable of tracked) {
      disposeSafely(disposable);
    }
  }

  function dispose(): void {
    for (const key of [...entries.keys()]) {
      releaseAll(key);
    }
  }

  function size(): number {
    return entries.size;
  }

  return { track, release, releaseAll, dispose, size };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns whether the configured command directly launches the Grok CLI. */
export function isGrokCliCommand(command: string): boolean {
  return getExecutableBaseName(command) === 'grok';
}

/** Appends output without allowing the retained diagnostic buffer to grow past its limit. */
export function appendBoundedOutput(current: string, chunk: string, maxLength: number): string {
  const limit = Math.max(0, Math.trunc(maxLength));

  if (current.length >= limit) {
    return current.slice(0, limit);
  }

  return current + chunk.slice(0, limit - current.length);
}

function getExecutableBaseName(command: string): string {
  const executable = extractExecutable(command);
  const fileName = executable.split(/[\\/]/).pop() ?? executable;

  return fileName.replace(/\.(?:exe|cmd|bat|ps1)$/i, '').toLowerCase();
}

function buildCommandNotFoundPatterns(command: string): RegExp[] {
  const executableName = getExecutableBaseName(command);

  if (!executableName) {
    return [];
  }

  const escapedName = escapeRegExp(executableName);

  return [
    new RegExp(`(?:^|\\s)${escapedName}:\\s+command not found`, 'i'),
    new RegExp(`(?:^|\\s)${escapedName}:\\s+not found`, 'i'),
    new RegExp(`command not found:\\s*${escapedName}`, 'i'),
    new RegExp(`unknown command:?\\s*${escapedName}`, 'i'),
    new RegExp(`['"]?${escapedName}['"]?.*is not recognized`, 'i'),
    new RegExp(`\\b${escapedName}\\b.*not recognized as a name of a cmdlet`, 'i'),
    new RegExp(`\\b${escapedName}\\b.*cannot find the file`, 'i'),
    new RegExp(`no such file or directory:\\s*${escapedName}(?:\\s|$)`, 'i'),
  ];
}

/** Returns a trimmed CLI command with a safe fallback. */
export function normalizeCliCommand(value: string | undefined, fallback = FALLBACK_CLI_COMMAND): string {
  return (value ?? fallback).trim();
}

/** Resolves launch command from user-level configuration only, ignoring workspace-controlled values. */
export function resolveCliCommandSetting(
  inspection: ConfigurationInspectionLike<string> | undefined,
  fallback = FALLBACK_CLI_COMMAND,
): string {
  const value = inspection?.globalValue !== undefined
    ? inspection.globalValue
    : inspection?.defaultValue ?? fallback;

  return normalizeCliCommand(value, fallback);
}

/** Returns the configured terminal base name without any numeric suffix. */
export function normalizeTerminalName(value: string | undefined, fallback = FALLBACK_TERMINAL_NAME): string {
  return (value ?? fallback).trim() || fallback;
}

/** Returns the terminal label with the numeric suffix used by the extension. */
export function buildTerminalName(value: string | undefined, sequence: number, fallback = FALLBACK_TERMINAL_NAME): string {
  const baseName = normalizeTerminalName(value, fallback);
  const suffix = sequence <= 1 ? '' : ` ${sequence}`;

  return `${baseName}${suffix}`;
}

/** Returns the settings search query for the current extension id. */
export function buildExtensionSettingsQuery(extensionId: string): string {
  return `@ext:${extensionId}`;
}

/** Extracts the executable token while preserving quoted Windows paths with spaces. */
export function extractExecutable(command: string): string {
  const normalized = command.trim();

  if (!normalized) {
    return '';
  }

  const firstCharacter = normalized[0];
  if (firstCharacter === '"' || firstCharacter === "'") {
    const closingQuoteIndex = normalized.indexOf(firstCharacter, 1);
    if (closingQuoteIndex > 0) {
      return normalized.slice(1, closingQuoteIndex);
    }
  }

  const whitespaceIndex = normalized.search(/\s/);
  return whitespaceIndex === -1 ? normalized : normalized.slice(0, whitespaceIndex);
}

/** Returns whether a missing executable should show Grok Build installation guidance. */
export function shouldShowMissingGrokGuidance(command: string, exitCode: number | undefined, output: string): boolean {
  if (!isGrokCliCommand(command)) {
    return false;
  }

  if (exitCode !== undefined && exitCode !== 1 && exitCode !== 127) {
    return false;
  }

  return buildCommandNotFoundPatterns(command).some((pattern) => pattern.test(output));
}

/** Resolves the terminal cwd from the active editor or the first workspace folder. */
export function resolveTerminalCwd<T>(
  activeEditor: ActiveEditorLike<T> | undefined,
  workspace: WorkspaceLike<T>,
): T | undefined {
  const activeWorkspaceFolder = activeEditor ? workspace.getWorkspaceFolder(activeEditor.document.uri) : undefined;
  return activeWorkspaceFolder?.uri ?? workspace.workspaceFolders?.[0]?.uri;
}

export { FALLBACK_CLI_COMMAND, FALLBACK_TERMINAL_NAME };
