import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  MenuComponent,
  MenuItemCheckboxComponent,
  MenuItemDirective,
  MenuItemRadioComponent,
  MenuTriggerDirective,
} from '../menu';
import { MenuHarness } from './menu-harness';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MenuComponent,
    MenuTriggerDirective,
    MenuItemDirective,
    MenuItemCheckboxComponent,
    MenuItemRadioComponent,
  ],
  template: `
    <button type="button" [twMenuTrigger]="actions">Actions</button>
    <ng-template #actions>
      <tw-menu aria-label="Actions">
        <button type="button" twMenuItem (triggered)="lastTriggered.set('Rename')">
          Rename
        </button>
        <button type="button" twMenuItem [disabled]="true">Archive</button>
        <button type="button" twMenuItemCheckbox [checked]="showGrid()"
                (checkedChange)="showGrid.set($event)">
          Show grid
        </button>
        <button type="button" twMenuItemRadio [checked]="density() === 'cosy'"
                (checkedChange)="density.set('cosy')">
          Cosy
        </button>
      </tw-menu>
    </ng-template>

    <button type="button" [twMenuTrigger]="other">Other</button>
    <ng-template #other>
      <tw-menu aria-label="Other">
        <button type="button" twMenuItem>Elsewhere</button>
      </tw-menu>
    </ng-template>
  `,
})
class HarnessHost {
  readonly lastTriggered = signal<string | null>(null);
  readonly showGrid = signal(false);
  readonly density = signal<'compact' | 'cosy'>('compact');
}

describe('MenuHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HarnessHost, OverlayModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // The ORDINARY fixture loader, deliberately. The panel renders into the
    // overlay container outside the fixture, but the harness hosts on the
    // in-fixture trigger and resolves the panel via `documentRootLocatorFactory()`
    // — so a consumer never needs `TestbedHarnessEnvironment.documentRootLoader`.
    // If that internal detail regressed, every item assertion below would see an
    // empty menu.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => (el.innerHTML = ''));
  });

  it('reads the trigger text and reports the closed state', async () => {
    const menu = await loader.getHarness(MenuHarness.with({ triggerText: 'Actions' }));

    expect(await menu.getTriggerText()).toBe('Actions');
    expect(await menu.isOpen()).toBe(false);
  });

  it('opens and closes', async () => {
    const menu = await loader.getHarness(MenuHarness.with({ triggerText: 'Actions' }));

    await menu.open();
    expect(await menu.isOpen()).toBe(true);

    await menu.close();
    expect(await menu.isOpen()).toBe(false);
  });

  it('enumerates items only while the panel is attached', async () => {
    const menu = await loader.getHarness(MenuHarness.with({ triggerText: 'Actions' }));

    // CDK removes the panel from the DOM on close, so a closed menu has no items.
    expect(await menu.getItems()).toHaveLength(0);

    await menu.open();
    const items = await menu.getItems();
    expect(items).toHaveLength(4);
    expect(await items[0].getText()).toBe('Rename');
    expect(await items[0].getRole()).toBe('menuitem');
    expect(await items[1].isDisabled()).toBe(true);
    expect(await items[0].isDisabled()).toBe(false);
  });

  it('scopes items to its own panel, not to every open menu', async () => {
    const actions = await loader.getHarness(MenuHarness.with({ triggerText: 'Actions' }));
    const other = await loader.getHarness(MenuHarness.with({ triggerText: 'Other' }));

    await actions.open();
    expect(await actions.getItems()).toHaveLength(4);
    // The second trigger is closed, so it must report nothing even though a
    // menu IS open in the document — this is what `aria-controls` scoping buys.
    expect(await other.getItems()).toHaveLength(0);
  });

  it('clicks an item by text', async () => {
    const menu = await loader.getHarness(MenuHarness.with({ triggerText: 'Actions' }));

    await menu.clickItem('Rename');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.lastTriggered()).toBe('Rename');
  });

  it('throws a named error rather than failing silently on an unknown item', async () => {
    const menu = await loader.getHarness(MenuHarness.with({ triggerText: 'Actions' }));

    await expect(menu.clickItem('Nonexistent')).rejects.toThrow(/no item matching/i);
  });

  it('reports and flips checkbox item state', async () => {
    const menu = await loader.getHarness(MenuHarness.with({ triggerText: 'Actions' }));

    await menu.open();
    const [checkbox] = await menu.getItems({ text: 'Show grid' });
    expect(await checkbox.getRole()).toBe('menuitemcheckbox');
    expect(await checkbox.isChecked()).toBe(false);

    await checkbox.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.showGrid()).toBe(true);

    // Re-read from a fresh open: the state CHANGED across the interaction.
    await menu.open();
    const [reread] = await menu.getItems({ text: 'Show grid' });
    expect(await reread.isChecked()).toBe(true);
  });

  it('reports radio item state and distinguishes plain items', async () => {
    const menu = await loader.getHarness(MenuHarness.with({ triggerText: 'Actions' }));

    await menu.open();
    const [radio] = await menu.getItems({ text: 'Cosy' });
    expect(await radio.getRole()).toBe('menuitemradio');
    expect(await radio.isChecked()).toBe(false);

    // A plain item carries no `aria-checked` at all, which the harness reports
    // as `null` rather than folding into `false`.
    const [plain] = await menu.getItems({ text: 'Rename' });
    expect(await plain.isChecked()).toBeNull();

    await radio.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.density()).toBe('cosy');

    await menu.open();
    const [reread] = await menu.getItems({ text: 'Cosy' });
    expect(await reread.isChecked()).toBe(true);
  });

  it('filters items by disabled and checked state', async () => {
    const menu = await loader.getHarness(MenuHarness.with({ triggerText: 'Actions' }));

    await menu.open();
    const disabled = await menu.getItems({ disabled: true });
    expect(disabled).toHaveLength(1);
    expect(await disabled[0].getText()).toBe('Archive');

    // Nothing is checked yet, so the `checked: true` filter must return nothing
    // — and `checked: false` must skip the plain items, whose state is `null`.
    expect(await menu.getItems({ checked: true })).toHaveLength(0);
    expect(await menu.getItems({ checked: false })).toHaveLength(2);
  });
});
