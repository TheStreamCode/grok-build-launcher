# Security Review — 2026-08-01

## Executive Summary

The reviewed v0.1.9 candidate has no unresolved critical, high, or medium severity findings. The extension has a small local attack surface: it registers two VS Code commands, creates integrated terminals, opens one fixed HTTPS documentation URL, and has no webview, server, telemetry, credential store, direct subprocess API, or runtime dependency.

The dependency audit reported zero known vulnerabilities, the GitHub security APIs reported zero open code-scanning, Dependabot, and secret-scanning alerts, and the local type-check and test suite passed. These results are a point-in-time assessment, not a guarantee that future dependencies or platform behavior will remain vulnerability-free.

## Scope And Method

The review covered `src/`, the extension manifest, tests, npm dependency metadata, GitHub Actions, package boundaries, privacy/security documentation, and the generated VSIX. It evaluated command execution, workspace-controlled input, terminal-output handling, external navigation, dependency risk, workflow permissions, and secret exposure.

The security model was compared with the current [VS Code Workspace Trust guidance](https://code.visualstudio.com/api/extension-guides/workspace-trust), [GitHub Actions secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use), and [npm audit documentation](https://docs.npmjs.com/cli/v11/commands/npm-audit/).

## Critical Severity

No critical findings identified.

## High Severity

No high-severity findings identified.

## Medium Severity

No unresolved medium-severity findings identified.

## Low Severity And Resolved Findings

### SEC-001 — Workspace-controlled command execution — Resolved

The launcher executes a configurable terminal command, so a malicious workspace must not be able to replace that value. The manifest marks the command setting as machine-scoped and restricted in untrusted workspaces (`package.json:34-40`, `package.json:91-95`). Runtime resolution reads only the inspected global value (`src/command-utils.ts:68-77`), and the command handler independently refuses to launch until the workspace is trusted (`src/extension.ts:148-164`). Regression tests cover both boundaries.

### SEC-002 — Terminal-output retention — Resolved

Missing-command diagnosis could otherwise retain arbitrary CLI output in memory. The implementation monitors only direct `grok` launches, requires explicit command-not-found evidence, caps retained output at 8 KiB, and discards it after the execution check (`src/extension.ts:16-38`, `src/extension.ts:131-145`, `src/command-utils.ts:118-129`). It does not inspect custom commands or wrappers and does not persist or transmit captured output.

### SEC-003 — CI supply-chain mutability — Resolved

The CI workflow grants read-only repository permissions and pins third-party actions to full commit SHAs (`.github/workflows/ci.yml:10-11`, `.github/workflows/ci.yml:31-39`). Linux CI also runs the high-severity dependency-audit gate (`.github/workflows/ci.yml:44-46`).

## Informational Findings And Accepted Design Risk

### SEC-004 — User-configured command is intentionally executable

`grokBuildLauncher.cliCommand` accepts a full terminal command rather than only a fixed binary path. This is required for existing wrapper and argument use cases and is not changed to avoid a breaking behavior. Users must treat the global value as trusted executable configuration. The workspace-scope and Workspace Trust controls above prevent a cloned repository from supplying it.

### SEC-005 — External CLI remains outside the extension boundary

The extension does not install, update, authenticate, or communicate with Grok Build CLI. Once launched, that third-party CLI has its own network access, credentials, data handling, and terms. The README and security policy make this boundary explicit.

## Verification Evidence

- `npm ci`: completed; zero vulnerabilities reported.
- `npm run audit`: completed; zero known vulnerabilities.
- `npm run typecheck`: completed without diagnostics.
- `npm run check`: completed; 37 tests passed, VS Code extension host exited with code 0, and package contents were inspected.
- `npm run package`: completed; 14 files, 1,839,560 bytes.
- VSIX SHA-256: `97C99CE541284654C4CBE99F118292D5FBB23CA380867106B615065585240A83`.
- The packaged `media/launcher-mark.svg` SHA-256 matches the repository source, and the removed derived PNG is absent from the VSIX.

## Recommended Follow-up

- Keep Dependabot security updates, CodeQL, secret scanning, push protection, branch protection, and private vulnerability reporting enabled.
- Re-run this review after adding runtime dependencies, network access, webviews, authentication, automatic installation, or new command-execution paths.
- Add a compatible TypeScript-aware linter when the lint ecosystem formally supports the repository's TypeScript major version; do not suppress peer compatibility warnings merely to add a lint command.
