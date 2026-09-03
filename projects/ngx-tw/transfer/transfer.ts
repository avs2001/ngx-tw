/*
 * tw-transfer — dual-listbox shuttle. Two panels (source / target) with a column
 * of move buttons between them; the user ticks items in a panel and shuttles the
 * ticked items to the other side. The component's *value* is the set of keys
 * currently on the target side (`targetKeys`), exposed through
 * `ControlValueAccessor` + `FormFieldControl` (mirrors `tags-input` / `select`).
 *
 * Architecture decisions (verified against @angular/cdk 21.2.x source):
 *  - Each panel body is one `[cdkListbox]` (multiple) with one `[cdkOption]` per
 *    VISIBLE item. CDK owns `role="listbox"`/`"option"`, `aria-multiselectable`/
 *    `aria-selected`, roving-tabindex Arrow/Home/End, Space/Enter toggle, and
 *    typeahead. We do NOT roll a custom listbox or reuse select's overlay.
 *  - Option value is the item's KEY `K` (`[cdkOption]="row.key"`), so each panel's
 *    `cdkListboxValue` is a `readonly K[]` and `compareWith` is key identity.
 *  - TWO selection layers, kept distinct:
 *      • `targetKeys` (signal) — persisted membership = the CVA value.
 *      • per-panel ephemeral "checked" — the CdkListbox value, cleared after moves.
 *  - The checked binding is CONTROLLED: `[cdkListboxValue]="<panel>Checked()"`,
 *    writing the user's `cdkListboxValueChange` back into that signal. Programmatic
 *    writes to `cdkListboxValue` are SILENT in CDK (only user gestures call
 *    `valueChange.next` — verified: triggerOption/triggerRange), so the loop never
 *    re-enters → no cycle / freeze.
 *  - The checked set is a `linkedSignal` whose source is the rendered-key set: on
 *    every render change it PRUNES keys whose option is no longer present (a filter
 *    hid it, or a move removed it). Two consequences: (1) the bound value is always
 *    a subset of the rendered options, so CdkListbox's internal `_invalid` flag —
 *    which would otherwise collapse the whole selection to `[]` — never trips; and
 *    (2) a key checked then filtered out is dropped permanently (it does NOT
 *    re-appear when the filter clears). This matches the requirements doc and side-
 *    steps a CDK quirk where a controlled value re-surfacing a just-re-rendered
 *    option is not reliably re-selected. Moves always act on the visible subset.
 */

import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  isDevMode,
  linkedSignal,
  type OnInit,
  output,
  signal,
  type Signal,
  TemplateRef,
} from '@angular/core';
import { type ControlValueAccessor, NgControl } from '@angular/forms';
import {
  CdkListbox,
  CdkOption,
  type ListboxValueChangeEvent,
} from '@angular/cdk/listbox';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { Platform } from '@angular/cdk/platform';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tv } from 'tailwind-variants';
import {
  type ErrorStateMatcher,
  type TwSize,
  wireErrorState,
} from '@cdevhub/ngx-tw/core';
import {
  FormFieldControl,
  TW_FORM_FIELD_CONTROL,
} from '@cdevhub/ngx-tw/form-field';
import { CheckboxComponent } from '@cdevhub/ngx-tw/checkbox';
import { InputDirective } from '@cdevhub/ngx-tw/input';

// ── Public types ──────────────────────────────────────────────────────

/** Which panel of the transfer an item / event belongs to. */
export type TwTransferSide = 'source' | 'target';

/** i18n strings for the transfer. Pass any subset; unset keys fall back to the English defaults. */
export interface TwTransferLabels {
  /** Source (left) panel title. Defaults to `'Source'`. */
  sourceTitle?: string;
  /** Target (right) panel title. Defaults to `'Target'`. */
  targetTitle?: string;
  /** Placeholder + accessible name for the per-panel search inputs. Defaults to `'Search'`. */
  searchPlaceholder?: string;
  /** Text shown in a panel body when it has no visible items. Defaults to `'No items'`. */
  emptyText?: string;
  /** Accessible name for the header select-all checkbox. Defaults to `'Select all'`. */
  selectAllLabel?: string;
  /** Accessible name for the → (move-to-target) button. Defaults to `'Move selected to target'`. */
  moveToTargetLabel?: string;
  /** Accessible name for the ← (move-to-source) button. Defaults to `'Move selected to source'`. */
  moveToSourceLabel?: string;
  /** Count template rendered in each panel header. Variables: `{total}`, `{selected}`. Defaults to `'{total} items'`. */
  countFormat?: string;
  /** LiveAnnouncer template announced after a move. Variables: `{count}`, `{target}`. Defaults to `'{count} items moved to {target}'`. */
  moveAnnouncement?: string;
}

/** Visual configuration for the transfer. Pass any subset; unset keys fall back to the defaults. */
export interface TwTransferDisplayConfig {
  /** Row / control density across the design-system ramps. Defaults to `'md'`. */
  size?: TwSize;
  /** Scroll-viewport height of each list, in px (a number) or `'auto'` (flow with content). Defaults to `240`. */
  listHeight?: number | 'auto';
  /** When true, each panel gets a labelled search input above its list. Defaults to `false`. */
  showSearch?: boolean;
  /** When true, each panel header shows a tri-state select-all checkbox. Defaults to `true`. */
  showSelectAll?: boolean;
}

/** Behavioural configuration for the transfer. Generic over item type `T`. Pass any subset; unset keys fall back to the defaults. */
export interface TwTransferBehaviorConfig<T = unknown> {
  /** When true, items only flow source → target; the ← button is not rendered. Defaults to `false`. */
  oneWay?: boolean;
  /** Custom search predicate. Defaults to a case-insensitive substring match of the query against `labelFn(item)`. */
  filterFn?: (item: T, query: string) => boolean;
  /** Per-item disable predicate. A disabled item renders as a disabled option and is excluded from select-all and all moves. Defaults to `() => false`. */
  disabledItem?: (item: T) => boolean;
}

