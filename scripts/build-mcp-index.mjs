#!/usr/bin/env node
// Builds the static MCP index consumed by @cdevhub/ngx-tw-mcp.
//
// A consumer installs @cdevhub/ngx-tw from npm, and that tarball contains
// compiled JS, .d.ts, and theme CSS — not the component .ts source, and not
// the demo app. So the MCP server can do *zero* parsing at run time: everything
// it serves is baked into this index here, inside the monorepo, where source
// and demo both exist.
//
// The index is generated into `dist/ngx-tw/` and NEVER committed. Committing a
// derived artifact manufactures the drift class it would then have to police;
// a generated-at-build index cannot be stale because there is no stored copy.
//
// Usage: node scripts/build-mcp-index.mjs [--out <dir>]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { extractEntryPoint } from './mcp/extract-api.mjs';
import { extractSnippets } from './mcp/extract-snippets.mjs';
import { extractThemeTokens } from './mcp/extract-tokens.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const libRoot = join(repoRoot, 'projects/ngx-tw');
const demoRoutes = join(repoRoot, 'projects/demo/src/app/routes');
const contentDir = join(repoRoot, 'scripts/mcp/content');

const outFlag = process.argv.indexOf('--out');
const outDir = outFlag !== -1 ? resolve(repoRoot, process.argv[outFlag + 1]) : join(repoRoot, 'dist/ngx-tw');

// ─── entry points ─────────────────────────────────────────────────────────
/**
 * The root barrel is the authoritative entry-point list — it is what the
 * library itself declares public, so deriving from it keeps the index and the
 * package in agreement by construction.
 */
function entryPointNames() {
  const publicApi = readFileSync(join(libRoot, 'src/public-api.ts'), 'utf8');
  const names = [...publicApi.matchAll(/@cdevhub\/ngx-tw\/([\w/-]+)/g)].map((m) => m[1]);
  return [...new Set(names)].filter((n) => existsSync(join(libRoot, n, 'index.ts')));
}

/**
 * Load an entry point's hand-authored guidance. `*.meta.ts` is TypeScript but
 * contains only a literal object, so stripping the type-only syntax is enough
 * to evaluate it — far cheaper than standing up a transpiler for one literal.
 */
async function loadMeta(name) {
  const base = name.split('/').pop();
  const metaPath = join(libRoot, name, `${base}.meta.ts`);
  if (!existsSync(metaPath)) return { meta: null, metaPath: null };

  const source = readFileSync(metaPath, 'utf8')
    .replace(/^\s*import\s+type[\s\S]*?;\s*$/m, '')
    .replace(/\bsatisfies\s+ComponentMeta\b/, '')
    .replace(/^\s*export\s+const\s+meta\s*=/m, 'export default');

  const dataUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  const module = await import(dataUrl);
  return { meta: module.default, metaPath };
}

// ─── build ────────────────────────────────────────────────────────────────
async function build() {
  const pkg = JSON.parse(readFileSync(join(libRoot, 'package.json'), 'utf8'));
  const names = entryPointNames();

  const entryPoints = [];
  for (const name of names) {
    const { meta, metaPath } = await loadMeta(name);
    const routeDir = join(demoRoutes, name);

    entryPoints.push({
      name,
      importPath: `@cdevhub/ngx-tw/${name}`,
      symbols: extractEntryPoint(join(libRoot, name, 'index.ts')),
      snippets: extractSnippets(routeDir),
      ...(meta ?? {}),
      // Retained so `verify-mcp-index` can report the offending file, and so a
      // missing meta is visible in the index rather than merely absent.
      hasMeta: !!meta,
      metaPath: metaPath ? metaPath.slice(repoRoot.length + 1) : null,
    });
  }

  const readContent = (file) => readFileSync(join(contentDir, file), 'utf8');

  return {
    schemaVersion: 1,
    // Stamped into every server response so a consumer pinning an old MCP
    // package can see the mismatch instead of silently trusting it.
    libraryVersion: pkg.version,
    packageName: pkg.name,
    entryPoints,
    themeTokens: extractThemeTokens([
      join(libRoot, 'theme/_semantic.css'),
      join(libRoot, 'theme/_typography.css'),
    ]),
    content: {
      conventions: readContent('conventions.md'),
      gettingStarted: readContent('getting-started.md'),
    },
  };
}

/**
 * Only write when invoked as a command. `verify-mcp-index.mjs` imports `build`
 * to construct an index in memory; a validation-only command must not have a
 * filesystem write as an import side effect.
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const index = await build();

  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'index.json');
  writeFileSync(outPath, JSON.stringify(index));

  const withMeta = index.entryPoints.filter((e) => e.hasMeta).length;
  const snippets = index.entryPoints.reduce((n, e) => n + e.snippets.length, 0);
  const symbols = index.entryPoints.reduce((n, e) => n + e.symbols.length, 0);

  console.log(`  ✓ MCP index → ${outPath.slice(repoRoot.length + 1)}`);
  console.log(
    `    ${index.entryPoints.length} entry points · ${symbols} symbols · ` +
    `${snippets} snippets · ${withMeta} with guidance · ` +
    `${index.themeTokens.length} theme tokens · ${(JSON.stringify(index).length / 1024).toFixed(0)} KB`,
  );
}

export { build, entryPointNames };
