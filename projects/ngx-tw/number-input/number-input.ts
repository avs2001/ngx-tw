import {
  afterNextRender,
  computed,
  Directive,
  ElementRef,
  forwardRef,
  inject,
  input,
  isDevMode,
  output,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TW_INPUT_VALUE_ACCESSOR } from '@cdevhub/ngx-tw/input';

/**
 * Turns a plain `<input twInput twNumberInput>` into a robust numeric field
 * without `type="number"` — fixing the broken-on-mobile, browser-inconsistent
 * native control. It composes the sibling {@link InputDirective}: that directive
 * keeps owning the form-field chrome, error-state, and `aria-invalid` /
 * `aria-required`, while this directive owns the numeric value transport,
 * locale-aware parse/format, spinbutton ARIA, `inputmode`, and keyboard stepping.
 *
 * Pair it with the companion `<tw-number-stepper [for]="ref">` for visible
 * up/down spinner buttons.
 *
 * Forms: implements `ControlValueAccessor`, so the value round-trips as a real
 * `number | null` (never a string) through template-driven, reactive, and
 * signal-based forms.
 */
@Directive({
  selector: 'input[twNumberInput]',
  exportAs: 'twNumberInput',
  providers: [
    // Custom CVA — transports a real `number | null`, not a string. Registered
    // statically because this directive injects NO `NgControl` (matcher /
    // error-state stay on the sibling InputDirective), so the circular-DI trap
    // that forces runtime registration does not apply. Follows the
    // segmented-control / calendar precedent. A custom accessor takes precedence
    // over the built-in DefaultValueAccessor, so there is no "more than one
    // value accessor" error.
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputDirective),
      multi: true,
    },
    // Lets the sibling InputDirective read the formatted *display text* (not the
    // numeric model) for its empty / float-label state. The factory exposes the
    // `displayText` signal so InputDirective's `isSignal(value)` effect stays
    // self-healing. Must NOT be `useExisting` — that would expose the numeric
    // `value` signal and report the field empty during intermediate typing.
    {
      provide: TW_INPUT_VALUE_ACCESSOR,
      useFactory: (dir: NumberInputDirective) => ({ value: dir.displayText }),
      deps: [forwardRef(() => NumberInputDirective)],
    },
  ],
  host: {
    'role': 'spinbutton',
    '[attr.inputmode]': 'inputMode()',
    '[attr.aria-valuemin]': 'min() ?? null',
    '[attr.aria-valuemax]': 'max() ?? null',
    '[attr.aria-valuenow]': 'value() ?? null',
    '[attr.aria-valuetext]': 'displayText() || "Empty"',
    '(input)': 'onInput()',
    '(keydown)': 'onKeydown($event)',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
  },
})
export class NumberInputDirective implements ControlValueAccessor {
  private readonly el =
    inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  // ── Inputs ──

  /** Smallest accepted value. Clamps the committed value (on blur, Enter, and stepping) and sets `aria-valuemin`. Does not clamp per keystroke. Defaults to `undefined` (no lower bound). */
  readonly min = input<number | undefined>(undefined);

  /** Largest accepted value. Clamps the committed value (on blur, Enter, and stepping) and sets `aria-valuemax`. Does not clamp per keystroke. Defaults to `undefined` (no upper bound). */
  readonly max = input<number | undefined>(undefined);

  /** Amount added or subtracted by ArrowUp/ArrowDown and the stepper buttons. Defaults to `1`. Values `<= 0` or non-finite fall back to `1`. */
  readonly step = input<number>(1);

  /** `Intl.NumberFormat` options driving the blurred display (grouping, decimals, currency). The formatter's resolved `maximumFractionDigits` also sets commit-time rounding precision and switches `inputmode` to `'numeric'` when it is `0`. Percent style is not supported in v1. Defaults to `undefined` (locale default number formatting, grouping on). */
  readonly format = input<Intl.NumberFormatOptions | undefined>(undefined);

  /** BCP-47 locale for `Intl.NumberFormat` formatting and for locale-aware parsing (decimal and group separators). Defaults to `undefined` (the runtime default locale). */
  readonly locale = input<string | undefined>(undefined);

  // ── Output ──

  /** Fires when the committed numeric value changes through user interaction (typing, stepping, clamping on blur/Enter). Does not fire on `writeValue` (programmatic form writes). Useful for non-form / template-ref usage alongside the `value` signal. */
  readonly valueChange = output<number | null>();

  // ── State ──

  private readonly _value = signal<number | null>(null);
  private readonly cvaDisabled = signal(false);
  private readonly readonlySig = signal(false);

  /** The current committed numeric value, or `null` when empty / unparseable. Read this from a template ref (`#n="twNumberInput"`) for non-form usage. */
  readonly value = this._value.asReadonly();

