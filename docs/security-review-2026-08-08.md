# Security Review — 2026-08-08

## Executive Summary

The reviewed post-v0.1.10 `main` candidate has no unresolved critical, high, or medium severity
findings after remediation. The extension remains a small local launcher with no runtime
dependencies, webview, server, telemetry, credential store, direct subprocess API, installer, or
background network activity.

The review found three newly disclosed high-severity advisories in transitive development
dependencies used by the VSCE release tool. They were not packaged with the extension, but they
made the dependency audit fail and affected repository release tooling. The lockfile now resolves
the patched versions. The extension-host test was also made deterministic at the declared VS Code
compatibility floor while retaining latest-stable coverage in CI.

This is a point-in-time assessment, not a guarantee about future platform or dependency behavior.

## Scope And Method

The review covered `src/`, tests, extension metadata, npm dependencies and install scripts, GitHub
Actions and repository security settings, documentation, version synchronization, and the generated
VSIX. It evaluated command execution, workspace-controlled input, terminal-output retention,
resource lifetime, external navigation, supply-chain controls, secret exposure, compatibility
testing, and release readiness.

## Critical Severity

No critical findings identified.

## High Severity

No unresolved high-severity findings identified.

## Medium Severity

No unresolved medium-severity findings identified.

## Resolved Findings

### SEC-008 — Vulnerable transitive release-tool dependencies — Resolved

At the start of the review, `npm audit` reported high-severity advisories affecting `fast-uri`
3.1.4, `js-yaml` 4.3.0, and `undici` 7.28.0 through the development-only `@vscode/vsce` graph.
The lockfile now selects patched versions 3.1.5, 4.3.1, and 7.29.0 respectively
(`package-lock.json:1991-2001`, `package-lock.json:2571-2583`,
`package-lock.json:4403-4411`). The extension has no production dependency graph, so the vulnerable
packages were not present in the installed VSIX; remediation was still required to restore a clean
release-tool supply chain and passing audit gate.

The existing install-script approvals remain restricted to the previously reviewed exact versions
of `@vscode/vsce-sign` and `keytar` (`package.json:129-132`). No new approval was added.

### SEC-009 — Extension-host compatibility test followed a moving target — Resolved

The extension declares VS Code `^1.103.0`, but the test harness previously omitted the download
version and therefore exercised whichever stable VS Code release was current. The harness now
defaults explicitly to 1.103.0 and supports controlled version and cache-path overrides
(`test/integration/runTest.js:4-15`). CI tests the compatibility floor on Windows and macOS and
latest stable on Linux while preserving the three required check names
(`.github/workflows/ci.yml:18-34`).

### SEC-001 — Per-launch terminal resources remained reachable — Revalidated

Listeners and timers created by a launch remain owned by the keyed registry, are released when
execution starts or ends, are released when the terminal closes, and are disposed during extension
shutdown (`src/extension.ts:28`, `src/extension.ts:81-129`, `src/extension.ts:216-229`).

### SEC-002 — Workspace-controlled command execution — Revalidated

The command remains machine-scoped and restricted in untrusted workspaces. Runtime code checks
Workspace Trust and resolves only the inspected global/default value
(`src/extension.ts:172-189`, `src/command-utils.ts:153-163`). A cloned repository cannot replace
the command launched by the toolbar action.

### SEC-003 — Terminal-output retention and over-collection — Revalidated

Only direct `grok` executions receive missing-command monitoring. Captured output remains capped at
the first 8 KiB, kept only in memory, and discarded after the shell-execution check
(`src/extension.ts:17`, `src/extension.ts:30-45`, `src/extension.ts:151-166`). Custom commands and
wrappers are launched without output collection.

### SEC-004 — Release-tool install scripts and stale output — Revalidated

Install-script approvals remain exact-version scoped, compilation cleans `out/`, and CI retains
read-only permissions with third-party actions pinned to full commit SHAs
(`package.json:108-132`, `.github/workflows/ci.yml:10-15`, `.github/workflows/ci.yml:37-46`).

## Informational And Accepted Design Risk

### SEC-005 — User-configured command is intentionally executable

The global setting accepts a full terminal command to preserve wrapper and argument use cases. This
is an intentional public contract; users must treat it as trusted executable configuration.
Workspace Trust and machine-scope controls prevent repository-supplied values.

### SEC-006 — Grok Build CLI is outside the extension boundary

The extension does not install, update, authenticate, or communicate with Grok Build CLI. Once
launched, that separate product has its own network, credential, data-handling, and legal behavior.

### SEC-007 — Large original SVG asset

`media/launcher-mark.svg` dominates the compressed VSIX because it contains embedded raster data.
It is original, already published artwork and is not executable content. It remains accepted to
preserve the existing design and format; any optimization requires separate visual-equivalence
approval.

## Verification Evidence

- Node.js v22.17.0 and npm 11.16.0 were used for the release gates.
- `npm ci`: installed 317 packages from the committed lockfile, audited 318 packages, reported zero
  vulnerabilities, and requested no new install-script approval.
- `npm audit --audit-level=moderate` and the production-only high-severity audit both reported zero
  vulnerabilities.
- `npm run typecheck`: completed without diagnostics.
- `npm run check`: 49 tests passed, the VS Code 1.103.0 Extension Host exited with code 0, and the
  12-file package boundary was inspected.
- The VS Code 1.132.0 latest-stable Extension Host also exited with code 0 from an isolated cache.
- Generated VSIX: 14 files, 1,841,196 bytes, SHA-256
  `04F923D146ADBC9759FE0019281A758365F671E34E6FDDFBB4230924A276170F`. It contained no source,
  tests, engineering docs, GitHub metadata, source maps, lockfile, environment data, or development
  dependencies. The packaged and source SVG SHA-256 hashes matched.
- GitHub security state before remediation: six open Dependabot alerts, zero open CodeQL alerts,
  zero open secret-scanning alerts, and private vulnerability reporting enabled.

## Recommended Follow-up

- Keep Workspace Trust, global-only command resolution, bounded output, and launch-registry tests mandatory.
- Re-review every new npm install script before changing `allowScripts`.
- Keep the extension-host floor aligned with `engines.vscode` and retain a latest-stable CI lane.
- Keep CodeQL, Dependabot security updates, secret scanning, push protection, and branch protection enabled.
- Re-run this review after adding runtime dependencies, network access, webviews, authentication,
  installation logic, or a new command-execution path.
