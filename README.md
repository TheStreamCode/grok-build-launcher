# Grok Build Launcher

Launch Grok Build CLI in a fresh side terminal without leaving your editor

[![CI](https://github.com/TheStreamCode/grok-build-launcher/actions/workflows/ci.yml/badge.svg)](https://github.com/TheStreamCode/grok-build-launcher/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/mikesoft.vscode-grok-build-launcher?label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-grok-build-launcher)

<p align="center">
  <img src="media/icon.png" width="128" height="128" alt="Grok Build Launcher icon">
</p>

Grok Build Launcher is a focused, local-first, unofficial VS Code extension for VS Code, Cursor, and Windsurf on Windows, macOS, and Linux. It opens the user-installed Grok Build CLI in a dedicated side terminal and stays out of the CLI's authentication and configuration.

> **Independent project.** Grok Build Launcher is not affiliated with, endorsed by, sponsored by, or approved by xAI. Grok, Grok Build, xAI, and related names and trademarks belong to their respective owners. This repository contains original launcher assets and no official xAI or Grok artwork. See [`TRADEMARKS.md`](TRADEMARKS.md) for the complete notice.

## Install

| Channel | Action |
| --- | --- |
| Visual Studio Marketplace | [Install the extension](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-grok-build-launcher) |
| Open VSX Registry | [Install from Open VSX](https://open-vsx.org/extension/mikesoft/vscode-grok-build-launcher) |
| GitHub Releases | [Download the latest VSIX](https://github.com/TheStreamCode/grok-build-launcher/releases/latest) |

VS Code users can also install the Marketplace build from a terminal:

```bash
code --install-extension mikesoft.vscode-grok-build-launcher
```

Grok Build CLI itself is a separate product. Install it from the [official xAI documentation](https://docs.x.ai/build/overview) and confirm that `grok` works in an integrated terminal.

## Quick start

1. Install Grok Build CLI and confirm that `grok` works in an integrated terminal.
2. Install Grok Build Launcher and open a trusted workspace or file.
3. Select the launcher button in the editor title toolbar.

A fresh side terminal opens and starts `grok` in the relevant workspace folder.

## Features

- Editor-title toolbar launcher and Command Palette command
- A fresh side terminal for every launch
- Active-editor workspace selection with multi-root fallback
- Configurable executable command and terminal name
- Quoted Windows executable-path support
- Installation guidance through the verified official xAI documentation
- Bounded, memory-only missing-command diagnostics
- No automatic downloads, PATH edits, shell-profile changes, or telemetry

## Requirements

- VS Code `^1.103.0`, Cursor, Windsurf, or a compatible editor
- Grok Build CLI available in the integrated terminal environment

For development, use Node.js 22 and the committed npm lockfile.

## Configuration

| Setting | Purpose | Default | Scope |
| --- | --- | --- | --- |
| `grokBuildLauncher.cliCommand` | Command executed by the launcher. Workspace values are ignored. | `grok` | Machine |
| `grokBuildLauncher.terminalName` | Base label for newly created terminals. | `Grok Build` | Window |

Open the settings with **Grok Build Launcher: Open Settings** from the Command Palette.

Windows path containing spaces:

```json
"grokBuildLauncher.cliCommand": "\"C:\\Program Files\\Grok Build\\grok.exe\""
```

macOS or Linux absolute path:

```json
"grokBuildLauncher.cliCommand": "\"/Users/you/.grok/bin/grok\""
```

The extension does not require or read runtime environment variables. Local `.env` files are ignored by Git and must never contain publisher credentials or other secrets.

## Privacy and security

Grok Build Launcher does not collect telemetry, analytics, or personal data. Each launch creates a new terminal beside the current editor; when possible, the terminal starts in the workspace folder containing the active file, otherwise it uses the first open workspace folder.

For a direct `grok` launch, the extension may temporarily inspect at most the first 8 KiB of shell output to distinguish a missing executable from a normal CLI failure. The buffer exists only in memory, is discarded after the check, and is never persisted or transmitted. Custom commands and wrappers are not monitored.

Workspace Trust is enforced before command execution. `grokBuildLauncher.cliCommand` is read only from global or remote machine settings, and workspace-controlled values are ignored. The extension does not download or execute installers, run remote scripts, create temporary installation scripts, modify `PATH`, or edit shell profiles.

See [`SECURITY.md`](SECURITY.md) for the supported-version and disclosure policy.

## Troubleshooting

### The terminal opens but `grok` is not recognized

Use the installation guide offered by the extension, or follow the [official xAI installation documentation](https://docs.x.ai/build/overview). Restart the editor if newly opened terminals still cannot find `grok`.

### Nothing happens after selecting the launcher

Confirm that the workspace is trusted. Then check `grokBuildLauncher.cliCommand` and verify the same command in a regular integrated terminal.

### Custom executable path on Windows

Quote executable paths that contain spaces, such as `"C:\Program Files\Grok Build\grok.exe"`.

### Multi-root workspaces

Open a file from the desired workspace folder before selecting the launcher. The active editor determines the preferred starting directory.

## Development

Requirements: Node.js 22 and npm with the committed `package-lock.json`.

```bash
git clone https://github.com/TheStreamCode/grok-build-launcher.git
cd grok-build-launcher
npm ci
npm run audit
npm run typecheck
npm run check
```

`npm run check` starts from a clean `out/` directory, compiles the extension, runs unit and metadata tests, executes the VS Code Extension Host smoke test against the minimum supported version, and inspects the package file list. Set `VSCODE_TEST_VERSION=stable` to test the latest stable runtime.

To build the installable package:

```bash
npm run package
```

The command creates `vscode-grok-build-launcher-<version>.vsix` and excludes tests, source maps, engineering documents, GitHub metadata, and local environment data. GitHub releases include the versioned VSIX and a SHA-256 checksum sidecar. Marketplace and Open VSX publication are separate maintainer-controlled steps. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution requirements.

## Support

- [Report a reproducible bug](https://github.com/TheStreamCode/grok-build-launcher/issues/new?template=bug_report.yml)
- [Propose a focused enhancement](https://github.com/TheStreamCode/grok-build-launcher/issues/new?template=feature_request.yml)
- Read [`SUPPORT.md`](SUPPORT.md) for diagnostic details and private contact options
- Support ongoing maintenance through [GitHub Sponsors](https://github.com/sponsors/TheStreamCode)

Need one interface for several coding agents? [Super CLI](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-super-cli) provides a unified launcher for Claude Code, Codex, Copilot, Cursor, Grok, Kilo, Antigravity, OpenCode, and other supported tools.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Pull requests must pass the required CI checks.

## License

MIT License — see [`LICENSE`](LICENSE).

---

Maintained by [Michael Gasperini (Mikesoft)](https://mikesoft.it).
If this project is useful to you, consider [sponsoring its maintenance](https://github.com/sponsors/TheStreamCode).
