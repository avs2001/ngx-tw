import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  type OnInit,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewContainerRef,
  type Signal,
} from '@angular/core';
import {
  type ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import {
  buildSelectLikePositions,
  consumeOverlayEscape,
  type ErrorStateMatcher,
  resolveSelectScrollStrategy,
  TW_ERROR_STATE_MATCHER,
  type TwColor,
  type TwFormSubmitted,
  type TwSize,
} from '@cdevhub/ngx-tw/core';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Platform } from '@angular/cdk/platform';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import {
  FormFieldComponent,
  type FormFieldControl,
  TW_FORM_FIELD_CONTROL,
} from '@cdevhub/ngx-tw/form-field';
import { ComboboxOverlayComponent } from './combobox-overlay';
import type {
  ComboboxRenderedRow,
  ComboboxVisibleOption,
  TwComboboxOpenedEvent,
  TwComboboxOptionContext,
  TwComboboxOptionSelectedEvent,
  TwComboboxValueCommitEvent,
} from './types';

// ── Constants ──

/** Duration of leave animation (ms) — matches scale-out/fade-out in theme/_base.css. */
const ANIMATION_DURATION = 120;

/** Debounce window (ms) for LiveAnnouncer result announcements while typing. */
const ANNOUNCE_DEBOUNCE = 200;

/** Sentinel for an unresolved write-value awaiting late-arriving options. */
const UNRESOLVED = Symbol('combobox-unresolved');

let nextComboboxId = 0;

// ── Accessor defaults ──

function defaultOptionLabel(o: unknown): string {
  const opt = o as { label?: unknown; value?: unknown };
  if (typeof opt.label === 'string') return opt.label;
  return String(opt.value ?? '');
}

function defaultOptionValue<T>(o: unknown): T {
  return (o as { value: T }).value;
}

function defaultOptionDisabled(o: unknown): boolean {
  return !!(o as { disabled?: unknown }).disabled;
}

function defaultOptionGroup(o: unknown): string | undefined {
  return (o as { group?: string }).group;
}

function defaultOptionDescription(o: unknown): string | undefined {
  return (o as { description?: string }).description;
}

function defaultStartsWithFilter(option: unknown, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const label = defaultOptionLabel(option).toLowerCase();
  return label.startsWith(trimmed);
}

// ── tv() config ──

