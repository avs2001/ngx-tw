#!/usr/bin/env node
// Assembles the publishable @cdevhub/ngx-tw-mcp package into dist/ngx-tw-mcp/.
//
// The package build *consumes the library's dist index and fails without it*.
// That makes version lockstep mechanical rather than aspirational: you cannot
// publish an MCP package built against an absent or older library, because the
// only index it can ship is the one `build:lib` just produced, and its version
// is copied from the library's own package.json.
//
// Usage: node scripts/build-mcp-package.mjs

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repoRoot, 'projects/ngx-tw-mcp');
const libDist = join(repoRoot, 'dist/ngx-tw');
const outDir = join(repoRoot, 'dist/ngx-tw-mcp');

// ─── the lockstep gate ────────────────────────────────────────────────────
const indexPath = join(libDist, 'index.json');
if (!existsSync(indexPath)) {
  console.error(`\n✖ dist/ngx-tw/index.json is missing.`);
  console.error(`  The MCP package is built *from* the library's generated index, so the`);
  console.error(`  library must be built first. Run: npm run build:lib\n`);
  process.exit(1);
}

const libPkg = JSON.parse(readFileSync(join(repoRoot, 'projects/ngx-tw/package.json'), 'utf8'));
const index = JSON.parse(readFileSync(indexPath, 'utf8'));

// A stale index from an earlier version would ship API data that does not
// describe the library being released alongside it.
if (index.libraryVersion !== libPkg.version) {
  console.error(`\n✖ dist/ngx-tw/index.json describes ${index.libraryVersion}, but the library is ${libPkg.version}.`);
  console.error(`  The index is stale. Run: npm run build:lib\n`);
  process.exit(1);
}

// ─── assemble ─────────────────────────────────────────────────────────────
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(join(source, 'src'), join(outDir, 'src'), { recursive: true });
cpSync(indexPath, join(outDir, 'index.json'));
for (const file of ['README.md']) {
  const from = join(source, file);
  if (existsSync(from)) cpSync(from, join(outDir, file));
}

// Lockstep-versioned with the library, by construction rather than by memory.
const pkg = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
pkg.version = libPkg.version;
writeFileSync(join(outDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);

const kb = (readFileSync(indexPath).length / 1024).toFixed(0);
console.log(`  ✓ MCP package → dist/ngx-tw-mcp (v${pkg.version}, index ${kb} KB)`);
