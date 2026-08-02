# Security Review — 2026-08-02

## Executive Summary

The reviewed v0.1.10 candidate has no unresolved critical, high, or medium severity findings. The
extension remains a small, local launcher with no runtime dependencies, webview, server, telemetry,
credential store, direct subprocess API, installer, or background network activity.

This review confirmed the launch-resource leak is fixed, dependency and GitHub security alerts are
clear, release-tool install scripts are explicitly reviewed and version-pinned, and the VSIX contains
only the expected runtime, documentation, and original assets. This is a point-in-time assessment,
not a guarantee about future platform or dependency behavior.

## Scope And Method

The review covered `src/`, tests, extension metadata, npm dependencies and install scripts, GitHub
Actions and repository security settings, documentation, version synchronization, and the generated
VSIX. It evaluated command execution, workspace-controlled input, terminal-output retention,
resource lifetime, external navigation, supply-chain controls, and secret exposure.

## Critical Severity

No critical findings identified.

## High Severity

No unresolved high-severity findings identified.

## Medium Severity

No unresolved medium-severity findings identified.

## Resolved Findings

### SEC-001 — Per-launch terminal resources remained reachable — Resolved

Listeners and timers created for each launch previously entered `context.subscriptions`, which VS
Code drains only on deactivate. Repeated launches could therefore grow that array and retain the
associated closures and diagnostic buffers. v0.1.10 owns these resources in a keyed registry,
releases them when execution starts or ends, releases every resource when its terminal closes, and
keeps only one aggregate subscription for shutdown (`src/extension.ts:28`,
`src/extension.ts:81-117`, `src/extension.ts:217-229`).

### SEC-002 — Workspace-controlled command execution — Resolved

The manifest keeps `grokBuildLauncher.cliCommand` machine-scoped and restricted in untrusted
workspaces. Runtime code independently checks Workspace Trust and resolves only the inspected
global/default value (`src/extension.ts:172-189`, `src/command-utils.ts:153-163`). A cloned
repository cannot replace the command launched by the toolbar action.

### SEC-003 — Terminal-output retention and over-collection — Resolved

Only direct `grok` executions receive missing-command monitoring. Captured output is capped at the
first 8 KiB, kept in memory only, and discarded after the shell-execution check
(`src/extension.ts:17`, `src/extension.ts:30-45`, `src/extension.ts:105`). Custom commands and
wrappers are launched without output collection.

### SEC-004 — Release-tool supply chain and stale build output — Resolved

The two reviewed transitive VSCE install scripts are approved only for their exact versions, so a
dependency update requires renewed review (`package.json:129-132`). Compilation now cleans `out/`
before invoking TypeScript (`package.json:108`), preventing removed or renamed sources from leaving
stale JavaScript in local validation or a package candidate. CI retains read-only permissions and
immutable action SHAs (`.github/workflows/ci.yml:10-11`, `.github/workflows/ci.yml:31-39`).

## Informational And Accepted Design Risk

### SEC-005 — User-configured command is intentionally executable

The global setting accepts a full terminal command to preserve wrapper and argument use cases. This
is an intentional public contract; users must treat the setting as trusted executable
configuration. Workspace Trust and machine-scope controls prevent repository-supplied values.

### SEC-006 — Grok Build CLI is outside the extension boundary

The extension does not install, update, authenticate, or communicate with Grok Build CLI. Once
launched, that separate product has its own network, credential, data-handling, and legal behavior.

### SEC-007 — Large original SVG asset

`media/launcher-mark.svg` dominates the compressed VSIX because it contains embedded raster data.
It is original, already published artwork and is not executable content. It remains accepted to
preserve the existing design and asset format; any optimization requires separate visual-equivalence
approval.

## Verification Evidence

- `npm ci`: completed from the committed lockfile with zero vulnerabilities and no pending install-script approval.
- `npm run typecheck`: completed without diagnostics.
- `npm run check`: 49 tests passed, the VS Code Extension Host exited with code 0, and package contents were inspected.
- `npm audit --audit-level=moderate`: zero vulnerabilities.
- Unit-test coverage for `command-utils.js`: 97.59% lines, 92.06% branches, 100% functions.
- GitHub security APIs: zero open CodeQL, Dependabot, or secret-scanning alerts at review time.
- Final VSIX: 14 entries, 1,840,860 bytes, SHA-256 `545F31CCDD0962A8C1E13B2298365B73CE81C6812A025790C64F043CCAD58AAF`.

## Recommended Follow-up

- Keep Workspace Trust, global-only command resolution, bounded output, and launch-registry tests mandatory.
- Re-review every new npm install script before changing `allowScripts`.
- Keep CodeQL, Dependabot security updates, secret scanning, push protection, and branch protection enabled.
- Re-run this review after adding runtime dependencies, network access, webviews, authentication, installation logic, or a new command-execution path.
