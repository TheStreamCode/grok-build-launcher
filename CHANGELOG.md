# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## 0.1.9

### Changed

- Restored the original SVG command icon as the packaged toolbar asset, preserving its design, format, proportions, and transparency.
- Added explicit type-check, dependency-audit, and package-inspection scripts and included the security audit in Linux CI.
- Expanded the README development, environment configuration, build, and deployment guidance.
- Expanded `AGENTS.md` with architecture, security, asset-preservation, validation, and release invariants.

### Documentation

- Added a repository-grounded security review with resolved controls and residual design considerations.

## 0.1.8

### Changed

- Limited missing-command detection to direct `grok` launches and require actual shell error evidence before showing installation guidance.
- Added structured GitHub issue forms, clearer contribution and security guidance, and cross-platform CI hardening.
- Preserved the existing icon design while using losslessly optimized PNG assets in the packaged extension.
- Removed the stale icon generator because it no longer reproduced the shipped artwork.

### Security

- Bounded temporary shell-output diagnostics to 8 KiB and stopped reading output for custom commands and wrappers.
- Updated development dependencies and pinned GitHub Actions to immutable commit SHAs.

## 0.1.7

### Changed

- Replaced automatic CLI installation with guidance that opens the official xAI installation documentation.
- Removed installer execution, temporary installer scripts, PATH updates, shell profile changes, and related settings.

### Security

- Limited missing CLI handling to a warning and an external documentation link.

## 0.1.6

### Changed

- Improved legal documentation, trademark notices, third-party terms references, and metadata cleanup.

## 0.1.5

### Changed

- Upgraded TypeScript from `^6.0.0` to `^7.0.0` (resolved 7.0.2). No source or configuration changes were required.
- Raised the minimum required VS Code version to `^1.103.0` and aligned `@types/vscode` to match, so `vsce` validation passes against the declared engine floor.
- Enabled TypeScript 6 compatibility in `tsconfig.json` and stopped tracking compiled `out/` output in git.

### Security

- Resolved npm audit vulnerabilities in transitive dependencies (`form-data`, `js-yaml`, `linkify-it`, `markdown-it`, `qs`, `tmp`, `undici`) via `npm audit fix`.

## 0.1.4

### Changed

- Lowered the required VS Code version from `^1.120.0` to `^1.93.0`, the actual floor for the terminal shell integration APIs the launcher uses. This widens compatibility to every VS Code release from 1.93 onward instead of requiring 1.120 or newer.

## 0.1.3

### Changed

- Added native Windows support to the guided installation flow available in that release.

## 0.1.2

### Changed

- Unified the `LICENSE` copyright holder to **Michael Gasperini (Mikesoft)**. No functional changes.

## 0.1.1

### Changed

- Marketplace discoverability: added the **AI** and **Chat** categories, a more descriptive title and summary, and reordered keywords.
- Added Marketplace, Open VSX, CI, and GitHub Sponsors badges, a `sponsor` link, and a pointer to **Super CLI** (the all-in-one launcher) to the README. No functional changes.

## 0.1.0

### Added

- Added Grok Build launcher command for opening Grok Build CLI in a side terminal from the editor toolbar.
- Added the original consent-based guided installation flow, which was removed in version 0.1.7.
- Added the original cross-platform environment handling, which was removed in version 0.1.7.
- Added configurable command and terminal name settings.
- Added Workspace Trust gating and machine-scoped launch command configuration to avoid workspace-controlled command execution.
- Added unit tests, VS Code integration smoke tests, metadata checks, package inspection, and CI coverage.
- Added legal, support, security, and trademark documentation for a public repository.
