#!/usr/bin/env node
/**
 * Packaging smoke test — proves a *consumer* can actually use the built library.
 *
 * Everything here failed silently at some point (see `docs/production-audit.md`):
 * the theme stylesheet shipped but was unreachable through the `exports` map,
 * and once reachable it generated zero component utilities because its
 * `@source` glob pointed at a directory the tarball does not contain. Neither
 * broke the build, the unit tests, the e2e suite, or the demo app — the demo
 * imports the theme by relative path and Tailwind auto-detects the raw
 * monorepo source, which a consumer does not have.
 *
 * So this script deliberately works the way a consumer does and nothing like
 * the way this repo does:
 *   1. pack `dist/ngx-tw` into a real tarball
 *   2. install it into a scratch project OUTSIDE the repo
 *   3. resolve the documented theme specifier with Tailwind's own resolver
 *      config (`conditionNames: ['style']`)
 *   4. compile it with PostCSS and assert real component utilities appear
 *
 * Run after `npm run build:lib`. Exits non-zero with a diagnosis on failure.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const REPO = resolve(import.meta.dirname, '..');
const DIST = join(REPO, 'dist', 'ngx-tw');
const PKG = '@cdevhub/ngx-tw';
const THEME_SPECIFIER = `${PKG}/theme/index.css`;

/**
 * Utilities that only ever appear inside compiled library bundles. If these
 * reach the compiled CSS, the `@source` glob in `theme/index.css` is live.
 * They must NOT appear in any file this script writes into the scratch app —
 * Tailwind's automatic source detection would scan them and manufacture a
 * false pass. (That exact self-contamination produced a false result during
 * the audit; keep probe strings out of the scanned directory.)
 */
const LIBRARY_UTILITIES = ['shrink-0', 'rounded-lg', 'transition-colors'];

/** A utility the scratch app asks for itself — proves the compile ran at all. */
const APP_UTILITY = 'p-4';

const require = createRequire(join(REPO, 'noop.js'));
let scratch;
const fail = (msg, hint) => {
  console.error(`\n  FAIL  ${msg}`);
  if (hint) console.error(`        ${hint}`);
  process.exitCode = 1;
  throw new Error(msg);
};

try {
  readdirSync(DIST);
} catch {
  console.error(`dist/ngx-tw not found. Run "npm run build:lib" first.`);
  process.exit(1);
}

