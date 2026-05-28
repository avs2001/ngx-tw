#!/usr/bin/env node
// Tag-driven release orchestrator for @cdevhub/ngx-tw.
//
// Flow:
//   1. Guards: must be on `develop`, clean tree, in sync with origin/develop.
//   2. Confirm the latest `ci.yml` run on develop is green for the local HEAD.
//   3. Local pre-flight: lint, build:lib, test:ci, pack:check.
//   4. Compute next version from `projects/ngx-tw/package.json`.
//   5. Generate a changelog section from conventional commits since the last
//      release tag (`@cdevhub/ngx-tw@*`).
//   6. Bump the lib package.json, prepend the changelog section, commit.
//   7. Tag `@cdevhub/ngx-tw@<version>` and push develop + tag in one go.
//
// GitHub Actions then takes over: the tag push triggers `release.yml` which
// builds, tests, publishes to npm with provenance, and creates the matching
// GitHub Release.
//
// Usage:
//   node scripts/release.mjs <patch|minor|major> [--dry-run] [--skip-ci-check]

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const libPkgPath = resolve(repoRoot, 'projects/ngx-tw/package.json');
const changelogPath = resolve(repoRoot, 'CHANGELOG.md');

// ─── args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const bump = args.find((a) => ['patch', 'minor', 'major'].includes(a));
const dryRun = args.includes('--dry-run');
const skipCiCheck = args.includes('--skip-ci-check');

if (!bump) {
  console.error('Usage: node scripts/release.mjs <patch|minor|major> [--dry-run] [--skip-ci-check]');
  process.exit(1);
}

// ─── helpers ──────────────────────────────────────────────────────────────
function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe', ...opts }).trim();
}
function shInherit(cmd) {
  execSync(cmd, { cwd: repoRoot, stdio: 'inherit' });
}
function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}
function step(msg) {
  console.log(`\n→ ${msg}`);
}

// ─── 1. guards ────────────────────────────────────────────────────────────
step('Checking branch, working tree, and sync with origin');

const branch = sh('git rev-parse --abbrev-ref HEAD');
if (branch !== 'develop') fail(`Must be on develop branch (currently on ${branch}).`);

const dirty = sh('git status --porcelain');
if (dirty) {
  console.error(dirty);
  fail('Working tree is dirty. Commit or stash before releasing.');
}

shInherit('git fetch origin develop');
const localSha = sh('git rev-parse HEAD');
const remoteSha = sh('git rev-parse origin/develop');
if (localSha !== remoteSha) {
  console.error(`  Local : ${localSha}`);
  console.error(`  Remote: ${remoteSha}`);
  fail('Local develop is out of sync with origin/develop. Run `git pull --ff-only` and retry.');
}
console.log(`  ✓ On develop, clean, at ${localSha.slice(0, 7)}`);

// ─── 2. remote CI check ───────────────────────────────────────────────────
if (skipCiCheck) {
  console.log('\n⚠  --skip-ci-check passed; not verifying remote CI.');
} else {
  step('Checking latest CI run on develop');
  let ciJson;
  try {
    ciJson = sh(
      'gh run list --workflow=ci.yml --branch=develop --limit=5 --json conclusion,headSha,status,databaseId,url',
    );
  } catch (err) {
    fail('`gh run list` failed. Is the GitHub CLI installed and authenticated? (`gh auth status`)');
  }
  const runs = JSON.parse(ciJson);
  const headRun = runs.find((r) => r.headSha === localSha);
  if (!headRun) {
    fail(
      `No ci.yml run found for HEAD ${localSha.slice(0, 7)}. ` +
        `Wait for CI to complete, or pass --skip-ci-check to override.`,
    );
  }
  if (headRun.status !== 'completed') {
    fail(`CI run for HEAD ${localSha.slice(0, 7)} is "${headRun.status}". Wait for it to finish.`);
  }
  if (headRun.conclusion !== 'success') {
    console.error(`  Run: ${headRun.url}`);
    fail(`CI run for HEAD ${localSha.slice(0, 7)} is "${headRun.conclusion}".`);
  }
  console.log(`  ✓ CI green on ${localSha.slice(0, 7)}`);
}

// ─── 3. local pre-flight ──────────────────────────────────────────────────
step('Local pre-flight: lint, build:lib, test:ci, pack:check');
shInherit('npm run lint');
shInherit('npm run build:lib');
shInherit('npm run test:ci');
shInherit('npm run pack:check');
console.log('  ✓ All local checks passed');

