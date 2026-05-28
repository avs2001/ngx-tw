import {
  booleanAttribute,
  computed,
  Directive,
  effect,
  forwardRef,
  inject,
  input,
  numberAttribute,
  type Signal,
} from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { tv } from 'tailwind-variants';
import type { TwSize } from 'ngx-tw/core';
import { TW_FORM_FIELD_CONTROL } from 'ngx-tw/form-field';
import { InputDirective } from 'ngx-tw/input';

/**
 * How the user-resize handle behaves on the textarea. `'vertical'` (the
 * default) lets users drag the bottom edge to grow the textarea; `'none'`
 * locks the size; `'both'` allows free resizing on both axes (rarely useful
 * inside a form-field — the textarea can overflow the wrapper). Horizontal
 * is intentionally omitted — it breaks form-field layout in practice.
 */
export type TwTextareaResize = 'none' | 'vertical' | 'both';

const textareaVariants = tv(
  {
    base: '',
    variants: {
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        both: 'resize',
      },
    },
    defaultVariants: {
      resize: 'vertical',
    },
  },
  { twMerge: true },
);

/**
 * Adapts a native `<textarea>` into an ngx-tw form-field-compatible multi-line
 * control. Extends {@link InputDirective} — inherits its form-field
 * integration, error-state machinery, autofill / focus tracking, ARIA wiring,
 * and standalone styling. Adds textarea-specific behavior: autosize composition
 * via CDK's `CdkTextareaAutosize`, a `resize` axis for the user-resize handle,
 * `rows` / `minRows` / `maxRows`, and `maxLength` with a `valueLength` signal
 * for character counters.
 *
 * Like `InputDirective`, this directive deliberately does NOT implement
 * `ControlValueAccessor`. Angular's built-in `DefaultValueAccessor` attaches to
 * the native `<textarea>` and handles value I/O for template-driven
 * (`ngModel`), reactive (`FormControl` / `formControlName`), and signal-forms
 * (`formField`) bindings — no library glue required.
 *
 * Form-control input-cap exception applies (codified in CLAUDE.md): ARIA +
 * forms baseline plus textarea-specific surface exceeds the 5–6 cap;
 * `checkbox` is the canonical 12+ exemplar.
 */
@Directive({
  selector: 'textarea[twTextarea]',
  exportAs: 'twTextarea',
  hostDirectives: [
    {
      directive: CdkTextareaAutosize,
      inputs: [
        'cdkAutosizeMinRows: minRows',
        'cdkAutosizeMaxRows: maxRows',
      ],
    },
  ],
  providers: [
    {
      provide: TW_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => TextareaDirective),
    },
  ],
  host: {
    '[class]': 'classes() + " " + textareaClasses()',
    '[attr.id]': 'id()',
    '[attr.rows]': 'rows()',
    '[attr.maxlength]': 'maxLength() ?? null',
    '[disabled]': 'disabled()',
    '[attr.aria-invalid]': 'errorState() || null',
    '[attr.aria-required]': 'required() || null',
    '(input)': '_onInput()',
  },
})
export class TextareaDirective extends InputDirective {
  private readonly cdkAutosize = inject(CdkTextareaAutosize, {
    self: true,
    optional: true,
  });

  // @internal Re-declares the `size` input inherited from `InputDirective` so
  // it lands on this directive's own `ɵdir` input metadata. ng-packagr emits
  // `ɵdir` with only the child's directly declared inputs, so without this the
  // consumer-side strict template-check rejects `<textarea twTextarea
  // [size]="…">` with NG8002. Both signals share the same `'md'` default and
  // the inherited `classes()` computed reads through polymorphism, so runtime
  // behaviour is unchanged.
  //
  // The `@ts-ignore` is needed for a CI-only quirk: under
  // `noImplicitOverride`, partial compilation resolves `InputDirective`
  // through the just-built `dist/` d.ts on CI, where TypeScript decides the
  // base member isn't visible and rejects `override` with TS4113. Locally
  // the same resolution sees the member, so `@ts-expect-error` would itself
  // flag as unused. `@ts-ignore` suppresses whichever error fires and is
  // a no-op when neither does.
  /** Density of a standalone textarea. Maps to the inline-padding + font scale (`xs` … `xl`). Ignored inside a `<tw-form-field>` — the wrapper's `size` carries density. Defaults to `'md'`. */
  // @ts-ignore — TS4113 (CI) vs TS4114 (local); see comment above.
  override readonly size = input<TwSize>('md');

  /** Grows the textarea with its content (composed from CDK's `CdkTextareaAutosize`). When `true` the user-resize handle is forced off — autosize owns the height. Defaults to `false`. */
  readonly autosize = input<boolean, unknown>(false, {
    transform: booleanAttribute,
  });

  /** Minimum number of rows the textarea collapses to when `autosize` is `true`. Ignored when autosize is off. Defaults to `1`. */
  readonly minRows = input<number, unknown>(1, { transform: numberAttribute });

  /** Maximum number of rows the textarea expands to before scrolling, when `autosize` is `true`. `undefined` removes the cap. Ignored when autosize is off. Defaults to `undefined`. */
  readonly maxRows = input<number | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null || v === '' ? undefined : numberAttribute(v)),
  });

  /** Number of rows for the initial render height (native `rows` attribute). Browsers honor this even when `autosize` is `true`, so first paint uses this value. Defaults to `3`. */
  readonly rows = input<number, unknown>(3, { transform: numberAttribute });

  /** Controls the user-resize handle: `'none'` locks the size, `'vertical'` (default) allows vertical drag, `'both'` allows both axes. Forced to `'none'` when `autosize` is `true`. Horizontal-only is intentionally not supported. */
  readonly resize = input<TwTextareaResize>('vertical');

  /** Maximum character count. Mirrors to the native `maxlength` attribute when defined and is exposed via the `valueLength` signal so consumers can render a "X / N" hint. Defaults to `undefined`. */
  readonly maxLength = input<number | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null || v === '' ? undefined : numberAttribute(v)),
  });

  /** Current value length, updates on every `input` event. Wire `<span twHint align="end">{{ ta.valueLength() }} / {{ ta.maxLength() }}</span>` for a character counter. */
  readonly valueLength: Signal<number> = computed(() => this.value()?.length ?? 0);

  /** @internal Textarea-specific Tailwind classes (resize axis). Combined with the inherited `classes()` in the host `[class]` binding. */
  readonly textareaClasses = computed(() =>
    // Short-circuit the resize/autosize conflict deterministically — don't
    // rely on tv variant emission order or twMerge "last wins" semantics.
    this.autosize()
      ? textareaVariants({ resize: 'none' })
      : textareaVariants({ resize: this.resize() }),
  );

  constructor() {
    super();

    // Wire the autosize toggle. The CDK directive is always mounted via
    // hostDirectives; we just flip its `enabled` setter based on our input.
    effect(() => {
      if (this.cdkAutosize) {
        this.cdkAutosize.enabled = this.autosize();
      }
    });
  }

  /** Triggers a CDK autosize recalculation. Useful after programmatic value changes that bypass the native `(input)` event (e.g., clipboard write APIs). No-op when `autosize` is `false`. */
  resizeToFitContent(force = false): void {
    if (this.cdkAutosize && this.autosize()) {
      this.cdkAutosize.resizeToFitContent(force);
    }
  }
}
