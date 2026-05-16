import * as path from 'node:path';

const GROK_INSTALL_URL = 'https://x.ai/cli/install.sh';

type EnvironmentLike = Record<string, string | undefined>;

function quoteJavaScriptString(value: string): string {
  return JSON.stringify(value);
}

function trimTrailingSeparators(value: string): string {
  return value.replace(/[\\/]+$/g, '');
}

function normalizePathEntry(value: string, caseInsensitive: boolean): string {
  const normalized = trimTrailingSeparators(value.trim());
  return caseInsensitive ? normalized.toLowerCase() : normalized;
}

function getHomeDir(platform: NodeJS.Platform | string, env: EnvironmentLike, homedir: string): string {
  if (platform === 'win32') {
    return env.USERPROFILE || env.HOME || homedir;
  }

  return env.HOME || homedir;
}

/** Returns the terminal-facing missing CLI message. */
export function buildGrokInstallPromptMessage(): string {
  return 'Grok Build CLI was not found.';
}

/** Returns the short terminal command that runs the generated installer script. */
export function buildGrokInstallPromptCommand(scriptPath: string): string {
  return `node ${buildQuotedCommandPath(scriptPath)}`;
}

/** Returns the default Grok bin directory for the target platform. */
export function getDefaultGrokBinDir(
  platform: NodeJS.Platform | string = process.platform,
  env: EnvironmentLike = process.env,
  homedir = '',
): string {
  const home = getHomeDir(platform, env, homedir);

  if (platform === 'win32') {
    return path.win32.join(home, '.grok', 'bin');
  }

  return path.posix.join(home, '.grok', 'bin');
}

/** Returns the expected Grok executable path after the official installer completes. */
export function getDefaultGrokExecutablePath(
  platform: NodeJS.Platform | string = process.platform,
  env: EnvironmentLike = process.env,
  homedir = '',
): string {
  const executableName = platform === 'win32' ? 'grok.exe' : 'grok';

  if (platform === 'win32') {
    return path.win32.join(getDefaultGrokBinDir(platform, env, homedir), executableName);
  }

  return path.posix.join(getDefaultGrokBinDir(platform, env, homedir), executableName);
}

/** Quotes a command path so it can be sent directly to an integrated terminal. */
export function buildQuotedCommandPath(commandPath: string): string {
  return `"${commandPath.replace(/"/g, '\\"')}"`;
}

/** Returns whether a PATH-like string already contains the directory. */
export function hasPathEntry(pathValue: string, directory: string, delimiter: string, caseInsensitive: boolean): boolean {
  const expected = normalizePathEntry(directory, caseInsensitive);

  return pathValue
    .split(delimiter)
    .map((entry) => normalizePathEntry(entry, caseInsensitive))
    .some((entry) => entry === expected);
}

/** Appends a PATH entry only when it is not already present. */
export function appendPathEntry(pathValue: string, directory: string, delimiter: string, caseInsensitive: boolean): string {
  if (!pathValue.trim()) {
    return directory;
  }

  if (hasPathEntry(pathValue, directory, delimiter, caseInsensitive)) {
    return pathValue;
  }

  return `${pathValue}${delimiter}${directory}`;
}

