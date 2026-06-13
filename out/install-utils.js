"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROK_INSTALL_PS1_URL = exports.GROK_INSTALL_URL = void 0;
exports.buildGrokInstallPromptMessage = buildGrokInstallPromptMessage;
exports.buildGrokInstallPromptCommand = buildGrokInstallPromptCommand;
exports.getDefaultGrokBinDir = getDefaultGrokBinDir;
exports.getDefaultGrokExecutablePath = getDefaultGrokExecutablePath;
exports.buildQuotedCommandPath = buildQuotedCommandPath;
exports.hasPathEntry = hasPathEntry;
exports.appendPathEntry = appendPathEntry;
exports.buildGrokInstallPromptScript = buildGrokInstallPromptScript;
const path = __importStar(require("node:path"));
const GROK_INSTALL_URL = 'https://x.ai/cli/install.sh';
exports.GROK_INSTALL_URL = GROK_INSTALL_URL;
const GROK_INSTALL_PS1_URL = 'https://x.ai/cli/install.ps1';
exports.GROK_INSTALL_PS1_URL = GROK_INSTALL_PS1_URL;
function quoteJavaScriptString(value) {
    return JSON.stringify(value);
}
function trimTrailingSeparators(value) {
    return value.replace(/[\\/]+$/g, '');
}
function normalizePathEntry(value, caseInsensitive) {
    const normalized = trimTrailingSeparators(value.trim());
    return caseInsensitive ? normalized.toLowerCase() : normalized;
}
function getHomeDir(platform, env, homedir) {
    if (platform === 'win32') {
        return env.USERPROFILE || env.HOME || homedir;
    }
    return env.HOME || homedir;
}
/** Returns the terminal-facing missing CLI message. */
function buildGrokInstallPromptMessage() {
    return 'Grok Build CLI was not found.';
}
/** Returns the short terminal command that runs the generated installer script. */
function buildGrokInstallPromptCommand(scriptPath) {
    return `node ${buildQuotedCommandPath(scriptPath)}`;
}
/** Returns the default Grok bin directory for the target platform. */
function getDefaultGrokBinDir(platform = process.platform, env = process.env, homedir = '') {
    const home = getHomeDir(platform, env, homedir);
    if (platform === 'win32') {
        return path.win32.join(home, '.grok', 'bin');
    }
    return path.posix.join(home, '.grok', 'bin');
}
/** Returns the expected Grok executable path after the official installer completes. */
function getDefaultGrokExecutablePath(platform = process.platform, env = process.env, homedir = '') {
    const executableName = platform === 'win32' ? 'grok.exe' : 'grok';
    if (platform === 'win32') {
        return path.win32.join(getDefaultGrokBinDir(platform, env, homedir), executableName);
    }
    return path.posix.join(getDefaultGrokBinDir(platform, env, homedir), executableName);
}
/** Quotes a command path so it can be sent directly to an integrated terminal. */
function buildQuotedCommandPath(commandPath) {
    return `"${commandPath.replace(/"/g, '\\"')}"`;
}
/** Returns whether a PATH-like string already contains the directory. */
function hasPathEntry(pathValue, directory, delimiter, caseInsensitive) {
    const expected = normalizePathEntry(directory, caseInsensitive);
    return pathValue
        .split(delimiter)
        .map((entry) => normalizePathEntry(entry, caseInsensitive))
        .some((entry) => entry === expected);
}
/** Appends a PATH entry only when it is not already present. */
function appendPathEntry(pathValue, directory, delimiter, caseInsensitive) {
    if (!pathValue.trim()) {
        return directory;
    }
    if (hasPathEntry(pathValue, directory, delimiter, caseInsensitive)) {
        return pathValue;
    }
    return `${pathValue}${delimiter}${directory}`;
}
/** Returns the Node installer script executed inside a visible VS Code terminal after user consent. */
function buildGrokInstallPromptScript(shellInstallUrl = GROK_INSTALL_URL, windowsInstallUrl = GROK_INSTALL_PS1_URL) {
    const message = quoteJavaScriptString(buildGrokInstallPromptMessage());
    const shellUrl = quoteJavaScriptString(shellInstallUrl);
    const psUrl = quoteJavaScriptString(windowsInstallUrl);
    return String.raw `const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const shellInstallUrl = ${shellUrl};
const windowsInstallUrl = ${psUrl};
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

async function runOfficialInstaller() {
  if (process.platform === 'win32') {
    const psCommand = 'irm ' + windowsInstallUrl + ' | iex';
    await run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand]);
    return;
  }

  const command = 'curl -fsSL ' + shellInstallUrl + ' | bash';
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
//# sourceMappingURL=install-utils.js.map