/** Context surfaced to a `*twTransferItem` template. Generic over the item type `T`. */
export interface TwTransferItemContext<T> {
  /** The item data (implicit `let-item`). */
  $implicit: T;
  /** Resolved `labelFn(item)`. */
  label: string;
  /** Ephemeral pending-move checked state of this row's option. */
  checked: boolean;
  /** Whether the item is disabled (via `behavior.disabledItem`). */
  disabled: boolean;
  /** Which panel this row renders in. */
  side: TwTransferSide;
}

/** Payload emitted by `moved`. Generic over the key type `K`. */
export interface TwTransferMovedEvent<K> {
  /** The keys that moved in this interaction. */
  keys: readonly K[];
  /** The direction of the move. */
  direction: 'toTarget' | 'toSource';
}

// ── Resolved-default constants ────────────────────────────────────────

const LABELS_DEFAULTS: Required<TwTransferLabels> = {
  sourceTitle: 'Source',
  targetTitle: 'Target',
  searchPlaceholder: 'Search',
  emptyText: 'No items',
  selectAllLabel: 'Select all',
  moveToTargetLabel: 'Move selected to target',
  moveToSourceLabel: 'Move selected to source',
  countFormat: '{total} items',
  moveAnnouncement: '{count} items moved to {target}',
};

const DISPLAY_DEFAULTS: Required<TwTransferDisplayConfig> = {
  size: 'md',
  listHeight: 240,
  showSearch: false,
  showSelectAll: true,
};

