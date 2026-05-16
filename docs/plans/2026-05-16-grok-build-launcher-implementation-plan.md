# Grok Build Launcher Implementation Plan

**Goal:** Build a professional, public-ready VS Code extension that launches Grok Build CLI from the editor toolbar and offers a consent-based guided install flow when `grok` is missing.

**Architecture:** Keep the runtime small and testable. `src/extension.ts` owns VS Code command registration and terminal orchestration, while pure command parsing and installer helpers live in `src/command-utils.ts` and `src/install-utils.ts` for unit coverage.

**Tech Stack:** TypeScript, VS Code Extension API, Node.js built-in test runner, `@vscode/test-electron`, `@vscode/vsce`.

---

## Tasks

- [x] Define package metadata, commands, settings, and toolbar contribution.
- [x] Write failing unit tests for command parsing, missing CLI detection, installer script generation, default install paths, and PATH entry helpers.
- [x] Implement pure helper modules in TypeScript.
- [x] Implement VS Code activation, launch flow, guided installer terminal, and absolute path fallback.
- [x] Add integration smoke tests for activation, command registration, launcher terminal creation, and settings command.
- [x] Add public documentation, trademark disclaimer, support, security, changelog, ignore rules, and CI.
- [x] Generate original non-affiliated icon assets.
- [x] Run compile, unit tests, integration tests, package inspection, and VSIX packaging.
