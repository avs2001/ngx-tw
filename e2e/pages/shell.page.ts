import { expect, type Locator, type Page } from '@playwright/test';
import type { ComponentRoute, ServiceRoute, Subroute } from '../support/routes';

/**
 * Page Object Model for the demo shell — sidebar, header, and routing chrome.
 *
 * The shell renders an `<aside aria-label="Sidebar">` containing a
 * `<nav aria-label="Components">` with collapsible per-component sections.
 * Each component is a `<button>` with `aria-expanded`; expanding it reveals
 * three child `<a routerLink>` links (Overview / Examples / API).
 */
export class ShellPage {
  readonly sidebar: Locator;
  readonly nav: Locator;
  readonly header: Locator;
  readonly main: Locator;
  readonly themeToggleLight: Locator;
  readonly themeToggleDark: Locator;
  readonly themeToggleSystem: Locator;
  readonly presetMenuButton: Locator;
  readonly presetListbox: Locator;

  constructor(readonly page: Page) {
    this.sidebar = page.getByRole('complementary', { name: 'Sidebar' });
    this.nav = this.sidebar.getByRole('navigation', { name: 'Components' });
    this.header = page.locator('header');
    this.main = page.locator('main');
    this.themeToggleLight = this.header.getByRole('button', { name: 'Light mode' });
    this.themeToggleDark = this.header.getByRole('button', { name: 'Dark mode' });
    this.themeToggleSystem = this.header.getByRole('button', { name: 'System theme' });
    // The preset trigger button has aria-haspopup="listbox"; its accessible
    // name is the active preset's display label (e.g. "Default"), which
    // changes when the user picks a different preset. Locate by the
    // aria-haspopup attribute instead — it's stable across preset changes.
    this.presetMenuButton = this.header.locator('button[aria-haspopup="listbox"]');
    this.presetListbox = page.getByRole('listbox');
  }

  /** Navigate to the app root. */
  async gotoRoot(): Promise<void> {
    await this.page.goto('/');
  }

  /** Navigate directly to a component sub-route (deep link). */
  async gotoComponent(component: ComponentRoute, subroute: Subroute): Promise<void> {
    await this.page.goto(`/components/${component}/${subroute}`);
  }

  /** Navigate directly to a service sub-route (deep link). */
  async gotoService(service: ServiceRoute, subroute: Subroute): Promise<void> {
    await this.page.goto(`/services/${service}/${subroute}`);
  }

  /**
   * The sidebar's expandable group button for a component (e.g. "Button",
   * "Date Picker"). Located by accessible name only — the label uses
   * Title Case and a space separator, derived from the route slug.
   */
  navGroupButton(label: string): Locator {
    return this.nav.getByRole('button', { name: label, exact: true });
  }

  /** Sidebar child link, e.g. for `'button' / 'examples'` → "Examples" inside the Button group. */
  navChildLink(group: string, child: 'Overview' | 'Examples' | 'API'): Locator {
    // The nav scopes the search, but multiple groups expose the same child
    // labels — match by `href` to disambiguate.
    const groupSlug = group.toLowerCase().replace(/\s+/g, '-');
    return this.nav.locator(`a[href$="/components/${groupSlug}/${child.toLowerCase()}"]`);
  }

  /** Click a component group header to expand its child links. */
  async expandGroup(label: string): Promise<void> {
    const button = this.navGroupButton(label);
    const expanded = await button.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await button.click();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
    }
  }

  /**
   * Click through the sidebar to a specific component sub-route. Expands the
   * group first if collapsed, then clicks the child link.
   */
  async navigateViaSidebar(
    groupLabel: string,
    component: ComponentRoute,
    child: 'Overview' | 'Examples' | 'API',
  ): Promise<void> {
    await this.expandGroup(groupLabel);
    const link = this.navChildLink(component, child);
    await link.click();
    await this.page.waitForURL(`**/components/${component}/${child.toLowerCase()}`);
  }
}
