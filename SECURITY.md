# Security Policy

## Supported Versions

Security fixes are provided for the latest published version. Upgrade to the current release before reporting behavior that may already be fixed.

## Reporting Vulnerabilities

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

Use [GitHub private vulnerability reporting](https://github.com/TheStreamCode/grok-build-launcher/security/advisories/new) when possible. You may alternatively email `info@mikesoft.it`.

Include the affected extension version, VS Code version, operating system, impact, reproduction steps, and any suggested mitigation. Avoid including secrets, tokens, private repository contents, or personal data unless strictly necessary.

The maintainer will acknowledge a complete report as soon as practical, investigate it privately, and coordinate disclosure after a fix or mitigation is available. Please allow reasonable time for remediation before public disclosure.

## Security Model

Grok Build Launcher does not collect telemetry, analytics, or personal data.

The extension can launch a user-configured command in the VS Code integrated terminal. Treat `grokBuildLauncher.cliCommand` as trusted local configuration. The extension does not execute that command outside the integrated terminal.

For direct `grok` launches, the extension may temporarily inspect a bounded prefix of shell output to identify command-not-found errors. That diagnostic data is not persisted or transmitted, and custom commands are not monitored.

When Grok Build CLI is unavailable, the extension displays installation guidance and can open the official xAI documentation in the external browser. It does not download or execute installers, create temporary installation scripts, or modify PATH and shell profile configuration.

Grok Build CLI is a separate third-party product with its own authentication, network behavior, and security model.

## Security Reviews

The latest repository-grounded review is available in [`docs/security-review-2026-08-08.md`](https://github.com/TheStreamCode/grok-build-launcher/blob/main/docs/security-review-2026-08-08.md). Treat dated reports as point-in-time assessments and verify the current code and dependency state before relying on them.

## Release Integrity

Official GitHub Releases attach the versioned VSIX and a matching `.sha256` sidecar. Verify a downloaded package with `Get-FileHash -Algorithm SHA256` on PowerShell or `sha256sum` on macOS and Linux, then compare the result with the sidecar before installing it manually.

Marketplace and Open VSX packages are published through separate maintainer-controlled channels. Registry versions and GitHub Releases should be treated as distinct distribution states and verified independently.