/** Replaces `{name}` tokens in a template with values from `vars`. */
function formatLabel(
  template: string,
  vars: Record<string, string | number>,
): string {
  // Defence in depth. `resolvedLabels()` already filters explicitly-undefined
  // consumer keys, so a non-string cannot reach here through the public
  // `labels` input today. The guard exists so a future regression in that
  // merge degrades to a missing label instead of throwing.
  if (typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

// ── tv() config ───────────────────────────────────────────────────────
//
// All class strings are literal so the Tailwind v4 JIT scanner picks them up.
// Semantic + surface/fg/border tokens only. The selected/checked option styling
// mirrors `tree`'s selected node (`bg-primary-50 text-primary-700`, no `dark:`
// overrides — slot tokens own structural light/dark contrast).

const transferVariants = tv(
  {
    slots: {
      // panel · controls · panel. The middle column is auto width; both panels
      // share the remaining space and clamp to `min-w-0` so rows can truncate.
      root: 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 items-stretch text-fg',
      panel:
        'flex flex-col min-w-0 rounded-lg border border-border bg-surface overflow-hidden',
      panelHeader:
        'flex items-center gap-2 border-b border-border bg-surface-muted',
      panelTitle: 'text-sm font-semibold text-fg min-w-0 truncate flex-1',
      panelCount: 'text-xs text-fg-muted shrink-0 tabular-nums',
      search: 'border-b border-border',
      // The cdkListbox scroll viewport. `outline-none` because focus rides the
      // individual options (canonical ring there), not the container.
      list: 'flex flex-col overflow-y-auto outline-none',
      // The cdkOption row.
      option:
        'flex items-center gap-2 cursor-pointer select-none text-fg transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      // Presentational check glyph (aria-hidden). Always laid out (for alignment);
      // visibility toggles via opacity off the checked state.
      optionCheck:
        'shrink-0 transition-opacity duration-200 motion-reduce:transition-none',
      optionLabel: 'min-w-0 truncate flex-1',
      controls: 'flex flex-col justify-center gap-2',
      // Plain square move buttons (icon-only). Square-interactive sub-scale per
      // size; not the [twButton] directive (its size padding would fight a square
      // override across two class bindings).
      moveButton:
        'inline-flex items-center justify-center shrink-0 rounded-md border border-border bg-surface text-fg-muted cursor-pointer transition-colors duration-200 motion-reduce:transition-none hover:bg-surface-muted hover:text-fg hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
      // Glyph inside the square move button. Glyph sub-scale saturating at
      // `lg`: 3 / 4 / 5 / 6 / 6, matching `optionCheck`. Previously 4/4/5/5/5,
      // which left three of the five advertised steps dead. `xl` stops at
      // 24px rather than the scale's 32px because the glyph lives inside a
      // 36px `moveButton` (the square-interactive scale saturates at `lg`
      // too, per CLAUDE.md) — a 32px glyph in a 36px target leaves no optical
      // padding. Raising one means raising the other.
      moveIcon: 'shrink-0',
      empty:
        'flex items-center justify-center p-4 text-sm text-fg-subtle text-center',
    },
    variants: {
      size: {
        xs: {
          panelHeader: 'px-2 py-1',
          search: 'px-2 py-1',
          option: 'px-2 py-1 text-xs gap-1.5',
          optionCheck: 'size-3',
          moveButton: 'size-6',
          moveIcon: 'size-3',
          empty: 'text-xs',
        },
        sm: {
          panelHeader: 'px-3 py-1.5',
          search: 'px-3 py-1.5',
          option: 'px-3 py-1.5 text-sm',
          optionCheck: 'size-4',
          moveButton: 'size-7',
          moveIcon: 'size-4',
        },
        md: {
          panelHeader: 'px-4 py-2',
          search: 'px-3 py-2',
          option: 'px-3 py-2 text-sm',
          optionCheck: 'size-5',
          moveButton: 'size-8',
          moveIcon: 'size-5',
        },
        lg: {
          panelHeader: 'px-5 py-2.5',
          search: 'px-4 py-2.5',
          option: 'px-4 py-2.5 text-base',
          optionCheck: 'size-6',
          moveButton: 'size-9',
          moveIcon: 'size-6',
        },
        xl: {
          panelHeader: 'px-6 py-3',
          search: 'px-4 py-3',
          option: 'px-4 py-3 text-base',
          optionCheck: 'size-6',
          moveButton: 'size-9',
          moveIcon: 'size-6',
        },
      },
      checked: {
        true: {
          option: 'bg-primary-50 text-primary-700 hover:bg-primary-50',
          optionCheck: 'opacity-100 text-primary-600',
        },
        false: {
          option: 'hover:bg-surface-muted',
          optionCheck: 'opacity-0',
        },
      },
      optionDisabled: {
        true: { option: 'opacity-50 pointer-events-none' },
        false: {},
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none' },
        false: {},
      },
    },
    defaultVariants: {
      size: 'md',
      checked: false,
      optionDisabled: false,
      disabled: false,
    },
  },
  { twMerge: true },
);

// ── TransferItemDefDirective ──────────────────────────────────────────
//
// Pure TemplateRef carrier for the consumer's per-item template. Mirrors tree's
// `TreeNodeDefDirective` / table's `CellDefDirective`: a typed context +
// `ngTemplateContextGuard` so `let-item` / `let-checked="checked"` type-check.
// Optional — when absent each row renders the default check glyph + label.

/** Structural directive (`*twTransferItem="let item"`) declaring the per-item template. Typed as `TwTransferItemContext<T>`. */
@Directive({ selector: '[twTransferItem]' })
export class TransferItemDefDirective<T = unknown> {
  /** @internal Consumer-projected per-item template. */
  readonly template = inject(TemplateRef<TwTransferItemContext<T>>);

  /** @internal */
  static ngTemplateContextGuard<T>(
    _dir: TransferItemDefDirective<T>,
    _ctx: unknown,
  ): _ctx is TwTransferItemContext<T> {
    return true;
  }
}

// ── Internal view-model types ─────────────────────────────────────────

interface RowBase<T, K> {
  readonly item: T;
  readonly key: K;
  readonly label: string;
  readonly disabled: boolean;
}

interface RowView<T, K> extends RowBase<T, K> {
  readonly checked: boolean;
  readonly optionClass: string;
  readonly checkClass: string;
  readonly context: TwTransferItemContext<T>;
}

interface PanelView<T, K> {
  readonly side: TwTransferSide;
  readonly title: string;
  readonly titleId: string;
  readonly countText: string;
  readonly emptyText: string;
  readonly searchPlaceholder: string;
  readonly selectAllLabel: string;
  readonly query: string;
  readonly rows: readonly RowView<T, K>[];
  readonly checkedValue: readonly K[];
  readonly selectAllChecked: boolean;
  readonly selectAllIndeterminate: boolean;
}

let nextId = 0;

// ── TransferComponent ─────────────────────────────────────────────────

/**
 * A dual-listbox shuttle: two panels (source / target) with a column of move
 * buttons between them. The user ticks items in a panel and shuttles them across;
 * an optional per-panel search and a tri-state header select-all accelerate bulk
 * moves. The component's value is the set of keys on the target side, exposed
 * through `ControlValueAccessor` + `FormFieldControl` so it works with reactive,
 * template-driven, and signal forms and integrates with `<tw-form-field>`.
 *
 * Each panel composes `@angular/cdk/listbox` (`CdkListbox` / `CdkOption`) for
 * focus-managed, accessible, keyboard-navigable selection. Consumers supply
 * `keyFn` (required) and `labelFn` (defaulted to `String(item)`), and may project
 * a `*twTransferItem` template for rich row content.
 */
@Component({
  selector: 'tw-transfer',
  exportAs: 'twTransfer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CdkListbox, CdkOption, CheckboxComponent, InputDirective],
  providers: [
    {
      provide: TW_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => TransferComponent),
    },
  ],
  host: {
    role: 'group',
    '[id]': 'id()',
    '[class]': 'rootClasses()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'resolvedLabelledBy() || null',
    '[attr.aria-describedby]': 'resolvedDescribedBy() || null',
    '[attr.aria-disabled]': 'disabled() || null',
    // NOTE: no `aria-invalid` here. ARIA 1.2 does not allow it on `role="group"`
    // (axe: critical `aria-allowed-attr`). It is carried by the target panel's
    // content region instead — `value` is `targetKeys`, so that panel is the one
    // holding the value. `tags-input` and `file-upload` were corrected the same
    // way in an earlier pass; this component was missed.
    '[attr.data-focused]': 'focused() || null',
  },
  template: `
    <!-- One panel, instantiated twice (source, then target) around the controls. -->
    <ng-template #panelTpl let-panel>
      <div [class]="panelClasses()">
        <div [class]="panelHeaderClasses()">
          @if (showSelectAll()) {
            <tw-checkbox
              [size]="checkboxSize()"
              [checked]="panel.selectAllChecked"
              [indeterminate]="panel.selectAllIndeterminate"
              [disabled]="disabled()"
              [aria-label]="panel.selectAllLabel"
              (change)="onSelectAll(panel.side, $event)"
            />
          }
          <span [id]="panel.titleId" [class]="panelTitleClasses()">{{ panel.title }}</span>
          <span [class]="panelCountClasses()">{{ panel.countText }}</span>
        </div>

        @if (showSearch()) {
          <div [class]="searchClasses()">
            <input
              twInput
              type="text"
              [size]="resolvedSize()"
              [value]="panel.query"
              [disabled]="disabled()"
              [attr.placeholder]="panel.searchPlaceholder"
              [attr.aria-label]="panel.searchPlaceholder"
              (input)="onSearch(panel.side, $event)"
            />
          </div>
        }

        <!-- The cdkListbox is rendered only when it has options. An empty
             role="listbox" violates aria-required-children, so an empty panel
             shows a plain message region instead. -->
        @if (panel.rows.length > 0) {
          <div
            cdkListbox
            [cdkListboxMultiple]="true"
            [cdkListboxValue]="panel.checkedValue"
            [cdkListboxDisabled]="disabled()"
            [cdkListboxCompareWith]="compareKeys"
            [class]="listClasses()"
            [style.height.px]="listHeightPx()"
            [attr.aria-labelledby]="panel.titleId"
            [attr.aria-invalid]="panel.side === 'target' && errorState() ? 'true' : null"
            (cdkListboxValueChange)="onCheckedChange(panel.side, $event)"
          >
            @for (row of panel.rows; track row.key) {
              <div
                [cdkOption]="row.key"
                [cdkOptionDisabled]="row.disabled"
                [cdkOptionTypeaheadLabel]="row.label"
                [class]="row.optionClass"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  [class]="row.checkClass"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.796-6.889a1 1 0 0 1 1.414-.006Z"
                    clip-rule="evenodd"
                  />
                </svg>
                @if (itemTemplate(); as tpl) {
                  <ng-container
                    [ngTemplateOutlet]="tpl.template"
                    [ngTemplateOutletContext]="row.context"
                  />
                } @else {
                  <span [class]="optionLabelClasses()">{{ row.label }}</span>
                }
              </div>
            }
          </div>
        } @else {
          <!--
            Also carries aria-invalid: an empty target is exactly when a required
            transfer is invalid, and the listbox above does not exist to carry it
            (an empty role=listbox would violate aria-required-children).
          -->
          <div
            [class]="emptyClasses()"
            [style.height.px]="listHeightPx()"
            [attr.aria-invalid]="panel.side === 'target' && errorState() ? 'true' : null"
          >{{ panel.emptyText }}</div>
        }
      </div>
    </ng-template>

    <ng-container
      [ngTemplateOutlet]="panelTpl"
      [ngTemplateOutletContext]="{ $implicit: sourcePanel() }"
    />

    <div [class]="controlsClasses()">
      <button
        type="button"
        [class]="moveButtonClasses()"
        [disabled]="disabled() || sourceMovableKeys().length === 0"
        [attr.aria-label]="resolvedLabels().moveToTargetLabel"
        (click)="onMoveToTarget()"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" [class]="moveIconClasses()">
          <path
            fill-rule="evenodd"
            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      @if (!oneWay()) {
        <button
          type="button"
          [class]="moveButtonClasses()"
          [disabled]="disabled() || targetMovableKeys().length === 0"
          [attr.aria-label]="resolvedLabels().moveToSourceLabel"
          (click)="onMoveToSource()"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" [class]="moveIconClasses()">
            <path
              fill-rule="evenodd"
              d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      }
    </div>

    <ng-container
      [ngTemplateOutlet]="panelTpl"
      [ngTemplateOutletContext]="{ $implicit: targetPanel() }"
    />
  `,
})
export class TransferComponent<T = unknown, K = unknown>
  extends FormFieldControl<readonly K[]>
  implements ControlValueAccessor, OnInit
{
  // ── Inputs ──

  /** All items across both panels. The source/target split derives from the value, not the reverse. Defaults to `[]`. */
  readonly data = input<readonly T[]>([]);

  /** Resolves a stable key for an item — drives membership (the value), checked state, tracking, the cdkOption value, and compareWith. Required. */
  readonly keyFn = input.required<(item: T) => K>();

  /** Resolves an item's display label — used for the default row render, search filtering, and listbox typeahead. Defaults to `(item) => String(item)`. */
  readonly labelFn = input<(item: T) => string>((item: T) => String(item));

  /** Per-panel text + ARIA labels. Partial; unset keys fall back to the English defaults. */
  readonly labels = input<Partial<TwTransferLabels>>({});

  /** Visual configuration — size, list viewport height, search / select-all visibility. Partial; unset keys fall back to the defaults. */
  readonly display = input<Partial<TwTransferDisplayConfig>>({});

  /** Behavioural configuration — oneWay, custom filterFn, per-item disabledItem predicate. Partial; unset keys fall back to the defaults. */
  readonly behavior = input<Partial<TwTransferBehaviorConfig<T>>>({});

  /** Disables the entire control — panels non-interactive, search + buttons disabled, muted styling. Also driven by Forms `setDisabledState`. Defaults to `false`. */
  readonly disabledInput = input(false, { alias: 'disabled' });

  /** Marks the control as required. Mirrored to `aria-required` chrome via the form-field; also inferred from `Validators.required` on a bound control. Defaults to `false`. */
  readonly requiredInput = input(false, { alias: 'required' });

  /** Reserved for control identification (e.g. analytics, future native-submission parity). The transfer has no single native value element, so it is not currently reflected to the DOM. Defaults to `undefined`. */
  readonly name = input<string | undefined>(undefined);

  /** Id on the host element. Auto-generated as `tw-transfer-N` when unset. Used by the form-field's `<label for>` association. Alias: `id`. */
  readonly idInput = input<string | undefined>(undefined, { alias: 'id' });

  /** Accessible name applied to the control when no visible label is wired. Mirrored to `aria-label`. Defaults to `undefined`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the control. Mirrored to `aria-labelledby`. Defaults to `undefined`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external element that describes the control. The form-field merges its hint / error ids alongside. Defaults to `undefined`. Alias: `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Per-instance override of the {@link ErrorStateMatcher}. When omitted, uses the `TW_ERROR_STATE_MATCHER` token's value. Defaults to `undefined`. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  // ── Outputs ──

  /** Fires when items move between panels by user interaction. Payload is the new full target-keys array. Does not fire on `writeValue`. */
  readonly valueChange = output<readonly K[]>();

  /** Fires after each directional move, identifying the moved keys and their direction. Does not fire on `writeValue`. */
  readonly moved = output<TwTransferMovedEvent<K>>();

  // ── Content query ──

  /** @internal Consumer-projected per-item template (`*twTransferItem`). */
  readonly itemTemplate = contentChild(TransferItemDefDirective<T>);

  // ── Injected deps ──

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly platform = inject(Platform);

  // ── Identity ──

  private readonly uid = nextId++;
  /** @internal Fallback id used when the consumer does not set `[id]`. */
  readonly hostId = `tw-transfer-${this.uid}`;
  private readonly sourceTitleId = `${this.hostId}-source-title`;
  private readonly targetTitleId = `${this.hostId}-target-title`;

  // ── State signals ──

  /** @internal The value: keys currently on the target side. Source of truth for membership. */
  private readonly targetKeys = signal<readonly K[]>([]);
  /** @internal Per-panel search queries. */
  private readonly sourceQuery = signal('');
  private readonly targetQuery = signal('');

  private readonly cvaDisabled = signal(false);
  private readonly _focused = signal(false);

  /** @internal Shared `errorState` / `required` / `errors` derivation — see `wireErrorState`. */
  private readonly errorWiring = wireErrorState({
    ngControl: () => this.ngControl,
    matcher: () => this.errorStateMatcher(),
    required: () => this.requiredInput(),
    track: [() => this._focused()],
  });
  private readonly describedByIdsSignal = signal<readonly string[]>([]);
  private readonly labelledByIdsSignal = signal<readonly string[]>([]);

  private onChange: (value: readonly K[]) => void = () => {};
  private onTouched: () => void = () => {};

  /** @internal Stable comparator for `[cdkListboxCompareWith]`. Keys are identity-comparable. */
  readonly compareKeys = (a: K, b: K): boolean => Object.is(a, b);

  // ── Resolved config ──

  /**
   * @internal Resolved label record.
   *
   * Explicitly-undefined keys are dropped before merging. Root `tsconfig.json`
   * does not set `exactOptionalPropertyTypes`, so
   * `[labels]="{ moveAnnouncement: i18n.moved }"` type-checks even when the
   * i18n bundle has no such key — and a plain spread would then overwrite the
   * default with `undefined`, which reaches `formatLabel()` and throws
   * `Cannot read properties of undefined (reading 'replace')`. Same filter
   * `table.ts` and `timeline.ts` already use; the `Required<>` annotation only
   * tells the truth once the filter is in place.
   */
  readonly resolvedLabels = computed<Required<TwTransferLabels>>(() => {
    const overrides = Object.fromEntries(
      Object.entries(this.labels() ?? {}).filter(([, value]) => value !== undefined),
    );
    return { ...LABELS_DEFAULTS, ...overrides } as Required<TwTransferLabels>;
  });

  /**
   * @internal Resolved display config. Same explicitly-undefined filter as
   * `resolvedLabels` — a plain spread let `[display]="{ listHeight: undefined }"`
   * reach the list's inline `height` as `undefined`, collapsing the panes.
   */
  private readonly resolvedDisplay = computed<Required<TwTransferDisplayConfig>>(() => {
    const overrides = Object.fromEntries(
      Object.entries(this.display() ?? {}).filter(([, value]) => value !== undefined),
    );
    return { ...DISPLAY_DEFAULTS, ...overrides } as Required<TwTransferDisplayConfig>;
  });

  // Behaviour is resolved inline (not via a `Required<>` const) because `filterFn`
  // is legitimately optional and both predicates are generic over `T`.
  private readonly resolvedBehavior = computed(() => {
    const b = this.behavior();
    return {
      oneWay: b.oneWay ?? false,
      filterFn: b.filterFn,
      disabledItem: b.disabledItem ?? ((_item: T) => false),
    };
  });

  /** @internal */
  readonly resolvedSize = computed<TwSize>(() => this.resolvedDisplay().size);
  /** @internal Checkbox tops out at `lg` density; map xl → lg. */
  readonly checkboxSize = computed<TwSize>(() => {
    const s = this.resolvedSize();
    return s === 'xl' ? 'lg' : s;
  });
  /** @internal */
  readonly showSearch = computed(() => this.resolvedDisplay().showSearch);
  /** @internal */
  readonly showSelectAll = computed(() => this.resolvedDisplay().showSelectAll);
  /** @internal */
  readonly oneWay = computed(() => this.resolvedBehavior().oneWay);
  /** @internal Fixed list height in px, or `null` when `'auto'`. */
  readonly listHeightPx = computed(() => {
    const h = this.resolvedDisplay().listHeight;
    return h === 'auto' ? null : h;
  });

  // ── Derived membership state ──

  /** @internal Map from key to item across all data — for orphan-aware target rendering and disabled lookups. */
  private readonly itemByKey = computed(() => {
    const kf = this.keyFn();
    const map = new Map<K, T>();
    for (const item of this.data()) map.set(kf(item), item);
    return map;
  });

  private readonly targetKeySet = computed(() => new Set(this.targetKeys()));

  /** @internal Items on the source side (in `data` order). */
  private readonly sourceItems = computed<readonly T[]>(() => {
    const inTarget = this.targetKeySet();
    const kf = this.keyFn();
    return this.data().filter((item) => !inTarget.has(kf(item)));
  });

  /** @internal Items on the target side (in `targetKeys` order; orphan keys with no item are skipped). */
  private readonly targetItems = computed<readonly T[]>(() => {
    const map = this.itemByKey();
    const out: T[] = [];
    for (const key of this.targetKeys()) {
      const item = map.get(key);
      if (item !== undefined) out.push(item);
    }
    return out;
  });

  // ── Per-panel row pipelines (source) ──
  // Stage 1 (base) carries no checked flag → renderedKeys / reconciled derive from
  // it without a cycle. Stage 2 augments with checked state + precomputed classes.

  private readonly sourceRowsBase = computed(() =>
    this.toRowsBase(this.filterItems(this.sourceItems(), this.sourceQuery())),
  );
  private readonly sourceRenderedKeys = computed(
    () => new Set(this.sourceRowsBase().map((r) => r.key)),
  );
  /**
   * @internal Ephemeral pending-move checked keys for the source panel — the
   * controlled `[cdkListboxValue]`. A `linkedSignal` over the rendered-key set so
   * it auto-prunes keys whose option a filter / move removed (kept ⊆ rendered → no
   * CdkListbox `_invalid`; dropped keys do not re-surface). Cleared after moves.
   */
  readonly sourceChecked = linkedSignal<ReadonlySet<K>, readonly K[]>({
    source: this.sourceRenderedKeys,
    computation: (rendered, prev) =>
      (prev?.value ?? []).filter((k) => rendered.has(k)),
  });
  private readonly sourceCheckedSet = computed(() => new Set(this.sourceChecked()));
  private readonly sourceRows = computed(() =>
    this.toRows(this.sourceRowsBase(), this.sourceCheckedSet(), 'source'),
  );

  // ── Per-panel row pipelines (target) ──

  private readonly targetRowsBase = computed(() =>
    this.toRowsBase(this.filterItems(this.targetItems(), this.targetQuery())),
  );
  private readonly targetRenderedKeys = computed(
    () => new Set(this.targetRowsBase().map((r) => r.key)),
  );
  /** @internal Ephemeral pending-move checked keys for the target panel — see {@link sourceChecked}. */
  readonly targetChecked = linkedSignal<ReadonlySet<K>, readonly K[]>({
    source: this.targetRenderedKeys,
    computation: (rendered, prev) =>
      (prev?.value ?? []).filter((k) => rendered.has(k)),
  });
  private readonly targetCheckedSet = computed(() => new Set(this.targetChecked()));
  private readonly targetRows = computed(() =>
    this.toRows(this.targetRowsBase(), this.targetCheckedSet(), 'target'),
  );

  // ── Movable + select-all derivations ──

  /** @internal Checked, enabled, visible source keys — what the → button moves. */
  readonly sourceMovableKeys = computed<readonly K[]>(() => {
    const checked = this.sourceCheckedSet();
    return this.sourceRowsBase()
      .filter((r) => !r.disabled && checked.has(r.key))
      .map((r) => r.key);
  });

  /** @internal Checked, enabled, visible target keys — what the ← button moves. */
  readonly targetMovableKeys = computed<readonly K[]>(() => {
    const checked = this.targetCheckedSet();
    return this.targetRowsBase()
      .filter((r) => !r.disabled && checked.has(r.key))
      .map((r) => r.key);
  });

  private readonly sourceSelectAllKeys = computed<readonly K[]>(() =>
    this.sourceRowsBase().filter((r) => !r.disabled).map((r) => r.key),
  );
  private readonly targetSelectAllKeys = computed<readonly K[]>(() =>
    this.targetRowsBase().filter((r) => !r.disabled).map((r) => r.key),
  );

  // ── Panel view-models ──

  /** @internal */
  readonly sourcePanel = computed<PanelView<T, K>>(() =>
    this.buildPanel(
      'source',
      this.sourceTitleId,
      this.resolvedLabels().sourceTitle,
      this.sourceRowsBase(),
      this.sourceRows(),
      this.sourceCheckedSet(),
      this.sourceSelectAllKeys(),
      this.sourceChecked(),
      this.sourceQuery(),
    ),
  );

  /** @internal */
  readonly targetPanel = computed<PanelView<T, K>>(() =>
    this.buildPanel(
      'target',
      this.targetTitleId,
      this.resolvedLabels().targetTitle,
      this.targetRowsBase(),
      this.targetRows(),
      this.targetCheckedSet(),
      this.targetSelectAllKeys(),
      this.targetChecked(),
      this.targetQuery(),
    ),
  );

  // ── tv() class outputs ──

  private readonly variants = computed(() =>
    transferVariants({
      size: this.resolvedSize(),
      disabled: this.disabled(),
    }),
  );

  /** @internal */
  readonly rootClasses = computed(() => this.variants().root());
  /** @internal */
  readonly panelClasses = computed(() => this.variants().panel());
  /** @internal */
  readonly panelHeaderClasses = computed(() => this.variants().panelHeader());
  /** @internal */
  readonly panelTitleClasses = computed(() => this.variants().panelTitle());
  /** @internal */
  readonly panelCountClasses = computed(() => this.variants().panelCount());
  /** @internal */
  readonly searchClasses = computed(() => this.variants().search());
  /** @internal */
  readonly listClasses = computed(() => this.variants().list());
  /** @internal */
  readonly optionLabelClasses = computed(() => this.variants().optionLabel());
  /** @internal */
  readonly controlsClasses = computed(() => this.variants().controls());
  /** @internal */
  readonly moveButtonClasses = computed(() => this.variants().moveButton());
  /** @internal */
  readonly moveIconClasses = computed(() => this.variants().moveIcon());
  /** @internal */
  readonly emptyClasses = computed(() => this.variants().empty());

  constructor() {
    super();
    // Runtime CVA wiring — register on any host-level NgControl. The component
    // injects `NgControl { self }` for TW_ERROR_STATE_MATCHER, so a static
    // NG_VALUE_ACCESSOR provider would create circular DI on the same instance.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    afterNextRender(() => {
      if (isDevMode() && !this.hasAccessibleNameHint()) {
        console.warn(
          '[tw-transfer] The control has no accessible name. Provide `aria-label` / `aria-labelledby`, or wrap it in a <tw-form-field> with a <label twLabel>.',
        );
      }
    });
  }

  // ── Public methods ──

  /** Moves the given items (by key) to the target side; ignores keys already there or whose item is disabled. Clears the source panel's pending checks, emits `valueChange` + `moved`, calls the CVA onChange, and announces the move. No-op when the control is disabled. */
  moveToTarget(keys: readonly K[]): void {
    if (this.disabled()) return;
    const current = this.targetKeys();
    const existing = new Set(current);
    const disabledFn = this.resolvedBehavior().disabledItem;
    const map = this.itemByKey();
    const moved: K[] = [];
    for (const key of keys) {
      if (existing.has(key)) continue;
      const item = map.get(key);
      if (item !== undefined && disabledFn(item)) continue;
      existing.add(key);
      moved.push(key);
    }
    this.sourceChecked.set([]);
    if (!moved.length) return;
    // Append moved keys to the existing array — orphan keys (in the value, not in
    // `data`) are part of `current` and therefore preserved.
    this.applyValue([...current, ...moved], moved, 'toTarget');
  }

  /** Moves the given items (by key) to the source side; ignores keys not on target or whose item is disabled. Clears the target panel's pending checks. No-op when the control is disabled or `behavior.oneWay` is on. Same emissions as {@link moveToTarget}. */
  moveToSource(keys: readonly K[]): void {
    if (this.disabled() || this.resolvedBehavior().oneWay) return;
    const current = this.targetKeys();
    const present = new Set(current);
    const disabledFn = this.resolvedBehavior().disabledItem;
    const map = this.itemByKey();
    const remove = new Set<K>();
    for (const key of keys) {
      if (!present.has(key)) continue;
      const item = map.get(key);
      if (item !== undefined && disabledFn(item)) continue;
      remove.add(key);
    }
    this.targetChecked.set([]);
    if (!remove.size) return;
    // Filter the existing array — unspecified orphan keys are preserved.
    this.applyValue(
      current.filter((k) => !remove.has(k)),
      [...remove],
      'toSource',
    );
  }

  // ── Template event handlers ──

  /** @internal */
  onCheckedChange(side: TwTransferSide, event: ListboxValueChangeEvent<K>): void {
    if (side === 'source') this.sourceChecked.set([...event.value]);
    else this.targetChecked.set([...event.value]);
  }

  /** @internal Select-all toggles the visible, enabled keys for the panel (replace semantics). */
  onSelectAll(side: TwTransferSide, checked: boolean): void {
    if (side === 'source') {
      this.sourceChecked.set(checked ? [...this.sourceSelectAllKeys()] : []);
    } else {
      this.targetChecked.set(checked ? [...this.targetSelectAllKeys()] : []);
    }
  }

  /** @internal */
  onSearch(side: TwTransferSide, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (side === 'source') this.sourceQuery.set(value);
    else this.targetQuery.set(value);
  }

  /** @internal */
  onMoveToTarget(): void {
    this.moveToTarget(this.sourceMovableKeys());
    // The clicked → button disables itself once its checked set drains; a focused
    // element that becomes `disabled` drops focus to <body>. Keep the user in the
    // control by moving focus to the destination listbox (non-empty after a move).
    this.focusDestination('target');
  }

  /** @internal */
  onMoveToSource(): void {
    this.moveToSource(this.targetMovableKeys());
    this.focusDestination('source');
  }

  /**
   * @internal Focuses the destination panel's listbox after the move re-renders.
   * Deferred to the next render (the destination listbox may have just mounted
   * from empty) and matched by its title id rather than DOM order (the *other*
   * panel may have emptied, removing its listbox).
   */
  private focusDestination(side: TwTransferSide): void {
    if (!this.platform.isBrowser) return;
    const titleId = side === 'source' ? this.sourceTitleId : this.targetTitleId;
    afterNextRender(
      () => {
        const listbox = this.elementRef.nativeElement.querySelector(
          `[cdklistbox][aria-labelledby="${titleId}"]`,
        ) as HTMLElement | null;
        listbox?.focus();
      },
      { injector: this.injector },
    );
  }

  // ── Internal helpers ──

  private applyValue(
    next: readonly K[],
    moved: readonly K[],
    direction: 'toTarget' | 'toSource',
  ): void {
    this.targetKeys.set(next);
    this.onChange(next);
    this.valueChange.emit(next);
    this.moved.emit({ keys: moved, direction });
    const labels = this.resolvedLabels();
    const dest = direction === 'toTarget' ? labels.targetTitle : labels.sourceTitle;
    this.liveAnnouncer.announce(
      formatLabel(labels.moveAnnouncement, { count: moved.length, target: dest }),
      'polite',
    );
  }

  private filterItems(items: readonly T[], query: string): readonly T[] {
    const q = query.trim();
    if (!q) return items;
    const custom = this.resolvedBehavior().filterFn;
    if (custom) return items.filter((item) => custom(item, q));
    const labelFn = this.labelFn();
    const lower = q.toLowerCase();
    return items.filter((item) => labelFn(item).toLowerCase().includes(lower));
  }

  private toRowsBase(items: readonly T[]): RowBase<T, K>[] {
    const kf = this.keyFn();
    const labelFn = this.labelFn();
    const disabledFn = this.resolvedBehavior().disabledItem;
    return items.map((item) => ({
      item,
      key: kf(item),
      label: labelFn(item),
      disabled: disabledFn(item),
    }));
  }

  private toRows(
    base: readonly RowBase<T, K>[],
    checked: ReadonlySet<K>,
    side: TwTransferSide,
  ): RowView<T, K>[] {
    const size = this.resolvedSize();
    return base.map((b) => {
      const isChecked = checked.has(b.key);
      const v = transferVariants({
        size,
        checked: isChecked,
        optionDisabled: b.disabled,
      });
      return {
        ...b,
        checked: isChecked,
        optionClass: v.option(),
        checkClass: v.optionCheck(),
        context: {
          $implicit: b.item,
          label: b.label,
          checked: isChecked,
          disabled: b.disabled,
          side,
        },
      };
    });
  }

  private buildPanel(
    side: TwTransferSide,
    titleId: string,
    title: string,
    base: readonly RowBase<T, K>[],
    rows: readonly RowView<T, K>[],
    checked: ReadonlySet<K>,
    selectAllKeys: readonly K[],
    checkedValue: readonly K[],
    query: string,
  ): PanelView<T, K> {
    const labels = this.resolvedLabels();
    const selectedCount = rows.reduce((n, r) => (r.checked ? n + 1 : n), 0);
    const state = this.selectAllState(selectAllKeys, checked);
    return {
      side,
      title,
      titleId,
      countText: formatLabel(labels.countFormat, {
        total: base.length,
        selected: selectedCount,
      }),
      emptyText: labels.emptyText,
      searchPlaceholder: labels.searchPlaceholder,
      selectAllLabel: labels.selectAllLabel,
      query,
      rows,
      checkedValue,
      selectAllChecked: state === 'checked',
      selectAllIndeterminate: state === 'indeterminate',
    };
  }

  private selectAllState(
    enabledKeys: readonly K[],
    checked: ReadonlySet<K>,
  ): 'checked' | 'indeterminate' | 'unchecked' {
    if (enabledKeys.length === 0) return 'unchecked';
    let n = 0;
    for (const key of enabledKeys) if (checked.has(key)) n++;
    if (n === 0) return 'unchecked';
    if (n === enabledKeys.length) return 'checked';
    return 'indeterminate';
  }

  private hasAccessibleNameHint(): boolean {
    return (
      !!this.ariaLabel() ||
      !!this.ariaLabelledby() ||
      this.labelledByIdsSignal().length > 0
    );
  }

  // ── FormFieldControl signals ──

  /** @internal */
  readonly id: Signal<string> = computed(() => this.idInput() ?? this.hostId);

  /** The current target-keys array. Doubles as the `FormFieldControl` value member. */
  readonly value: Signal<readonly K[]> = this.targetKeys.asReadonly();

  /** @internal */
  readonly focused: Signal<boolean> = this._focused.asReadonly();

  /** @internal Empty when nothing is on the target side — drives the form-field floating label. */
  readonly empty: Signal<boolean> = computed(() => this.targetKeys().length === 0);

  /** @internal */
  readonly disabled: Signal<boolean> = computed(
    () => this.disabledInput() || this.cvaDisabled(),
  );

  /** @internal */
  readonly required: Signal<boolean> = this.errorWiring.required;

  /** @internal */
  readonly errorState: Signal<boolean> = this.errorWiring.errorState;

  /** @internal Active validation errors from the bound control, for `[twError match="…"]` filtering. */
  override readonly errors = this.errorWiring.errors;

  /** @internal */
  readonly controlType = 'transfer';

  /** @internal */
  readonly userAriaDescribedBy: Signal<string | undefined> = computed(() =>
    this.ariaDescribedby(),
  );

  /** @internal */
  override readonly userAriaLabelledby: Signal<string | undefined> = computed(() =>
    this.ariaLabelledby(),
  );

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

  // ── ControlValueAccessor ──

  writeValue(value: readonly K[] | null | undefined): void {
    // Orphan keys (present here but absent from `data`) are preserved — they render
    // nothing but survive the round-trip, so a form value outlives a lagging `data`.
    this.targetKeys.set(Array.isArray(value) ? [...value] : []);
    this.sourceChecked.set([]);
    this.targetChecked.set([]);
  }

  registerOnChange(fn: (value: readonly K[]) => void): void {
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

  /** @internal Clicking the form-field surface focuses the first listbox. */
  onContainerClick(event: MouseEvent): void {
    if (this.disabled() || event.defaultPrevented) return;
    const host = this.elementRef.nativeElement;
    if (event.target !== host && host.contains(event.target as Node)) return;
    const listbox = host.querySelector('[cdklistbox]') as HTMLElement | null;
    listbox?.focus();
  }

  // ── Lifecycle ──

  ngOnInit(): void {
    // Host-level focus monitor (checkChildren: true): internal focus moves between
    // the two listboxes / buttons / search stay "focused"; origin === null fires
    // only when focus leaves the WHOLE control — the single source for onTouched.
    this.focusMonitor
      .monitor(this.elementRef, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((origin) => {
        const wasFocused = this._focused();
        this._focused.set(!!origin);
        if (wasFocused && !origin) {
          this.onTouched();
          this.errorWiring.bump();
        }
      });
    this.destroyRef.onDestroy(() => this.focusMonitor.stopMonitoring(this.elementRef));

    // React to status/value changes on the bound control so errorState recomputes.
    this.errorWiring.connect();
  }
}
