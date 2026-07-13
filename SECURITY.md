# Security Policy

## Reporting Vulnerabilities

Please do not report security vulnerabilities through public GitHub issues.

Send vulnerability reports to `info@mikesoft.it` with enough detail to reproduce the issue. Avoid including secrets, tokens, private repository contents, or personal data unless strictly necessary.

## Security Model

Grok Build Launcher does not collect telemetry, analytics, or personal data.

The extension can launch a user-configured command in the VS Code integrated terminal. Treat `grokBuildLauncher.cliCommand` as trusted local configuration. The extension does not execute that command outside the integrated terminal.

When Grok Build CLI is unavailable, the extension displays installation guidance and can open the official xAI documentation in the external browser. It does not download or execute installers, create temporary installation scripts, or modify PATH and shell profile configuration.

Grok Build CLI is a separate third-party product with its own authentication, network behavior, and security model.
