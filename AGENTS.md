# Repository Guidelines

## Project Structure

- `src/extension.ts` registers VS Code commands and terminal behavior.
- `src/command-utils.ts` contains pure helpers for command parsing, missing CLI detection, terminal names, and workspace cwd resolution.
- `src/install-utils.ts` contains pure helpers and generated installer script logic for guided Grok Build CLI installation.
- `test/*.test.js` contains Node unit and metadata tests.
- `test/integration/` contains VS Code extension-host smoke tests.
- `media/` stores original packaged assets.
- `docs/` stores engineering notes and plans. Keep user-facing docs in `README.md`.

## Commands

- `npm install`: install dependencies.
- `npm run compile`: compile TypeScript into `out/`.
- `npm run test:unit`: run unit and metadata tests after compile.
- `npm run test:integration`: run VS Code extension-host smoke tests.
- `npm run check`: run the full validation suite and package file inspection.
- `npm run package`: build a `.vsix` package.

## Legal And Branding

This is an independent, unofficial launcher. Do not add official xAI or Grok logos, icons, screenshots, or brand assets unless the rights holder gives written permission. Keep affiliation disclaimers visible in user-facing documentation.
