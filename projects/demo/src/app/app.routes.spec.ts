import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Drift guard: the smoke matrix in `e2e/support/routes.ts` is the single
 * source of truth for the Playwright suite. If somebody adds (or removes) a
 * `components/<slug>` route in `app.routes.ts` without updating
 * `e2e/support/routes.ts`, every smoke test will silently miss it. This spec
 * fails the build in that case.
 *
 * The check is intentionally text-based: we don't want to evaluate
 * `app.routes.ts` at unit-test time (it pulls in lazy `import()` references
 * and the full Angular routing surface). Pulling slugs out via regex stays
 * fast, simple, and immune to refactors that don't change the route table.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..', '..');
const APP_ROUTES = join(REPO_ROOT, 'projects/demo/src/app/app.routes.ts');
const E2E_ROUTES = join(REPO_ROOT, 'e2e/support/routes.ts');

function extractSlugs(
  source: string,
  prefix: 'components' | 'services',
): readonly string[] {
  const pattern = new RegExp(`path:\\s*['"\`]${prefix}/([a-z0-9-]+)['"\`]`, 'g');
  const slugs = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    slugs.add(match[1]);
  }
  return [...slugs].sort();
}

function extractArray(
  source: string,
  name: 'COMPONENTS' | 'SERVICES',
): readonly string[] {
  const pattern = new RegExp(`export const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`);
  const match = pattern.exec(source);
  if (!match) {
    throw new Error(`Could not find \`export const ${name}\` array in e2e/support/routes.ts`);
  }
  const entries = match[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^['"`]|['"`]$/g, ''))
    .filter((entry) => entry.length > 0 && !entry.startsWith('//'));
  return [...entries].sort();
}

describe('app.routes ↔ e2e/support/routes drift guard', () => {
  const appRoutesSource = readFileSync(APP_ROUTES, 'utf-8');
  const e2eRoutesSource = readFileSync(E2E_ROUTES, 'utf-8');

  it('COMPONENTS list matches every `components/<slug>` declared in app.routes.ts', () => {
    const declared = extractSlugs(appRoutesSource, 'components');
    const expected = extractArray(e2eRoutesSource, 'COMPONENTS');

    const missingFromInventory = declared.filter((s) => !expected.includes(s));
    const extraInInventory = expected.filter((s) => !declared.includes(s));

    expect(
      { missingFromInventory, extraInInventory },
      'Update `e2e/support/routes.ts` so it matches `app.routes.ts`.',
    ).toEqual({ missingFromInventory: [], extraInInventory: [] });
  });

  it('SERVICES list matches every `services/<slug>` declared in app.routes.ts', () => {
    const declared = extractSlugs(appRoutesSource, 'services');
    const expected = extractArray(e2eRoutesSource, 'SERVICES');

    expect(declared).toEqual(expected);
  });

  it('COMPONENTS in e2e/support/routes.ts is sorted alphabetically', () => {
    const expected = extractArray(e2eRoutesSource, 'COMPONENTS');
    const sorted = [...expected].sort();
    expect(expected, 'Sort the COMPONENTS list alphabetically').toEqual(sorted);
  });
});
