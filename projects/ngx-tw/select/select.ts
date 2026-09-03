import {
  afterNextRender,
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
  isDevMode,
  linkedSignal,
  model,
  type OnInit,
  output,
  signal,
  type Signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { type ControlValueAccessor, NgControl } from '@angular/forms';
import {
  type FlexibleConnectedPositionStrategy,
  Overlay,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Platform } from '@angular/cdk/platform';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { tv } from 'tailwind-variants';
import {
  buildSelectLikePositions,
  consumeOverlayEscape,
  type ErrorStateMatcher,
  resolveSelectScrollStrategy,
  type TwColor,
  type TwSize,
  wireErrorState,
} from '@cdevhub/ngx-tw/core';
import {
  type FormFieldControl,
  TW_FORM_FIELD,
  TW_FORM_FIELD_CONTROL,
} from '@cdevhub/ngx-tw/form-field';
import { SelectOverlayComponent } from './select-overlay';

// ── Public types ──────────────────────────────────────────────────

/** Canonical option shape. Consumers using arbitrary objects override the accessor inputs instead. */
export interface TwSelectOption<T> {
  /** Visible label. */
  label: string;
  /** Value emitted via `value` / `valueChange`. */
  value: T;
  /** When true, the option cannot be focused or selected. */
  disabled?: boolean;
  /** Optional group name. Options sharing a group render under a labelled `role="group"` region. */
  group?: string;
}

/** Visual style of the select trigger. */
export type SelectVariant = 'default' | 'naked';

/** Origin of a selection change, used to distinguish user input from programmatic writes. */
export type TwSelectSelectionSource = 'user' | 'reset' | 'programmatic';

/** Emitted by `selectionChange`. Generic over the option-value type. */
export interface TwSelectSelectionChangeEvent<T> {
  /** The current value. `null` when single-select has no selection; `T[]` in multi-select (possibly empty). */
  value: T | readonly T[] | null;
  /** The previous value, before this change. */
  previousValue: T | readonly T[] | null;
  /** Values newly added to the selection. Always empty when `source: 'reset'`. */
  added: readonly T[];
  /** Values removed from the selection. */
  removed: readonly T[];
  /** What triggered the change. */
  source: TwSelectSelectionSource;
}

/** Emitted by `openedChange`. */
export interface TwSelectOpenedEvent {
  /** Whether the panel is now open. */
  open: boolean;
  /** The combobox trigger element — handy when coordinating multiple open panels. */
  trigger: HTMLElement;
}

/** Emitted by `searchChange`. */
export interface TwSelectSearchEvent {
  /** The current search text passed to `filterPredicate`. */
  search: string;
  /** Number of options currently visible after filtering. */
  visibleCount: number;
}

/** Context provided to an `*twSelectOption` template. */
export interface TwSelectOptionContext<T, O = TwSelectOption<T>> {
  /** The raw option object (or arbitrary record when using accessors). */
  $implicit: O;
  /** Resolved label from `optionLabel`. */
  label: string;
  /** Resolved value from `optionValue`. */
  value: T;
  /** Whether this option is currently selected. */
  selected: boolean;
  /** Whether this option is the active-descendant for keyboard nav. */
  active: boolean;
  /** Whether this option is disabled. */
  disabled: boolean;
  /** Index within `visibleOptions()`. */
  index: number;
}

/** Context provided to a `*twSelectTrigger` template. */
export interface TwSelectTriggerContext<T, O = TwSelectOption<T>> {
  /** The current value. */
  $implicit: T | readonly T[] | null;
  /** Whether the panel is open. */
  open: boolean;
  /** Whether the current value is empty. */
  empty: boolean;
  /** The resolved option objects for the current value. */
  selectedOptions: readonly O[];
}

/** Rendered row in the panel — either a group-label header or an option. */
// `T` is a phantom type kept for API parity with the other Select generics
// (`SelectVisibleOption<T, O>`, `SelectComponent<T, O>`).
export type SelectRenderedRow<_T, O = unknown> =
  | { readonly kind: 'group-label'; readonly group: string }
  | { readonly kind: 'option'; readonly option: O; readonly index: number; readonly group?: string };

/** Internal: resolved option view paired with its position in `visibleOptions()`. */
export interface SelectVisibleOption<T, O = unknown> {
  readonly option: O;
  readonly label: string;
  readonly value: T;
  readonly disabled: boolean;
  readonly group?: string;
}

// Duration for leave animation — matches theme/_base.css scale-out/fade-out.
const ANIMATION_DURATION = 120;

// ── tv() config ───────────────────────────────────────────────────

const selectVariants = tv(
  {
    slots: {
      root: 'relative inline-block w-full',
      // `flex`, NOT `inline-flex`. An inline-level trigger inside the block
      // `root` generates a line box, so the host's height became
      // `max(strutAscent, triggerAscent) + triggerDescent` — taller than the
      // trigger itself whenever the consumer's inherited strut out-ascends it.
      // That is what made `xs` measure an odd 27px (26px trigger + a
      // font-metric-dependent fraction) while combobox, whose trigger is
      // block-level `flex`, measured a clean 26. A block-level trigger removes
      // the line box entirely, so the host height equals the pinned height.
      trigger:
        'w-full flex items-center gap-2 text-fg cursor-pointer transition-[color,border-color,background-color,box-shadow] duration-normal motion-reduce:transition-none',
      valueText: 'flex-1 min-w-0 text-left truncate',
      placeholderText: 'flex-1 min-w-0 text-left truncate text-fg-subtle',
      chevron: 'shrink-0 text-fg-muted transition-transform duration-normal motion-reduce:transition-none',
      // In-flow placeholder that holds the clear control's slot inside the
      // trigger's flex row. The control itself is an absolutely positioned
      // SIBLING of the trigger, because HTML's content model forbids
      // interactive content inside a `button`. Keeping a same-sized box in flow
      // means the value text truncates at exactly the same point, and the
      // `naked` variant's `h-auto` trigger keeps the same 24px floor, as when
      // the control was itself a flex item. Reserving the space with trailing
      // padding instead does NOT work: tailwind-merge does not treat `pe-*` as
      // conflicting with `px-*`, so both would survive the merge.
      clearSpacer: 'size-6 shrink-0',
      // `size-6` (24px) is the WCAG 2.2 SC 2.5.8 target-size floor and the `xs`
      // step of the square-interactive scale. It does NOT scale with `size`:
      // the clear sits over the trigger, whose smallest pinned height is 24px
      // (`xs` -> `h-6`), so any larger step would overflow the smallest
      // trigger. The floor is what the success criterion asks for.
      //
      // `end-*` (inset-inline-end), never `right-*`: the trigger's flex row
      // reverses under `dir="rtl"`, so a physical offset would park the control
      // on the wrong side. Per-size values live in the `size` variant below.
      clearButton:
        'absolute top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-normal motion-reduce:transition-none size-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      // Trigger height is PINNED (docs/vertical-rhythm.md §1-3): the box is
      // always one line, so it declares its border-box height and carries no
      // vertical padding. Horizontal padding and the font size are unchanged.
      //
      // The `clearButton` offsets place the absolutely positioned control back
      // over the in-flow `clearSpacer` it replaced. Each is the trigger's
      // 1px border + its horizontal padding + the chevron's width + `gap-2`,
      // rounded to the nearest spacing step (so each sits 1px inboard of the
      // spacer, which is not perceivable). The `naked` variant drops the border
      // and the padding and takes its own values in `compoundVariants` below.
      size: {
        // xs density: chevron uses `size-3.5` (14px) — half-step that lines up
        // with text-xs inside the compact trigger.
        xs: { trigger: 'px-2 text-xs h-6', chevron: 'size-3.5', clearButton: 'end-8' },
        sm: { trigger: 'px-3 text-sm h-8', chevron: 'size-4', clearButton: 'end-9' },
        md: { trigger: 'px-4 text-sm h-9', chevron: 'size-4', clearButton: 'end-10' },
        lg: { trigger: 'px-5 text-base h-11', chevron: 'size-5', clearButton: 'end-12' },
        xl: { trigger: 'px-6 text-base h-12', chevron: 'size-5', clearButton: 'end-13' },
      },
      variant: {
        default: {
          trigger:
            'border border-border bg-surface rounded-md hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        },
        // `naked` = wrapped in a `tw-form-field`, which owns the box: its
        // controlWrapper draws the border and the vertical padding. `h-auto`
        // releases the pinned height (declared after `size`, so twMerge keeps
        // it — same ordering `p-0` already relies on) so the trigger
        // contributes only its line box and the field's own rhythm governs.
        //
        // The focus ring is NOT declared here — it depends on whether a
        // form-field is actually present. See `fieldOwnsFocusRing` below.
        naked: {
          trigger: 'bg-transparent border-0 rounded-none p-0 h-auto',
        },
      },
      // Whether an ancestor `tw-form-field` draws the focus ring for us. Only
      // the `naked` variant reads it, via the compound variants below: inside
      // a field the control wrapper owns the ring, so the trigger suppresses
      // its own; used standalone there is no wrapper, so the trigger has to
      // draw the canonical ring itself or the composite has no focus
      // indicator at all (WCAG 2.2 SC 2.4.7).
      //
      // This cannot be expressed by adding `focus-visible:outline-none` to
      // `naked` and overriding it later: `outline-none` (outline-style) and
      // `outline-2` (outline-width) sit in different tailwind-merge conflict
      // groups, so both survive the merge and `outline-style: none` wins.
      fieldOwnsFocusRing: {
        true: {},
        false: {},
      },
      open: {
        true: { chevron: 'rotate-180' },
        false: { chevron: 'rotate-0' },
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' },
        false: { root: '' },
      },
      focused: { true: {}, false: {} },
      color: {
        primary: {},
        secondary: {},
        accent: {},
        neutral: {},
        info: {},
        success: {},
        warning: {},
        error: {},
      },
    },
    compoundVariants: [
      { variant: 'default', focused: true, color: 'primary', class: { trigger: 'border-primary-500' } },
      { variant: 'default', focused: true, color: 'secondary', class: { trigger: 'border-secondary-500' } },
      { variant: 'default', focused: true, color: 'accent', class: { trigger: 'border-accent-500' } },
      { variant: 'default', focused: true, color: 'neutral', class: { trigger: 'border-border-strong' } },
      { variant: 'default', focused: true, color: 'info', class: { trigger: 'border-info-500' } },
      { variant: 'default', focused: true, color: 'success', class: { trigger: 'border-success-500' } },
      { variant: 'default', focused: true, color: 'warning', class: { trigger: 'border-warning-500' } },
      { variant: 'default', focused: true, color: 'error', class: { trigger: 'border-error-500' } },
      // `naked` drops the border and the horizontal padding (`px-0`), so the
      // clear control's offset collapses to chevron width + `gap-2`.
      { variant: 'naked', size: 'xs', class: { clearButton: 'end-6' } },
      { variant: 'naked', size: 'sm', class: { clearButton: 'end-6' } },
      { variant: 'naked', size: 'md', class: { clearButton: 'end-6' } },
      { variant: 'naked', size: 'lg', class: { clearButton: 'end-7' } },
      { variant: 'naked', size: 'xl', class: { clearButton: 'end-7' } },
      {
        variant: 'naked',
        fieldOwnsFocusRing: true,
        class: { trigger: 'focus-visible:outline-none' },
      },
      {
        variant: 'naked',
        fieldOwnsFocusRing: false,
        class: {
          trigger:
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        },
      },
    ],
    defaultVariants: {
      size: 'md',
      variant: 'default',
      open: false,
      disabled: false,
      focused: false,
      color: 'primary',
      fieldOwnsFocusRing: false,
    },
  },
  { twMerge: true },
);

// ── Option-state color lookups ──
// Slot tokens own light/dark contrast — no `dark:`, no shade picks.

const OPTION_SELECTED_BG: Record<TwColor, string> = {
  primary: 'bg-primary-soft',
  secondary: 'bg-secondary-soft',
  accent: 'bg-accent-soft',
  neutral: 'bg-neutral-soft',
  info: 'bg-info-soft',
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  error: 'bg-error-soft',
};

const OPTION_CHECKMARK_COLOR: Record<TwColor, string> = {
  primary: 'text-primary-icon',
  secondary: 'text-secondary-icon',
  accent: 'text-accent-icon',
  neutral: 'text-fg',
  info: 'text-info-icon',
  success: 'text-success-icon',
  warning: 'text-warning-icon',
  error: 'text-error-icon',
};

// ── Template directives (content-projected slots) ─────────────────

/** Structural directive projecting a custom template for each option in the panel. */
@Directive({ selector: '[twSelectOption]' })
export class SelectOptionTemplateDirective<T = unknown, O = TwSelectOption<T>> {
  /** @internal */
  readonly templateRef = inject(TemplateRef<TwSelectOptionContext<T, O>>);

  /** @internal Enables strict typing of `let-` bindings in the template. */
  static ngTemplateContextGuard<T, O>(
    _dir: SelectOptionTemplateDirective<T, O>,
    _ctx: unknown,
  ): _ctx is TwSelectOptionContext<T, O> {
    return true;
  }
}

/** Structural directive projecting a custom template for the select's trigger content. */
@Directive({ selector: '[twSelectTrigger]' })
export class SelectTriggerTemplateDirective<T = unknown, O = TwSelectOption<T>> {
  /** @internal */
  readonly templateRef = inject(TemplateRef<TwSelectTriggerContext<T, O>>);

  /** @internal */
  static ngTemplateContextGuard<T, O>(
    _dir: SelectTriggerTemplateDirective<T, O>,
    _ctx: unknown,
  ): _ctx is TwSelectTriggerContext<T, O> {
    return true;
  }
}

/** Structural directive projecting a custom template for the panel's empty state. */
@Directive({ selector: '[twSelectEmpty]' })
export class SelectEmptyTemplateDirective {
  /** @internal */
  readonly templateRef = inject(TemplateRef<{ $implicit: string }>);

  /** @internal */
  static ngTemplateContextGuard(
    _dir: SelectEmptyTemplateDirective,
    _ctx: unknown,
  ): _ctx is { $implicit: string } {
    return true;
  }
}

/** Structural directive projecting a custom header at the top of the panel. */
@Directive({ selector: '[twSelectHeader]' })
export class SelectHeaderTemplateDirective {
  /** @internal */
  readonly templateRef = inject(TemplateRef<unknown>);
}

/** Structural directive projecting a custom footer at the bottom of the panel. */
@Directive({ selector: '[twSelectFooter]' })
export class SelectFooterTemplateDirective {
  /** @internal */
  readonly templateRef = inject(TemplateRef<unknown>);
}

// ── ID generator ──

let nextSelectId = 0;

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

// ── SelectComponent ──

/**
 * ARIA combobox with listbox popup. Supports single/multi selection, in-panel
 * search filtering, custom option/trigger templates, and full integration with
 * Angular forms (reactive, template-driven, signal-forms) plus `tw-form-field`.
 */
@Component({
  selector: 'tw-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  providers: [
    {
      provide: TW_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => SelectComponent),
    },
  ],
  template: `
    <button
      #triggerButton
      type="button"
      [id]="hostId"
      [class]="triggerClasses()"
      [attr.role]="'combobox'"
      [attr.aria-haspopup]="'listbox'"
      [attr.aria-expanded]="open() ? 'true' : 'false'"
      [attr.aria-controls]="listboxId"
      [attr.aria-activedescendant]="triggerActiveDescendantId()"
      [attr.aria-autocomplete]="searchable() ? 'list' : 'none'"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="labelledBy() || null"
      [attr.aria-describedby]="describedBy() || null"
      [attr.aria-required]="required() || null"
      [attr.aria-invalid]="errorState() || null"
      [attr.aria-disabled]="isDisabled() || null"
      [disabled]="isDisabled()"
      [attr.data-variant]="resolvedVariant()"
      (click)="onTriggerClick()"
      (keydown)="onTriggerKeydown($event)"
    >
      @if (triggerTemplateChild(); as tpl) {
        <span [class]="valueTextClasses()">
          <ng-container
            *ngTemplateOutlet="tpl.templateRef; context: buildTriggerContext()"
          />
        </span>
      } @else if (isEmpty()) {
        <span [class]="placeholderTextClasses()">{{ placeholder() || '\u00A0' }}</span>
      } @else {
        <span [class]="valueTextClasses()">{{ defaultTriggerText() }}</span>
      }

      @if (showClearButton()) {
        <!--
          Holds the clear control's slot in the flex row. The control itself is
          rendered after this button, not inside it - see clearSpacer above.
        -->
        <span [class]="clearSpacerClasses()" aria-hidden="true"></span>
      }

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
    </button>

    @if (showClearButton()) {
      <!--
        A real, native button and a SIBLING of the trigger: HTML's content model
        for button is "no interactive content descendant", so the previous
        role="button" tabindex="0" span nested inside the trigger was invalid.
        It sits after the trigger in DOM order, so the tab order is unchanged.
      -->
      <button
        type="button"
        [class]="clearButtonClasses()"
        aria-label="Clear selection"
        (click)="onClearClick($event)"
        (keydown)="onClearKeydown($event)"
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

    <span hidden>
      <ng-content />
    </span>
  `,
  host: {
    '[class]': 'rootClasses()',
  },
})
export class SelectComponent<T = unknown>
  implements ControlValueAccessor, FormFieldControl<T | readonly T[]>, OnInit
{
  /** Array of options to render in the panel. Accepts either `TwSelectOption<T>` objects or arbitrary records read via the accessor inputs. Defaults to an empty array. */
  readonly options = input<readonly unknown[]>([]);

  /** Accessor returning the visible label for an option. Override when passing arbitrary objects. Defaults to reading `.label`, falling back to `String(.value)`. */
  readonly optionLabel = input<(option: unknown) => string>(defaultOptionLabel);

  /** Accessor returning the value for an option. The result is what `value` / `valueChange` emit. Defaults to reading `.value`. */
  readonly optionValue = input<(option: unknown) => T>(
    defaultOptionValue as (option: unknown) => T,
  );

  /** Accessor returning the disabled state for an option. Defaults to reading `.disabled`. */
  readonly optionDisabled = input<(option: unknown) => boolean>(defaultOptionDisabled);

  /** Accessor returning the group name for an option. Options sharing a group render under a labelled `role="group"` region. Defaults to reading `.group`. */
  readonly optionGroup = input<(option: unknown) => string | undefined>(defaultOptionGroup);

  /** When true, enables multi-selection. The `value` model becomes a `T[]` and the panel renders checkable options. Defaults to `false`. */
  readonly multiple = input(false);

  /** When true, renders a search input at the top of the panel that filters options using `filterPredicate`. Defaults to `false`. */
  readonly searchable = input(false);

  /** Custom filter function for the search input. Defaults to a case-insensitive substring match on the option label. */
  readonly filterPredicate = input<(option: unknown, search: string) => boolean>(
    (option, search) => {
      const label = this.optionLabel()(option);
      return label.toLowerCase().includes(search.toLowerCase());
    },
  );

  /** Placeholder text shown in the trigger when no value is selected. Defaults to `undefined`. */
  readonly placeholder = input<string | undefined>(undefined);

  /** When true, the trigger cannot be activated and the panel cannot open. Defaults to `false`. Alias: `disabled`. */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /** When true, exposes `aria-required="true"` on the trigger and the `*` marker on a wrapping `tw-form-field`. Also inferred from `Validators.required` on a bound control, so a reactive/template-driven form does not have to state it twice. Defaults to `false`. */
  readonly requiredInput = input<boolean>(false, { alias: 'required' });

  /** Controls trigger padding, font size, and panel option density. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Semantic color for focused trigger border, active-option background, and checkmarks. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Visual style of the trigger. When inside a `tw-form-field` and left unset, auto-resolves to `'naked'`. Otherwise defaults to `'default'`. */
  readonly variant = input<SelectVariant | undefined>(undefined);

  /** Overlay panel width. `'trigger'` matches the trigger's measured width; `'auto'` lets content decide; a number is applied as pixels; a string is passed through as a CSS length. Defaults to `'trigger'`. */
  readonly panelWidth = input<'trigger' | 'auto' | number | string>('trigger');

  /** Extra class(es) applied to the overlay panel element. Defaults to an empty string. */
  readonly panelClass = input<string | readonly string[]>('');

  /** Maximum height of the listbox scroll region in pixels. Defaults to `256`. */
  readonly panelMaxHeight = input(256);

  /** Whether the panel closes after a selection is made. When unset, resolves to `true` for single-select and `false` for multi-select. */
  readonly closeOnSelect = input<boolean | undefined>(undefined);

  /** CDK scroll strategy for the overlay. Defaults to `'reposition'`. */
  readonly scrollStrategy = input<'reposition' | 'close' | 'block'>('reposition');

  /** Pixel distance between trigger and panel. Defaults to `4`. */
  readonly offset = input(4);

  /** Fallback message rendered when the filter yields no options and no `*twSelectEmpty` template is provided. Defaults to `'No results'`. */
  readonly emptyMessage = input('No results');

  /** Accessible name for the combobox trigger. Defaults to `undefined`. Alias: `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the combobox. Defaults to `undefined`. Alias: `aria-labelledby`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external element that describes the combobox. Defaults to `undefined`. Alias: `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Per-instance override of the {@link ErrorStateMatcher}. When omitted, the select uses the `TW_ERROR_STATE_MATCHER` token's value. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  /** Equality comparator for option values. Defaults to `Object.is`. */
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);

  // ── Models (two-way) ──

  /** Two-way bound selected value(s). Single-select: `T | null`. Multi-select: `T[]`. Defaults to `null`. */
  readonly value = model<T | readonly T[] | null>(null);

  /** Two-way bound open state of the panel. Defaults to `false`. */
  readonly open = model(false);

  // ── Outputs ──

  /** Fires when the panel's visibility finishes changing. Payload carries the new `open` state and the trigger element the overlay is anchored to. */
  readonly openedChange = output<TwSelectOpenedEvent>();

  /** Fires after any selection change, with `added`, `removed`, `previousValue`, and a `source` discriminator. */
  readonly selectionChange = output<TwSelectSelectionChangeEvent<T>>();

  /** Fires whenever the search input changes (only when `searchable` is true). Payload carries the raw, untrimmed query and the post-filter `visibleCount`. Emitted immediately, not debounced. */
  readonly searchChange = output<TwSelectSearchEvent>();

  // ── Content queries ──

  /** @internal */
  readonly triggerTemplateChild = contentChild(SelectTriggerTemplateDirective);
  /** @internal */
  readonly optionTemplateChild = contentChild(SelectOptionTemplateDirective);
  /** @internal */
  readonly emptyTemplateChild = contentChild(SelectEmptyTemplateDirective);
  /** @internal */
  readonly headerTemplateChild = contentChild(SelectHeaderTemplateDirective);
  /** @internal */
  readonly footerTemplateChild = contentChild(SelectFooterTemplateDirective);

  // ── View queries ──

  /** @internal The combobox trigger — focus target after the clear control unmounts. */
  private readonly triggerButtonRef = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  // ── Injected deps ──

  private readonly overlayService = inject(Overlay);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly platform = inject(Platform);
  private readonly formField = inject(TW_FORM_FIELD, { optional: true });
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  // ── Identity ──

  private readonly uid = nextSelectId++;
  /** @internal */
  readonly hostId = `tw-select-${this.uid}`;
  /** @internal */
  readonly listboxId = `${this.hostId}-listbox`;
  /** @internal */
  readonly searchInputId = `${this.hostId}-search`;
  /** @internal */
  readonly optionId = (index: number): string => `${this.hostId}-option-${index}`;

  // ── Internal state signals ──

  /** @internal */
  readonly internalValue = linkedSignal<T | readonly T[] | null>(() => this.value());
  /** @internal */
  readonly search = signal('');
  /** @internal */
  readonly activeIndex = signal<number>(-1);
  /** @internal */
  readonly focusedSignal = signal(false);
  private readonly cvaDisabled = signal(false);

  /** @internal Shared `errorState` / `required` / `errors` derivation — see `wireErrorState`. */
  private readonly errorWiring = wireErrorState({
    ngControl: () => this.ngControl,
    matcher: () => this.errorStateMatcher(),
    required: () => this.requiredInput(),
  });
  private readonly describedByIdsSignal = signal<readonly string[]>([]);
  private readonly labelledByIdsSignal = signal<readonly string[]>([]);

  private onChange: (value: T | readonly T[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  private overlayRef: OverlayRef | null = null;
  /**
   * The live position strategy. Held as a field so every open can re-apply
   * `offset` onto it — see `refreshOverlayConfig`.
   */
  private positionStrategy: FlexibleConnectedPositionStrategy | null = null;
  /** The `offset` value currently baked into `positionStrategy`. */
  private appliedOffset: number | null = null;
  /** The `scrollStrategy` name currently installed on `overlayRef`. */
  private appliedScrollStrategy: 'reposition' | 'close' | 'block' | null = null;
  private perOpenSubs: Subscription | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Overlay bookkeeping is deliberately held in plain fields, not signals — same
  // shape as popover and command-palette. A signal here would be track-read by the
  // open/close lifecycle effect that also writes it, which is the cycle shape
  // CLAUDE.md forbids. The only reactive bit is `isAttached`, written by the
  // lifecycle effect and read only by the state-push effect below, so the two
  // never form a loop.
  private overlayInstance: SelectOverlayComponent<T> | null = null;
  private closing = false;

  /** Flips true once the overlay component is attached; the sole trigger for the state-push effect. */
  private readonly isAttached = signal(false);

  // ── Derived state ──

  /** @internal */
  readonly isDisabled = computed(() => this.disabledInput() || this.cvaDisabled());

  /** @internal Effective variant — auto-naked when wrapped in tw-form-field. */
  readonly resolvedVariant = computed<SelectVariant>(
    () => this.variant() ?? (this.formField ? 'naked' : 'default'),
  );

  /** @internal */
  readonly isEmpty = computed(() => {
    const v = this.internalValue();
    if (this.multiple()) return !Array.isArray(v) || v.length === 0;
    return v === null || v === undefined;
  });

  /** @internal Visible (filtered) options with resolved view data. */
  readonly visibleOptions = computed<readonly SelectVisibleOption<T>[]>(() => {
    const opts = this.options();
    const labelFn = this.optionLabel();
    const valueFn = this.optionValue();
    const disabledFn = this.optionDisabled();
    const groupFn = this.optionGroup();
    const s = this.search().trim();
    const predicate = this.filterPredicate();
    const filtered = s && this.searchable() ? opts.filter((o) => predicate(o, s)) : opts;
    return filtered.map((option) => ({
      option,
      label: labelFn(option),
      value: valueFn(option),
      disabled: disabledFn(option),
      group: groupFn(option),
    }));
  });

  /** @internal Rows rendered in the panel (group labels + options). */
  readonly renderedRows = computed<readonly SelectRenderedRow<T>[]>(() => {
    const visible = this.visibleOptions();
    const rows: SelectRenderedRow<T>[] = [];
    let currentGroup: string | undefined;
    visible.forEach((v, index) => {
      if (v.group !== currentGroup) {
        if (v.group !== undefined) {
          rows.push({ kind: 'group-label', group: v.group });
        }
        currentGroup = v.group;
      }
      rows.push({ kind: 'option', option: v.option, index, group: v.group });
    });
    return rows;
  });

  /** @internal Resolved option objects that match the current value. */
  readonly selectedOptions = computed<readonly unknown[]>(() => {
    const v = this.internalValue();
    if (v === null || v === undefined) return [];
    const cmp = this.compareWith();
    const valueFn = this.optionValue();
    const opts = this.options();
    if (this.multiple()) {
      const arr = Array.isArray(v) ? v : [];
      return opts.filter((o) => arr.some((x) => cmp(valueFn(o), x)));
    }
    return opts.filter((o) => cmp(valueFn(o), v as T));
  });

  /** @internal */
  readonly defaultTriggerText = computed(() => {
    const opts = this.selectedOptions();
    const labelFn = this.optionLabel();
    if (opts.length === 0) return '';
    return opts.map((o) => labelFn(o)).join(', ');
  });

  /** @internal */
  readonly showClearButton = computed(
    () => !this.isDisabled() && !this.isEmpty(),
  );

  /** @internal */
  readonly activeDescendantId = computed(() => {
    if (!this.open()) return null;
    const idx = this.activeIndex();
    if (idx < 0 || idx >= this.visibleOptions().length) return null;
    return this.optionId(idx);
  });

  /**
   * @internal `aria-activedescendant` for the trigger button.
   *
   * Null while a searchable panel is open: `openOverlay()` moves DOM focus to
   * the overlay's search input, and `aria-activedescendant` is only honoured
   * on the element that actually holds focus. Leaving it on the blurred
   * trigger made arrow-key navigation silent to assistive tech. The overlay's
   * search input carries it instead in that mode.
   */
  readonly triggerActiveDescendantId = computed(() => {
    if (this.searchable() && this.open()) return null;
    return this.activeDescendantId();
  });

  /** @internal */
  readonly describedBy = computed(() => {
    const extra = this.describedByIdsSignal();
    const user = this.ariaDescribedby();
    const merged = [...extra];
    if (user) merged.push(...user.split(/\s+/).filter(Boolean));
    return merged.length ? merged.join(' ') : '';
  });

  /** @internal Merged `aria-labelledby`: form-field-pushed label ids + consumer-supplied `aria-labelledby`. */
  readonly labelledBy = computed(() => {
    const extra = this.labelledByIdsSignal();
    const user = this.ariaLabelledby();
    const merged = [...extra];
    if (user) merged.push(...user.split(/\s+/).filter(Boolean));
    return merged.length ? merged.join(' ') : '';
  });

  /** @internal Resolved close-on-select behaviour. */
  readonly resolvedCloseOnSelect = computed(() => {
    const explicit = this.closeOnSelect();
    if (explicit !== undefined) return explicit;
    return !this.multiple();
  });

  // ── tv() output ──

  private readonly variantResult = computed(() =>
    selectVariants({
      size: this.size(),
      variant: this.resolvedVariant(),
      open: this.open(),
      disabled: this.isDisabled(),
      focused: this.focusedSignal(),
      color: this.color(),
      fieldOwnsFocusRing: !!this.formField,
    }),
  );

  /** @internal */
  readonly rootClasses = computed(() => this.variantResult().root());
  /** @internal */
  readonly triggerClasses = computed(() => this.variantResult().trigger());
  /** @internal */
  readonly valueTextClasses = computed(() => this.variantResult().valueText());
  /** @internal */
  readonly placeholderTextClasses = computed(() => this.variantResult().placeholderText());
  /** @internal */
  readonly chevronClasses = computed(() => this.variantResult().chevron());
  /** @internal */
  readonly clearButtonClasses = computed(() => this.variantResult().clearButton());
  /** @internal */
  readonly clearSpacerClasses = computed(() => this.variantResult().clearSpacer());

  /** @internal */
  readonly optionSizeClass = computed(() => {
    switch (this.size()) {
      case 'xs':
        return 'px-2 py-1 text-xs gap-1.5';
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-4 py-2.5 text-base';
      case 'xl':
        return 'px-4 py-3 text-base';
    }
  });

  /** @internal */
  readonly checkmarkColorClass = computed(() => OPTION_CHECKMARK_COLOR[this.color()]);

  /** @internal Class string applied to each option row. */
  computeOptionClass = (selected: boolean, active: boolean, disabled: boolean): string => {
    const sizeClass = this.optionSizeClass();
    const color = this.color();
    const base =
      'relative flex items-center cursor-pointer select-none text-fg gap-2 transition-colors duration-normal motion-reduce:transition-none';
    const parts: string[] = [base, sizeClass];
    if (disabled) {
      parts.push('opacity-50 pointer-events-none');
    }
    if (selected) {
      parts.push(OPTION_SELECTED_BG[color]);
    } else if (active) {
      parts.push('bg-surface-muted');
    } else {
      parts.push('hover:bg-surface-muted');
    }
    return parts.join(' ');
  };

  // ── FormFieldControl impl (readonly signals) ──

  /** @internal */
  readonly id: Signal<string> = computed(() => this.hostId);
  /** @internal */
  readonly focused: Signal<boolean> = this.focusedSignal.asReadonly();
  /** @internal */
  readonly empty: Signal<boolean> = this.isEmpty;
  /** @internal */
  readonly disabled: Signal<boolean> = this.isDisabled;
  /**
   * @internal Resolved required state: the `required` input OR'd with
   * `Validators.required` on a bound `NgControl`. Without the validator arm the
   * form-field `*` marker (`FormFieldComponent.isRequired`) and the trigger's
   * `aria-required` silently vanish under reactive/template-driven forms, while
   * signal forms shows them — `cvaControlCreate` writes the `required` *input*
   * directly from the field state and never consults validators. The OR keeps
   * both branches true at once.
   */
  readonly required: Signal<boolean> = this.errorWiring.required;
  /** @internal Active validation errors map from the bound `NgControl`. Drives `[twError match="…"]` inside a wrapping `tw-form-field`; without it the form-field's key set is permanently empty and every `match`ed error stays hidden. */
  readonly errors: Signal<Record<string, unknown> | null> = this.errorWiring.errors;
  /** @internal Error-state per the configured `ErrorStateMatcher`. Reads the bound `NgControl.invalid` through the matcher. */
  readonly errorState: Signal<boolean> = this.errorWiring.errorState;
  /** @internal */
  readonly controlType = 'select';
  /** @internal */
  readonly userAriaDescribedBy: Signal<string | undefined> = computed(() => this.ariaDescribedby());
  /** @internal */
  readonly userAriaLabelledby: Signal<string | undefined> = computed(() => this.ariaLabelledby());

  /** @internal Public read-only view of the current value for FormFieldControl. */
  // Overriding `value` typing from the model by using an explicit computed that matches the abstract signature.
  // (The model `value` property is a WritableSignal<T | readonly T[] | null>; FormFieldControl needs a Signal<T | readonly T[] | null>.
  // A WritableSignal is assignable to Signal, so we just cast once.)

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
    // Only `open` and `isDisabled` are read in the tracked phase; the lifecycle
    // calls run inside `untracked()` because they both read and write panel state
    // (openOverlay resets `search` and then reads it back through visibleOptions).
    effect(() => {
      const shouldOpen = this.open();
      const disabled = this.isDisabled();
      untracked(() => {
        if (disabled && this.overlayInstance) {
          this.closeOverlay();
          return;
        }
        if (shouldOpen && !this.overlayInstance && !disabled && !this.closing) {
          this.openOverlay();
        } else if (!shouldOpen && this.overlayInstance && !this.closing) {
          this.closeOverlay();
        }
      });
    });

    // Push state into overlay component whenever anything relevant changes.
    // `isAttached` is the trigger — it is written by the lifecycle effect above
    // and never written here, so the two effects cannot feed each other. All
    // reads happen in the tracked phase; every write to the overlay instance is
    // wrapped in `untracked()` so it never feeds back into this effect.
    effect(() => {
      const attached = this.isAttached();
      const size = this.size();
      const color = this.color();
      const multiple = this.multiple();
      const searchable = this.searchable();
      const panelMaxHeight = this.panelMaxHeight();
      const emptyMessage = this.emptyMessage();
      const search = this.search();
      const activeIndex = this.activeIndex();
      const activeDescendantId = this.activeDescendantId();
      const renderedRows = this.renderedRows();
      const visibleOptions = this.visibleOptions();
      const optionTemplate = this.optionTemplateChild();
      const emptyTemplate = this.emptyTemplateChild();
      const headerTemplate = this.headerTemplateChild();
      const footerTemplate = this.footerTemplateChild();
      const optionLabelFn = this.optionLabel();
      const checkmarkColorClass = this.checkmarkColorClass();
      const panelClassValue = this.resolvePanelClass();
      untracked(() => {
        const instance = this.overlayInstance;
        if (!attached || !instance) return;
        instance.size.set(size);
        instance.color.set(color);
        instance.multiple.set(multiple);
        instance.searchable.set(searchable);
        instance.panelMaxHeight.set(panelMaxHeight);
        instance.emptyMessage.set(emptyMessage);
        instance.search.set(search);
        instance.activeIndex.set(activeIndex);
        instance.activeDescendantId.set(activeDescendantId);
        instance.renderedRows.set(renderedRows);
        instance.visibleOptions.set(visibleOptions);
        instance.optionTemplate.set(optionTemplate);
        instance.emptyTemplate.set(emptyTemplate);
        instance.headerTemplate.set(headerTemplate);
        instance.footerTemplate.set(footerTemplate);
        instance.optionLabelFn.set(optionLabelFn);
        instance.selectedChecker.set((index: number) => this.isVisibleOptionSelected(index));
        instance.computeOptionClass.set(this.computeOptionClass);
        instance.checkmarkColorClass.set(checkmarkColorClass);
        instance.panelClassValue.set(panelClassValue);
        instance.listboxId.set(this.listboxId);
        instance.searchInputId.set(this.searchInputId);
        instance.optionIdFn.set(this.optionId);
      });
    });

    // Emit searchChange whenever the user types.
    effect(() => {
      const s = this.search();
      const count = this.visibleOptions().length;
      untracked(() => {
        if (this.overlayInstance) {
          this.searchChange.emit({ search: s, visibleCount: count });
        }
      });
    });

    // Dev-mode accessible-name warning.
    afterNextRender(() => {
      if (!isDevMode()) return;
      const hasLabel =
        !!this.ariaLabel() ||
        !!this.ariaLabelledby() ||
        !!this.formField?.hasLabel() ||
        !!this.triggerTemplateChild();
      if (!hasLabel) {
        console.warn(
          '[tw-select] The select has no accessible name. Set aria-label, aria-labelledby, wrap in <tw-form-field> with a <label twLabel>, or project a *twSelectTrigger template.',
        );
      }
    });

    // Monitor focus on the trigger (and descendant overlay) for focused state.
    const monitorSub = this.focusMonitor
      .monitor(this.elementRef, true)
      .subscribe((origin) => {
        const wasFocused = this.focusedSignal();
        this.focusedSignal.set(!!origin);
        if (!origin) {
          this.onTouched();
          if (wasFocused) {
            // Blur often flips `touched` on the bound `NgControl`; bump the
            // revision so `errorState` recomputes.
            this.errorWiring.bump();
          }
        }
      });

    this.destroyRef.onDestroy(() => {
      monitorSub.unsubscribe();
      this.focusMonitor.stopMonitoring(this.elementRef);
      this.clearCloseTimer();
      this.perOpenSubs?.unsubscribe();
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      this.overlayRef?.dispose();
      this.overlayRef = null;
      this.positionStrategy = null;
      this.overlayInstance = null;
    });
  }

  // ── Public methods ──

  /** Opens the overlay panel. No-op when disabled or already open. */
  openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.open.set(true);
  }

  /** Closes the overlay panel. No-op when already closed. */
  closePanel(): void {
    if (!this.open()) return;
    this.open.set(false);
  }

  /** Toggles the panel's open state. */
  toggle(): void {
    if (this.open()) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  /** Clears the current selection and emits `selectionChange` with `source: 'reset'`. */
  clear(): void {
    const previous = this.internalValue();
    const removed = this.selectedOptions().map((o) => this.optionValue()(o));
    const next: T | readonly T[] | null = this.multiple() ? [] : null;
    this.internalValue.set(next);
    this.value.set(next);
    this.onChange(next);
    this.selectionChange.emit({
      value: next,
      previousValue: previous,
      added: [],
      removed,
      source: 'reset',
    });
  }

  /** @internal Whether a visible-option index is currently selected. */
  isVisibleOptionSelected(index: number): boolean {
    const visible = this.visibleOptions();
    if (index < 0 || index >= visible.length) return false;
    return this.isValueSelected(visible[index].value);
  }

  /** @internal */
  isValueSelected(value: T): boolean {
    const current = this.internalValue();
    if (current === null || current === undefined) return false;
    const cmp = this.compareWith();
    if (this.multiple()) {
      const arr = Array.isArray(current) ? current : [];
      return arr.some((x) => cmp(x, value));
    }
    return cmp(current as T, value);
  }

  /** @internal */
  selectByVisibleIndex(index: number, source: TwSelectSelectionSource = 'user'): void {
    const visible = this.visibleOptions();
    if (index < 0 || index >= visible.length) return;
    const target = visible[index];
    if (target.disabled) return;
    this.commitSelection(target.value, target.label, source);
  }

  // ── Trigger interactions ──

  /** @internal */
  onTriggerClick(): void {
    if (this.isDisabled()) return;
    this.toggle();
  }

  /**
   * @internal
   *
   * `stopPropagation` + `preventDefault` are load-bearing even now that the
   * control is a sibling of the trigger rather than nested inside it: inside a
   * `tw-form-field` the click still bubbles to the field's control wrapper,
   * which calls `onContainerClick()` and would open the panel on a clear.
   */
  onClearClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.clear();
    this.focusTrigger();
  }

  /**
   * @internal
   *
   * A native `button` already activates on Enter and Space in a browser, so
   * this looks redundant — it is not. `preventDefault()` here suppresses that
   * native activation, so the two paths cannot both fire, and jsdom never
   * synthesises a click from a key event at all, which makes this the only
   * keyboard path a unit spec can exercise.
   */
  onClearKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.clear();
      this.focusTrigger();
    }
  }

  /**
   * Clearing removes the clear control from the DOM (`showClearButton()` goes
   * false), so whatever had focus is destroyed under the user. Hand focus back
   * to the trigger rather than letting it fall to `<body>` (SC 2.4.3).
   *
   * The disabled guard is not redundant. `[disabled]` on a native button makes
   * `.focus()` a silent no-op (the same trap `calendar-cell` hit), and today
   * the only reason the path cannot be reached is that `showClearButton()`
   * happens to include `!isDisabled()`. That is ordering, not a guarantee: a
   * `setDisabledState(true)` landing between the keydown and this call would
   * drop focus to `<body>` with nothing to show for it.
   */
  private focusTrigger(): void {
    if (this.isDisabled()) return;
    this.triggerButtonRef()?.nativeElement.focus();
  }

  /** @internal */
  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    this.handleKeydown(event);
  }

  /** @internal Handles keyboard events from the trigger AND the search input inside the overlay. */
  handleKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const isOpen = this.open();
    const searchMode = this.searchable() && isOpen;

    if (event.altKey && (key === 'ArrowDown' || key === 'ArrowUp')) {
      event.preventDefault();
      if (key === 'ArrowDown' && !isOpen) this.openPanel();
      else if (key === 'ArrowUp' && isOpen) this.closePanel();
      return;
    }

    switch (key) {
      case 'Enter': {
        if (!isOpen) {
          event.preventDefault();
          this.openPanel();
          return;
        }
        event.preventDefault();
        const idx = this.activeIndex();
        if (idx >= 0) {
          this.selectByVisibleIndex(idx, 'user');
        }
        return;
      }
      case ' ':
      case 'Spacebar': {
        if (searchMode) return;
        event.preventDefault();
        if (!isOpen) {
          this.openPanel();
          return;
        }
        const idx = this.activeIndex();
        if (idx >= 0) {
          this.selectByVisibleIndex(idx, 'user');
        }
        return;
      }
      case 'ArrowDown': {
        event.preventDefault();
        if (!isOpen) {
          this.openPanel();
        } else {
          this.moveActive(1);
        }
        return;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (!isOpen) {
          this.openPanel();
          this.moveActiveTo(this.visibleOptions().length - 1, -1);
        } else {
          this.moveActive(-1);
        }
        return;
      }
      case 'Home': {
        if (searchMode) return;
        event.preventDefault();
        if (!isOpen) this.openPanel();
        this.moveActiveTo(0, 1);
        return;
      }
      case 'End': {
        if (searchMode) return;
        event.preventDefault();
        if (!isOpen) this.openPanel();
        this.moveActiveTo(this.visibleOptions().length - 1, -1);
        return;
      }
      case 'PageDown': {
        if (!isOpen) return;
        event.preventDefault();
        this.moveActive(10);
        return;
      }
      case 'PageUp': {
        if (!isOpen) return;
        event.preventDefault();
        this.moveActive(-10);
        return;
      }
      case 'Escape': {
        if (isOpen) {
          event.preventDefault();
          this.closePanel();
        }
        return;
      }
      case 'Tab': {
        if (isOpen) {
          this.closePanel();
        }
        return;
      }
      default:
        if (!searchMode && key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.applyTypeAhead(key);
        }
        return;
    }
  }

  // ── Type-ahead (non-search mode) ──

  private typeAheadBuffer = '';
  private typeAheadTimer: ReturnType<typeof setTimeout> | null = null;

  private applyTypeAhead(char: string): void {
    if (this.typeAheadTimer !== null) clearTimeout(this.typeAheadTimer);
    this.typeAheadBuffer += char.toLowerCase();
    const labelFn = this.optionLabel();
    const visible = this.visibleOptions();
    // Disabled options are skipped, matching every other navigation path in this
    // file (`findEnabledFrom`). Without the filter, `aria-activedescendant` could
    // land on an option that `selectByVisibleIndex` then refuses to commit, so
    // Enter did nothing with no feedback.
    const match = visible.findIndex(
      (o) =>
        !o.disabled &&
        labelFn(o.option).toLowerCase().startsWith(this.typeAheadBuffer),
    );
    if (match >= 0) {
      if (!this.open()) this.openPanel();
      this.activeIndex.set(match);
      this.scrollActiveIntoView();
    }
    this.typeAheadTimer = setTimeout(() => {
      this.typeAheadBuffer = '';
      this.typeAheadTimer = null;
    }, 400);
  }

  // ── Active-index navigation ──

  private moveActive(delta: number): void {
    const visible = this.visibleOptions();
    if (visible.length === 0) {
      this.activeIndex.set(-1);
      return;
    }
    const start = this.activeIndex();
    const direction = delta > 0 ? 1 : -1;
    const steps = Math.abs(delta);
    let current = start;
    for (let i = 0; i < steps; i++) {
      const next = this.findEnabledFrom(current + direction, direction);
      if (next === -1) break;
      current = next;
    }
    if (current !== start && current >= 0) {
      this.activeIndex.set(current);
      this.scrollActiveIntoView();
    }
  }

  private moveActiveTo(startIndex: number, direction: 1 | -1): void {
    const next = this.findEnabledFrom(startIndex, direction);
    if (next >= 0) {
      this.activeIndex.set(next);
      this.scrollActiveIntoView();
    }
  }

  private findEnabledFrom(start: number, direction: 1 | -1): number {
    const visible = this.visibleOptions();
    let i = start;
    while (i >= 0 && i < visible.length) {
      if (!visible[i].disabled) return i;
      i += direction;
    }
    return -1;
  }

  /** @internal */
  initActiveIndexOnOpen(): void {
    const visible = this.visibleOptions();
    if (visible.length === 0) {
      this.activeIndex.set(-1);
      return;
    }
    const selectedIdx = visible.findIndex((v) => this.isValueSelected(v.value));
    if (selectedIdx >= 0 && !visible[selectedIdx].disabled) {
      this.activeIndex.set(selectedIdx);
    } else {
      this.activeIndex.set(this.findEnabledFrom(0, 1));
    }
    this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    if (!this.platform.isBrowser) return;
    queueMicrotask(() => {
      const id = this.activeDescendantId();
      if (!id) return;
      const el = document.getElementById(id);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    });
  }

  // ── Selection commit ──

  private commitSelection(value: T, label: string, source: TwSelectSelectionSource): void {
    const previous = this.internalValue();
    if (this.multiple()) {
      const cmp = this.compareWith();
      const currentArr = Array.isArray(previous) ? [...(previous as readonly T[])] : [];
      const existingIdx = currentArr.findIndex((x) => cmp(x, value));
      let added: readonly T[] = [];
      let removed: readonly T[] = [];
      if (existingIdx >= 0) {
        removed = [currentArr[existingIdx]];
        currentArr.splice(existingIdx, 1);
      } else {
        added = [value];
        currentArr.push(value);
      }
      this.internalValue.set(currentArr);
      this.value.set(currentArr);
      if (source === 'user') {
        this.onChange(currentArr);
        this.liveAnnouncer.announce(`${label} ${added.length ? 'selected' : 'deselected'}`, 'polite');
      }
      this.selectionChange.emit({
        value: currentArr,
        previousValue: previous,
        added,
        removed,
        source,
      });
    } else {
      const cmp = this.compareWith();
      const prevSingle = previous as T | null;
      if (prevSingle !== null && prevSingle !== undefined && cmp(prevSingle, value)) {
        if (this.resolvedCloseOnSelect()) this.closePanel();
        return;
      }
      this.internalValue.set(value);
      this.value.set(value);
      if (source === 'user') this.onChange(value);
      this.selectionChange.emit({
        value,
        previousValue: previous,
        added: [value],
        removed: prevSingle !== null && prevSingle !== undefined ? [prevSingle] : [],
        source,
      });
      if (this.resolvedCloseOnSelect()) this.closePanel();
    }
  }

  // ── Overlay lifecycle ──

  private openOverlay(): void {
    this.ensureOverlay();
    this.attachOverlayComponent();
    // After `attachOverlayComponent`, deliberately: CDK only wires a swapped
    // scroll strategy into the overlay when the ref is attached. See
    // `applyScrollStrategy`.
    this.applyScrollStrategy();
    this.subscribePerOpen();
    this.search.set('');
    this.initActiveIndexOnOpen();
    // Set last: this is what wakes the state-push effect, and it must not fire
    // until the instance exists and the per-open state has been reset.
    this.isAttached.set(true);
    queueMicrotask(() => {
      if (this.searchable()) {
        this.overlayInstance?.focusSearchInput();
      }
    });
    this.openedChange.emit({ open: true, trigger: this.elementRef.nativeElement });
  }

  private closeOverlay(): void {
    if (this.closing || !this.overlayInstance) return;
    this.closing = true;

    this.overlayInstance.leaving.set(true);

    this.triggerButtonRef()?.nativeElement.focus();

    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      if (this.overlayRef?.hasAttached()) {
        this.overlayRef.detach();
      }
      this.perOpenSubs?.unsubscribe();
      this.perOpenSubs = null;
      this.overlayInstance = null;
      this.isAttached.set(false);
      this.search.set('');
      this.activeIndex.set(-1);
      untracked(() => this.open.set(false));
      this.closing = false;
      this.openedChange.emit({ open: false, trigger: this.elementRef.nativeElement });
    }, ANIMATION_DURATION);
  }

  private ensureOverlay(): void {
    if (this.overlayRef) {
      // The OverlayRef deliberately survives a close (closing only detaches), so
      // anything read at creation time would otherwise be frozen for the whole
      // component lifetime. Re-apply the input-driven bits on every open.
      this.refreshPositionConfig();
      this.updateOverlaySize();
      return;
    }
    this.appliedOffset = this.offset();
    const positionStrategy = this.overlayService
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(buildSelectLikePositions(this.appliedOffset))
      .withFlexibleDimensions(false)
      .withPush(false)
      .withViewportMargin(8);
    this.positionStrategy = positionStrategy;
    this.appliedScrollStrategy = this.scrollStrategy();

    this.overlayRef = this.overlayService.create({
      positionStrategy,
      scrollStrategy: resolveSelectScrollStrategy(this.appliedScrollStrategy, this.overlayService),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      panelClass: 'tw-select-panel',
    });
    this.installResizeObserver();
    this.updateOverlaySize();
  }

  /** Pushes the current `offset` onto the live position strategy. */
  private refreshPositionConfig(): void {
    const offset = this.offset();
    if (!this.positionStrategy || offset === this.appliedOffset) return;
    this.appliedOffset = offset;
    this.positionStrategy.withPositions(buildSelectLikePositions(offset));
    // `withPositions` only stores the list. The open path calls this while the
    // ref is still detached, so the following `attach()` applies it; the guard
    // covers a future caller that runs while the panel is up.
    if (this.overlayRef?.hasAttached()) this.overlayRef.updatePosition();
  }

  /**
   * Swaps in a new CDK scroll strategy when `scrollStrategy` changed since the
   * last open.
   *
   * **Must be called while the overlay is attached.**
   * `OverlayRef.updateScrollStrategy` only calls `attach()`/`enable()` on the
   * new strategy when `hasAttached()` is true; swapped in while detached, the
   * strategy would never receive its `OverlayRef` and the subsequent
   * `OverlayRef.attach()` would call bare `enable()` on it — leaving
   * `CloseScrollStrategy`/`RepositionScrollStrategy` to throw on the first
   * scroll event.
   */
  private applyScrollStrategy(): void {
    const name = this.scrollStrategy();
    // The `hasAttached` half of the guard is the safety net for that rule: if a
    // caller ever runs this while detached we skip the swap (and leave
    // `appliedScrollStrategy` stale, so the next open retries) rather than
    // installing a strategy CDK will never hand an OverlayRef to.
    if (!this.overlayRef?.hasAttached() || name === this.appliedScrollStrategy) {
      return;
    }
    this.appliedScrollStrategy = name;
    this.overlayRef.updateScrollStrategy(
      resolveSelectScrollStrategy(name, this.overlayService),
    );
  }

  private installResizeObserver(): void {
    if (!this.platform.isBrowser || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.updateOverlaySize());
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  private updateOverlaySize(): void {
    if (!this.overlayRef) return;
    const width = this.panelWidth();
    if (width === 'trigger') {
      // The view query, NOT `querySelector('button')`: the clear control is now
      // a second button inside the host, and measuring the wrong one would
      // silently corrupt `panelWidth="trigger"`.
      const button = this.triggerButtonRef()?.nativeElement ?? null;
      const rect = (button ?? this.elementRef.nativeElement).getBoundingClientRect();
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
    const portal = new ComponentPortal<SelectOverlayComponent<T>>(
      SelectOverlayComponent as unknown as new () => SelectOverlayComponent<T>,
      this.viewContainerRef,
      this.injector,
    );
    const ref = this.overlayRef.attach(portal);
    const instance = ref.instance;
    instance.onSearchInput.set((v) => this.search.set(v));
    instance.onOptionSelect.set((i) => this.selectByVisibleIndex(i, 'user'));
    instance.onOptionActivate.set((i) => this.activeIndex.set(i));
    instance.onPanelKeydown.set((e) => this.handleKeydown(e));
    this.overlayInstance = instance;
  }

  private subscribePerOpen(): void {
    this.perOpenSubs?.unsubscribe();
    this.perOpenSubs = new Subscription();
    if (!this.overlayRef) return;

    this.perOpenSubs.add(
      this.overlayRef
        .backdropClick()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.closePanel()),
    );

    const teardownEscape = consumeOverlayEscape(this.overlayRef, (event) => {
      event.preventDefault();
      this.closePanel();
    });
    this.perOpenSubs.add(() => teardownEscape());
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

  /** @internal */
  buildTriggerContext(): TwSelectTriggerContext<T> {
    return {
      $implicit: this.internalValue(),
      open: this.open(),
      empty: this.isEmpty(),
      selectedOptions: this.selectedOptions() as readonly TwSelectOption<T>[],
    };
  }

  // ── ControlValueAccessor ──

  writeValue(value: T | readonly T[] | null): void {
    const previous = this.internalValue();
    let normalised: T | readonly T[] | null;
    if (this.multiple()) {
      if (Array.isArray(value)) normalised = value as readonly T[];
      else if (value === null || value === undefined) normalised = [];
      else normalised = [value as T];
    } else {
      if (Array.isArray(value)) normalised = value.length ? (value[0] as T) : null;
      else normalised = (value as T | null) ?? null;
    }
    this.internalValue.set(normalised);
    this.value.set(normalised);
    this.selectionChange.emit({
      value: normalised,
      previousValue: previous,
      added: [],
      removed: [],
      source: 'programmatic',
    });
  }

  registerOnChange(fn: (value: T | readonly T[] | null) => void): void {
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

  /** @internal Receives the merged `aria-labelledby` ids from the wrapping form-field. The trigger needs explicit labelledby because it's a non-native combobox button — `<label for>` does not reach it. */
  setLabelledByIds(ids: string[]): void {
    this.labelledByIdsSignal.set([...ids]);
  }

  /** @internal */
  onContainerClick(event: MouseEvent): void {
    if (this.isDisabled()) return;
    this.triggerButtonRef()?.nativeElement.focus();
    if (!event.defaultPrevented) {
      this.openPanel();
    }
  }

  ngOnInit(): void {
    // NgControl's `control` is set by the parent FormControl* directive before
    // children's `ngOnInit`. Subscribe here so errorState reacts to status/value
    // changes on the bound control.
    this.errorWiring.connect();
  }
}