try {
  scratch = mkdtempSync(join(tmpdir(), 'ngx-tw-pkgcheck-'));
  const app = join(scratch, 'app');
  execFileSync('mkdir', ['-p', app]);

  // 1. pack + install exactly as a consumer would
  console.log('  ...  packing dist/ngx-tw');
  const tarball = execFileSync('npm', ['pack', '--pack-destination', scratch, '--silent'], {
    cwd: DIST,
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .pop();

  writeFileSync(join(scratch, 'package.json'), JSON.stringify({ name: 'pkgcheck', private: true }));
  console.log('  ...  installing the tarball into a scratch project');
  execFileSync(
    'npm',
    ['install', join(scratch, tarball), '--no-audit', '--no-fund', '--legacy-peer-deps', '--silent'],
    { cwd: scratch, stdio: 'inherit' },
  );

  // `theme/index.css` opens with `@import "tailwindcss"`, so the scratch project
  // needs the peer resolvable. Symlink this repo's copy rather than installing
  // from the registry: it keeps the check offline, fast, and pinned to the exact
  // Tailwind version the library is developed against.
  execFileSync('ln', [
    '-sfn',
    join(REPO, 'node_modules', 'tailwindcss'),
    join(scratch, 'node_modules', 'tailwindcss'),
  ]);

  // 2. Resolve the DOCUMENTED specifier against the `exports` map before
  //    compiling. The compile below would also catch an unreachable subpath,
  //    but buried inside a PostCSS stack trace — this gives a clear diagnosis.
  //    Run in a child process with `--conditions=style` so the check matches
  //    what a CSS toolchain sees, not what a JS `require` sees.
  console.log(`  ...  resolving "${THEME_SPECIFIER}" under the "style" condition`);
  const probe = `require.resolve(${JSON.stringify(THEME_SPECIFIER)}, { paths: [process.cwd()] })`;
  try {
    execFileSync(process.execPath, ['--conditions=style', '-e', probe], {
      cwd: scratch,
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (e) {
    const reason = String(e.stderr || e.message)
      .split('\n')
      .find((l) => l.includes('ERR_') || l.includes('not exported')) ?? '';
    fail(
      `"${THEME_SPECIFIER}" does not resolve — the documented import is broken.`,
      `The CSS ships in the tarball but the "exports" map blocks the subpath. Ensure projects/ngx-tw/package.json declares "./theme/*.css". Node said: ${reason.trim()}`,
    );
  }

  // 2b. Every secondary entry point must still be reachable through the
  //     `exports` map. This is checked because the B1 fix hand-authors an
  //     `exports` block in the source package.json, and ng-packagr *seeds* its
  //     generated map from that block — so a malformed custom entry could
  //     suppress the auto-generated component exports. Nothing else would
  //     notice: in-repo builds, unit tests, e2e and the demo all resolve
  //     components through the tsconfig path alias, never through `exports`.
  console.log('  ...  checking every secondary entry point is exported');
  const srcRoot = join(REPO, 'projects', 'ngx-tw');
  const expected = readdirSync(srcRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => {
      const nested = [];
      const walk = (rel) => {
        try {
          readdirSync(join(srcRoot, rel), { withFileTypes: true })
            .filter((c) => c.isDirectory())
            .forEach((c) => walk(join(rel, c.name)));
        } catch {
          /* not a directory we can descend */
        }
        try {
          readFileSync(join(srcRoot, rel, 'ng-package.json'));
          nested.push(`./${rel}`);
        } catch {
          /* not an entry point */
        }
      };
      walk(d.name);
      return nested;
    });

  const installedExports = JSON.parse(
    readFileSync(join(scratch, 'node_modules', PKG, 'package.json'), 'utf8'),
  ).exports;
  const unexported = expected.filter((s) => !(s in installedExports));
  if (unexported.length) {
    fail(
      `${unexported.length} secondary entry point(s) are missing from the "exports" map: ${unexported.join(', ')}`,
      'Consumers importing these would get ERR_PACKAGE_PATH_NOT_EXPORTED. A hand-authored "exports" entry in projects/ngx-tw/package.json can suppress ng-packagr\'s generated entries — check that block first.',
    );
  }
  console.log(`        ${expected.length} entry points exported`);

  // 3. compile it the way a consumer's build does
  writeFileSync(join(app, 'index.html'), `<div class="${APP_UTILITY}"></div>\n`);
  writeFileSync(join(app, 'in.css'), `@import "${THEME_SPECIFIER}";\n`);

  console.log('  ...  compiling with PostCSS + @tailwindcss/postcss');
  const postcss = require('postcss');
  const tailwind = require('@tailwindcss/postcss');
  const { css } = await postcss([tailwind({ base: app })]).process(
    readFileSync(join(app, 'in.css'), 'utf8'),
    { from: join(app, 'in.css') },
  );

  // 4. assert
  const hasRule = (name) => new RegExp(`^\\s*\\.${name.replace(/[[\]]/g, '\\$&')}\\s*\\{`, 'm').test(css);

  if (!hasRule(APP_UTILITY)) {
    fail(
      `the compile produced no ".${APP_UTILITY}" rule — Tailwind did not scan the app at all.`,
      'This is a harness problem, not a packaging one. The assertions below are meaningless until it is fixed.',
    );
  }

  const missing = LIBRARY_UTILITIES.filter((u) => !hasRule(u));
  if (missing.length) {
    fail(
      `theme resolved and compiled, but generated NO component utilities (missing: ${missing.join(', ')}).`,
      `The "@source" glob in projects/ngx-tw/theme/index.css does not match anything in the published package. It must point at the shipped bundles (../fesm2022/**/*.mjs), not at .ts source — the tarball contains no source. Tailwind does not error on a dead glob, so this fails silently in every consumer app.`,
    );
  }

  const kb = Math.round(css.length / 1024);
  console.log(`\n  PASS  theme resolves via "${THEME_SPECIFIER}"`);
  console.log(`  PASS  component utilities present (${LIBRARY_UTILITIES.join(', ')})`);
  console.log(`        compiled ${kb} KB from a clean consumer install\n`);
} finally {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
}
