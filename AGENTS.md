# Repository Guidelines

## Scope And Structure

- `src/extension.ts` owns VS Code command registration, workspace-trust checks, terminal creation, shell-integration handling, and user notifications.
- `src/command-utils.ts` contains pure, VS Code-independent helpers for command parsing, missing-CLI detection, terminal naming, bounded diagnostics, workspace cwd resolution, and the keyed disposable registry that owns per-launch resources.
- `test/*.test.js` contains Node unit, regression, documentation, and package-metadata tests. New files matching that glob are picked up automatically by `npm run test:unit`.
- `test/integration/` contains the VS Code extension-host smoke test.
- `media/icon.png` and `media/launcher-mark.svg` are the original packaged assets.
- `docs/` stores dated engineering plans and reviews. Keep current user-facing instructions in `README.md`.
- `out/`, `.vscode-test/`, `.vsce/`, and `*.vsix` are generated or local-only and must not be committed.

## Setup And Commands

Use Node.js 22 and the committed npm lockfile.

npm install scripts are denied unless their exact package version is listed in `allowScripts`.
Review the script before using `npm approve-scripts`; dependency updates require a fresh review.

- `npm ci`: install the exact dependency graph.
- `npm run clean`: remove compiled output.
- `npm run compile`: clean stale output, then compile TypeScript into `out/`.
- `npm run typecheck`: run strict TypeScript checks without emitting files.
- `npm run test:unit`: compile and run Node unit and metadata tests.
- `npm run test:integration`: compile and run the VS Code extension-host smoke test against VS Code 1.103.0 by default. Set `VSCODE_TEST_VERSION=stable` to exercise the latest stable runtime and `VSCODE_TEST_CACHE_PATH` when an isolated download cache is required.
- `npm run audit`: fail on known high- or critical-severity dependency vulnerabilities.
- `npm run test:package`: inspect the files that would be included in the VSIX.
- `npm run check`: compile, run all tests, and inspect package contents.
- `npm run package`: clean, compile, and build a versioned `.vsix` package.

Run `npm ci`, `npm run audit`, `npm run typecheck`, `npm run check`, and `npm run package` before a release. Extension-host warnings from the downloaded VS Code runtime are not failures when the process exits successfully; investigate non-zero exits and failed assertions.

`npm ci` must not report an unreviewed `allowScripts` request. Never broaden an approval or carry it
to a new package version without inspecting that version's install script.

## Architecture And Behavior Invariants

- Preserve existing commands, settings, terminal placement, multi-root cwd selection, and fresh-terminal-per-launch behavior unless a breaking change is explicitly approved.
- Require Workspace Trust before launching any terminal command. Keep the trust check in the command handler even when manifest capabilities hide or disable UI.
- Treat `grokBuildLauncher.cliCommand` as trusted user configuration. Read it from the global/machine setting only; never allow a workspace value to control command execution.
- Do not add `child_process`, automatic installers, remote script execution, PATH edits, shell-profile edits, or silent dependency downloads.
- Keep missing-CLI guidance conservative: monitor only a direct `grok` executable, require actual command-not-found output, retain at most 8 KiB temporarily, and never persist or transmit terminal output.
- Keep parsing and decision logic in pure helpers with focused regression tests. Limit `src/extension.ts` to VS Code API orchestration.
- Never push per-launch listeners or timers onto `context.subscriptions`. VS Code clears that array only on deactivate, so repeated launches would grow it without bound, and calling `.dispose()` does not remove the entry. Register them in the `launchResources` registry instead and let `onDidCloseTerminal` tear them down. `src/extension.ts` must keep exactly one `context.subscriptions.push(` call, in `activate`, and a regression test enforces it.
- Preserve the shell-integration timeout fallback so the launcher still works when shell integration is unavailable. The fallback must not write to a terminal that already exited.
- Open installation help only through the verified HTTPS xAI documentation URL already defined in the extension.

## Security And Privacy

- Do not add telemetry, analytics, tracking, network requests, credential storage, or collection of personal or workspace data without explicit approval and updated privacy/security documentation.
- Never commit tokens, publisher credentials, private keys, sanitized-output mistakes, `.env` files, or local machine paths. The extension currently requires no environment variables.
- Keep GitHub Actions permissions read-only unless a reviewed job needs a narrower explicit write permission.
- Pin third-party GitHub Actions to full commit SHAs and retain the human-readable release comment.
- Report vulnerabilities through GitHub private vulnerability reporting or the contact in `SECURITY.md`, not public issues.

## Assets, Legal, And Branding

- Do not change the design, format, colors, proportions, transparency, or visual content of existing assets.
- Keep `media/icon.png` as PNG and `media/launcher-mark.svg` as SVG. The manifest toolbar icon must continue to reference the SVG for both light and dark themes.
- Asset optimization is allowed only when lossless and necessary. Verify dimensions, transparency, and pixel/render equivalence before accepting it; do not create a generated replacement.
- This is an independent, unofficial launcher. Do not add official xAI or Grok logos, icons, artwork, screenshots, or brand assets without written permission from the rights holder.
- Keep the affiliation disclaimer visible in `README.md` and preserve the notices in `TRADEMARKS.md`.

## Code And Test Conventions

- Use strict TypeScript, two-space indentation, single quotes in TypeScript, semicolons, and descriptive names.
- Avoid broad refactors, drive-by formatting, and new runtime dependencies for behavior that the VS Code or Node standard APIs already provide.
- Add or update regression tests for every behavior change. Metadata tests should validate security-sensitive manifest settings and package boundaries.
- Keep tests deterministic and cross-platform. Do not assume a specific user shell, filesystem root, or installed Grok CLI.
- Keep the default extension-host test version aligned with the minimum version in `engines.vscode`; use CI to exercise both the minimum and latest stable VS Code runtimes without renaming required checks.
- Update `README.md`, `CHANGELOG.md`, `SECURITY.md`, and related tests when user-visible or security behavior changes.

## GitHub And Release Discipline

- Preserve unrelated user changes in dirty worktrees. Stage only files that belong to the current task.
- Use concise imperative or Conventional Commit subjects. Do not force-push, rewrite published history, or bypass branch protection unless the user explicitly authorizes the exact action.
- Normal changes go through a pull request with required checks and review. Push directly to `main` only when the user explicitly requests it.
- Before releasing, align the version in `package.json`, `package-lock.json`, `README.md`, `CHANGELOG.md`, `CITATION.cff`, issue templates, and metadata tests.
- Inspect the VSIX file list and verify it excludes source maps, tests, engineering docs, GitHub metadata, local environment data, and development dependencies.
- Do not commit generated VSIX or checksum files. Attach the built artifact, a `.sha256` sidecar, and the digest in the release notes to the matching GitHub release when publication is requested.
