import AxeBuilder from '@axe-core/playwright';
import type { AxeResults } from 'axe-core';
import type { Page } from '@playwright/test';

/**
 * Tag set scanned on every axe run. WCAG 2.1 AA is the bar; `best-practice`
 * catches landmark uniqueness, heading order, and color-contrast hints that
 * are not strict WCAG failures but still matter for screen-reader users.
 *
 * **Do not** disable rules across the board. If a rule fires falsely on a
 * specific selector, scope it via `exclude` at the call site with a comment
 * explaining why — see chapter 06 §"Rule configuration".
 */
export const AXE_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
] as const;

export interface RunAxeOptions {
  /** Limit the scan to these selectors. Default: full page. */
  readonly include?: readonly string[];

  /**
   * Per-call selector exclusions. Each entry should be accompanied by a
   * code comment at the call site that justifies why the selector is
   * excluded — anonymous exclusions silence real findings.
   */
  readonly exclude?: readonly string[];
}

/**
 * Run axe-core against `page` with the library's standard tag set. Returns
 * the full `AxeResults` so callers can both `expect(...violations).toEqual([])`
 * and surface the violation report verbatim in the failure message.
 *
 * The only configuration knobs are `include` / `exclude` — by design. Rule
 * disables and tag overrides are intentionally not exposed; they hide real
 * regressions far more often than they save a noisy test.
 */
export async function runAxe(page: Page, options: RunAxeOptions = {}): Promise<AxeResults> {
  let builder = new AxeBuilder({ page }).withTags([...AXE_TAGS]);
  for (const selector of options.include ?? []) {
    builder = builder.include(selector);
  }
  for (const selector of options.exclude ?? []) {
    builder = builder.exclude(selector);
  }
  return await builder.analyze();
}

/**
 * Rules a given page is allowed to still fail, by rule id.
 *
 * This replaces a component-wide skip. Excluding a whole component hides every
 * rule it does NOT violate as well as the ones it does — so a component on the
 * old list could regress on `button-name` and the sweep stayed green, and the
 * `wcag22aa` target-size rules this suite now scans were invisible for all 12
 * backlogged components at once.
 *
 * An entry is a debt with a name. Fixing a component means deleting its rule
 * ids one at a time, and every rule NOT listed is enforced on that page from
 * the first day.
 */
export type RuleBacklog = ReadonlyMap<string, ReadonlySet<string>>;

/**
 * Splits violations into the ones this page still owes and the ones that are
 * regressions.
 *
 * `unexpected` is what the test asserts on. `staleAllowances` is what the page
 * was permitted to fail but did not — a backlog entry that no longer
 * corresponds to a real violation, which should be deleted so the list cannot
 * rot into permanent permission.
 */
export function partitionViolations(
  violations: AxeResults['violations'],
  allowed: ReadonlySet<string> | undefined,
): {
  readonly unexpected: AxeResults['violations'];
  readonly staleAllowances: readonly string[];
} {
  const allowedIds = allowed ?? new Set<string>();
  const seen = new Set(violations.map(v => v.id));
  return {
    unexpected: violations.filter(v => !allowedIds.has(v.id)),
    staleAllowances: [...allowedIds].filter(id => !seen.has(id)).sort(),
  };
}

/**
 * Format the violations array into a compact human-readable string for use
 * in `expect(...).toEqual([])` failure messages. Default `JSON.stringify`
 * output of axe's results is large, hard to diff, and buries the rule id;
 * this puts the rule and node target on the first line so failure logs are
 * scannable in CI.
 */
export function formatViolations(violations: AxeResults['violations']): string {
  if (violations.length === 0) return 'no violations';
  return violations
    .map((v) => {
      const targets = v.nodes
        .map((n) => n.target.join(' '))
        .slice(0, 5)
        .join(', ');
      const more = v.nodes.length > 5 ? ` (+${v.nodes.length - 5} more nodes)` : '';
      return `[${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    nodes: ${targets}${more}\n    help: ${v.helpUrl}`;
    })
    .join('\n\n');
}
