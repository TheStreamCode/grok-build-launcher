# Grok Build Launcher

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/mikesoft.vscode-grok-build-launcher?label=Marketplace&color=6366F1)](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-grok-build-launcher)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/mikesoft.vscode-grok-build-launcher?color=0EA5E9)](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-grok-build-launcher)
[![Open VSX](https://img.shields.io/open-vsx/v/mikesoft/vscode-grok-build-launcher?label=Open%20VSX&color=a60ee5)](https://open-vsx.org/extension/mikesoft/vscode-grok-build-launcher)
[![CI](https://github.com/TheStreamCode/grok-build-launcher/actions/workflows/ci.yml/badge.svg)](https://github.com/TheStreamCode/grok-build-launcher/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Sponsor](https://img.shields.io/badge/Sponsor-TheStreamCode-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/TheStreamCode)

Grok Build Launcher is an unofficial VS Code extension that launches Grok Build CLI in a new side terminal directly from the editor toolbar.

Works on Windows, macOS, and Linux.

Current documented release: `0.1.10`. See `CHANGELOG.md` for release-by-release changes.

Repository: https://github.com/TheStreamCode/grok-build-launcher

> **✨ Want one launcher for every agent?** Try **[Super CLI](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-super-cli)** — a single sidebar that launches Claude Code, Codex, Copilot, Cursor, Grok, Kilo, Antigravity, OpenCode, and more. Install this launcher for Grok alone, or Super CLI for the whole set.

> **Independent project disclaimer**
> This extension is an independent, unofficial project. It is not affiliated with, endorsed by, sponsored by, or approved by xAI. Grok, Grok Build, xAI, and related names, logos, and trademarks are property of their respective owners. This project does not include official xAI or Grok logos.

## Features

- Adds a launcher button to the editor title toolbar
- Opens a fresh side terminal beside the active editor on every launch
- Uses the active editor workspace when available, with a fallback to the first open workspace folder
- Runs the configurable Grok Build CLI command, defaulting to `grok`
- Shows professional installation guidance when the default `grok` command is missing
- Opens the verified official xAI installation documentation in the external browser on request
- Does not download or execute installers or modify PATH and shell profile configuration
- Keeps missing-command diagnostics bounded in memory and only monitors direct `grok` launches
- Supports quoted Windows executable paths
- Does not collect telemetry, analytics, or personal data

## Requirements

- VS Code `^1.103.0`
- Grok Build CLI available in the integrated terminal environment

For development, use Node.js 22 and npm with the committed lockfile.

## Installation

1. Install the extension from the VS Code Marketplace or from a local `.vsix` package.
2. Open a workspace or file in VS Code.
3. Click the Grok Build Launcher button in the editor title toolbar.

If Grok Build CLI is already installed and `grok` is on PATH, the launcher starts immediately.

Install Grok Build CLI by following the [official xAI installation documentation](https://docs.x.ai/build/overview).

## Missing CLI Guidance

When the default `grok` command is unavailable, the extension displays a warning with an **Open Installation Guide** action. Selecting it opens the verified official xAI documentation in the external browser.

The extension does not download or execute installers, run remote scripts, create temporary installation scripts, or modify PATH and shell profile configuration.

## How It Works

Each launch creates a new terminal beside the current editor and sends the configured command immediately. Existing terminals are not reused.

When possible, the launcher opens the terminal in the workspace folder of the active editor. If the active editor is outside the workspace, it falls back to the first workspace folder in the current VS Code window.

The launcher checks command availability through VS Code terminal shell integration, so detection follows the same environment used by the integrated terminal rather than the extension host process. The listeners and timers created for a launch are released as soon as that launch finishes or its terminal is closed, so repeated launches do not accumulate resources in the extension host.

For safety, the launcher is disabled in untrusted workspaces. The executable command is read only from the global user setting (or the default), and workspace-controlled command values are ignored. This prevents a repository from changing the command that runs when you click the toolbar button.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `grokBuildLauncher.cliCommand` | `grok` | Command executed when the launcher button is clicked. |
| `grokBuildLauncher.terminalName` | `Grok Build` | Base label used for created launch terminals. |

`grokBuildLauncher.cliCommand` is a machine-level setting. Configure it from your user or remote machine settings, not from repository workspace settings.

### Environment Variables

The extension does not require or read runtime environment variables. Configuration is managed through the VS Code settings listed above. Local `.env` files are ignored by Git; do not store publisher tokens or other credentials in the repository.

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

## Troubleshooting

### The terminal opens but `grok` is not recognized

Use **Open Installation Guide** in the warning, or open the [official xAI installation documentation](https://docs.x.ai/build/overview). After installation, restart VS Code if new integrated terminals do not recognize `grok`.

### Nothing happens after clicking the button

Check `grokBuildLauncher.cliCommand` and verify that the same command works in a regular integrated terminal.

### Custom executable path on Windows

Quote executable paths that contain spaces. This is required for paths such as `"C:\Program Files\Grok Build\grok.exe"`.

### Multi-root workspaces

The launcher prefers the workspace folder of the active editor. To control where Grok Build starts in a multi-root window, open a file from the target workspace before clicking the toolbar button.

## Privacy

Grok Build Launcher does not collect telemetry, analytics, or personal data.

When VS Code terminal shell integration is available, the extension temporarily inspects at most the first 8 KiB of output from a direct `grok` launch to distinguish a missing executable from a normal CLI error. This diagnostic output is kept only in memory, is discarded after the check, and is never stored or transmitted by the extension. Custom commands and wrappers are not monitored.

The extension launches commands in your local VS Code integrated terminal. Grok Build CLI itself is a separate product with its own behavior, authentication, network access, and terms.

## Legal And Trademarks

This repository contains only the extension code and original launcher assets. It does not include official xAI or Grok logos.

See `TRADEMARKS.md` for the full affiliation and trademark notice.

## Development

Install the exact lockfile dependencies, then run the focused checks you need:

```bash
npm ci
npm run typecheck
npm run test:unit
npm run test:integration
npm run audit
npm run check
```

`npm run check` starts from a clean `out/` directory, compiles the extension, runs unit and metadata tests, executes the VS Code extension-host smoke test, and inspects the package file list.

The repository includes unit tests, metadata checks, VS Code integration smoke tests, and CI coverage for Windows, macOS, and Linux.

## Build And Deployment

Create an installable VSIX with:

```bash
npm run package
```

The command cleans and recompiles `out/`, then creates `vscode-grok-build-launcher-<version>.vsix` in the repository root. Generated JavaScript source maps, tests, engineering docs, GitHub metadata, local environment files, and development dependencies are excluded from the package.

Releases are distributed as versioned VSIX assets on GitHub and may also be published to compatible extension registries by the maintainer. Publishing credentials are deployment secrets: keep them outside the repository and never place them in `.env`, documentation, issue reports, or workflow output.

## Support

Open a GitHub issue for bugs and feature requests. For support details, see `SUPPORT.md`.

Financial support for the independent maintainer is available through GitHub Sponsors: [github.com/sponsors/TheStreamCode](https://github.com/sponsors/TheStreamCode).

## License

Released under the MIT License. See `LICENSE` for details.
