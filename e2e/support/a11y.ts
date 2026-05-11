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
