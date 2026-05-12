import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside
 * `split-examples.component.ts`. Used to anchor section locators by
 * accessible name — same convention as `DialogPage`.
 */
export type SplitSectionName =
  | 'Horizontal — sidebar & main'
  | 'Vertical split'
  | 'Three-pane editor layout'
  | 'Collapsible pane with snap'
  | 'Pixel mode'
  | 'Persisted layout'
  | 'Nested splits';

/**
 * Page Object Model for the split component's examples route.
 *
 * Mirrors the `DialogPage` layout: a `goto()`, one locator per
 * `<section class="mb-10">`, and small accessors for the gutters /
 * collapse-status text inside each section. Higher-level flows
 * ("drag the gutter X percent then assert size") belong in the spec.
 */
export class SplitPage {
  readonly main: Locator;

  readonly horizontalSection: Locator;
  readonly verticalSection: Locator;
  readonly threePaneSection: Locator;
  readonly collapsibleSection: Locator;
  readonly pixelSection: Locator;
  readonly persistedSection: Locator;
  readonly nestedSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');

    this.horizontalSection = this.section('Horizontal — sidebar & main');
    this.verticalSection = this.section('Vertical split');
    this.threePaneSection = this.section('Three-pane editor layout');
    this.collapsibleSection = this.section('Collapsible pane with snap');
    this.pixelSection = this.section('Pixel mode');
    this.persistedSection = this.section('Persisted layout');
    this.nestedSection = this.section('Nested splits');
  }

  /** Navigate to the split examples route and wait for the H1 to mount. */
  async goto(): Promise<void> {
    await this.page.goto('/components/split/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /**
   * The `<tw-split>` element inside a given section. Each demo section has
   * exactly one top-level `<tw-split>` (the nested case wraps an inner one
   * — use `.first()` to pin to the outer). The element itself is a flex
   * container — read width/height on the *parent* wrapper when measuring
   * pane sizes.
   */
  splitIn(section: Locator): Locator {
    return section.locator('tw-split').first();
  }

  /**
   * Gutter (the `[role="separator"]` rendered by `tw-split`). Pass the
   * gutter index (0 for a two-pane split) and optionally a section to
   * disambiguate. Anchored by the `data-split-gutter-index` attribute the
   * component sets in its template — stable across refactors.
   */
  gutter(section: Locator, index = 0): Locator {
    return this.splitIn(section).locator(`[role="separator"][data-split-gutter-index="${index}"]`).first();
  }

  /** Programmatic collapse/expand/reset buttons in the Collapsible section. */
  collapseButton(action: 'Collapse sidebar' | 'Expand sidebar' | 'Reset'): Locator {
    return this.collapsibleSection.getByRole('button', { name: action, exact: true });
  }

  /**
   * Live "pane N collapsed/expanded" status the demo writes from
   * `(collapseChange)`. The demo binds it to a plain `<span>` with the
   * `font-mono` class — locate by class within the collapsible section.
   */
  get collapseStatus(): Locator {
    return this.collapsibleSection.locator('span.font-mono');
  }

  /**
   * Read the bounding box of a pane wrapper inside a section. The demo
   * wraps each `<tw-split>` in a fixed-height `<div>` — the panes are the
   * `<tw-split-pane>` elements, which inherit `flex` styling from
   * `tw-split`. We measure the rendered DOM rect, not the signal, because
   * the visible size is what users care about and what the drag math
   * affects.
   */
  paneRect(section: Locator, paneIndex: number) {
    return this.splitIn(section)
      .locator('tw-split-pane')
      .nth(paneIndex)
      .boundingBox();
  }

  /** Bounding box of a gutter in a section. */
  gutterRect(section: Locator, gutterIndex = 0) {
    return this.gutter(section, gutterIndex).boundingBox();
  }

  private section(name: SplitSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
