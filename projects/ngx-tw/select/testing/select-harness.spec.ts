import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { SelectComponent } from '../select';
import { SelectHarness } from './select-harness';

interface TestOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

const OPTIONS: readonly TestOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
  { label: 'Date', value: 'date' },
];

@Component({
  imports: [SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-select
      [options]="options()"
      [(value)]="value"
      [multiple]="multiple()"
      [disabled]="disabled()"
      [placeholder]="'Choose'"
      aria-label="Fruit"
    />
  `,
})
class HarnessHost {
  options = signal<readonly TestOption[]>(OPTIONS);
  value = signal<string | readonly string[] | null>(null);
  multiple = signal(false);
  disabled = signal(false);
}

describe('SelectHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HarnessHost, OverlayModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // The ORDINARY fixture loader, deliberately. The options panel renders into
    // the overlay container outside `tw-select`, but the harness resolves it via
    // `documentRootLocatorFactory()`, so a consumer never needs
    // `TestbedHarnessEnvironment.documentRootLoader`. If that internal detail
    // regressed, every option assertion below would see an empty panel.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('reads the trigger label and placeholder text', async () => {
    const select = await loader.getHarness(SelectHarness);

    expect(await select.getLabel()).toBe('Fruit');
    expect(await select.getTriggerText()).toBe('Choose');
    expect(await select.isOpen()).toBe(false);
  });

  it('opens and closes', async () => {
    const select = await loader.getHarness(SelectHarness);

    await select.open();
    expect(await select.isOpen()).toBe(true);

    await select.close();
    expect(await select.isOpen()).toBe(false);
  });

  it('enumerates the options only while the panel is attached', async () => {
    const select = await loader.getHarness(SelectHarness);

    // The overlay is disposed on close, not hidden — so a closed select has no
    // options to enumerate. This is the assertion that would break if the
    // component ever went back to detach-and-reuse.
    expect(await select.getOptions()).toHaveLength(0);

    await select.open();
    const options = await select.getOptions();
    expect(options).toHaveLength(4);
    expect(await options[0].getText()).toBe('Apple');
    expect(await options[2].isDisabled()).toBe(true);
    expect(await options[0].isDisabled()).toBe(false);
  });

  it('selects an option by text and reflects it in the trigger', async () => {
    const select = await loader.getHarness(SelectHarness);

    await select.selectOption('Banana');
    fixture.detectChanges();
    await fixture.whenStable();

    // State CHANGED across the interaction — a harness returning a hardcoded
    // value would have failed the placeholder assertion above or this one.
    expect(await select.getTriggerText()).toBe('Banana');
    expect(fixture.componentInstance.value()).toBe('banana');
  });

  it('throws a named error rather than failing silently on an unknown option', async () => {
    const select = await loader.getHarness(SelectHarness);

    await expect(select.selectOption('Kumquat')).rejects.toThrow(
      /no option matching/i,
    );
  });

  it('reports selected options through the option harnesses', async () => {
    fixture.componentInstance.multiple.set(true);
    fixture.componentInstance.value.set(['apple', 'date']);
    fixture.detectChanges();
    await fixture.whenStable();

    const select = await loader.getHarness(SelectHarness);
    expect(await select.getSelectedOptionTexts()).toEqual(['Apple', 'Date']);
  });

  it('clears a held value through the sibling clear button', async () => {
    const select = await loader.getHarness(SelectHarness);

    await select.selectOption('Apple');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await select.hasClearButton()).toBe(true);

    await select.clear();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBeNull();
    expect(await select.getTriggerText()).toBe('Choose');
  });

  it('has no clear control while empty, and clear() says so', async () => {
    const select = await loader.getHarness(SelectHarness);

    expect(await select.hasClearButton()).toBe(false);
    await expect(select.clear()).rejects.toThrow(/no clear control/i);
  });

  it('reports the disabled state', async () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const select = await loader.getHarness(SelectHarness);
    expect(await select.isDisabled()).toBe(true);
  });

  it('finds a select by its label through the predicate', async () => {
    const select = await loader.getHarness(SelectHarness.with({ label: 'Fruit' }));
    expect(await select.getLabel()).toBe('Fruit');
  });
});
