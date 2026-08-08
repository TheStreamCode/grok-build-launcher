# Grok Build Launcher

<p align="center">
  <img src="media/icon.png" width="128" height="128" alt="Grok Build Launcher icon">
</p>

<p align="center">
  <strong>Launch Grok Build CLI in a fresh side terminal without leaving your editor.</strong>
</p>

<p align="center">
  A focused, local-first, unofficial VS Code extension for VS Code, Cursor, and Windsurf on Windows, macOS, and Linux.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-grok-build-launcher"><img alt="Install from Visual Studio Marketplace" src="https://img.shields.io/badge/Visual%20Studio%20Marketplace-Install-007ACC?logo=visualstudiocode&logoColor=white"></a>
  <a href="https://open-vsx.org/extension/mikesoft/vscode-grok-build-launcher"><img alt="Open VSX version" src="https://img.shields.io/open-vsx/v/mikesoft/vscode-grok-build-launcher?label=Open%20VSX&color=a60ee5"></a>
  <a href="https://github.com/TheStreamCode/grok-build-launcher/releases/latest"><img alt="Latest GitHub release" src="https://img.shields.io/github/v/release/TheStreamCode/grok-build-launcher?display_name=tag&sort=semver&label=GitHub%20Release"></a>
  <a href="https://github.com/TheStreamCode/grok-build-launcher/actions/workflows/ci.yml"><img alt="Continuous integration status" src="https://github.com/TheStreamCode/grok-build-launcher/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/License-MIT-blue.svg"></a>
</p>

> **Independent project:** Grok Build Launcher is not affiliated with, endorsed by, sponsored by, or approved by xAI. Grok, Grok Build, xAI, and related names and trademarks belong to their respective owners. This repository contains original launcher assets and no official xAI or Grok artwork.

Current documented release: `0.1.12`. See [`CHANGELOG.md`](CHANGELOG.md) for release-by-release changes.

Repository: https://github.com/TheStreamCode/grok-build-launcher

## Install

