#!/usr/bin/env node
// Publish helper for ngx-tw.
//
// ng-packagr builds the library into `dist/ngx-tw/` and copies a transformed
// package.json there — that is the artifact npm should publish. Changesets'
// default `changeset publish` would run `npm publish` from the workspace
// directory (`projects/ngx-tw/`), which contains source, not the built
// artifact. So we run the publish ourselves and emit the magic stdout marker
// that `changesets/action` parses to create the matching GitHub release.

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve(process.cwd(), 'dist/ngx-tw');

if (!existsSync(resolve(distDir, 'package.json'))) {
  console.error(`✖ ${distDir}/package.json not found — did you run \`npm run build:lib\`?`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(resolve(distDir, 'package.json'), 'utf8'));
const { name, version } = pkg;

// Skip if this exact version is already on npm — keeps the workflow idempotent
// when the release job retries.
let alreadyPublished = false;
try {
  execSync(`npm view ${name}@${version} version`, { stdio: 'pipe' });
  alreadyPublished = true;
} catch {
  // `npm view` exits non-zero when the version doesn't exist — expected.
}

if (alreadyPublished) {
  console.log(`• ${name}@${version} is already published — skipping.`);
  process.exit(0);
}

console.log(`→ publishing ${name}@${version} from ${distDir}`);
execSync('npm publish --access public', { cwd: distDir, stdio: 'inherit' });

// changesets/action runs `git push origin <tag>` after parsing the marker
// below, but it expects the tag to already exist locally — `changeset publish`
// would normally create it, but we don't call that (we publish from `dist/`).
// Create it ourselves. Tolerate "already exists" so retries on the same SHA
// are idempotent.
const tag = `${name}@${version}`;
try {
  execSync(`git tag ${tag}`, { stdio: 'pipe' });
  console.log(`→ created git tag ${tag}`);
} catch (err) {
  const stderr = err.stderr?.toString() ?? '';
  if (stderr.includes('already exists')) {
    console.log(`• git tag ${tag} already exists — reusing.`);
  } else {
    throw err;
  }
}

// Stdout marker parsed by changesets/action to create the GitHub release.
console.log(`🦋  New tag: ${tag}`);
