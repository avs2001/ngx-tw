import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, HarnessLoader } from '@angular/cdk/testing';
import {
  MenuItemHarness,
  type MenuItemHarnessFilters,
} from './menu-item-harness';

/** Filters accepted by `MenuHarness.with`. */
export interface MenuHarnessFilters extends BaseHarnessFilters {
  /** Match by the text rendered in the trigger. */
  triggerText?: string | RegExp;
}

/**
 * Harness for a `[twMenuTrigger]` and the `tw-menu` panel it opens.
 *
 * ## Why this is a parallel harness and not a delegating one
 *
 * `tw-menu` composes `CdkMenu` / `CdkMenuItem` through `hostDirectives`, so a
 * thin harness delegating to a CDK one would be preferable — except that
 * `@angular/cdk` ships **no component harnesses at all**. Its only testing
 * entry points are `@angular/cdk/testing`, `@angular/cdk/testing/testbed` and
 * `@angular/cdk/testing/selenium-webdriver`, all of which are harness
 * *infrastructure*; the component harnesses live in `@angular/material/*\/testing`,
 * and `@angular/material` is not a dependency of this library. There is nothing
 * to delegate to. What composition does buy us is that the locators below are
 * ARIA roles and attributes CDK guarantees (`role="menuitem"`,
 * `aria-expanded`, `aria-controls`), not ngx-tw class names.
 *
 * ## Why the host selector is not `[twMenuTrigger]`
 *
 * `twMenuTrigger` takes a required `TemplateRef`, so it is always written as a
 * property binding — `[twMenuTrigger]="menu"` — and Angular renders **no
 * attribute** for a bound input. `[twMenuTrigger]` therefore matches nothing in
 * the DOM. `MenuTriggerDirective` adds no host class or attribute of its own
 * (contrast Material, whose `MatMenuTrigger` adds `.mat-mdc-menu-trigger`
 * precisely so its harness can find it), so the only durable marker is the one
 * CDK contributes: `aria-haspopup="menu"`, bound unconditionally by
 * `CdkMenuTrigger` whenever it has a template. Nothing else in ngx-tw renders
 * that value — `[twContextMenuTrigger]` deliberately renders none — so the match
 * is exact today. If `MenuTriggerDirective` ever grows a host marker, widening
 * this selector to it is a non-breaking change.
 *
 * ## Loading it
 *
 * The host is the trigger, which lives in the fixture, so the ordinary
 * `TestbedHarnessEnvironment.loader(fixture)` is correct. The panel renders into
 * the CDK overlay container outside the fixture, and this harness resolves it
 * internally via `documentRootLocatorFactory()` — a consumer never needs
 * `documentRootLoader`.
 *
 * The panel is located by the id in the trigger's `aria-controls`, so a fixture
 * holding several menus (or an open submenu) still resolves each trigger to its
 * own panel.
 *
 * Only `[twMenuTrigger]` is covered. `[twContextMenuTrigger]` opens on a
 * `contextmenu` event at pointer coordinates and exposes neither `aria-expanded`
 * nor `aria-haspopup`; it is deliberately out of scope.
 */
export class MenuHarness extends ComponentHarness {
  static hostSelector = '[aria-haspopup="menu"]';

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: MenuHarnessFilters = {}): HarnessPredicate<MenuHarness> {
    return new HarnessPredicate(MenuHarness, options).addOption(
      'triggerText',
      options.triggerText,
      async (h, text) => HarnessPredicate.stringMatches(await h.getTriggerText(), text),
    );
  }

  /** The text currently rendered in the trigger, trimmed. */
  async getTriggerText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Whether the menu is open, read from the trigger's `aria-expanded`. */
  async isOpen(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the menu by clicking the trigger. No-op when already open. */
  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await (await this.host()).click();
  }

  /** Closes the menu by clicking the trigger again. No-op when already closed. */
  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.host()).click();
  }

  /**
   * Every item in the open panel — plain, checkbox and radio alike. Returns an
   * empty array when the menu is closed, because CDK removes the panel from the
   * DOM rather than hiding it.
   */
  async getItems(
    filters: MenuItemHarnessFilters = {},
  ): Promise<MenuItemHarness[]> {
    const panel = await this.getPanelLoader();
    if (!panel) return [];
    return panel.getAllHarnesses(MenuItemHarness.with(filters));
  }

  /**
   * Opens the menu if needed and clicks the first item whose text matches.
   * Throws when nothing matches, rather than failing silently.
   *
   * CDK closes the menu when an item is activated, so a `getItems()` chained
   * after this returns an empty array — call {@link open} again before
   * re-reading item state.
   */
  async clickItem(text: string | RegExp): Promise<void> {
    await this.open();
    const matches = await this.getItems({ text });
    if (matches.length === 0) {
      throw new Error(`MenuHarness.clickItem: no item matching ${String(text)}.`);
    }
    await matches[0].click();
  }

  /**
   * A loader rooted at this trigger's own panel, or `null` when the menu is
   * closed. Scoping by `aria-controls` keeps sibling menus and submenus apart.
   */
  private async getPanelLoader(): Promise<HarnessLoader | null> {
    const id = await (await this.host()).getAttribute('aria-controls');
    if (!id) return null;
    return this.documentRootLocatorFactory().harnessLoaderForOptional(`#${id}`);
  }
}
