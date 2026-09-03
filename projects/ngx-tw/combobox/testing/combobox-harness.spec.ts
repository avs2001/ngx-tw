import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComboboxComponent } from '../combobox';
import { ComboboxHarness } from './combobox-harness';

interface TestOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

const OPTIONS: readonly TestOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Apricot', value: 'apricot' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
];

@Component({
  imports: [ComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-combobox
      [options]="options()"
      [(value)]="value"
      [(inputValue)]="inputValue"
      [disabled]="disabled()"
      [required]="required()"
      [placeholder]="'Type…'"
      aria-label="Fruit"
    />
  `,
})
class HarnessHost {
  readonly options = signal<readonly TestOption[]>(OPTIONS);
  readonly value = signal<string | null>(null);
  readonly inputValue = signal('');
  readonly disabled = signal(false);
  readonly required = signal(false);
}

@Component({
  imports: [ComboboxComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-combobox [options]="options" [formControl]="ctrl" aria-label="Fruit" />`,
})
class ReactiveHost {
  readonly options = OPTIONS;
  readonly ctrl = new FormControl<string | null>(null, Validators.required);
}

describe('ComboboxHarness', () => {
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
    // the overlay container outside `tw-combobox`, but the harness resolves it
    // via `documentRootLocatorFactory()`, so a consumer never needs
    // `TestbedHarnessEnvironment.documentRootLoader`. If that internal detail
    // regressed, every option assertion below would see an empty panel.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
  });

  it('reads the label, placeholder and empty input value', async () => {
    const combobox = await loader.getHarness(ComboboxHarness);

    expect(await combobox.getLabel()).toBe('Fruit');
    expect(await combobox.getPlaceholder()).toBe('Type…');
    expect(await combobox.getInputValue()).toBe('');
    expect(await combobox.isOpen()).toBe(false);
  });

  it('opens and closes', async () => {
    const combobox = await loader.getHarness(ComboboxHarness);

    await combobox.open();
    expect(await combobox.isOpen()).toBe(true);

    await combobox.close();
    expect(await combobox.isOpen()).toBe(false);
  });

  it('enumerates the options only once the panel has been attached', async () => {
    const combobox = await loader.getHarness(ComboboxHarness);

    // The overlay is disposed on close, not hidden — so a combobox that has
    // never opened has no options to enumerate. This is the assertion that
    // would break if the component went back to detach-and-reuse.
    expect(await combobox.getOptions()).toHaveLength(0);

    await combobox.open();
    const options = await combobox.getOptions();
    expect(options).toHaveLength(4);
    expect(await options[0].getText()).toBe('Apple');
    expect(await options[3].isDisabled()).toBe(true);
    expect(await options[0].isDisabled()).toBe(false);
  });

  it('filters the options from a typed query and reads the result', async () => {
    const combobox = await loader.getHarness(ComboboxHarness);

    expect(await combobox.getOptionTexts()).toEqual([
      'Apple',
      'Apricot',
      'Banana',
      'Cherry',
    ]);

    await combobox.setInputValue('Ap');
    fixture.detectChanges();
    await fixture.whenStable();

    // State CHANGED across the interaction — a harness returning a hardcoded
    // list would have failed one of these two assertions.
    expect(await combobox.getOptionTexts()).toEqual(['Apple', 'Apricot']);
    expect(await combobox.getInputValue()).toBe('Ap');
  });

  it('selects an option by text and commits it to the bound value', async () => {
    const combobox = await loader.getHarness(ComboboxHarness);

    await combobox.selectOption('Banana');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await combobox.getInputValue()).toBe('Banana');
    expect(fixture.componentInstance.value()).toBe('banana');
  });

  it('marks the held value as the selected option', async () => {
    // Seeded through the bound model rather than by picking, deliberately.
    // Picking closes the panel, and `combobox.ts` freezes its state push for
    // the length of the leave animation while leaving `isSelected` as a live
    // closure — so for those ~120ms the still-mounted rows resolve selection
    // against the *filtered* list and the highlight lands on the wrong row.
    // Asserting through that window would be asserting a transient bug.
    fixture.componentInstance.value.set('banana');
    fixture.detectChanges();
    await fixture.whenStable();

    const combobox = await loader.getHarness(ComboboxHarness);
    await combobox.open();

    const selected = await combobox.getOptions({ selected: true });
    expect(selected).toHaveLength(1);
    expect(await selected[0].getText()).toBe('Banana');
  });

  it('throws a named error rather than failing silently on an unknown option', async () => {
    const combobox = await loader.getHarness(ComboboxHarness);

    await expect(combobox.selectOption('Kumquat')).rejects.toThrow(
      /no option matching/i,
    );
  });

  it('clears a typed value through the inline clear control', async () => {
    const combobox = await loader.getHarness(ComboboxHarness);

    await combobox.selectOption('Apple');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await combobox.hasClearButton()).toBe(true);

    await combobox.clear();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBeNull();
    expect(await combobox.getInputValue()).toBe('');
  });

  it('has no clear control while empty, and clear() says so', async () => {
    const combobox = await loader.getHarness(ComboboxHarness);

    expect(await combobox.hasClearButton()).toBe(false);
    await expect(combobox.clear()).rejects.toThrow(/no clear control/i);
  });

  it('reports the disabled state and refuses to open', async () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const combobox = await loader.getHarness(ComboboxHarness);
    expect(await combobox.isDisabled()).toBe(true);

    await combobox.open();
    expect(await combobox.isOpen()).toBe(false);
  });

  it('reports the required state', async () => {
    const combobox = await loader.getHarness(ComboboxHarness);
    expect(await combobox.isRequired()).toBe(false);

    fixture.componentInstance.required.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await combobox.isRequired()).toBe(true);
  });

  it('reports the invalid state only once the bound control is touched', async () => {
    const reactive = TestBed.createComponent(ReactiveHost);
    reactive.detectChanges();
    await reactive.whenStable();
    const combobox = await TestbedHarnessEnvironment.loader(reactive).getHarness(
      ComboboxHarness,
    );

    // `Validators.required` reaches `aria-required` without the consumer also
    // writing `[required]`, but the error state waits for `touched`.
    expect(await combobox.isRequired()).toBe(true);
    expect(await combobox.isInvalid()).toBe(false);

    reactive.componentInstance.ctrl.markAsTouched();
    reactive.componentInstance.ctrl.updateValueAndValidity();
    reactive.detectChanges();
    await reactive.whenStable();
    expect(await combobox.isInvalid()).toBe(true);

    reactive.componentInstance.ctrl.setValue('apple');
    reactive.detectChanges();
    await reactive.whenStable();
    expect(await combobox.isInvalid()).toBe(false);
  });

  it('finds a combobox by its label through the predicate', async () => {
    const combobox = await loader.getHarness(ComboboxHarness.with({ label: 'Fruit' }));
    expect(await combobox.getLabel()).toBe('Fruit');
  });
});