/** Returns the Node installer script executed inside a visible VS Code terminal after user consent. */
export function buildGrokInstallPromptScript(installUrl = GROK_INSTALL_URL): string {
  const message = quoteJavaScriptString(buildGrokInstallPromptMessage());
  const url = quoteJavaScriptString(installUrl);

  return String.raw`const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const installUrl = ${url};
const binDir = path.join(os.homedir(), '.grok', 'bin');
const executablePath = path.join(binDir, process.platform === 'win32' ? 'grok.exe' : 'grok');

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, args, { stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(command + ' exited with code ' + code));
    });
  });
}

function commandOutput(command, args) {
  try {
    return cp.execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function findWindowsBash() {
  const candidates = [
    process.env.GIT_BASH_PATH,
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles, 'Git\\bin\\bash.exe') : undefined,
    process.env['ProgramFiles(x86)'] ? path.join(process.env['ProgramFiles(x86)'], 'Git\\bin\\bash.exe') : undefined,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs\\Git\\bin\\bash.exe') : undefined,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const whereResult = commandOutput('where.exe', ['bash.exe'])
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => /bash\.exe$/i.test(line));

  return whereResult || '';
}

async function runOfficialInstaller() {
  const command = 'curl -fsSL ' + installUrl + ' | bash';

  if (process.platform === 'win32') {
    const bashPath = findWindowsBash();
    if (!bashPath) {
      console.error('Git Bash was not found. Install Git for Windows, then run this installer again.');
      process.exit(1);
    }

    await run(bashPath, ['-lc', command]);
    return;
  }

  await run(process.env.SHELL || '/bin/sh', ['-lc', command]);
}

async function ensureWindowsUserPath() {
  const script = "$dir = " + JSON.stringify(binDir) + "; " +
    "$userPath = [Environment]::GetEnvironmentVariable('Path', 'User'); " +
    "$entries = @(); if ($userPath) { $entries = $userPath -split ';' | Where-Object { $_ } }; " +
    "$exists = $entries | Where-Object { $_.TrimEnd('\\') -ieq $dir.TrimEnd('\\') }; " +
    "if (-not $exists) { $newPath = (($entries + $dir) -join ';'); [Environment]::SetEnvironmentVariable('Path', $newPath, 'User'); Write-Host 'Added ' $dir ' to the Windows user PATH.' } " +
    "else { Write-Host 'Windows user PATH already contains ' $dir }";

  await run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script]);
}

function appendIfMissing(filePath, block) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  if (existing.includes('.grok/bin')) {
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, (existing.endsWith('\n') || existing.length === 0 ? '' : '\n') + block, 'utf8');
  console.log('Updated PATH configuration in ' + filePath);
}

function ensurePosixShellPath() {
  const shellName = path.basename(process.env.SHELL || '');
  const exportBlock = '\n# >>> grok build launcher >>>\nexport PATH="$HOME/.grok/bin:$PATH"\n# <<< grok build launcher <<<\n';
  const fishBlock = '\n# >>> grok build launcher >>>\nfish_add_path $HOME/.grok/bin\n# <<< grok build launcher <<<\n';
  const home = os.homedir();

  if (shellName === 'fish') {
    appendIfMissing(path.join(home, '.config', 'fish', 'config.fish'), fishBlock);
    return;
  }

  if (shellName === 'zsh') {
    appendIfMissing(path.join(home, '.zshrc'), exportBlock);
    if (process.platform === 'darwin') {
      appendIfMissing(path.join(home, '.zprofile'), exportBlock);
    }
    return;
  }

  if (shellName === 'bash') {
    appendIfMissing(path.join(home, '.bashrc'), exportBlock);
    if (process.platform === 'darwin') {
      appendIfMissing(path.join(home, '.bash_profile'), exportBlock);
    }
    return;
  }

  appendIfMissing(path.join(home, '.profile'), exportBlock);
}

(async () => {
  console.log(${message});
  console.log('Installing Grok Build CLI with the official xAI installer...');
  await runOfficialInstaller();

  if (process.platform === 'win32') {
    await ensureWindowsUserPath();
  } else {
    ensurePosixShellPath();
  }

  if (!fs.existsSync(executablePath)) {
    console.warn('Install completed, but the expected executable was not found at ' + executablePath + '.');
    console.warn('Restart VS Code or run the official installer manually if the grok command is still unavailable.');
    process.exit(0);
  }

  console.log('Grok Build CLI installed at ' + executablePath + '.');
  console.log("Run 'grok' or 'agent' to get started.");
  console.log('Restart VS Code if existing terminals do not see the updated PATH.');
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
`;
}

export { GROK_INSTALL_URL };