const comboboxVariants = tv(
  {
    slots: {
      root: 'relative inline-block w-full',
      // container-focus indicator — the `<input>` clears its own outline
      // (`outline-none` in the input slot below) so the surrounding trigger
      // surface owns the visible ring via `focus-within:`. The color/width
      // variants below paint this ring per the `color`/`errorState` axis.
      trigger:
        'flex w-full items-center gap-1.5 rounded-md border border-border bg-surface text-fg transition-colors duration-normal motion-reduce:transition-none hover:border-border-strong focus-within:outline-2 focus-within:outline-offset-2',
      input:
        'flex-1 min-w-0 bg-transparent outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed',
      clearButton:
        'inline-flex items-center justify-center shrink-0 size-5 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      chevron:
        'shrink-0 text-fg-muted transition-transform duration-normal motion-reduce:transition-none',
      spinner: 'shrink-0 text-fg-muted animate-spin',
    },
    variants: {
      size: {
        // xs density: chevron and spinner use `size-3.5` (14px) — the codified
        // half-step between size-3 and size-4 that lines up with text-xs metric
        // inside a 28px trigger.
        xs: { trigger: 'px-2 py-1 text-xs', chevron: 'size-3.5', clearButton: 'size-4', spinner: 'size-3.5' },
        sm: { trigger: 'px-3 py-1.5 text-sm', chevron: 'size-4', spinner: 'size-4' },
        md: { trigger: 'px-4 py-2 text-sm', chevron: 'size-4', spinner: 'size-4' },
        lg: { trigger: 'px-5 py-2.5 text-base', chevron: 'size-5', spinner: 'size-5' },
        xl: { trigger: 'px-6 py-3 text-base', chevron: 'size-5', spinner: 'size-5' },
      },
      color: {
        primary: { trigger: 'focus-within:outline-primary-500' },
        secondary: { trigger: 'focus-within:outline-secondary-500' },
        accent: { trigger: 'focus-within:outline-accent-500' },
        neutral: { trigger: 'focus-within:outline-border-strong' },
        info: { trigger: 'focus-within:outline-info-500' },
        success: { trigger: 'focus-within:outline-success-500' },
        warning: { trigger: 'focus-within:outline-warning-500' },
        error: { trigger: 'focus-within:outline-error-500' },
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' },
        false: {},
      },
      open: {
        true: { chevron: 'rotate-180' },
        false: {},
      },
      naked: {
        true: {
          trigger:
            'border-0 bg-transparent rounded-none px-0 py-0 hover:border-0 focus-within:outline-0 focus-within:outline-offset-0',
        },
        false: {},
      },
      errorState: {
        true: { trigger: 'focus-within:outline-error-500' },
        false: {},
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
      disabled: false,
      open: false,
      naked: false,
      errorState: false,
    },
  },
  { twMerge: true },
);

// ── Slot directives ──

/** Structural directive projecting a custom template for each option row. Context: `TwComboboxOptionContext<T>`. */
@Directive({ selector: '[twComboboxOption]' })
export class ComboboxOptionTemplateDirective<T = unknown, O = unknown> {
  /** @internal */
  readonly templateRef = inject(TemplateRef<TwComboboxOptionContext<T, O>>);

  /** @internal */
  static ngTemplateContextGuard<T, O>(
    _dir: ComboboxOptionTemplateDirective<T, O>,
    _ctx: unknown,
  ): _ctx is TwComboboxOptionContext<T, O> {
    return true;
  }
}

/** Structural directive projecting a custom template for the empty-results state. Context: `{ $implicit: query }`. */
@Directive({ selector: '[twComboboxEmpty]' })
export class ComboboxEmptyTemplateDirective {
  /** @internal */
  readonly templateRef = inject(TemplateRef<{ $implicit: string }>);

  /** @internal */
  static ngTemplateContextGuard(
    _dir: ComboboxEmptyTemplateDirective,
    _ctx: unknown,
  ): _ctx is { $implicit: string } {
    return true;
  }
}

/** Structural directive projecting a custom template above the list while `loading=true`. */
@Directive({ selector: '[twComboboxLoading]' })
export class ComboboxLoadingTemplateDirective {
  /** @internal */
  readonly templateRef = inject(TemplateRef<unknown>);
}

/** Attribute directive marking a leading adornment projected inside the input row. */
@Directive({
  selector: '[twComboboxPrefix]',
  host: { class: 'flex items-center shrink-0 text-fg-muted' },
})
export class ComboboxPrefixDirective {}

/** Attribute directive marking a trailing adornment projected inside the input row, before the clear button. */
@Directive({
  selector: '[twComboboxSuffix]',
  host: { class: 'flex items-center shrink-0 text-fg-muted' },
})
export class ComboboxSuffixDirective {}

// ── Component ──

/**
 * Editable single-select typeahead form control. Follows the WAI-ARIA 1.2
 * combobox + listbox pattern with `aria-activedescendant` (DOM focus stays
 * on the `<input>`). Supports local filtering, async result streams via
 * `queryChange`, grouped options, strict and free-text modes, and full
 * integration with template-driven, reactive, and signal forms plus
 * `tw-form-field`.
 */
@Component({
  selector: 'tw-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TW_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => ComboboxComponent),
    },
  ],
  template: `
    <div #triggerSurface [class]="triggerClasses()">
      <ng-content select="[twComboboxPrefix]" />

      <input
        #inputEl
        type="text"
        [id]="hostId"
        [class]="inputClasses()"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open() ? 'true' : 'false'"
        [attr.aria-controls]="open() ? listboxId : null"
        [attr.aria-activedescendant]="open() ? (activeOptionId() || null) : null"
        [attr.aria-required]="requiredInput() ? 'true' : null"
        [attr.aria-invalid]="errorState() ? 'true' : null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="resolvedLabelledBy() || null"
        [attr.aria-describedby]="resolvedDescribedBy() || null"
        [attr.aria-disabled]="isDisabled() ? 'true' : null"
        [disabled]="isDisabled()"
        [placeholder]="placeholder() ?? null"
        [value]="inputValue()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (compositionstart)="onCompositionStart()"
        (compositionend)="onCompositionEnd($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
      />

      <ng-content select="[twComboboxSuffix]" />

      @if (showSpinner()) {
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          [class]="spinnerClasses()"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity="0.25" />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
          />
        </svg>
      }

      @if (showClearButton()) {
        <button
          type="button"
          tabindex="-1"
          [class]="clearButtonClasses()"
          aria-label="Clear"
          (mousedown)="onClearMousedown($event)"
          (click)="onClearClick($event)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-3">
            <path
              fill-rule="evenodd"
              d="M10 8.586 4.707 3.293a1 1 0 0 0-1.414 1.414L8.586 10l-5.293 5.293a1 1 0 1 0 1.414 1.414L10 11.414l5.293 5.293a1 1 0 0 0 1.414-1.414L11.414 10l5.293-5.293a1 1 0 0 0-1.414-1.414L10 8.586Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      }

      @if (showChevron()) {
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          [class]="chevronClasses()"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            clip-rule="evenodd"
          />
        </svg>
      }
    </div>

    <span hidden>
      <ng-content />
    </span>
  `,
  host: {
    '[class]': 'rootClasses()',
  },
})
export class ComboboxComponent<T = unknown>
  implements ControlValueAccessor, FormFieldControl<T | string | null>, OnInit
{
  // ── Inputs ──

  /** Array of options to render in the popover. Accepts plain records or `TwComboboxOption<T>`. */
  readonly options = input<readonly unknown[]>([]);

  /** Accessor returning the visible label for an option. Used by the default filter and the trigger label resolver. */
  readonly optionLabel = input<(option: unknown) => string>(defaultOptionLabel);

  /** Accessor returning the value emitted via `valueCommit` when this option is picked. */
  readonly optionValue = input<(option: unknown) => T>(defaultOptionValue as (option: unknown) => T);

  /** Accessor returning whether an option is non-interactive. */
  readonly optionDisabled = input<(option: unknown) => boolean>(defaultOptionDisabled);

  /** Accessor returning a group label. Options sharing a group render under a labelled `role="group"` region. */
  readonly optionGroup = input<(option: unknown) => string | undefined>(defaultOptionGroup);

  /** Accessor returning an optional secondary description rendered under the label in the default option row. */
  readonly optionDescription = input<(option: unknown) => string | undefined>(defaultOptionDescription);

  /** Filter function applied client-side whenever `inputValue` changes. Pass `null` to disable client filtering (async mode). Defaults to case-insensitive `startsWith` on the label. */
  readonly filterFn = input<((option: unknown, query: string) => boolean) | null>(defaultStartsWithFilter);

  /** When `true`, free-text commits are rejected — the input reverts to the last committed label on blur. */
  readonly strict = input<boolean>(false);

  /** Placeholder shown when the input is empty. */
  readonly placeholder = input<string | undefined>(undefined);

  /** Disables the input and prevents the popover from opening. */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /** Sets `aria-required="true"` on the input. */
  readonly requiredInput = input<boolean>(false, { alias: 'required' });

  /** Controls trigger padding and font size per the inline padding scale. */
  readonly size = input<TwSize>('md');

  /** Semantic color for the focus ring. */
  readonly color = input<TwColor>('primary');

  /** Whether the trailing chevron affordance is rendered. */
  // TRUE-default: the chevron signals the dropdown affordance; without it the
  // combobox reads as a plain input. Opt-out is for inline search inputs.
  readonly showChevron = input<boolean>(true);

  /** Whether the inline clear (×) button appears while `inputValue` is non-empty. */
  // TRUE-default: the clear affordance is the expected combobox UX once a value
  // is set; opt-out is for required-only flows.
  readonly clearable = input<boolean>(true);

  /** When `true`, shows an in-popover spinner and an inline spinner in the trigger while the popover is open. */
  readonly loading = input<boolean>(false);

  /** Debounce window (ms) before `queryChange` emits. Local filtering is not debounced. */
  readonly queryDebounce = input<number>(150);

  /** Minimum query length before the popover opens automatically. `0` opens on focus. */
  readonly minQueryLength = input<number>(0);

  /** Whether the popover opens automatically when the input receives focus. */
  // TRUE-default: clicking into a combobox opens the dropdown — standard select-
  // like UX. Opt-out is for command-palette-style flows triggered only by typing.
  readonly openOnFocus = input<boolean>(true);

  /** Maximum height (px) of the popover scroll region. */
  readonly panelMaxHeight = input<number>(256);

  /** Overlay width strategy. `'trigger'` matches input width; `'auto'` lets content decide; a number is applied as px; a string is passed as a CSS length. */
  readonly panelWidth = input<'trigger' | 'auto' | number | string>('trigger');

  /** Extra class(es) appended to the overlay panel for consumer customization. */
  readonly panelClass = input<string | readonly string[]>('');

  /** CDK overlay scroll strategy. */
  readonly scrollStrategy = input<'reposition' | 'close' | 'block'>('reposition');

  /** Pixel offset between the input and the popover. */
  readonly offset = input<number>(4);

  /** Fallback empty-state message when no `*twComboboxEmpty` template is projected. */
  readonly emptyMessage = input<string>('No results');

  /** Equality comparator used to reconcile `value` with options during `writeValue`. */
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);

  /** Accessible name for the combobox input. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external label element. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external descriptor element. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Per-instance override of the {@link ErrorStateMatcher}. When omitted, the combobox uses the `TW_ERROR_STATE_MATCHER` token's value. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  // ── Models ──

  /** Two-way bound committed value. May be an option's value (`T`), a typed string (free-text mode), or `null`. */
  readonly value = model<T | string | null>(null);

  /** Two-way bound visible text in the input. Bound separately from `value` so async consumers can drive the query. */
  readonly inputValue = model<string>('');

  /** Two-way bound open state of the popover. */
  readonly open = model<boolean>(false);

  // ── Outputs ──

  /** Fires after the query text changes, debounced by `queryDebounce`. Async-mode consumers subscribe to this to fetch results. */
  readonly queryChange = output<string>();

  /** Fires when the user picks an option from the list (not on free-text commit). */
  readonly optionSelected = output<TwComboboxOptionSelectedEvent<T>>();

  /** Fires whenever `value` changes, with a `source` discriminator distinguishing option / free-text / reset / programmatic origin. */
  readonly valueCommit = output<TwComboboxValueCommitEvent<T>>();

  /** Fires when the popover opens or closes. */
  readonly openedChange = output<TwComboboxOpenedEvent>();

  // ── Content queries ──

  /** @internal */
  readonly optionTemplateChild = contentChild(ComboboxOptionTemplateDirective);
  /** @internal */
  readonly emptyTemplateChild = contentChild(ComboboxEmptyTemplateDirective);
  /** @internal */
  readonly loadingTemplateChild = contentChild(ComboboxLoadingTemplateDirective);

  // ── View queries ──

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private readonly triggerSurfaceRef = viewChild<ElementRef<HTMLDivElement>>('triggerSurface');

  // ── Injected deps ──

  private readonly overlayService = inject(Overlay);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly platform = inject(Platform);
  private readonly formField = inject(FormFieldComponent, { optional: true });
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly parentForm = inject(NgForm, { optional: true });
  private readonly parentFormGroup = inject(FormGroupDirective, { optional: true });
  private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);

  // ── Identity ──

  private readonly uid = nextComboboxId++;
  /** @internal */
  readonly hostId = `tw-combobox-${this.uid}`;
  /** @internal */
  readonly listboxId = `${this.hostId}-listbox`;
  /** @internal */
  readonly optionId = (index: number): string => `${this.hostId}-option-${index}`;
  /** @internal */
  readonly groupHeaderId = (group: string): string =>
    `${this.hostId}-group-${group.replace(/\s+/g, '-').toLowerCase()}`;

  // ── Internal state signals ──

  /** @internal */
  readonly composing = signal(false);
  /** @internal */
  readonly focusedSignal = signal(false);
  private readonly cvaDisabled = signal(false);
  private readonly _ngControlRev = signal(0);
  private readonly _formSubmitRev = signal(0);
  private readonly describedByIdsSignal = signal<readonly string[]>([]);
  private readonly labelledByIdsSignal = signal<readonly string[]>([]);
  /** @internal */
  readonly lastCommittedLabel = signal<string>('');
  private readonly pendingWriteValue = signal<T | string | null | typeof UNRESOLVED>(UNRESOLVED);
  private readonly closingSignal = signal(false);
  /** Re-runs the input handler once after IME composition ends. */
  private composingPendingValue: string | null = null;

  private onChange: (value: T | string | null) => void = () => {};
  private onTouched: () => void = () => {};

  private overlayRef: OverlayRef | null = null;
  private readonly overlayInstanceSignal = signal<ComboboxOverlayComponent<T> | null>(null);
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private queryDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private announceTimer: ReturnType<typeof setTimeout> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private get overlayInstance(): ComboboxOverlayComponent<T> | null {
    return this.overlayInstanceSignal();
  }

  // ── Derived state ──

  /** @internal */
  readonly isDisabled = computed(() => this.disabledInput() || this.cvaDisabled());

  /** @internal Auto-naked when wrapped in tw-form-field. */
  readonly naked = computed(() => !!this.formField);

  /** @internal Resolved visible options (after filter, with derived view fields). */
  readonly visibleOptions = computed<readonly ComboboxVisibleOption<T>[]>(() => {
    const opts = this.options();
    const labelFn = this.optionLabel();
    const valueFn = this.optionValue();
    const disabledFn = this.optionDisabled();
    const groupFn = this.optionGroup();
    const descFn = this.optionDescription();
    const filter = this.filterFn();
    const query = this.inputValue();
    const filtered = filter === null ? opts : opts.filter((o) => filter(o, query));
    return filtered.map((option) => ({
      option,
      label: labelFn(option),
      value: valueFn(option),
      disabled: disabledFn(option),
      group: groupFn(option),
      description: descFn(option),
    }));
  });

  /** @internal Rendered rows (group headers + option rows). */
  readonly renderedRows = computed<readonly ComboboxRenderedRow<T>[]>(() => {
    const visible = this.visibleOptions();
    const rows: ComboboxRenderedRow<T>[] = [];
    let currentGroup: string | undefined;
    visible.forEach((v, index) => {
      if (v.group !== currentGroup) {
        if (v.group !== undefined) {
          rows.push({ kind: 'group', group: v.group });
        }
        currentGroup = v.group;
      }
      rows.push({ kind: 'option', option: v, index });
    });
    return rows;
  });

  /** Returns the index of the first enabled option, or -1 when none. */
  private firstEnabledIndex(visible: readonly ComboboxVisibleOption<T>[] = this.visibleOptions()): number {
    for (let i = 0; i < visible.length; i++) {
      if (!visible[i].disabled) return i;
    }
    return -1;
  }

  /** Returns the index of the last enabled option, or -1 when none. */
  private lastEnabledIndex(visible: readonly ComboboxVisibleOption<T>[] = this.visibleOptions()): number {
    for (let i = visible.length - 1; i >= 0; i--) {
      if (!visible[i].disabled) return i;
    }
    return -1;
  }

  /** @internal Active descendant index, resets to the first enabled when the visible list changes. */
  readonly activeIndex = linkedSignal<readonly ComboboxVisibleOption<T>[], number>({
    source: () => this.visibleOptions(),
    computation: (visible) => {
      for (let i = 0; i < visible.length; i++) {
        if (!visible[i].disabled) return i;
      }
      return -1;
    },
  });

  /** @internal */
  readonly activeOption = computed(() => {
    const idx = this.activeIndex();
    const visible = this.visibleOptions();
    if (idx < 0 || idx >= visible.length) return null;
    return visible[idx];
  });

  /** @internal */
  readonly activeOptionId = computed(() => {
    const idx = this.activeIndex();
    if (idx < 0 || idx >= this.visibleOptions().length) return null;
    return this.optionId(idx);
  });

  /** @internal */
  readonly isEmpty = computed(() => this.inputValue().length === 0 && this.value() == null);

  /** @internal */
  readonly showClearButton = computed(
    () => this.clearable() && !this.isDisabled() && this.inputValue().length > 0,
  );

  /** @internal */
  readonly showSpinner = computed(() => this.loading());

  /** @internal */
  readonly resolvedDescribedBy = computed(() => {
    const extra = this.describedByIdsSignal();
    const user = this.ariaDescribedby();
    const merged = [...extra];
    if (user) merged.push(...user.split(/\s+/).filter(Boolean));
    return merged.length ? merged.join(' ') : '';
  });

  /** @internal */
  readonly resolvedLabelledBy = computed(() => {
    const extra = this.labelledByIdsSignal();
    const user = this.ariaLabelledby();
    const merged = [...extra];
    if (user) merged.push(...user.split(/\s+/).filter(Boolean));
    return merged.length ? merged.join(' ') : '';
  });

  /** @internal Error-state per the configured `ErrorStateMatcher`. Reads the bound `NgControl.invalid` through the matcher. */
  readonly errorState: Signal<boolean> = computed(() => {
    this._ngControlRev();
    this._formSubmitRev();
    const matcher = this.errorStateMatcher() ?? this.defaultMatcher;
    const form: TwFormSubmitted | null =
      (this.parentFormGroup as TwFormSubmitted | null) ??
      (this.parentForm as TwFormSubmitted | null);
    return matcher.isErrorState(this.ngControl?.control ?? null, form);
  });

  // ── tv() output ──

  private readonly variantResult = computed(() =>
    comboboxVariants({
      size: this.size(),
      color: this.color(),
      disabled: this.isDisabled(),
      open: this.open(),
      naked: this.naked(),
      errorState: this.errorState(),
    }),
  );

  /** @internal */
  readonly rootClasses = computed(() => this.variantResult().root());
  /** @internal */
  readonly triggerClasses = computed(() => this.variantResult().trigger());
  /** @internal */
  readonly inputClasses = computed(() => this.variantResult().input());
  /** @internal */
  readonly clearButtonClasses = computed(() => this.variantResult().clearButton());
  /** @internal */
  readonly chevronClasses = computed(() => this.variantResult().chevron());
  /** @internal */
  readonly spinnerClasses = computed(() => this.variantResult().spinner());

  // ── FormFieldControl impl ──

  /** @internal */
  readonly id: Signal<string> = computed(() => this.hostId);
  /** @internal */
  readonly focused: Signal<boolean> = this.focusedSignal.asReadonly();
  /** @internal */
  readonly empty: Signal<boolean> = this.isEmpty;
  /** @internal */
  readonly disabled: Signal<boolean> = this.isDisabled;
  /** @internal */
  readonly required: Signal<boolean> = computed(() => this.requiredInput());
  /** @internal */
  readonly controlType = 'combobox';
  /** @internal */
  readonly userAriaDescribedBy: Signal<string | undefined> = computed(() => this.ariaDescribedby());
  /** @internal */
  readonly userAriaLabelledby: Signal<string | undefined> = computed(() => this.ariaLabelledby());

  // ── Constructor ──

  constructor() {
    // Material-style CVA wiring: declare ourselves as the value accessor on any
    // host-level `NgControl` (FormControlDirective, NgModel, etc.). This avoids
    // the circular-DI that a static `NG_VALUE_ACCESSOR` provider would create
    // because `NgControl` is injected with `self: true` on the same element.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    // Mirror parent `open` model into overlay lifecycle.
    effect(() => {
      const shouldOpen = this.open();
      const disabled = this.isDisabled();
      if (disabled && this.overlayInstance) {
        this.closeOverlay({ silent: false });
        return;
      }
      if (shouldOpen && !this.overlayInstance && !disabled && !this.closingSignal()) {
        this.openOverlay();
      } else if (!shouldOpen && this.overlayInstance && !this.closingSignal()) {
        this.closeOverlay({ silent: false });
      }
    });

    // Push state into overlay component whenever anything relevant changes.
    // While the panel is animating out, freeze content updates so list mutations
    // (e.g. the input filtering down after commitOption) don't visually flicker
    // the panel during the leave animation.
    effect(() => {
      const instance = this.overlayInstance;
      if (!instance) return;
      if (this.closingSignal()) return;
      const renderedRows = this.renderedRows();
      const activeIndex = this.activeIndex();
      const panelMaxHeight = this.panelMaxHeight();
      const emptyMessage = this.emptyMessage();
      const query = this.inputValue();
      const loading = this.loading();
      const labelledBy = this.resolvedLabelledBy();
      const optionTemplate = this.optionTemplateChild()?.templateRef;
      const emptyTemplate = this.emptyTemplateChild()?.templateRef;
      const loadingTemplate = this.loadingTemplateChild()?.templateRef;
      const customPanelClass = this.resolvePanelClass();
      untracked(() => {
        instance.renderedRows.set(renderedRows);
        instance.activeIndex.set(activeIndex);
        instance.panelMaxHeight.set(panelMaxHeight);
        instance.emptyMessage.set(emptyMessage);
        instance.query.set(query);
        instance.loading.set(loading);
        instance.labelledBy.set(labelledBy);
        instance.optionTemplate.set(optionTemplate as TemplateRef<TwComboboxOptionContext<T>> | undefined);
        instance.emptyTemplate.set(emptyTemplate);
        instance.loadingTemplate.set(loadingTemplate);
        instance.customPanelClass.set(customPanelClass);
        instance.listboxId.set(this.listboxId);
        instance.optionIdFn.set(this.optionId);
        instance.groupHeaderIdFn.set(this.groupHeaderId);
        instance.isSelected.set((index: number) => this.isVisibleOptionSelected(index));
      });
    });

    // Late-arriving options reconciler for the async writeValue race.
    effect(() => {
      const opts = this.options();
      const pending = untracked(this.pendingWriteValue);
      if (pending === UNRESOLVED) return;
      if (opts.length === 0) return;
      const cmp = this.compareWith();
      const valueFn = this.optionValue();
      const labelFn = this.optionLabel();
      const match = opts.find((o) => {
        try {
          return cmp(valueFn(o), pending as T);
        } catch {
          return false;
        }
      });
      untracked(() => {
        if (match) {
          this.inputValue.set(labelFn(match));
          this.lastCommittedLabel.set(labelFn(match));
        }
        // Always clear the sentinel — subsequent options changes won't re-resolve.
        this.pendingWriteValue.set(UNRESOLVED);
      });
    });

    // Debounced LiveAnnouncer result-count announcements.
    effect(() => {
      const visible = this.visibleOptions();
      const query = this.inputValue();
      const isOpen = this.open();
      untracked(() => {
        if (!isOpen) return;
        this.clearAnnounceTimer();
        this.announceTimer = setTimeout(() => {
          const count = visible.length;
          const message =
            count === 0
              ? `No results for ${query}`
              : count === 1
                ? '1 result'
                : `${count} results`;
          this.liveAnnouncer.announce(message, 'polite');
        }, ANNOUNCE_DEBOUNCE);
      });
    });

    // FocusMonitor for blur → onTouched + focused state.
    const monitorSub = this.focusMonitor
      .monitor(this.elementRef, true)
      .subscribe((origin) => {
        const wasFocused = this.focusedSignal();
        this.focusedSignal.set(!!origin);
        if (!origin && wasFocused) {
          this.onTouched();
          // Blur often flips `touched` on the bound `NgControl`; bump the
          // revision so `errorState` recomputes.
          this._ngControlRev.update((n) => n + 1);
        }
      });

    this.destroyRef.onDestroy(() => {
      monitorSub.unsubscribe();
      this.focusMonitor.stopMonitoring(this.elementRef);
      this.clearCloseTimer();
      this.clearQueryDebounceTimer();
      this.clearAnnounceTimer();
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      this.overlayRef?.dispose();
      this.overlayRef = null;
      this.overlayInstanceSignal.set(null);
    });
  }

  // ── Public methods ──

  /** Opens the popover. No-op when disabled or already open. */
  openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.open.set(true);
  }

  /** Closes the popover. No-op when already closed. */
  closePanel(): void {
    if (!this.open()) return;
    this.open.set(false);
  }

  /** Programmatically focuses the input. */
  focus(): void {
    this.inputRef()?.nativeElement.focus();
  }

  // ── Visible-option helpers ──

  /** @internal */
  isVisibleOptionSelected(index: number): boolean {
    const visible = this.visibleOptions();
    if (index < 0 || index >= visible.length) return false;
    const current = this.value();
    if (current === null || current === undefined) return false;
    const cmp = this.compareWith();
    try {
      return cmp(visible[index].value, current as T);
    } catch {
      return false;
    }
  }

  // ── Input event handlers ──

  /** @internal */
  onInput(event: Event): void {
    if (this.composing()) {
      // Defer; we'll re-run with the final value on compositionend.
      this.composingPendingValue = (event.target as HTMLInputElement).value;
      return;
    }
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.inputValue.set(value);
    this.scheduleQueryEmit(value);
    // Open if not blocked by minQueryLength and not disabled.
    if (!this.isDisabled() && value.length >= this.minQueryLength()) {
      if (!this.open()) {
        this.open.set(true);
      }
    } else if (value.length < this.minQueryLength() && this.open()) {
      this.open.set(false);
    }
  }

  /** @internal */
  onCompositionStart(): void {
    this.composing.set(true);
  }

  /** @internal */
  onCompositionEnd(event: CompositionEvent): void {
    this.composing.set(false);
    const target = event.target as HTMLInputElement;
    const value = target.value || this.composingPendingValue || '';
    this.composingPendingValue = null;
    // Re-run the input handler logic once with the resolved value.
    this.inputValue.set(value);
    this.scheduleQueryEmit(value);
    if (!this.isDisabled() && value.length >= this.minQueryLength() && !this.open()) {
      this.open.set(true);
    }
  }

  /** @internal */
  onFocus(): void {
    if (this.isDisabled()) return;
    if (this.openOnFocus() && this.inputValue().length >= this.minQueryLength() && !this.open()) {
      this.open.set(true);
    }
  }

  /** @internal */
  onBlur(): void {
    if (this.composing()) return;
    // Don't commit while the user is interacting with the overlay (option mousedown
    // calls preventDefault to keep focus on the input, so blur here means real focus loss).
    if (this.isDisabled()) return;
    this.commit('blur');
  }

  /** @internal */
  onKeydown(event: KeyboardEvent): void {
    if (this.composing()) return;
    if (this.isDisabled()) return;
    const key = event.key;

    // Alt+Arrow combos
    if (event.altKey && key === 'ArrowDown') {
      event.preventDefault();
      this.openPanel();
      return;
    }
    if (event.altKey && key === 'ArrowUp') {
      event.preventDefault();
      this.closePanel();
      return;
    }

    switch (key) {
      case 'ArrowDown': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
          this.moveActiveTo(this.firstEnabledIndex(), 1);
        } else {
          this.moveActive(1);
        }
        return;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
          this.moveActiveTo(this.lastEnabledIndex(), -1);
        } else {
          this.moveActive(-1);
        }
        return;
      }
      case 'Home': {
        if (this.inputValue().length === 0 || event.altKey) {
          event.preventDefault();
          if (!this.open()) this.openPanel();
          this.moveActiveTo(0, 1);
        }
        return;
      }
      case 'End': {
        if (this.inputValue().length === 0 || event.altKey) {
          event.preventDefault();
          if (!this.open()) this.openPanel();
          this.moveActiveTo(this.visibleOptions().length - 1, -1);
        }
        return;
      }
      case 'Enter': {
        const active = this.activeOption();
        if (this.open() && active && !active.disabled) {
          event.preventDefault();
          event.stopPropagation();
          this.commitOption(active, 'option');
          return;
        }
        // Form-submit passthrough: do NOT call preventDefault.
        return;
      }
      case 'Escape': {
        if (this.open()) {
          event.preventDefault();
          event.stopPropagation();
          this.inputValue.set(this.lastCommittedLabel());
          this.closePanel();
        } else if (this.clearable() && this.inputValue().length > 0) {
          event.preventDefault();
          this.clear();
        }
        return;
      }
      case 'Tab': {
        // Commit (no preventDefault) so focus moves naturally.
        this.commit('tab');
        return;
      }
      case 'Backspace': {
        // Explicit no-op on empty input — do not close the popover.
        if (this.inputValue().length === 0) {
          event.preventDefault();
        }
        return;
      }
      default:
        return;
    }
  }

  // ── Clear button ──

  /** @internal — preventDefault to keep DOM focus on the input. */
  onClearMousedown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /** @internal */
  onClearClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clear();
    this.inputRef()?.nativeElement.focus();
  }

  /** Clears the input and committed value, emitting `valueCommit({ source: 'reset' })`. */
  clear(): void {
    if (this.isDisabled()) return;
    this.value.set(null);
    this.inputValue.set('');
    this.lastCommittedLabel.set('');
    this.valueCommit.emit({ value: null, source: 'reset' });
    this.onChange(null);
    this.closePanel();
  }

  // ── Active-index navigation ──

  private moveActive(delta: 1 | -1): void {
    const visible = this.visibleOptions();
    if (visible.length === 0) {
      this.activeIndex.set(-1);
      return;
    }
    const n = visible.length;
    let idx = this.activeIndex();
    if (idx < 0) idx = delta > 0 ? -1 : n;
    for (let i = 0; i < n; i++) {
      idx = (idx + delta + n) % n;
      if (!visible[idx].disabled) {
        this.activeIndex.set(idx);
        this.scrollActiveIntoView();
        return;
      }
    }
  }

  private moveActiveTo(startIndex: number, direction: 1 | -1): void {
    const visible = this.visibleOptions();
    if (visible.length === 0) {
      this.activeIndex.set(-1);
      return;
    }
    let i = Math.max(0, Math.min(startIndex, visible.length - 1));
    const max = visible.length;
    for (let n = 0; n < max; n++) {
      if (!visible[i].disabled) {
        this.activeIndex.set(i);
        this.scrollActiveIntoView();
        return;
      }
      i += direction;
      if (i < 0 || i >= visible.length) return;
    }
  }

  private scrollActiveIntoView(): void {
    if (!this.platform.isBrowser) return;
    queueMicrotask(() => {
      const id = this.activeOptionId();
      if (!id) return;
      const el = document.getElementById(id);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    });
  }

  // ── Commit resolver ──

  /** @internal */
  commit(source: 'enter' | 'blur' | 'tab'): void {
    if (this.isDisabled() || this.composing()) return;

    const rawText = this.inputValue();
    const text = rawText.trim();
    const active = this.activeOption();
    const labelFn = this.optionLabel();
    const disabledFn = this.optionDisabled();

    // 1. Active option wins.
    if (active && !active.disabled) {
      this.commitOption(active, 'option');
      return;
    }

    // 2. Exact label match auto-resolves.
    const exact = this.options().find(
      (o) => !disabledFn(o) && labelFn(o).trim() === text && text.length > 0,
    );
    if (exact) {
      const valueFn = this.optionValue();
      const groupFn = this.optionGroup();
      const descFn = this.optionDescription();
      this.commitOption(
        {
          option: exact,
          label: labelFn(exact),
          value: valueFn(exact),
          disabled: false,
          group: groupFn(exact),
          description: descFn(exact),
        },
        'option',
      );
      return;
    }

    // 3. Empty text → null.
    if (text === '') {
      const wasNonNull = this.value() !== null || this.inputValue() !== '';
      this.value.set(null);
      this.inputValue.set('');
      this.lastCommittedLabel.set('');
      if (wasNonNull) {
        this.valueCommit.emit({ value: null, source: 'reset' });
        this.onChange(null);
      }
      this.closePanel();
      return;
    }

    // 4. No match.
    if (this.strict()) {
      this.inputValue.set(this.lastCommittedLabel());
      if (source !== 'enter') {
        this.closePanel();
      } else if (this.visibleOptions().length === 0) {
        this.closePanel();
      }
      return;
    }

    // Free-text commit.
    this.value.set(text);
    this.inputValue.set(text);
    this.lastCommittedLabel.set(text);
    this.valueCommit.emit({ value: text, source: 'free-text' });
    this.onChange(text);
    this.closePanel();
  }

  /** @internal */
  commitOption(option: ComboboxVisibleOption<T>, source: 'option'): void {
    const value = option.value;
    const label = option.label;
    this.value.set(value);
    this.inputValue.set(label);
    this.lastCommittedLabel.set(label);
    this.optionSelected.emit({ option: option.option, value, label });
    this.valueCommit.emit({ value, source });
    this.onChange(value);
    this.liveAnnouncer.announce(`${label} selected`, 'polite');
    this.closePanel();
  }

  // ── Query debounce ──

  private scheduleQueryEmit(value: string): void {
    this.clearQueryDebounceTimer();
    const delay = this.queryDebounce();
    this.queryDebounceTimer = setTimeout(() => {
      this.queryDebounceTimer = null;
      this.queryChange.emit(value);
    }, delay);
  }

  private clearQueryDebounceTimer(): void {
    if (this.queryDebounceTimer !== null) {
      clearTimeout(this.queryDebounceTimer);
      this.queryDebounceTimer = null;
    }
  }

  private clearAnnounceTimer(): void {
    if (this.announceTimer !== null) {
      clearTimeout(this.announceTimer);
      this.announceTimer = null;
    }
  }

  // ── Overlay lifecycle ──

  private openOverlay(): void {
    this.ensureOverlay();
    this.attachOverlayComponent();
    this.subscribeBackdrop();
    this.subscribeOverlayEscape();
    // Reset active to first enabled when opening.
    this.activeIndex.set(this.firstEnabledIndex());
    this.liveAnnouncer.announce(
      `${this.visibleOptions().length} suggestions available`,
      'polite',
    );
    this.openedChange.emit({
      open: true,
      trigger: this.inputRef()?.nativeElement ?? this.elementRef.nativeElement,
    });
  }

  private closeOverlay(_opts: { silent: boolean }): void {
    if (this.closingSignal() || !this.overlayInstance) return;
    this.closingSignal.set(true);
    this.clearAnnounceTimer();

    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      if (this.overlayRef?.hasAttached()) {
        this.overlayRef.detach();
      }
      this.overlayInstanceSignal.set(null);
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      untracked(() => this.open.set(false));
      this.closingSignal.set(false);
      this.openedChange.emit({
        open: false,
        trigger: this.inputRef()?.nativeElement ?? this.elementRef.nativeElement,
      });
    }, ANIMATION_DURATION);
  }

  private ensureOverlay(): void {
    if (this.overlayRef) {
      this.updateOverlaySize();
      return;
    }
    const positionStrategy = this.overlayService
      .position()
      .flexibleConnectedTo(this.triggerSurfaceRef()?.nativeElement ?? this.elementRef.nativeElement)
      .withPositions(buildSelectLikePositions(this.offset()))
      .withFlexibleDimensions(false)
      .withPush(false)
      .withViewportMargin(8);

    this.overlayRef = this.overlayService.create({
      positionStrategy,
      scrollStrategy: resolveSelectScrollStrategy(this.scrollStrategy(), this.overlayService),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      panelClass: 'tw-combobox-panel',
    });
    this.installResizeObserver();
    this.updateOverlaySize();
  }

  private installResizeObserver(): void {
    if (!this.platform.isBrowser || typeof ResizeObserver === 'undefined') return;
    const target = this.elementRef.nativeElement;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.updateOverlaySize());
    this.resizeObserver.observe(target);
  }

  private updateOverlaySize(): void {
    if (!this.overlayRef) return;
    const width = this.panelWidth();
    if (width === 'trigger') {
      const anchor = this.triggerSurfaceRef()?.nativeElement ?? this.elementRef.nativeElement;
      const rect = anchor.getBoundingClientRect();
      this.overlayRef.updateSize({ width: rect.width });
    } else if (width === 'auto') {
      this.overlayRef.updateSize({ width: undefined, minWidth: undefined });
    } else if (typeof width === 'number') {
      this.overlayRef.updateSize({ width });
    } else {
      this.overlayRef.updateSize({ width });
    }
  }

  private attachOverlayComponent(): void {
    if (!this.overlayRef) return;
    const portal = new ComponentPortal<ComboboxOverlayComponent<T>>(
      ComboboxOverlayComponent as unknown as new () => ComboboxOverlayComponent<T>,
      this.viewContainerRef,
      this.injector,
    );
    const ref = this.overlayRef.attach(portal);
    const instance = ref.instance;
    instance.onOptionPick.set((index) => {
      const visible = this.visibleOptions();
      if (index < 0 || index >= visible.length) return;
      const opt = visible[index];
      if (opt.disabled) return;
      this.commitOption(opt, 'option');
    });
    instance.onOptionHover.set((index) => {
      const visible = this.visibleOptions();
      if (index < 0 || index >= visible.length) return;
      if (visible[index].disabled) return;
      this.activeIndex.set(index);
    });
    this.overlayInstanceSignal.set(instance);
  }

  private subscribeBackdrop(): void {
    if (!this.overlayRef) return;
    const sub = this.overlayRef.backdropClick().subscribe(() => {
      this.closePanel();
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  /**
   * Listens for `Escape` on the overlay's `keydownEvents()`. Mirrors
   * `SelectComponent` so focus inside the overlay panel (e.g., if the user
   * tabs into projected loading/empty templates) still dismisses cleanly.
   * The combobox's own `<input>` keydown handler already short-circuits
   * Escape when focus is on the input; this layer is the safety net for
   * panel-internal focus.
   */
  private subscribeOverlayEscape(): void {
    if (!this.overlayRef) return;
    const teardown = consumeOverlayEscape(this.overlayRef, (event) => {
      event.preventDefault();
      this.inputValue.set(this.lastCommittedLabel());
      this.closePanel();
    });
    this.destroyRef.onDestroy(() => teardown());
  }

  private resolvePanelClass(): string {
    const raw = this.panelClass();
    return Array.isArray(raw) ? raw.join(' ') : (raw as string);
  }

  private clearCloseTimer(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  // ── ControlValueAccessor ──

  writeValue(value: T | string | null): void {
    if (value === null || value === undefined) {
      this.value.set(null);
      this.inputValue.set('');
      this.lastCommittedLabel.set('');
      this.pendingWriteValue.set(UNRESOLVED);
      this.valueCommit.emit({ value: null, source: 'programmatic' });
      return;
    }
    // Store verbatim.
    this.value.set(value);
    const cmp = this.compareWith();
    const valueFn = this.optionValue();
    const labelFn = this.optionLabel();
    const match = this.options().find((o) => {
      try {
        return cmp(valueFn(o), value as T);
      } catch {
        return false;
      }
    });
    if (match) {
      const label = labelFn(match);
      this.inputValue.set(label);
      this.lastCommittedLabel.set(label);
      this.pendingWriteValue.set(UNRESOLVED);
    } else {
      const label = String(value);
      this.inputValue.set(label);
      this.lastCommittedLabel.set(label);
      this.pendingWriteValue.set(value);
    }
    this.valueCommit.emit({ value, source: 'programmatic' });
  }

  registerOnChange(fn: (value: T | string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
    if (isDisabled && this.open()) {
      this.closePanel();
    }
  }

  // ── FormFieldControl methods ──

  /** @internal */
  setDescribedByIds(ids: string[]): void {
    this.describedByIdsSignal.set([...ids]);
  }

  /** @internal */
  setLabelledByIds(ids: string[]): void {
    this.labelledByIdsSignal.set([...ids]);
  }

  /** @internal */
  onContainerClick(_event: MouseEvent): void {
    if (this.isDisabled()) return;
    this.inputRef()?.nativeElement.focus();
  }

  ngOnInit(): void {
    // NgControl's `control` is set by the parent FormControl* directive before
    // children's `ngOnInit`. Subscribe here so errorState reacts to status/value
    // changes on the bound control.
    const ctrl = this.ngControl?.control;
    if (ctrl) {
      const streams = [ctrl.statusChanges, ctrl.valueChanges].filter(
        (s): s is NonNullable<typeof s> => !!s,
      );
      if (streams.length) {
        merge(...streams)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this._ngControlRev.update((n) => n + 1));
      }
    }

    const submit = this.parentFormGroup?.ngSubmit ?? this.parentForm?.ngSubmit;
    if (submit) {
      submit
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this._formSubmitRev.update((n) => n + 1));
    }
  }
}