| Channel | Action | Best for |
| --- | --- | --- |
| Visual Studio Marketplace | [Install the extension](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-grok-build-launcher) | VS Code |
| Open VSX Registry | [Install from Open VSX](https://open-vsx.org/extension/mikesoft/vscode-grok-build-launcher) | Cursor, Windsurf, and Open VSX-compatible editors |
| GitHub Releases | [Download the latest VSIX](https://github.com/TheStreamCode/grok-build-launcher/releases/latest) | Manual and offline installation |

VS Code users can also install the Marketplace build from a terminal:

```bash
code --install-extension mikesoft.vscode-grok-build-launcher
```

## Quick Start

1. Install Grok Build CLI from the [official xAI documentation](https://docs.x.ai/build/overview) and confirm that `grok` works in an integrated terminal.
2. Install Grok Build Launcher and open a trusted workspace or file.
3. Select the launcher button in the editor title toolbar. A fresh side terminal opens and starts `grok` in the relevant workspace folder.

## Why This Launcher

- **Stay in context:** launch Grok Build directly beside the file you are editing.
- **Predictable sessions:** every click creates a fresh terminal instead of reusing hidden state.
- **Workspace-aware startup:** multi-root windows prefer the workspace of the active editor.
- **Local-first operation:** commands run visibly in the integrated terminal, with no telemetry or background installer.
- **Conservative failure guidance:** installation help appears only for a direct `grok` launch with real command-not-found evidence.

## At A Glance

| Area | Behavior |
| --- | --- |
| Execution | Visible VS Code integrated terminal |
| Workspace safety | Launching is disabled until the workspace is trusted |
| Command control | The executable command comes from machine-level user configuration, never workspace settings |
| Privacy | No telemetry, analytics, tracking, persistence, or transmission of terminal output |
| Diagnostics | At most 8 KiB held temporarily in memory for direct `grok` missing-command detection |
| Compatibility | VS Code `^1.103.0`; Windows, macOS, and Linux |

## How It Works

**Toolbar action → Workspace Trust check → fresh side terminal → machine-level Grok command**

Each launch creates a new terminal beside the current editor. When possible, the terminal starts in the workspace folder containing the active file; otherwise it uses the first open workspace folder.

The launcher uses VS Code terminal shell integration to observe the same environment as the integrated terminal. Per-launch listeners and fallback timers are released when the launch finishes or the terminal closes, so repeated launches do not accumulate extension-host resources.

Workspace Trust is enforced before command execution. `grokBuildLauncher.cliCommand` is read only from global or remote machine settings, and workspace-controlled values are ignored.

## Features

- Editor-title toolbar launcher and Command Palette command
- Fresh side terminal for every launch
- Active-editor workspace selection with multi-root fallback
- Configurable executable command and terminal name
- Quoted Windows executable-path support
- Verified HTTPS installation guidance when the default CLI is missing
- Bounded, memory-only missing-command diagnostics
- No automatic downloads, PATH edits, shell-profile changes, or telemetry

## Requirements

- VS Code `^1.103.0` or a compatible editor
- Grok Build CLI available in the integrated terminal environment

For development, use Node.js 22 and the committed npm lockfile.

## Configuration

| Setting | Default | Scope | Description |
| --- | --- | --- | --- |
| `grokBuildLauncher.cliCommand` | `grok` | Machine | Command executed by the launcher. Workspace values are ignored. |
| `grokBuildLauncher.terminalName` | `Grok Build` | Window | Base label for newly created terminals. |

Open settings from the Command Palette with **Grok Build Launcher: Open Settings**.

Default command:

```json
"grokBuildLauncher.cliCommand": "grok"
```

Windows path containing spaces:

```json
"grokBuildLauncher.cliCommand": "\"C:\\Program Files\\Grok Build\\grok.exe\""
```

macOS or Linux absolute path:

```json
"grokBuildLauncher.cliCommand": "\"/Users/you/.grok/bin/grok\""
```

### Environment Variables

The extension does not require or read runtime environment variables. Runtime configuration is managed through the settings above. Local `.env` files are ignored by Git and must never contain publisher credentials or other secrets intended for repository use.

## Missing CLI Guidance

When a direct `grok` launch produces command-not-found evidence, the extension offers an **Open Installation Guide** action that opens the verified [official xAI documentation](https://docs.x.ai/build/overview).

The extension does not download or execute installers, run remote scripts, create temporary installation scripts, or modify PATH and shell-profile configuration.

## Security And Privacy

Grok Build Launcher does not collect telemetry, analytics, or personal data.

For a direct `grok` launch, the extension may temporarily inspect at most the first 8 KiB of shell output to distinguish a missing executable from a normal CLI failure. The buffer exists only in memory, is discarded after the check, and is never persisted or transmitted. Custom commands and wrappers are not monitored.

The extension launches commands locally in the integrated terminal. Grok Build CLI is a separate product with its own authentication, network behavior, privacy policy, and terms.

Security-sensitive reports should use [GitHub private vulnerability reporting](https://github.com/TheStreamCode/grok-build-launcher/security/advisories/new). See [`SECURITY.md`](SECURITY.md) for the supported-version and disclosure policy.

## Troubleshooting

### The terminal opens but `grok` is not recognized

Use **Open Installation Guide**, or follow the [official xAI installation documentation](https://docs.x.ai/build/overview). Restart the editor if newly opened terminals still cannot find `grok`.

### Nothing happens after selecting the launcher

Confirm that the workspace is trusted. Then check `grokBuildLauncher.cliCommand` and verify the same command in a regular integrated terminal.

### Custom executable path on Windows

Quote executable paths that contain spaces, such as `"C:\Program Files\Grok Build\grok.exe"`.

### Multi-root workspaces

Open a file from the desired workspace folder before selecting the launcher. The active editor determines the preferred starting directory.

## Development

Install the exact lockfile dependency graph and run the complete validation suite:

```bash
npm ci
npm run audit
npm run typecheck
npm run check
```

Useful focused commands:

```bash
npm run compile
npm run test:unit
npm run test:integration
npm run test:package
```

`npm run check` starts from a clean `out/` directory, compiles the extension, runs unit and metadata tests, executes the VS Code Extension Host smoke test against the minimum supported version, and inspects the package file list. Set `VSCODE_TEST_VERSION=stable` to test the latest stable runtime. `VSCODE_TEST_CACHE_PATH` can select an isolated runtime cache.

Continuous integration validates Windows, macOS, and Linux. Linux also runs the dependency audit, while CodeQL analyzes JavaScript/TypeScript and GitHub Actions workflows.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution requirements and repository conventions.

## Build And Deployment

Create the installable VSIX with:

```bash
npm run package
```

The command cleans and recompiles `out/`, then creates `vscode-grok-build-launcher-<version>.vsix`. Package inspection excludes tests, source maps, engineering documents, GitHub metadata, local environment data, and development dependencies.

GitHub releases include the versioned VSIX and a SHA-256 checksum sidecar. Marketplace and Open VSX publication are separate maintainer-controlled deployment steps.

## Related Project

Need one interface for several coding agents? [Super CLI](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-super-cli) provides a unified launcher for Claude Code, Codex, Copilot, Cursor, Grok, Kilo, Antigravity, OpenCode, and other supported tools.

## Support

- [Report a reproducible bug](https://github.com/TheStreamCode/grok-build-launcher/issues/new?template=bug_report.yml)
- [Propose a focused enhancement](https://github.com/TheStreamCode/grok-build-launcher/issues/new?template=feature_request.yml)
- Read [`SUPPORT.md`](SUPPORT.md) for diagnostic details and private contact options
- Support ongoing maintenance through [GitHub Sponsors](https://github.com/sponsors/TheStreamCode)

## Legal And Trademarks

This repository contains only extension code and original launcher assets. It does not include official xAI or Grok logos, screenshots, or artwork. See [`TRADEMARKS.md`](TRADEMARKS.md) for the complete affiliation and trademark notice.

## License

Released under the [MIT License](LICENSE).