// ─── 4. compute next version ──────────────────────────────────────────────
const pkg = JSON.parse(readFileSync(libPkgPath, 'utf8'));
const current = pkg.version;
const [maj, min, pat] = current.split('.').map(Number);
const next =
  bump === 'major' ? `${maj + 1}.0.0` : bump === 'minor' ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`;
const tagName = `@cdevhub/ngx-tw@${next}`;

step(`Releasing ${current} → ${next}  (tag: ${tagName})`);

// ─── 5. changelog from conventional commits ───────────────────────────────
let lastTag = '';
try {
  lastTag = sh("git describe --tags --match '@cdevhub/ngx-tw@*' --abbrev=0");
} catch {
  console.log('  (no previous tag found — collecting all commits)');
}
const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const rawLog = sh(`git log ${range} --no-merges --pretty=format:%H%x00%s%x00%b%x1e`);

const CC_RE = /^(feat|fix|perf|refactor|docs|chore|build|ci|test|style|revert)(\(([^)]+)\))?(!)?:\s*(.+)$/;
const groups = {
  '⚠ BREAKING CHANGES': [],
  Features: [],
  'Bug Fixes': [],
  Performance: [],
};

const repoSlug = (() => {
  const url = sh('git config --get remote.origin.url');
  const m = url.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
  return m ? m[1] : 'avs2001/ngx-tw';
})();

for (const entry of rawLog.split('\x1e').map((s) => s.trim()).filter(Boolean)) {
  const [hash, subject, body = ''] = entry.split('\x00');
  const m = subject.match(CC_RE);
  if (!m) continue;
  const [, type, , scope, bang, desc] = m;
  const isBreaking = bang === '!' || /BREAKING CHANGE:/i.test(body);
  const short = hash.slice(0, 7);
  const link = `[${short}](https://github.com/${repoSlug}/commit/${hash})`;
  const scopePart = scope ? `**${scope}:** ` : '';
  const line = `- ${scopePart}${desc} (${link})`;
  if (isBreaking) groups['⚠ BREAKING CHANGES'].push(line);
  if (type === 'feat') groups.Features.push(line);
  else if (type === 'fix') groups['Bug Fixes'].push(line);
  else if (type === 'perf') groups.Performance.push(line);
}

const filledSections = Object.entries(groups)
  .filter(([, items]) => items.length)
  .map(([title, items]) => `### ${title}\n\n${items.join('\n')}\n`);

if (filledSections.length === 0) {
  fail(
    'No conventional commits (feat / fix / perf / breaking) found since last tag.\n' +
      '  Either add a qualifying commit or release manually with --skip-ci-check.',
  );
}

const today = new Date().toISOString().slice(0, 10);
const newSection = `## ${next} — ${today}\n\n${filledSections.join('\n')}`;

// Insert the new section just before the first existing `## ` heading; if
// CHANGELOG has none yet, append to the end.
const existingChangelog = readFileSync(changelogPath, 'utf8');
const lines = existingChangelog.split('\n');
const firstSectionIdx = lines.findIndex((l, i) => i > 0 && /^## /.test(l));
const updatedChangelog =
  firstSectionIdx === -1
    ? `${existingChangelog.trimEnd()}\n\n${newSection}\n`
    : [...lines.slice(0, firstSectionIdx), newSection, ...lines.slice(firstSectionIdx)].join('\n');

console.log('\n  ─── Generated changelog section ───');
console.log(newSection.replace(/^/gm, '  │ '));
console.log('  ─────────────────────────────────────');

// ─── 6. write files, commit, tag ──────────────────────────────────────────
if (dryRun) {
  console.log('\n✓ --dry-run: no files written, no commit, no tag, no push.');
  process.exit(0);
}

step('Writing CHANGELOG.md and bumping library package.json');
writeFileSync(changelogPath, updatedChangelog);
pkg.version = next;
writeFileSync(libPkgPath, JSON.stringify(pkg, null, 2) + '\n');

step('Committing and tagging');
shInherit('git add CHANGELOG.md projects/ngx-tw/package.json');
shInherit(`git commit -m "chore(release): ${tagName}"`);
shInherit(`git tag -a "${tagName}" -m "Release ${tagName}"`);

// ─── 7. push ──────────────────────────────────────────────────────────────
step('Pushing develop + tag to origin');
try {
  shInherit('git push origin develop --follow-tags');
} catch {
  console.error(
    `\n✖ Push failed. The local commit + tag exist but did not reach origin.\n` +
      `  Most likely cause: branch protection on \`develop\` requires PRs.\n` +
      `  To recover and restart cleanly:\n` +
      `    git reset --hard origin/develop\n` +
      `    git tag -d ${tagName}\n` +
      `  Then either disable PR-only protection for direct admin pushes, or\n` +
      `  use a PR-based flow for releases.`,
  );
  process.exit(1);
}

console.log(`\n✓ Released ${tagName}`);
console.log(`  GitHub Actions will publish to npm and create the release.`);
console.log(`  Watch: gh run list --workflow=release.yml --limit=1`);
