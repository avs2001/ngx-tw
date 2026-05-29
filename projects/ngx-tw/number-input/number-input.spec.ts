import {
  ChangeDetectionStrategy,
  Component,
  signal,
  type Type,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { describe, it, expect, vi } from 'vitest';
import {
  FormFieldComponent,
  LabelDirective,
} from '@cdevhub/ngx-tw/form-field';
import { InputDirective } from '@cdevhub/ngx-tw/input';
import { NumberInputDirective } from './number-input';

// ── Host harnesses ──

@Component({
  imports: [InputDirective, NumberInputDirective, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input
    twInput
    twNumberInput
    [formControl]="ctrl"
    [min]="min()"
    [max]="max()"
    [step]="step()"
    [format]="format()"
    [locale]="locale()"
  />`,
})
class ReactiveHost {
  readonly ctrl = new FormControl<number | null>(null);
  readonly min = signal<number | undefined>(undefined);
  readonly max = signal<number | undefined>(undefined);
  readonly step = signal<number>(1);
  readonly format = signal<Intl.NumberFormatOptions | undefined>(undefined);
  readonly locale = signal<string | undefined>('en-US');
  readonly directive = viewChild.required(NumberInputDirective);
}

@Component({
  imports: [InputDirective, NumberInputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input
    twInput
    twNumberInput
    [min]="min()"
    [max]="max()"
    [step]="step()"
    (valueChange)="onChange($event)"
  />`,
})
class BareHost {
  readonly min = signal<number | undefined>(undefined);
  readonly max = signal<number | undefined>(undefined);
  readonly step = signal<number>(1);
  readonly events: (number | null)[] = [];
  onChange(v: number | null): void {
    this.events.push(v);
  }
  readonly directive = viewChild.required(NumberInputDirective);
}

@Component({
  imports: [InputDirective, NumberInputDirective, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput twNumberInput [(ngModel)]="qty" />`,
})
class NgModelHost {
  qty: number | null = null;
  readonly directive = viewChild.required(NumberInputDirective);
}

@Component({
  imports: [InputDirective, NumberInputDirective, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput twNumberInput [formField]="qForm.qty" />`,
})
class SignalFormHost {
  readonly model = signal<{ qty: number | null }>({ qty: null });
  readonly qForm = form(this.model);
  readonly directive = viewChild.required(NumberInputDirective);
}

@Component({
  imports: [
    InputDirective,
    NumberInputDirective,
    ReactiveFormsModule,
    FormFieldComponent,
    LabelDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-form-field>
    <label twLabel>Qty</label>
    <input twInput twNumberInput [formControl]="ctrl" />
  </tw-form-field>`,
})
class FormFieldHost {
  readonly ctrl = new FormControl<number | null>(null);
  readonly directive = viewChild.required(NumberInputDirective);
  readonly input = viewChild.required(InputDirective);
}

@Component({
  imports: [InputDirective, NumberInputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput twNumberInput disabled />`,
})
class DisabledAttrHost {
  readonly directive = viewChild.required(NumberInputDirective);
}

@Component({
  imports: [InputDirective, NumberInputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput twNumberInput readonly />`,
})
class ReadonlyAttrHost {
  readonly directive = viewChild.required(NumberInputDirective);
}

@Component({
  imports: [InputDirective, NumberInputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput twNumberInput [step]="0" />`,
})
class StepZeroHost {}

// ── Helpers ──

async function create<T>(host: Type<T>): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({ imports: [host] }).compileComponents();
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function inputEl<T>(fixture: ComponentFixture<T>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input') as HTMLInputElement;
}

function typeInto(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event('input'));
}

function keydown(input: HTMLInputElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, cancelable: true });
  input.dispatchEvent(event);
  return event;
}

describe('NumberInputDirective', () => {
  describe('Rendering / attributes', () => {
    it('mounts a bare input without errors and keeps type="text"', async () => {
      const fixture = await create(BareHost);
      const input = inputEl(fixture);
      expect(input).toBeTruthy();
      expect(input.getAttribute('type')).toBe('text');
    });

    it('exposes role="spinbutton"', async () => {
      const input = inputEl(await create(BareHost));
      expect(input.getAttribute('role')).toBe('spinbutton');
    });

    it('uses inputmode="decimal" by default, "numeric" for integer formats', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      expect(input.getAttribute('inputmode')).toBe('decimal');
      fixture.componentInstance.format.set({ maximumFractionDigits: 0 });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(input.getAttribute('inputmode')).toBe('numeric');
    });

    it('binds aria-valuemin / aria-valuemax only when min / max are set', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      expect(input.hasAttribute('aria-valuemin')).toBe(false);
      expect(input.hasAttribute('aria-valuemax')).toBe(false);
      fixture.componentInstance.min.set(0);
      fixture.componentInstance.max.set(99);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(input.getAttribute('aria-valuemin')).toBe('0');
      expect(input.getAttribute('aria-valuemax')).toBe('99');
    });

    it('drops aria-valuenow when empty, sets it when valued', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      expect(input.hasAttribute('aria-valuenow')).toBe(false);
      fixture.componentInstance.ctrl.setValue(5);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(input.getAttribute('aria-valuenow')).toBe('5');
    });

    it('always supplies aria-valuetext ("Empty" when blank, formatted when valued)', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      expect(input.getAttribute('aria-valuetext')).toBe('Empty');
      fixture.componentInstance.ctrl.setValue(5);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(input.getAttribute('aria-valuetext')).toBe('5');
    });
  });

  describe('Parsing', () => {
    async function parseHost(): Promise<ComponentFixture<ReactiveHost>> {
      return create(ReactiveHost);
    }

    it('parses a plain integer and emits valueChange', async () => {
      const fixture = await create(BareHost);
      const input = inputEl(fixture);
      typeInto(input, '42');
      expect(fixture.componentInstance.directive().value()).toBe(42);
      expect(fixture.componentInstance.events).toEqual([42]);
    });

    it('parses empty string to null', async () => {
      const fixture = await parseHost();
      typeInto(inputEl(fixture), '');
      expect(fixture.componentInstance.ctrl.value).toBeNull();
    });

    it('keeps intermediate states raw while focused, with the table model values', async () => {
      const fixture = await parseHost();
      const input = inputEl(fixture);
      for (const [text, model] of [
        ['1.', 1],
        ['1.0', 1],
        ['1.50', 1.5],
      ] as const) {
        typeInto(input, text);
        expect(input.value).toBe(text); // raw, not reformatted
        expect(fixture.componentInstance.ctrl.value).toBe(model);
      }
      for (const text of ['-', '.', '-.']) {
        typeInto(input, text);
        expect(input.value).toBe(text);
        expect(fixture.componentInstance.ctrl.value).toBeNull();
      }
    });

    it('rejects garbage, exponent notation, and bare separators to null', async () => {
      const fixture = await parseHost();
      const input = inputEl(fixture);
      for (const text of ['abc', '1.2.3', '1e3', '1E3', '$', '%', '--']) {
        typeInto(input, text);
        expect(fixture.componentInstance.ctrl.value).toBeNull();
      }
    });

    it('strips a leading plus and accepts the number', async () => {
      const fixture = await parseHost();
      typeInto(inputEl(fixture), '+5');
      expect(fixture.componentInstance.ctrl.value).toBe(5);
    });

    it('treats a lone group separator as null but a trailing one as the integer', async () => {
      const fixture = await parseHost();
      const input = inputEl(fixture);
      typeInto(input, ',');
      expect(fixture.componentInstance.ctrl.value).toBeNull();
      typeInto(input, '1,');
      expect(fixture.componentInstance.ctrl.value).toBe(1);
    });

    it('parses a currency-formatted en-US string', async () => {
      const fixture = await parseHost();
      typeInto(inputEl(fixture), '$1,234.50');
      expect(fixture.componentInstance.ctrl.value).toBe(1234.5);
    });

    it('parses a de-DE formatted string', async () => {
      const fixture = await parseHost();
      fixture.componentInstance.locale.set('de-DE');
      fixture.detectChanges();
      typeInto(inputEl(fixture), '1.234,50');
      expect(fixture.componentInstance.ctrl.value).toBe(1234.5);
    });

    it('strips a narrow-NBSP group separator (fr-FR) via the Unicode-whitespace step', async () => {
      const fixture = await parseHost();
      fixture.componentInstance.locale.set('fr-FR');
      fixture.detectChanges();
      typeInto(inputEl(fixture), '1 234,5');
      expect(fixture.componentInstance.ctrl.value).toBe(1234.5);
    });
  });

  describe('Formatting / commit on blur', () => {
    it('reformats on blur (default vs minimumFractionDigits)', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      typeInto(input, '1.0');
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(input.value).toBe('1');

      fixture.componentInstance.format.set({ minimumFractionDigits: 2 });
      fixture.detectChanges();
      typeInto(input, '1.0');
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(input.value).toBe('1.00');
    });

    it('reverts to the last committed value when blurring on unparseable text', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      typeInto(input, '5');
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(input.value).toBe('5');

      input.dispatchEvent(new Event('focus'));
      typeInto(input, '-');
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(input.value).toBe('5');
      expect(fixture.componentInstance.ctrl.value).toBe(5);
    });

    it('formats currency on commit', async () => {
      const fixture = await create(ReactiveHost);
      fixture.componentInstance.format.set({
        style: 'currency',
        currency: 'USD',
      });
      fixture.detectChanges();
      fixture.componentInstance.ctrl.setValue(5);
      fixture.detectChanges();
      await fixture.whenStable();
      const input = inputEl(fixture);
      expect(input.value).toContain('5');
      expect(input.value).toMatch(/\$/);
    });

    it('rounds the model to the resolved precision on a user commit (display === model)', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      typeInto(input, '1.23456');
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(input.value).toBe('1.235');
      expect(fixture.componentInstance.ctrl.value).toBe(1.235);
    });

    it('never displays negative zero', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      typeInto(input, '-0');
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(input.value).toBe('0');
      expect(Object.is(fixture.componentInstance.ctrl.value, -0)).toBe(false);
      expect(fixture.componentInstance.ctrl.value).toBe(0);
    });
  });

  describe('Clamping', () => {
    it('clamps below min on commit', async () => {
      const fixture = await create(ReactiveHost);
      fixture.componentInstance.min.set(10);
      fixture.detectChanges();
      const input = inputEl(fixture);
      typeInto(input, '5');
      expect(fixture.componentInstance.ctrl.value).toBe(5); // not clamped while typing
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(fixture.componentInstance.ctrl.value).toBe(10);
      expect(input.value).toBe('10');
    });

    it('clamps above max on commit', async () => {
      const fixture = await create(ReactiveHost);
      fixture.componentInstance.max.set(99);
      fixture.detectChanges();
      const input = inputEl(fixture);
      typeInto(input, '200');
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(fixture.componentInstance.ctrl.value).toBe(99);
    });
  });

  describe('Keyboard stepping', () => {
    it('ArrowUp adds step, ArrowDown subtracts, both clamp', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      fixture.componentInstance.ctrl.setValue(5);
      fixture.detectChanges();
      await fixture.whenStable();
      keydown(input, 'ArrowUp');
      await fixture.whenStable();
      expect(fixture.componentInstance.ctrl.value).toBe(6);
      keydown(input, 'ArrowDown');
      await fixture.whenStable();
      expect(fixture.componentInstance.ctrl.value).toBe(5);
    });

    it('ArrowUp preventDefaults; PageUp / Backspace do not', async () => {
      const input = inputEl(await create(ReactiveHost));
      expect(keydown(input, 'ArrowUp').defaultPrevented).toBe(true);
      expect(keydown(input, 'PageUp').defaultPrevented).toBe(false);
      expect(keydown(input, 'Backspace').defaultPrevented).toBe(false);
    });

    it('steps an empty field with min by clamping (treat as 0, +step, clamp)', async () => {
      const fixture = await create(ReactiveHost);
      fixture.componentInstance.min.set(10);
      fixture.detectChanges();
      keydown(inputEl(fixture), 'ArrowUp');
      await fixture.whenStable();
      expect(fixture.componentInstance.ctrl.value).toBe(10);
    });

    it('steps an empty field with no min to step (from 0)', async () => {
      const fixture = await create(ReactiveHost);
      keydown(inputEl(fixture), 'ArrowUp');
      await fixture.whenStable();
      expect(fixture.componentInstance.ctrl.value).toBe(1);
    });

    it('Home jumps to min, End jumps to max', async () => {
      const fixture = await create(ReactiveHost);
      fixture.componentInstance.min.set(3);
      fixture.componentInstance.max.set(80);
      fixture.detectChanges();
      const input = inputEl(fixture);
      keydown(input, 'Home');
      await fixture.whenStable();
      expect(fixture.componentInstance.ctrl.value).toBe(3);
      keydown(input, 'End');
      await fixture.whenStable();
      expect(fixture.componentInstance.ctrl.value).toBe(80);
    });

    it('Enter commits in place without losing focus', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      input.focus();
      input.dispatchEvent(new Event('focus'));
      typeInto(input, '2.5');
      keydown(input, 'Enter');
      await fixture.whenStable();
      expect(document.activeElement).toBe(input);
      expect(fixture.componentInstance.ctrl.value).toBe(2.5);
      expect(input.value).toBe('2.5');
    });

    it('does not step when readonly', async () => {
      const fixture = await create(ReadonlyAttrHost);
      const dir = fixture.componentInstance.directive();
      const before = dir.value();
      keydown(inputEl(fixture), 'ArrowUp');
      dir.increment();
      expect(dir.value()).toBe(before);
    });
  });

  describe('Public API', () => {
    it('increment / decrement step, clamp, and emit valueChange without moving focus', async () => {
      const fixture = await create(BareHost);
      const input = inputEl(fixture);
      const dir = fixture.componentInstance.directive();
      dir.increment();
      expect(dir.value()).toBe(1);
      expect(fixture.componentInstance.events).toContain(1);
      expect(document.activeElement).not.toBe(input); // no focus steal
    });

    it('value() reflects the committed model', async () => {
      const fixture = await create(BareHost);
      typeInto(inputEl(fixture), '7');
      expect(fixture.componentInstance.directive().value()).toBe(7);
    });

    it('disabled() reflects a static disabled attribute', async () => {
      const fixture = await create(DisabledAttrHost);
      expect(fixture.componentInstance.directive().disabled()).toBe(true);
    });

    it('readonly() reflects a readonly attribute (seeded after render)', async () => {
      const fixture = await create(ReadonlyAttrHost);
      expect(fixture.componentInstance.directive().readonly()).toBe(true);
    });
  });

  describe('ControlValueAccessor', () => {
    it('writeValue writes the formatted display and model without emitting valueChange', async () => {
      const fixture = await create(BareHost);
      const dir = fixture.componentInstance.directive();
      dir.writeValue(42);
      fixture.detectChanges();
      expect(inputEl(fixture).value).toBe('42');
      expect(dir.value()).toBe(42);
      expect(fixture.componentInstance.events).toEqual([]);
    });

    it('writeValue while focused leaves the raw caret text untouched', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      input.dispatchEvent(new Event('focus'));
      typeInto(input, '1.23');
      fixture.componentInstance.ctrl.setValue(99);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(input.value).toBe('1.23'); // caret guard
      expect(fixture.componentInstance.directive().value()).toBe(99);
    });

    it('writeValue(null) and writeValue(NaN) clear to null', async () => {
      const fixture = await create(BareHost);
      const dir = fixture.componentInstance.directive();
      dir.writeValue(5);
      fixture.detectChanges();
      dir.writeValue(null);
      fixture.detectChanges();
      expect(inputEl(fixture).value).toBe('');
      expect(dir.value()).toBeNull();
      dir.writeValue(Number.NaN);
      expect(dir.value()).toBeNull();
    });

    it('calls onTouched on blur', async () => {
      const fixture = await create(ReactiveHost);
      expect(fixture.componentInstance.ctrl.touched).toBe(false);
      inputEl(fixture).dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(fixture.componentInstance.ctrl.touched).toBe(true);
    });

    it('round-trips through [formControl] (setValue updates the element)', async () => {
      const fixture = await create(ReactiveHost);
      const input = inputEl(fixture);
      fixture.componentInstance.ctrl.setValue(7);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(input.value).toBe('7');
      typeInto(input, '12');
      expect(fixture.componentInstance.ctrl.value).toBe(12);
    });

    it('round-trips through [(ngModel)]', async () => {
      const fixture = await create(NgModelHost);
      typeInto(inputEl(fixture), '8');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.qty).toBe(8);
    });

    it('round-trips through signal forms [formField]', async () => {
      const fixture = await create(SignalFormHost);
      typeInto(inputEl(fixture), '9');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.qForm.qty().value()).toBe(9);
    });

    it('setDisabledState(true) flips disabled(), disables the element, and blocks stepping', async () => {
      const fixture = await create(ReactiveHost);
      fixture.componentInstance.ctrl.disable();
      fixture.detectChanges();
      await fixture.whenStable();
      const dir = fixture.componentInstance.directive();
      expect(dir.disabled()).toBe(true);
      expect(inputEl(fixture).disabled).toBe(true);
      const before = dir.value();
      dir.increment();
      expect(dir.value()).toBe(before);
    });
  });

  describe('TW_INPUT_VALUE_ACCESSOR wiring', () => {
    it('feeds displayText (not the numeric value) to the sibling InputDirective empty state', async () => {
      const fixture = await create(FormFieldHost);
      const input = inputEl(fixture);
      input.dispatchEvent(new Event('focus'));
      typeInto(input, '-');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.directive().displayText()).toBe('-');
      expect(fixture.componentInstance.directive().value()).toBeNull();
      // numeric model is null, yet the field reads non-empty because displayText is '-'
      expect(fixture.componentInstance.input().empty()).toBe(false);
    });
  });

  describe('Dev-mode / wheel', () => {
    it('warns and falls back to 1 on a non-positive step', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      await create(StepZeroHost);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('step=0'),
      );
      warn.mockRestore();
    });

    it('does not change the value on mouse wheel', async () => {
      const fixture = await create(BareHost);
      const input = inputEl(fixture);
      typeInto(input, '5');
      input.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
      fixture.detectChanges();
      expect(fixture.componentInstance.directive().value()).toBe(5);
    });
  });
});
