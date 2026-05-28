#!/usr/bin/env node
// Publish helper for @cdevhub/ngx-tw.
//
// ng-packagr builds the library into `dist/ngx-tw/` and writes a transformed
// package.json there — that is the artifact npm should publish (not the
// workspace source at `projects/ngx-tw/`). This script publishes from `dist/`
// and is invoked by `.github/workflows/release.yml` on tag pushes matching
// `@cdevhub/ngx-tw@*`. The git tag and GitHub Release are created by the
// release script + workflow respectively; this file only handles the
// `npm publish` step.
//
// Idempotent: re-running for an already-published version is a no-op, so the
// release workflow can be retried safely.

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve(process.cwd(), 'dist/ngx-tw');

if (!existsSync(resolve(distDir, 'package.json'))) {
  console.error(`✖ ${distDir}/package.json not found — did you run \`npm run build:lib\`?`);
  process.exit(1);
}

const { name, version } = JSON.parse(readFileSync(resolve(distDir, 'package.json'), 'utf8'));

let alreadyPublished = false;
try {
  execSync(`npm view ${name}@${version} version`, { stdio: 'pipe' });
  alreadyPublished = true;
} catch {
  // `npm view` exits non-zero when the version doesn't exist — expected.
}

if (alreadyPublished) {
  console.log(`• ${name}@${version} is already on npm — skipping.`);
  process.exit(0);
}

// Provenance attaches a signed npm attestation linking the tarball back to the
// GitHub Actions run that built it. Requires `id-token: write` on the release
// job (already set) and a Granular/Automation `NPM_TOKEN` from a 2FA-enabled
// account. Skipped locally because `--provenance` only works in recognised CI.
const provenance = process.env.GITHUB_ACTIONS === 'true' ? ' --provenance' : '';

console.log(`→ publishing ${name}@${version}${provenance ? ' (with provenance)' : ''}`);
execSync(`npm publish --access public${provenance}`, { cwd: distDir, stdio: 'inherit' });
console.log(`✓ ${name}@${version} published.`);
