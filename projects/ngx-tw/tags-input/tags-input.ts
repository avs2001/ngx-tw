import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  isDevMode,
  type OnInit,
  output,
  signal,
  type Signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import {
  type ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isObservable, merge } from 'rxjs';
import { tv } from 'tailwind-variants';
import {
  type ErrorStateMatcher,
  TW_ERROR_STATE_MATCHER,
  type TwColor,
  type TwFormSubmitted,
  type TwSize,
} from '@cdevhub/ngx-tw/core';
import {
  FormFieldComponent,
  FormFieldControl,
  TW_FORM_FIELD_CONTROL,
} from '@cdevhub/ngx-tw/form-field';
import { BadgeComponent } from '@cdevhub/ngx-tw/badge';
import type {
  TwTagAddedEvent,
  TwTagCompareFn,
  TwTagFactory,
  TwTagLabelFn,
  TwTagRemovedEvent,
} from './types';

// ── tv() config ──
// `focus-within:outline-{color}-500` and the chip color classes are emitted by
// combobox / badge already, so the Tailwind v4 JIT scanner picks them up.

const tagsInputVariants = tv(
  {
    slots: {
      // Host is the `role="group"` chip strip. `flex-wrap` lets chips wrap; the
      // container owns the focus-within ring (standalone) or strips its chrome
      // inside a `<tw-form-field>` (the field draws the border / focus border).
      root: 'flex flex-wrap items-center gap-1.5 w-full text-fg',
      chip: 'max-w-full min-w-0',
      chipLabel: 'truncate',
      // Real DOM focus → canonical outline ring (NOT the activedescendant
      // background-shift carve-out). `text-current` inherits the chip color.
      // Per-size sets the square-interactive target size + negative margins.
      removeButton:
        'inline-flex items-center justify-center shrink-0 ml-0.5 rounded-md text-current opacity-70 hover:opacity-100 transition-opacity duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:pointer-events-none',
      removeIcon: 'shrink-0',
      input:
        'flex-1 min-w-24 bg-transparent text-fg placeholder:text-fg-subtle outline-none disabled:cursor-not-allowed',
    },
    variants: {
      inFormField: {
        // Inside a form-field: keep only the chip-strip layout; the field owns
        // border, padding, background and the focused-border indicator.
        true: { root: '' },
        false: {
          root: 'rounded-md border border-border bg-surface transition-colors duration-normal motion-reduce:transition-none hover:border-border-strong focus-within:outline-2 focus-within:outline-offset-2',
        },
      },
      size: {
        // removeButton uses the square-interactive sub-scale (the button IS the
        // touch target): size-6 (24px) meets WCAG 2.5.8; negative margins absorb
        // the overflow so the chip height is unchanged. Mirrors badge's dismiss.
        // `size-3.5` half-step on the md remove glyph lines up the X with text-sm
        // at md density (codified half-step per CLAUDE.md icon sizing).
        xs: { root: 'text-xs', removeButton: 'size-6 -my-1 -mr-1', removeIcon: 'size-3' },
        sm: { root: 'text-sm', removeButton: 'size-6 -my-1 -mr-1', removeIcon: 'size-3' },
        md: { root: 'text-sm', removeButton: 'size-7 -my-1.5 -mr-1.5', removeIcon: 'size-3.5' },
        lg: { root: 'text-base', removeButton: 'size-8 -my-1.5 -mr-1.5', removeIcon: 'size-4' },
        xl: { root: 'text-base', removeButton: 'size-8 -my-1.5 -mr-1.5', removeIcon: 'size-4' },
      },
      color: {
        primary: { root: 'focus-within:outline-primary-500' },
        secondary: { root: 'focus-within:outline-secondary-500' },
        accent: { root: 'focus-within:outline-accent-500' },
        neutral: { root: 'focus-within:outline-border-strong' },
        info: { root: 'focus-within:outline-info-500' },
        success: { root: 'focus-within:outline-success-500' },
        warning: { root: 'focus-within:outline-warning-500' },
        error: { root: 'focus-within:outline-error-500' },
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' },
        false: {},
      },
      errorState: {
        true: {},
        false: {},
      },
    },
    compoundVariants: [
      // Standalone density × size — inline padding scale (mirrors combobox trigger).
      { inFormField: false, size: 'xs', class: { root: 'px-2 py-1' } },
      { inFormField: false, size: 'sm', class: { root: 'px-3 py-1.5' } },
      { inFormField: false, size: 'md', class: { root: 'px-4 py-2' } },
      { inFormField: false, size: 'lg', class: { root: 'px-5 py-2.5' } },
      { inFormField: false, size: 'xl', class: { root: 'px-6 py-3' } },
      // Standalone error state — colored border + focus ring.
      {
        inFormField: false,
        errorState: true,
        class: { root: 'border-error-500 focus-within:outline-error-500' },
      },
    ],
    defaultVariants: {
      inFormField: false,
      size: 'md',
      color: 'primary',
      disabled: false,
      errorState: false,
    },
  },
  { twMerge: true },
);