  /** @internal Formatted display text surfaced through `TW_INPUT_VALUE_ACCESSOR` so the sibling InputDirective's empty / float-label state tracks the text in the box (not the numeric model). Updated on every field mutation. */
  readonly displayText = signal<string>('');

  /** True when the control is disabled. Reactively tracks the reactive-forms path (`setDisabledState` via `control.disable()`) and a static `disabled` attribute read at mount. A runtime-toggled declarative `[disabled]` binding without reactive forms is NOT reactively tracked (v2 limitation — same class as `readonly`). Read by the companion stepper so its buttons disable in lock-step. */
  readonly disabled = computed(() => this.cvaDisabled() || this.el.disabled);

  /** True when the host input carries the `readonly` attribute (static / declarative, seeded after render). A runtime toggle of the bare `readonly` attribute is not reactively tracked (v2). Read by the companion stepper so its buttons disable in lock-step. */
  readonly readonly = this.readonlySig.asReadonly();

  /** @internal Mobile-keyboard hint: `'numeric'` for integer-only formats, else `'decimal'`. */
  readonly inputMode = computed(() =>
    this.format()?.maximumFractionDigits === 0 ? 'numeric' : 'decimal',
  );

  /** @internal Locale group / decimal separators, memoized per `locale()`. */
  private readonly separators = computed<{ group: string; decimal: string }>(
    () => {
      try {
        const parts = new Intl.NumberFormat(this.locale()).formatToParts(
          11000.1,
        );
        return {
          group: parts.find((p) => p.type === 'group')?.value ?? '',
          decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
        };
      } catch {
        return { group: '', decimal: '.' };
      }
    },
  );

  // ── Plain (non-signal) bookkeeping ──

  private _focused = false;
  private _lastValue: number | null = null;
  private _lastDisplay = '';
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Seed `readonly` after render. InputDirective mirrors its `readonly` input
    // onto the native attribute via an effect that runs AFTER construction
    // (input.ts:330-337), so a synchronous read here would be stale.
    afterNextRender(() => this.readonlySig.set(this.el.readOnly));

