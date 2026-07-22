#!/usr/bin/env node
// Publish helper for the two packages this repo ships.
//
// ng-packagr builds the library into `dist/ngx-tw/` and writes a transformed
// package.json there — that is the artifact npm should publish (not the
// workspace source at `projects/ngx-tw/`). This script publishes from `dist/`
// and is invoked by `.github/workflows/release.yml` on tag pushes matching
// `@cdevhub/ngx-tw@*`. The git tag and GitHub Release are created by the
// release script + workflow respectively; this file only handles the
// `npm publish` step.
//
// Two packages ship from one tag, lockstep-versioned:
//   dist/ngx-tw      — the component library (built by ng-packagr)
//   dist/ngx-tw-mcp  — the MCP server, whose index.json is generated from the
//                      library build, so it cannot describe a different version
//
// The library publishes first: if the MCP publish fails, consumers are left
// with a library and no MCP server, which degrades to "the tool isn't
// installed". The reverse order would advertise an API for a library that is
// not yet on npm.
//
// Idempotent per package: re-running for an already-published version is a
// no-op, so the release workflow can be retried safely.

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PACKAGES = [
  { dir: 'dist/ngx-tw', buildWith: 'npm run build:lib' },
  { dir: 'dist/ngx-tw-mcp', buildWith: 'npm run build:mcp' },
];

// Provenance attaches a signed npm attestation linking the tarball back to the
// GitHub Actions run that built it. Requires `id-token: write` on the release
// job (already set) and a Granular/Automation `NPM_TOKEN` from a 2FA-enabled
// account. Skipped locally because `--provenance` only works in recognised CI.
const provenance = process.env.GITHUB_ACTIONS === 'true' ? ' --provenance' : '';

/** Read a built package's identity, failing loudly if it was never built. */
function manifest({ dir, buildWith }) {
  const distDir = resolve(process.cwd(), dir);
  const pkgPath = resolve(distDir, 'package.json');
  if (!existsSync(pkgPath)) {
    console.error(`✖ ${dir}/package.json not found — did you run \`${buildWith}\`?`);
    process.exit(1);
  }
  return { distDir, ...JSON.parse(readFileSync(pkgPath, 'utf8')) };
}

// Resolve both manifests before publishing either. A missing MCP build should
// abort the whole release, not surface after the library is already public —
// npm unpublish is restricted to 72h and burns the version number forever.
const built = PACKAGES.map(manifest);

const versions = new Set(built.map((p) => p.version));
if (versions.size !== 1) {
  console.error(`✖ Version mismatch across packages: ${built.map((p) => `${p.name}@${p.version}`).join(', ')}`);
  console.error('  They ship lockstep from one tag. Rebuild with `npm run build:lib && npm run build:mcp`.');
  process.exit(1);
}

for (const { distDir, name, version } of built) {
  let alreadyPublished = false;
  try {
    execSync(`npm view ${name}@${version} version`, { stdio: 'pipe' });
    alreadyPublished = true;
  } catch {
    // `npm view` exits non-zero when the version doesn't exist — expected.
  }

  if (alreadyPublished) {
    console.log(`• ${name}@${version} is already on npm — skipping.`);
    continue;
  }

  console.log(`→ publishing ${name}@${version}${provenance ? ' (with provenance)' : ''}`);
  execSync(`npm publish --access public${provenance}`, { cwd: distDir, stdio: 'inherit' });
  console.log(`✓ ${name}@${version} published.`);
}
