const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const PNG_SIGNATURE_SIZE = 8;

function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function readLines(relativePath) {
  return readText(relativePath).split(/\r?\n/);
}

function readPackageJson() {
  return JSON.parse(readText('package.json'));
}

function readIgnoreEntries(relativePath) {
  return readText(relativePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readPngSize(relativePath) {
  const fileBuffer = fs.readFileSync(path.join(rootDir, relativePath));
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  assert.deepEqual(fileBuffer.subarray(0, PNG_SIGNATURE_SIZE), pngSignature);

  return {
    width: fileBuffer.readUInt32BE(16),
    height: fileBuffer.readUInt32BE(20),
  };
}

function stripEmbeddedImagePayloads(svgText) {
  return svgText.replace(/data:image\/[^"'\s>]+;base64,[^"'\s>]+/gi, 'data:image/embedded;base64,');
}

test('package metadata is public-ready and clearly unofficial', () => {
  const packageJson = readPackageJson();

  assert.equal(packageJson.name, 'vscode-grok-build-launcher');
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.type, 'commonjs');
  assert.equal(packageJson.displayName, 'Grok Build Launcher — Run Grok CLI in a Side Terminal');
  assert.equal(packageJson.description, 'Launch the Grok (xAI) AI coding agent CLI in a side terminal from your editor toolbar. Unofficial; works in VS Code, Cursor & Windsurf on Windows, macOS & Linux.');
  assert.equal(packageJson.publisher, 'mikesoft');
  assert.equal(packageJson.version, '0.1.11');
  assert.equal(packageJson.icon, 'media/icon.png');
  assert.equal(packageJson.license, 'MIT');
  assert.equal(packageJson.repository.url, 'https://github.com/TheStreamCode/grok-build-launcher.git');
  assert.equal(packageJson.bugs.url, 'https://github.com/TheStreamCode/grok-build-launcher/issues');
  assert.equal(packageJson.engines.vscode, '^1.103.0');
  assert.equal(packageJson.devDependencies['@types/vscode'], '1.103.0');
  assert.equal(packageJson.capabilities.untrustedWorkspaces.supported, 'limited');
  assert.deepEqual(packageJson.capabilities.untrustedWorkspaces.restrictedConfigurations, [
    'grokBuildLauncher.cliCommand',
  ]);
  assert.ok(packageJson.keywords.includes('grok build'));
  assert.ok(packageJson.keywords.includes('coding agent'));
});

test('package contributes launcher commands, toolbar item, and launch settings', () => {
  const packageJson = readPackageJson();
  const [openCliCommand, openSettingsCommand] = packageJson.contributes.commands;

  assert.equal(openCliCommand.command, 'grokBuildLauncher.openCli');
  assert.equal(openCliCommand.title, 'Open Grok Build in Side Terminal');
  assert.equal(openCliCommand.category, 'Grok Build Launcher');
  assert.deepEqual(openCliCommand.icon, {
    light: './media/launcher-mark.svg',
    dark: './media/launcher-mark.svg',
  });
  assert.equal(openSettingsCommand.command, 'grokBuildLauncher.openSettings');
  assert.equal(packageJson.contributes.menus['editor/title'][0].command, 'grokBuildLauncher.openCli');

  const settings = packageJson.contributes.configuration.properties;
  assert.equal(settings['grokBuildLauncher.cliCommand'].default, 'grok');
  assert.equal(settings['grokBuildLauncher.cliCommand'].scope, 'machine');
  assert.equal(settings['grokBuildLauncher.terminalName'].default, 'Grok Build');
  assert.equal(settings['grokBuildLauncher.autoInstall'], undefined);
  assert.equal(settings['grokBuildLauncher.preferAbsoluteInstalledPath'], undefined);
});

test('extension assets are original packaged assets on expected paths', () => {
  const marketplaceIcon = readPngSize('media/icon.png');
  const commandIconSource = readText('media/launcher-mark.svg');
  const commandIconMarkup = stripEmbeddedImagePayloads(commandIconSource);

  assert.equal(marketplaceIcon.width, 256);
  assert.equal(marketplaceIcon.height, 256);
  assert.equal(fs.existsSync(path.join(rootDir, 'media/launcher-mark.png')), false);
  assert.match(commandIconSource, /<svg/i);
  assert.doesNotMatch(commandIconMarkup, /xai|x\.ai|grok/i);
});

test('README covers setup, missing CLI guidance, privacy, and affiliation disclaimer', () => {
  const readme = readText('README.md');

  assert.match(readme, /^# Grok Build Launcher$/m);
  assert.match(readme, /unofficial VS Code extension/i);
  assert.match(readme, /https:\/\/github\.com\/TheStreamCode\/grok-build-launcher/);
  assert.match(readme, /VS Code `\^1\.103\.0`/);
  assert.match(readme, /not affiliated with, endorsed by, sponsored by, or approved by xAI/i);
  assert.match(readme, /Grok, Grok Build, xAI, and related names/i);
  assert.match(readme, /## Features/);
  assert.match(readme, /## Missing CLI Guidance/);
  assert.match(readme, /https:\/\/docs\.x\.ai\/build\/overview/);
  assert.match(readme, /does not download or execute installers/i);
  assert.match(readme, /does not collect telemetry, analytics, or personal data/i);
  assert.match(readme, /## Build And Deployment/);
  assert.match(readme, /does not require or read runtime environment variables/i);
  assert.match(readme, /npm run typecheck/);
  assert.match(readme, /npm run audit/);
  assert.match(readme, /npm run package/);
  assert.match(readme, /npm run check/);
});

test('legal and support documents are present and do not overclaim affiliation', () => {
  const trademarks = readText('TRADEMARKS.md');
  const support = readText('SUPPORT.md');
  const security = readText('SECURITY.md');
  const securityReview = readText('docs/security-review-2026-08-08.md');
  const license = readText('LICENSE');
  const contributing = readText('CONTRIBUTING.md');

  assert.match(trademarks, /This project is not affiliated with, endorsed by, sponsored by, or approved by xAI/i);
  assert.match(trademarks, /All product names, logos, brands, and trademarks are property of their respective owners/i);
  assert.match(support, /GitHub Issues/);
  assert.match(support, /info@mikesoft\.it/);
  assert.match(security, /Please do not report security vulnerabilities through public GitHub issues/i);
  assert.match(security, /docs\/security-review-2026-08-08\.md/);
  assert.match(securityReview, /no unresolved critical, high, or medium severity\s+findings/i);
  assert.match(securityReview, /SEC-008/);
  assert.match(license, /MIT License/);
  assert.match(contributing, /Do not add official xAI or Grok logos/i);
});

test('package scripts use deterministic local tooling entry points', () => {
  const packageJson = readPackageJson();

  assert.equal(packageJson.scripts.typecheck, 'node ./node_modules/typescript/bin/tsc -p . --pretty false --noEmit');
  assert.equal(packageJson.scripts.compile, 'npm run clean && node ./node_modules/typescript/bin/tsc -p . --pretty false');
  assert.equal(packageJson.scripts.test, 'npm run compile && node --test test/*.test.js && node ./test/integration/runTest.js');
  assert.equal(packageJson.scripts.audit, 'npm audit --audit-level=high');
  assert.equal(packageJson.scripts['test:package'], 'node ./node_modules/@vscode/vsce/vsce ls');
  assert.equal(packageJson.scripts.check, 'npm run compile && node --test test/*.test.js && node ./test/integration/runTest.js && npm run test:package');
  assert.equal(packageJson.scripts.package, 'node ./node_modules/@vscode/vsce/vsce package');
  assert.equal(packageJson.scripts['vscode:prepublish'], 'npm run compile');
  assert.deepEqual(packageJson.allowScripts, {
    '@vscode/vsce-sign@2.0.9': true,
    'keytar@7.9.0': true,
  });
});

test('ignore rules keep generated, local, and engineering-only files out of artifacts', () => {
  const gitignoreEntries = readIgnoreEntries('.gitignore');
  const vscodeignoreEntries = readIgnoreEntries('.vscodeignore');

  assert.ok(gitignoreEntries.includes('node_modules/'));
  assert.ok(gitignoreEntries.includes('.vscode-test/'));
  assert.ok(gitignoreEntries.includes('.vsce/'));
  assert.ok(gitignoreEntries.includes('*.vsix'));
  assert.ok(gitignoreEntries.includes('out/'));
  assert.ok(!gitignoreEntries.includes('package-lock.json'));
  assert.ok(gitignoreEntries.includes('!.env.example'));

  assert.ok(vscodeignoreEntries.includes('src/**'));
  assert.ok(vscodeignoreEntries.includes('test/**'));
  assert.ok(vscodeignoreEntries.includes('docs/**'));
  assert.ok(vscodeignoreEntries.includes('scripts/**'));
  assert.ok(!vscodeignoreEntries.includes('media/launcher-mark.svg'));
  assert.ok(vscodeignoreEntries.includes('.github/**'));
  assert.ok(vscodeignoreEntries.includes('AGENTS.md'));
  assert.ok(vscodeignoreEntries.includes('out/**/*.map'));
  assert.ok(vscodeignoreEntries.includes('package-lock.json'));
});

test('CI validates the extension with pinned actions on Windows, macOS, and Linux', () => {
  const workflow = readText('.github/workflows/ci.yml');
  const integrationRunner = readText('test/integration/runTest.js');

  assert.match(workflow, /^name: CI$/m);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /ubuntu-latest/);
  assert.match(workflow, /macos-latest/);
  assert.match(workflow, /name: validate \(\$\{\{ matrix\.os \}\}\)/);
  assert.match(workflow, /vscodeVersion: 1\.103\.0/);
  assert.match(workflow, /vscodeVersion: stable/);
  assert.match(workflow, /VSCODE_TEST_VERSION: \$\{\{ matrix\.vscodeVersion \}\}/);
  assert.match(workflow, /concurrency:/);
  assert.match(workflow, /timeout-minutes: 20/);
  assert.match(workflow, /actions\/checkout@[0-9a-f]{40} # v7/);
  assert.match(workflow, /actions\/setup-node@[0-9a-f]{40} # v6/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /cache: npm/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run audit/);
  assert.match(workflow, /npm run check/);
  assert.match(integrationRunner, /DEFAULT_VSCODE_TEST_VERSION = '1\.103\.0'/);
  assert.match(integrationRunner, /process\.env\.VSCODE_TEST_VERSION\?\.trim\(\)/);
  assert.match(integrationRunner, /process\.env\.VSCODE_TEST_CACHE_PATH\?\.trim\(\)/);
  assert.match(integrationRunner, /version: vscodeVersion/);
  assert.match(integrationRunner, /cachePath/);
});

test('GitHub contribution templates collect actionable and safe reports', () => {
  const codeowners = readText('.github/CODEOWNERS');
  const bugReport = readText('.github/ISSUE_TEMPLATE/bug_report.yml');
  const featureRequest = readText('.github/ISSUE_TEMPLATE/feature_request.yml');
  const issueConfig = readText('.github/ISSUE_TEMPLATE/config.yml');
  const pullRequestTemplate = readText('.github/pull_request_template.md');

  assert.match(codeowners, /^\* @TheStreamCode$/m);
  assert.match(bugReport, /Reproduction steps/);
  assert.match(bugReport, /contains no secrets, tokens, or private repository content/);
  assert.match(featureRequest, /keeps the project independent and unofficial/);
  assert.match(issueConfig, /security\/advisories\/new/);
  assert.match(pullRequestTemplate, /npm run check/);
  assert.match(pullRequestTemplate, /independent-project branding rules/);
});

test('changelog documents the initial release scope', () => {
  const changelog = readText('CHANGELOG.md');

  assert.match(changelog, /^# Changelog$/m);
  assert.match(changelog, /## 0\.1\.0/);
  assert.match(changelog, /Added Grok Build launcher command/);
  assert.match(changelog, /## 0\.1\.9/);
  assert.match(changelog, /original SVG command icon/);
  assert.match(changelog, /official xAI installation documentation/);
  assert.match(changelog, /Added legal, support, security, and trademark documentation/);
});

test('the released version is consistent across manifest, lockfile, docs, and citation', () => {
  const version = readPackageJson().version;
  const lockfile = JSON.parse(readText('package-lock.json'));

  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.equal(lockfile.version, version);
  assert.equal(lockfile.packages[''].version, version);
  assert.ok(readLines('CHANGELOG.md').some((line) => line === `## ${version}` || line.startsWith(`## ${version} `)));
  assert.ok(readText('README.md').includes(`Current documented release: \`${version}\``));
  assert.ok(readLines('CITATION.cff').includes(`version: "${version}"`));
  assert.ok(readText('.github/ISSUE_TEMPLATE/bug_report.yml').includes(`placeholder: "${version}"`));
});