const DEFAULT_SEPARATORS: readonly string[] = ['Enter', ','];

let nextId = 0;

/**
 * Free-text multi-value input. The user types a token and commits it via Enter,
 * a separator key, paste, or blur; committed tokens render as dismissible chips
 * (composing `[twBadge]`) inline with the text input. The value is exposed as a
 * real `T[]` (default `string[]`) through `ControlValueAccessor`, so it works
 * with template-driven, reactive, and signal forms and integrates with
 * `<tw-form-field>` for label / hint / error chrome.
 *
 * The control is a single tab stop with a roving-tabindex chip strip
 * (Material `MatChipGrid` interaction model): Arrow keys traverse chips and the
 * input, Delete / a two-step Backspace remove chips, and `LiveAnnouncer` voices
 * add / remove. Autocomplete suggestions are out of scope (use `tw-combobox`).
 */
@Component({
  selector: 'tw-tags-input',
  exportAs: 'twTagsInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  providers: [
    {
      provide: TW_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => TagsInputComponent),
    },
  ],
  template: `
    @for (chip of chipViews(); track chip.index) {
      <span twBadge variant="soft" [color]="color()" [size]="size()" [class]="chipClasses()">
        <span [class]="chipLabelClasses()">{{ chip.label }}</span>
        <button
          #removeBtn
          type="button"
          [class]="removeButtonClasses()"
          [attr.tabindex]="activeChipIndex() === chip.index ? 0 : -1"
          [attr.aria-label]="chip.removeLabel"
          [disabled]="disabled()"
          (click)="onRemoveClick(chip.index)"
          (keydown)="onChipKeydown($event, chip.index)"
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
            [class]="removeIconClasses()"
          >
            <path
              d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
            />
          </svg>
        </button>
      </span>
    }
    <input
      #textInput
      type="text"
      [class]="inputClasses()"
      [attr.tabindex]="activeChipIndex() === null ? 0 : -1"
      [attr.placeholder]="placeholder() || null"
      [attr.aria-required]="required() || null"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="resolvedLabelledBy() || null"
      [attr.aria-describedby]="resolvedDescribedBy() || null"
      [attr.aria-invalid]="errorState() || null"
      [attr.name]="name() || null"
      [disabled]="disabled()"
      (input)="onInput($event)"
      (keydown)="onInputKeydown($event)"
      (paste)="onPaste($event)"
    />
  `,
  host: {
    'role': 'group',
    '[id]': 'id()',
    '[class]': 'rootClasses()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'resolvedLabelledBy() || null',
    '[attr.aria-describedby]': 'resolvedDescribedBy() || null',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-invalid]': 'errorState() || null',
    '[attr.data-focused]': 'focused() || null',
  },
})
export class TagsInputComponent<T = string>
  extends FormFieldControl<T[]>
  implements ControlValueAccessor, OnInit
{
  /** Semantic color for the container focus-within ring and the chip accent. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls overall density: container padding, chip size, and text scale. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** When true, blocks typing, committing, and chip removal, and applies muted styling. Reactive forms also propagate disabled via `setDisabledState`. Defaults to `false`. */
  readonly disabledInput = input(false, { alias: 'disabled' });

  /** Marks the control as required. Mirrored to the input's `aria-required`. Also inferred from `Validators.required` on a bound control. Defaults to `false`. */
  readonly requiredInput = input(false, { alias: 'required' });

  /** Placeholder shown in the text input only while there are no chips and the input is empty. */
  readonly placeholder = input<string | undefined>(undefined);

  /** Keys that commit the in-progress text as a tag. Each entry is a `KeyboardEvent.key` value (`'Enter'`) or a single separator character (`','`). Single-character separators also split pasted text. Defaults to `['Enter', ',']`. */
  readonly separatorKeys = input<readonly string[]>(DEFAULT_SEPARATORS);

  /** When true, blurring the control while the input holds non-empty text commits it as a tag. Defaults to `false`. */
  readonly addOnBlur = input(false);

  /** Maximum number of tags. Once reached, further commits are blocked and announced. Does not truncate an oversized `writeValue`. Defaults to `undefined` (no limit). */
  readonly max = input<number | undefined>(undefined);

  /** When false (default), a committed tag equal (per `compareWith`) to an existing tag is dropped silently. When true, duplicates are kept. Defaults to `false`. */
  readonly allowDuplicates = input(false);

  /** Maps committed text to a tag value. Default is identity — the trimmed string. Override to build object tags. */
  readonly createTag = input<TwTagFactory<T>>(
    ((text: string) => text) as unknown as TwTagFactory<T>,
  );

  /** Maps a tag value to its visible chip label and the remove-button accessible name. Defaults to `String(tag)`. */
  readonly tagLabel = input<TwTagLabelFn<T>>((tag: T) => String(tag));

  /** Equality comparator used for dedup when `allowDuplicates` is false. Defaults to `Object.is` (reference / value identity). String tags dedupe case-sensitively by default; pass `(a, b) => a.toLowerCase() === b.toLowerCase()` for case-insensitive dedup. */
  readonly compareWith = input<TwTagCompareFn<T>>((a: T, b: T) => Object.is(a, b));

  /** Applied to the text input for labeling and identification only; does not submit the tag array via native (non-Angular) form posting. */
  readonly name = input<string | undefined>(undefined);

  /** Id on the host element. Auto-generated as `tw-tags-input-N` when not provided. Used by the form-field's `<label for>` association. */
  readonly idInput = input<string | undefined>(undefined, { alias: 'id' });

  /** Accessible name applied to the control when no visible label is wired. Mirrored to `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the control. Mirrored to `aria-labelledby`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external element that describes the control. Form-field merges its hint / error ids alongside. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Per-instance override of the {@link ErrorStateMatcher}. When omitted, uses the `TW_ERROR_STATE_MATCHER` token's value. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  /** Fires when the tag array changes through user interaction (add, remove, clear). Emits a fresh array reference. Does not fire on `writeValue`. */
  readonly valueChange = output<T[]>();

  /** Fires when a tag is committed via Enter, a separator key, paste, or `addTag()`. Does not fire for dropped duplicates, blocked-by-max commits, empty commits, or `writeValue`. */
  readonly tagAdded = output<TwTagAddedEvent<T>>();

  /** Fires when a tag is removed via the remove button, Backspace / Delete, or `removeTag()`. Does not fire on `writeValue` or `clear()`. */
  readonly tagRemoved = output<TwTagRemovedEvent<T>>();

  private readonly focusMonitor = inject(FocusMonitor);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly parentForm = inject(NgForm, { optional: true });
  private readonly parentFormGroup = inject(FormGroupDirective, { optional: true });
  private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);
  private readonly formField = inject(FormFieldComponent, { optional: true });

  private readonly textInputRef = viewChild<ElementRef<HTMLInputElement>>('textInput');
  private readonly removeButtons = viewChildren<ElementRef<HTMLButtonElement>>('removeBtn');

  private onChange: (value: T[]) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly tags = signal<T[]>([]);
  /** The current in-progress (uncommitted) text in the input. Empty when nothing is typed. */
  readonly inputText = signal('');
  /** @internal Roving-tabindex position. `null` = the text input is the active element; a number = that chip's remove button. */
  protected readonly activeChipIndex = signal<number | null>(null);
  private readonly cvaDisabled = signal(false);
  private readonly _focused = signal(false);
  private readonly _ngControlRev = signal(0);
  private readonly _formSubmitRev = signal(0);
  private readonly describedByIdsSignal = signal<readonly string[]>([]);
  private readonly labelledByIdsSignal = signal<readonly string[]>([]);
  /** Nonce bumped only on explicit focus intent — keeps the focus effect from stealing focus on unrelated renders. */
  private readonly focusNonce = signal(0);
  private lastMaxAnnounce = 0;

  private readonly uid = nextId++;
  /** @internal Fallback id used when the consumer does not set `[id]`. */
  readonly hostId = `tw-tags-input-${this.uid}`;

  // ── FormFieldControl signals ──

  /** @internal */
  readonly id: Signal<string> = computed(() => this.idInput() ?? this.hostId);

  /** The current tag array (empty array when there are no tags). Read from a template ref (`#t="twTagsInput"`) for non-form usage. Doubles as the `FormFieldControl` contract member. */
  readonly value: Signal<T[]> = this.tags.asReadonly();

  /** @internal */
  readonly focused: Signal<boolean> = this._focused.asReadonly();

  /** @internal Empty when there are no chips AND the input text is blank — drives the form-field floating label. */
  readonly empty: Signal<boolean> = computed(
    () => this.tags().length === 0 && this.inputText().trim().length === 0,
  );

  /** @internal */
  readonly disabled: Signal<boolean> = computed(
    () => this.disabledInput() || this.cvaDisabled(),
  );

  /** @internal */
  readonly required: Signal<boolean> = computed(() => {
    this._ngControlRev();
    if (this.requiredInput()) return true;
    return !!this.ngControl?.control?.hasValidator(Validators.required);
  });

  /** @internal */
  readonly errorState: Signal<boolean> = computed(() => {
    this._ngControlRev();
    this._formSubmitRev();
    this._focused();
    const matcher = this.errorStateMatcher() ?? this.defaultMatcher;
    const form: TwFormSubmitted | null =
      (this.parentFormGroup as TwFormSubmitted | null) ??
      (this.parentForm as TwFormSubmitted | null);
    return matcher.isErrorState(this.ngControl?.control ?? null, form);
  });

  /** @internal Active validation errors map from the bound control, for `[twError match="…"]` filtering. */
  override readonly errors = computed<Record<string, unknown> | null>(() => {
    this._ngControlRev();
    return (this.ngControl?.control?.errors as Record<string, unknown> | null) ?? null;
  });

  /** @internal */
  readonly controlType = 'tags-input';

  /** @internal */
  readonly userAriaDescribedBy: Signal<string | undefined> = computed(() => this.ariaDescribedby());

  /** @internal */
  override readonly userAriaLabelledby: Signal<string | undefined> = computed(() =>
    this.ariaLabelledby(),
  );

  // ── Effective ARIA ──
  //
  // When wrapped by `<tw-form-field>`, the form-field pushes the FULLY MERGED
  // id list (hint/error/label + the consumer's `aria-*by` ids) via
  // `setDescribedByIds` / `setLabelledByIds`. In that case the pushed ids alone
  // are the source of truth — re-merging the consumer's `aria-*by` input on top
  // would duplicate ids. When standalone, fall back to the consumer-supplied
  // `aria-*by` input.

  /** @internal Merged `aria-describedby` (form-field hint/error ids + consumer-supplied). */
  readonly resolvedDescribedBy = computed(() => {
    const pushed = this.describedByIdsSignal();
    if (pushed.length) return pushed.join(' ');
    const user = this.ariaDescribedby();
    if (user) return user.split(/\s+/).filter(Boolean).join(' ');
    return '';
  });

  /** @internal Merged `aria-labelledby` (form-field label id + consumer-supplied). */
  readonly resolvedLabelledBy = computed(() => {
    const pushed = this.labelledByIdsSignal();
    if (pushed.length) return pushed.join(' ');
    const user = this.ariaLabelledby();
    if (user) return user.split(/\s+/).filter(Boolean).join(' ');
    return '';
  });

  // ── tv() class bindings ──

  private readonly variantResult = computed(() =>
    tagsInputVariants({
      inFormField: !!this.formField,
      size: this.size(),
      color: this.color(),
      disabled: this.disabled(),
      errorState: this.errorState(),
    }),
  );

  /** @internal */
  readonly rootClasses = computed(() => this.variantResult().root());
  /** @internal */
  readonly chipClasses = computed(() => this.variantResult().chip());
  /** @internal */
  readonly chipLabelClasses = computed(() => this.variantResult().chipLabel());
  /** @internal */
  readonly removeButtonClasses = computed(() => this.variantResult().removeButton());
  /** @internal */
  readonly removeIconClasses = computed(() => this.variantResult().removeIcon());
  /** @internal */
  readonly inputClasses = computed(() => this.variantResult().input());

  /** @internal Pre-resolved chip view models so the template never calls accessor functions inline. */
  readonly chipViews = computed(() => {
    const label = this.tagLabel();
    return this.tags().map((tag, index) => {
      const text = label(tag);
      return { tag, label: text, removeLabel: `Remove ${text}`, index };
    });
  });

  constructor() {
    super();
    // Runtime CVA wiring — register on any host-level NgControl. The component
    // injects `NgControl { self }` for TW_ERROR_STATE_MATCHER, so a static
    // NG_VALUE_ACCESSOR provider would create circular DI on the same instance.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    // Focus side-effect (leaves the signal graph; writes no signal → no cycle).
    // Triggered only by `focusNonce` bumps so it never steals focus on an
    // unrelated render (e.g. initial mount). Reads the active index and refs
    // untracked so it does not re-fire when the chip list changes on its own.
    effect(() => {
      if (this.focusNonce() === 0) return;
      untracked(() => {
        const idx = this.activeChipIndex();
        if (idx === null) {
          this.textInputRef()?.nativeElement.focus();
        } else {
          this.removeButtons()[idx]?.nativeElement.focus();
        }
      });
    });

    afterNextRender(() => {
      if (isDevMode() && !this.hasAccessibleNameHint()) {
        console.warn(
          '[tw-tags-input] The control has no accessible name. Provide `aria-label` / `aria-labelledby`, or wrap it in a <tw-form-field> with a <label twLabel>.',
        );
      }
    });
  }

  // ── Public instance API ──

  /** Commits `text` as a tag (trim → `createTag` → dedup unless `allowDuplicates` → `max` check). Returns true if a tag was added, false if dropped (empty / duplicate / max). Emits `tagAdded` + `valueChange` on success. No-op when disabled. */
  addTag(text: string): boolean {
    if (this.disabled()) return false;
    const trimmed = text.trim();
    if (!trimmed) return false;
    return this.tryAdd(this.createTag()(trimmed)) === 'added';
  }

  /** Removes a tag by value (first match via `compareWith`) or by index when a number is passed. Emits `tagRemoved` + `valueChange` and restores focus. No-op when disabled or when no match. Note: when the tag type is `number`, the argument is treated as an index. */
  removeTag(tag: T | number): void {
    if (this.disabled()) return;
    if (typeof tag === 'number') {
      this.removeAt(tag);
      return;
    }
    const cmp = this.compareWith();
    const idx = this.tags().findIndex((t) => cmp(t, tag));
    if (idx >= 0) this.removeAt(idx);
  }

  /** Removes all tags and clears the in-progress input text. Emits `valueChange` with `[]`. Does NOT emit `tagRemoved` per tag (bulk reset). No-op when already empty or disabled. */
  clear(): void {
    if (this.disabled()) return;
    if (this.tags().length === 0 && this.inputText().length === 0) return;
    this.tags.set([]);
    this.setInputText('');
    this.activeChipIndex.set(null);
    this.onChange([]);
    this.valueChange.emit([]);
    this.liveAnnouncer.announce('All tags removed', 'polite');
  }

  /** Moves focus to the text input. */
  focus(): void {
    this.activeChipIndex.set(null);
    this.requestFocus();
  }

  // ── Internal commit / remove pipeline ──

  private tryAdd(tag: T): 'added' | 'duplicate' | 'max' {
    const current = this.tags();
    if (!this.allowDuplicates()) {
      const cmp = this.compareWith();
      if (current.some((e) => cmp(e, tag))) return 'duplicate';
    }
    const max = this.max();
    if (max !== undefined && current.length >= max) {
      this.announceMax();
      return 'max';
    }
    const next = [...current, tag];
    this.tags.set(next);
    this.onChange(next);
    this.tagAdded.emit({ tag, value: next });
    this.valueChange.emit(next);
    this.liveAnnouncer.announce(`${this.tagLabel()(tag)} added`, 'polite');
    return 'added';
  }

  private commitInput(): void {
    if (this.disabled()) return;
    const trimmed = this.inputText().trim();
    if (!trimmed) {
      this.setInputText('');
      return;
    }
    const result = this.tryAdd(this.createTag()(trimmed));
    // Clear on success or duplicate (gesture consumed); retain on max so the
    // user can retry after removing a tag.
    if (result !== 'max') this.setInputText('');
  }

  private removeAt(index: number): void {
    if (this.disabled()) return;
    const current = this.tags();
    if (index < 0 || index >= current.length) return;
    const tag = current[index];
    const next = current.filter((_, i) => i !== index);
    this.tags.set(next);
    this.onChange(next);
    this.tagRemoved.emit({ tag, value: next, index });
    this.valueChange.emit(next);
    this.liveAnnouncer.announce(`${this.tagLabel()(tag)} removed`, 'polite');
    // Focus restoration: next chip at this index, else the previous chip, else the input.
    if (next.length === 0) {
      this.focusInput();
    } else if (index < next.length) {
      this.focusChip(index);
    } else {
      this.focusChip(next.length - 1);
    }
  }

  // ── DOM event handlers ──

  /** @internal */
  onInput(event: Event): void {
    this.inputText.set((event.target as HTMLInputElement).value);
  }

  /** @internal */
  onInputKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const separators = this.separatorKeys();
    const key = event.key;

    // Single-character separator → commit (and swallow the character).
    if (key.length === 1 && separators.includes(key)) {
      event.preventDefault();
      this.commitInput();
      return;
    }
    // Enter separator → commit only when there is text (otherwise let the form submit).
    if (key === 'Enter' && separators.includes('Enter')) {
      if (this.inputText().trim().length > 0) {
        event.preventDefault();
        this.commitInput();
      }
      return;
    }
    if (key === 'ArrowLeft') {
      const el = event.target as HTMLInputElement;
      const atStart = (el.selectionStart ?? 0) === 0 && (el.selectionEnd ?? 0) === 0;
      if (atStart && this.tags().length > 0) {
        event.preventDefault();
        this.focusChip(this.tags().length - 1);
      }
      return;
    }
    if (key === 'Backspace' && this.inputText().length === 0) {
      if (this.tags().length > 0) {
        event.preventDefault();
        this.focusChip(this.tags().length - 1);
      }
      return;
    }
    if (key === 'Escape' && this.inputText().length > 0) {
      event.preventDefault();
      this.setInputText('');
    }
  }

  /** @internal */
  onChipKeydown(event: KeyboardEvent, index: number): void {
    if (this.disabled()) return;
    const last = this.tags().length - 1;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (index > 0) this.focusChip(index - 1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        if (index < last) this.focusChip(index + 1);
        else this.focusInput();
        return;
      case 'Home':
        event.preventDefault();
        this.focusChip(0);
        return;
      case 'End':
        event.preventDefault();
        this.focusInput();
        return;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.removeAt(index);
        return;
      case 'Escape':
        event.preventDefault();
        this.focusInput();
        return;
      default:
        return;
    }
  }

  /** @internal */
  onRemoveClick(index: number): void {
    this.removeAt(index);
  }

  /** @internal */
  onPaste(event: ClipboardEvent): void {
    if (this.disabled()) return;
    const data = event.clipboardData?.getData('text') ?? '';
    const charSeparators = this.separatorKeys().filter((k) => k.length === 1);
    const hasSeparator = charSeparators.some((s) => data.includes(s));
    if (!hasSeparator) {
      // No separator: let the browser merge the text into the input natively.
      return;
    }
    event.preventDefault();
    const combined = this.inputText() + data;
    this.setInputText('');
    for (const piece of this.splitOnSeparators(combined, charSeparators)) {
      const trimmed = piece.trim();
      if (!trimmed) continue;
      if (this.tryAdd(this.createTag()(trimmed)) === 'max') break;
    }
  }

  // ── ControlValueAccessor ──

  writeValue(value: T[] | null | undefined): void {
    this.tags.set(Array.isArray(value) ? [...value] : []);
    this.setInputText('');
  }

  registerOnChange(fn: (value: T[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // ── FormFieldControl methods ──

  /** @internal */
  setDescribedByIds(ids: string[]): void {
    this.describedByIdsSignal.set([...ids]);
  }

  /** @internal */
  override setLabelledByIds(ids: string[]): void {
    this.labelledByIdsSignal.set([...ids]);
  }

  /** @internal Clicking the form-field surface (outside the control) focuses the text input. Clicks inside the control are left alone so chip removal keeps its own focus restoration. */
  onContainerClick(event: MouseEvent): void {
    if (this.disabled()) return;
    if (event.defaultPrevented) return;
    const host = this.elementRef.nativeElement;
    if (event.target === host || host.contains(event.target as Node)) return;
    this.focus();
  }

  // ── Lifecycle ──

  ngOnInit(): void {
    // checkChildren: true — internal focus moves (input ↔ chips) stay "focused";
    // origin === null fires only when focus leaves the whole control, the single
    // source for onTouched and the addOnBlur commit.
    const monitor$ = this.focusMonitor.monitor(this.elementRef, true);
    if (isObservable(monitor$)) {
      monitor$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((origin) => {
        const wasFocused = this._focused();
        this._focused.set(!!origin);
        if (wasFocused && !origin) {
          if (this.addOnBlur() && this.inputText().trim().length > 0) {
            this.commitInput();
          }
          this.onTouched();
          this._ngControlRev.update((n) => n + 1);
          // Reset roving so the next Tab into the control lands on the input.
          this.activeChipIndex.set(null);
        }
      });
    }
    this.destroyRef.onDestroy(() => this.focusMonitor.stopMonitoring(this.elementRef));

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

  // ── Helpers ──

  private focusChip(index: number): void {
    this.activeChipIndex.set(index);
    this.requestFocus();
  }

  private focusInput(): void {
    this.activeChipIndex.set(null);
    this.requestFocus();
  }

  private requestFocus(): void {
    this.focusNonce.update((n) => n + 1);
  }

  private setInputText(value: string): void {
    this.inputText.set(value);
    const el = this.textInputRef()?.nativeElement;
    if (el && el.value !== value) el.value = value;
  }

  private announceMax(): void {
    const now = Date.now();
    if (now - this.lastMaxAnnounce < 500) return;
    this.lastMaxAnnounce = now;
    this.liveAnnouncer.announce(`Maximum ${this.max()} tags reached`, 'assertive');
  }

  private splitOnSeparators(text: string, separators: readonly string[]): string[] {
    if (separators.length === 0) return [text];
    let normalized = text;
    for (const s of separators) normalized = normalized.split(s).join('\u0000');
    return normalized.split('\u0000');
  }

  private hasAccessibleNameHint(): boolean {
    return (
      !!this.ariaLabel() ||
      !!this.ariaLabelledby() ||
      this.labelledByIdsSignal().length > 0
    );
  }
}
