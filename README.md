# Grok Build Launcher

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/mikesoft.vscode-grok-build-launcher?label=Marketplace&color=6366F1)](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-grok-build-launcher)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/mikesoft.vscode-grok-build-launcher?color=0EA5E9)](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-grok-build-launcher)
[![Open VSX](https://img.shields.io/open-vsx/v/mikesoft/vscode-grok-build-launcher?label=Open%20VSX&color=a60ee5)](https://open-vsx.org/extension/mikesoft/vscode-grok-build-launcher)
[![CI](https://github.com/TheStreamCode/grok-build-launcher/actions/workflows/ci.yml/badge.svg)](https://github.com/TheStreamCode/grok-build-launcher/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Sponsor](https://img.shields.io/badge/Sponsor-TheStreamCode-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/TheStreamCode)

Grok Build Launcher is an unofficial VS Code extension that launches Grok Build CLI in a new side terminal directly from the editor toolbar.

Works on Windows, macOS, and Linux.

Current documented release: `0.1.6`. See `CHANGELOG.md` for release-by-release changes.

Repository: https://github.com/TheStreamCode/grok-build-launcher

> **✨ Want one launcher for every agent?** Try **[Super CLI](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-super-cli)** — a single sidebar that launches Claude Code, Codex, Copilot, Cursor, Grok, Kilo, Antigravity, OpenCode, and more. Install this launcher for Grok alone, or Super CLI for the whole set.

> **Independent project disclaimer**
> This extension is an independent, unofficial project. It is not affiliated with, endorsed by, sponsored by, or approved by xAI. Grok, Grok Build, xAI, and related names, logos, and trademarks are property of their respective owners. This project does not include official xAI or Grok logos.

## Features

- Adds a launcher button to the editor title toolbar
- Opens a fresh side terminal beside the active editor on every launch
- Uses the active editor workspace when available, with a fallback to the first open workspace folder
- Runs the configurable Grok Build CLI command, defaulting to `grok`
- Offers explicit-consent guided installation when the default `grok` command is missing
- Updates the user PATH or selected shell startup files during guided install
- Falls back to the absolute installed `grok` executable path after guided install when enabled
- Supports quoted Windows executable paths
- Does not collect telemetry, analytics, or personal data

## Requirements

- VS Code `^1.103.0`
- Grok Build CLI available in the integrated terminal environment, or guided installation enabled
- On Windows guided installation uses the official xAI PowerShell installer — no Git Bash required

## Installation

1. Install the extension from the VS Code Marketplace or from a local `.vsix` package.
2. Open a workspace or file in VS Code.
3. Click the Grok Build Launcher button in the editor title toolbar.

If Grok Build CLI is already installed and `grok` is on PATH, the launcher starts immediately.

Manual Grok Build CLI installation uses the official xAI installer:

```bash
curl -fsSL https://x.ai/cli/install.sh | bash
```

## Guided Installation

When the launcher runs the default `grok` command and the integrated terminal reports that it is missing, the extension asks for explicit confirmation before installing anything.

If you choose **Install**, the extension opens a visible install terminal and runs a generated local Node script. The script visibly invokes the upstream xAI installer, then configures the expected PATH location. It never starts an installation unless you select **Install**.

The upstream installer makes network requests to `x.ai`; its download, authentication, behavior, and applicable xAI terms are outside this extension. Review those terms and the displayed terminal command before consenting.

Platform behavior:

- Windows: runs the upstream PowerShell installer (`irm https://x.ai/cli/install.ps1 | iex`) and adds `%USERPROFILE%\.grok\bin` only to the Windows user PATH. It does not change the system PATH.
- macOS: runs `curl -fsSL https://x.ai/cli/install.sh | bash` through the configured shell (or `/bin/sh` if none is configured). For zsh it updates `.zshrc` and `.zprofile`; for bash it updates `.bashrc` and `.bash_profile`; for fish it updates `.config/fish/config.fish`; for other shells it updates `.profile`.
- Linux: runs the same shell installer. For zsh it updates `.zshrc`; for bash it updates `.bashrc`; for fish it updates `.config/fish/config.fish`; for other shells it updates `.profile`.

On macOS and Linux, each startup file is changed only when it does not already contain `.grok/bin`.

After a successful guided install, the extension can update `grokBuildLauncher.cliCommand` to the detected absolute executable path. This makes the launcher work even before VS Code is restarted and before new terminals inherit the updated PATH.

The guided install flow is enabled by default, but it never runs without explicit confirmation.

## How It Works

Each launch creates a new terminal beside the current editor and sends the configured command immediately. Existing terminals are not reused.

When possible, the launcher opens the terminal in the workspace folder of the active editor. If the active editor is outside the workspace, it falls back to the first workspace folder in the current VS Code window.

The launcher checks command availability through VS Code terminal shell integration, so detection follows the same environment used by the integrated terminal rather than the extension host process.

For safety, the launcher is disabled in untrusted workspaces. The executable command is read only from the global user setting (or the default), and workspace-controlled command values are ignored. This prevents a repository from changing the command that runs when you click the toolbar button.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `grokBuildLauncher.cliCommand` | `grok` | Command executed when the launcher button is clicked. |
| `grokBuildLauncher.terminalName` | `Grok Build` | Base label used for created launch terminals. |
| `grokBuildLauncher.autoInstall` | `true` | Offer guided installation when the default `grok` command is missing. Installation still requires explicit confirmation. |
| `grokBuildLauncher.preferAbsoluteInstalledPath` | `true` | After guided install, update the launch command to the detected absolute `grok` executable path. |

`grokBuildLauncher.cliCommand`, `grokBuildLauncher.autoInstall`, and `grokBuildLauncher.preferAbsoluteInstalledPath` are machine-level settings. Configure them from your user or remote machine settings, not from repository workspace settings.

Use the Command Palette to open the extension settings:

- `Grok Build Launcher: Open Settings`

Examples:

Default command:

```json
"grokBuildLauncher.cliCommand": "grok"
```

Windows absolute executable path:

```json
"grokBuildLauncher.cliCommand": "\"C:\\Users\\You\\.grok\\bin\\grok.exe\""
```

macOS or Linux absolute executable path:

```json
"grokBuildLauncher.cliCommand": "\"/Users/you/.grok/bin/grok\""
```

Disable guided install prompts:

```json
"grokBuildLauncher.autoInstall": false
```

## Troubleshooting

### The terminal opens but `grok` is not recognized

Install Grok Build CLI with the official xAI installer:

```bash
curl -fsSL https://x.ai/cli/install.sh | bash
```

On Windows, the guided installer uses the official xAI PowerShell installer (`irm https://x.ai/cli/install.ps1 | iex`); no Git Bash is required.

If installation succeeds but existing terminals still do not see `grok`, restart VS Code so new terminal processes inherit the updated PATH.

### Windows PATH was updated but PowerShell still cannot find `grok`

Confirm that `%USERPROFILE%\.grok\bin` is present in your user PATH. Restart VS Code and open a new terminal. Existing terminal sessions do not automatically reload Windows user environment changes.

### Nothing happens after clicking the button

Check `grokBuildLauncher.cliCommand` and verify that the same command works in a regular integrated terminal.

### Custom executable path on Windows

Quote executable paths that contain spaces. This is required for paths such as `"C:\Program Files\Grok Build\grok.exe"`.

### Multi-root workspaces

The launcher prefers the workspace folder of the active editor. To control where Grok Build starts in a multi-root window, open a file from the target workspace before clicking the toolbar button.

## Privacy

Grok Build Launcher does not collect telemetry, analytics, or personal data.

The extension launches commands in your local VS Code integrated terminal. Grok Build CLI itself is a separate product with its own behavior, authentication, network access, and terms.

## Legal And Trademarks

This repository contains only the extension code and original launcher assets. It does not include official xAI or Grok logos.

See `TRADEMARKS.md` for the full affiliation and trademark notice.

## Development

Local verification and packaging:

```bash
npm install
npm run check
npm run test:integration
npm run package
```

`npm run package` creates the `.vsix` file in the workspace root.

The repository includes unit tests, metadata checks, VS Code integration smoke tests, and CI coverage for Windows and Linux.

## Support

Open a GitHub issue for bugs and feature requests. For support details, see `SUPPORT.md`.

Financial support for the independent maintainer is available through GitHub Sponsors: [github.com/sponsors/TheStreamCode](https://github.com/sponsors/TheStreamCode).

## License

Released under the MIT License. See `LICENSE` for details.
