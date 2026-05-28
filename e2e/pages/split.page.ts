import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside
 * `split-examples.component.ts`. Used to anchor section locators by
 * accessible name — same convention as `DialogPage`.
 */
export type SplitSectionName =
  | 'Horizontal'
  | 'Vertical'
  | 'Three panes'
  | 'Min / Max constraints'
  | 'Collapsible pane'
  | 'Persisted sizes'
  | 'Pixel mode'
  | 'RTL'
  | 'Programmatic control';

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
  readonly minMaxSection: Locator;
  readonly collapsibleSection: Locator;
  readonly pixelSection: Locator;
  readonly persistedSection: Locator;
  readonly programmaticSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');

    this.horizontalSection = this.section('Horizontal');
    this.verticalSection = this.section('Vertical');
    this.threePaneSection = this.section('Three panes');
    this.minMaxSection = this.section('Min / Max constraints');
    this.collapsibleSection = this.section('Collapsible pane');
    this.pixelSection = this.section('Pixel mode');
    this.persistedSection = this.section('Persisted sizes');
    this.programmaticSection = this.section('Programmatic control');
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
   * disambiguate. The component identifies gutters by accessible name
   * (`Resize column N` / `Resize row N` — see `split.ts:_ariaLabel`); we
   * anchor on `role="separator"` + position so the locator stays stable
   * regardless of the label's i18n form.
   */
  gutter(section: Locator, index = 0): Locator {
    return this.splitIn(section).locator('[role="separator"]').nth(index);
  }

  /** Programmatic Collapse/Expand buttons in the Collapsible section. */
  collapseButton(action: 'Collapse' | 'Expand'): Locator {
    return this.collapsibleSection.getByRole('button', { name: action, exact: true });
  }

  /**
   * setSizes / Reset buttons in the Programmatic section. The label is the
   * button's exact accessible name as rendered in the demo.
   */
  programmaticButton(label: '20 / 80' | '50 / 50' | '80 / 20' | 'Reset'): Locator {
    return this.programmaticSection.getByRole('button', { name: label, exact: true });
  }

  /**
   * Live "collapsed/expanded (cause)" status the demo writes from
   * `(collapseChange)`. Bound to a `<span>` in the Collapsible section.
   * Post-S* the demo prints just `"<state> (<cause>)"`, no pane index.
   */
  get collapseStatus(): Locator {
    // The status span sits in the section footer and is the *last* span with
    // muted text — the section also contains short hint copy spans.
    return this.collapsibleSection.locator('span', { hasText: /collapsed|expanded|—/ }).last();
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