    // Dev-mode: warn once on a bogus step (mirrors time-picker).
    afterNextRender(() => {
      if (!isDevMode()) return;
      const s = this.step();
      if (s <= 0 || !Number.isFinite(s)) {
        console.warn(`[twNumberInput] step=${s} is invalid. Using 1 instead.`);
      }
    });
  }

  // ── ControlValueAccessor ──

  /** @internal */
  writeValue(value: number | null | undefined): void {
    if (value == null || Number.isNaN(value)) {
      this._value.set(null);
      this.displayText.set('');
      this._lastValue = null;
      this._lastDisplay = '';
      if (!this._focused) this.el.value = '';
      return;
    }
    // Normalize -0 → 0 (never store a negative zero); otherwise keep the value
    // un-rounded — a programmatic write is authoritative and must not silently
    // diverge from the parent FormControl.
    const n = Object.is(value, -0) ? 0 : value;
    const display = this.formatValue(n);
    this._value.set(n);
    this.displayText.set(display);
    // Update the revert anchor even while focused, so an unparseable blur after
    // a programmatic write snaps back to the form's value (not to '').
    this._lastValue = n;
    this._lastDisplay = display;
    // Caret guard: never rewrite el.value while focused (clobbers the caret);
    // defer the visible reformat to the next blur.
    if (!this._focused) this.el.value = display;
  }

  /** @internal */
  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  /** @internal */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** @internal */
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // ── Public methods ──

  /** Steps the value up: treats an empty field as `0`, adds `step`, clamps to `[min,max]`, rounds to the formatter's resolved precision, formats, and writes both the display and the model. Emits `valueChange`. No-op when the host input is disabled or readonly. Does not move focus. */
  increment(): void {
    this.stepBy(1);
  }

  /** Steps the value down: treats an empty field as `0`, subtracts `step`, clamps to `[min,max]`, rounds, formats, writes display and model. Emits `valueChange`. No-op when disabled or readonly. Does not move focus. */
  decrement(): void {
    this.stepBy(-1);
  }

  /** Moves focus to the underlying input element. */
  focus(options?: FocusOptions): void {
    this.el.focus(options);
  }

  // ── Host handlers ──

  /** @internal */
  onInput(): void {
    const raw = this.el.value;
    this.displayText.set(raw);
    const parsed = this.parseValue(raw);
    this._value.set(parsed);
    this.onChange(parsed);
    this.valueChange.emit(parsed);
  }

  /** @internal */
  onFocus(): void {
    this._focused = true;
  }

  /** @internal */
  onBlur(): void {
    this._focused = false;
    this.commitFromElement();
    this.onTouched();
  }

  /** @internal */
  onKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.el.readOnly) return;
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.increment();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.decrement();
        break;
      case 'Home':
        if (this.min() !== undefined) {
          event.preventDefault();
          this.commitNumber(this.min() as number);
        }
        break;
      case 'End':
        if (this.max() !== undefined) {
          event.preventDefault();
          this.commitNumber(this.max() as number);
        }
        break;
      case 'Enter':
        // Do NOT preventDefault — preserve native form submission. Commit in place.
        this.commitFromElement();
        break;
      // All other keys (PageUp/Down, text entry, caret nav, Backspace) → native.
    }
  }

  // ── Internal commit / step logic ──

  private stepBy(direction: 1 | -1): void {
    if (this.disabled() || this.el.readOnly) return;
    // Treat an empty field as 0, apply ±step, then clamp — matches native
    // <input type="number">.
    const current = this.parseValue(this.el.value) ?? 0;
    this.commitNumber(current + direction * this.resolvedStep());
  }

  private commitFromElement(): void {
    const raw = this.el.value;
    if (raw.trim() === '') {
      this.commitEmpty();
      return;
    }
    const parsed = this.parseValue(raw);
    if (parsed === null) {
      // Non-empty unparseable → snap back to the last committed value.
      this.revertToLastCommitted();
      return;
    }
    this.commitNumber(parsed);
  }

  private commitNumber(n: number): void {
    const rounded = this.roundToPrecision(this.clamp(n));
    const normalized = Object.is(rounded, -0) ? 0 : rounded;
    const display = this.formatValue(normalized);
    const changed = !Object.is(this._value(), normalized);
    this._value.set(normalized);
    this.displayText.set(display);
    this._lastValue = normalized;
    this._lastDisplay = display;
    this.el.value = display;
    if (changed) {
      this.onChange(normalized);
      this.valueChange.emit(normalized);
    }
  }

  private commitEmpty(): void {
    const changed = this._value() !== null;
    this._value.set(null);
    this.displayText.set('');
    this._lastValue = null;
    this._lastDisplay = '';
    this.el.value = '';
    if (changed) {
      this.onChange(null);
      this.valueChange.emit(null);
    }
  }

  private revertToLastCommitted(): void {
    const changed = this._value() !== this._lastValue;
    this._value.set(this._lastValue);
    this.displayText.set(this._lastDisplay);
    this.el.value = this._lastDisplay;
    if (changed) {
      this.onChange(this._lastValue);
      this.valueChange.emit(this._lastValue);
    }
  }

  // ── Inline numeric helpers ──

  private resolvedStep(): number {
    const s = this.step();
    return s > 0 && Number.isFinite(s) ? s : 1;
  }

  private clamp(n: number): number {
    const min = this.min();
    const max = this.max();
    let r = n;
    if (min !== undefined && r < min) r = min;
    if (max !== undefined && r > max) r = max;
    return r;
  }

  private roundToPrecision(n: number): number {
    if (!Number.isFinite(n)) return n;
    const digits = this.resolvedMaxFractionDigits();
    if (digits === undefined) return n;
    const factor = 10 ** digits;
    return Math.round(n * factor) / factor;
  }

  private resolvedMaxFractionDigits(): number | undefined {
    try {
      return new Intl.NumberFormat(
        this.locale(),
        this.format(),
      ).resolvedOptions().maximumFractionDigits;
    } catch {
      return undefined;
    }
  }

  private formatValue(n: number): string {
    const normalized = Object.is(n, -0) ? 0 : n;
    try {
      return new Intl.NumberFormat(this.locale(), this.format()).format(
        normalized,
      );
    } catch {
      return String(normalized);
    }
  }

  /**
   * Parse a raw string to `number | null` in a load-bearing order: the `e`/`E`
   * rejection MUST precede stripping (otherwise `'1e3'` would survive as `'13'`).
   */
  private parseValue(raw: string): number | null {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    // 2. Reject exponent notation before any stripping.
    if (/[eE]/.test(trimmed)) return null;
    const { group, decimal } = this.separators();
    // 3. Strip all Unicode whitespace (covers NBSP / narrow-NBSP group separators
    //    and a user-typed ASCII space alike).
    let s = trimmed.replace(/\s/gu, '');
    // 4. Strip group separators (redundant-but-harmless for space-grouped locales).
    if (group) s = s.split(group).join('');
    // 5. Normalize the locale decimal separator to '.'.
    if (decimal && decimal !== '.') s = s.split(decimal).join('.');
    // 6. Strip remaining non-numeric chars (currency symbols, '%', leading '+', …)
    //    and collapse to a single leading '-'.
    s = s.replace(/[^\d.-]/g, '').replace(/(?!^)-/g, '');
    // 7. Digit-presence + finiteness guard (prevents Number('') === 0 committing 0).
    if (!/\d/.test(s)) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    // Normalize -0 → 0 so it never enters the model from any path.
    return Object.is(n, -0) ? 0 : n;
  }
}
