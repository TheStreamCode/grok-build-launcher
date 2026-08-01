# Contributing

Thank you for considering a contribution to Grok Build Launcher.

## Before You Start

- Use GitHub Issues for confirmed bugs and focused feature proposals.
- Use GitHub private vulnerability reporting or the contact in `SECURITY.md` for security-sensitive reports.
- Keep changes narrowly scoped. Open separate pull requests for unrelated work.

## Development Setup

Use Node.js 22 and the lockfile-managed npm dependencies:

```bash
npm ci
npm run check
```

Useful focused commands:

```bash
npm run compile
npm run typecheck
npm run test:unit
npm run test:integration
npm run audit
npm run package
```

## Project Rules

- Keep the extension independent and clearly unofficial.
- Do not add official xAI or Grok logos, icons, artwork, screenshots, or brand assets without written permission from the rights holder.
- Keep user-facing wording clear that the project is not affiliated with, endorsed by, sponsored by, or approved by xAI.
- Do not add telemetry, analytics, or personal data collection without explicit documentation and a reviewed privacy rationale.
- Keep helper logic in testable modules when possible.
- Add or update tests for behavior changes.
- Keep the manifest, README, changelog, and metadata tests aligned when user-visible behavior changes.
- Never commit generated `out/`, `.vscode-test/`, `.vsix`, log, or local environment files.

## Commits

Write concise imperative commit subjects. Conventional Commit prefixes such as `fix:`, `feat:`, `docs:`, `test:`, and `chore:` are welcome when they make the history easier to scan.

## Pull Requests

Before opening a pull request, run:

```bash
npm run check
```

Include a concise description, user-visible behavior changes, and relevant verification output.

Pull requests should:

- explain the problem and the chosen solution
- include regression tests for fixes and behavior tests for features
- update `README.md` and `CHANGELOG.md` when users are affected
- avoid drive-by formatting or dependency changes
- pass every required GitHub Actions check
