import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  QueryList,
  ViewChildren,
  DestroyRef,
  Directive,
  inject,
  input,
  signal,
  TemplateRef,
  type AfterViewInit,
  type Provider,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  CdkStep,
  CdkStepHeader,
  CdkStepLabel,
  CdkStepper,
  CdkStepperNext,
  CdkStepperPrevious,
  STEP_STATE,
  STEPPER_GLOBAL_OPTIONS,
  type StepperOptions,
  type StepperOrientation,
  type StepperSelectionEvent,
  type StepState,
} from '@angular/cdk/stepper';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

/** Visual style of the step indicator strip. */
export type StepperVariant = 'default' | 'dot' | 'simple';

/** Context passed to custom `*twStepperIcon` templates. */
export interface StepperIconContext {
  $implicit: { index: number; active: boolean };
}

// ── tv() config ──

const stepperVariants = tv(
  {
    slots: {
      root: 'flex',
      header: 'flex',
      stepItem: 'flex',
      stepHeader:
        'group relative inline-flex items-center gap-2 cursor-pointer transition-colors duration-normal motion-reduce:transition-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed',
      stepIndicator:
        'inline-flex items-center justify-center shrink-0 rounded-full font-medium transition-[color,background-color,border-color,box-shadow] duration-normal motion-reduce:transition-none',
      stepNumber: 'leading-none',
      stepIconSlot: 'inline-flex items-center justify-center',
      stepLabelWrapper: 'flex flex-col min-w-0 text-left',
      stepLabel: 'leading-tight',
      stepDescription: 'text-xs text-fg-muted leading-tight mt-0.5',
      stepOptionalHint: 'text-xs text-fg-subtle ml-1 font-normal',
      stepConnector:
        'shrink-0 transition-colors duration-normal motion-reduce:transition-none',
      stepPanel: 'min-w-0',
    },
    variants: {
      variant: {
        default: {},
        dot: {
          stepNumber: 'hidden',
          stepIconSlot: 'hidden',
        },
        simple: {
          stepLabelWrapper: 'sr-only',
        },
      },
      size: {
        xs: {
          stepIndicator: 'size-6 text-xs',
          stepLabel: 'text-xs',
        },
        sm: {
          stepIndicator: 'size-7 text-xs',
          stepLabel: 'text-sm',
        },
        md: {
          stepIndicator: 'size-8 text-sm',
          stepLabel: 'text-sm',
        },
        // lg/xl step labels use `text-base` per the trigger font-size scale
        // (CLAUDE.md typography). Steps are interactive trigger elements.
        lg: {
          stepIndicator: 'size-10 text-base',
          stepLabel: 'text-base',
        },
        xl: {
          stepIndicator: 'size-12 text-base',
          stepLabel: 'text-base',
        },
      },
      orientation: {
        horizontal: {
          root: 'flex-col w-full',
          header: 'flex-row items-center w-full',
          stepItem: 'flex-row items-center flex-1 last:flex-none',
          stepConnector: 'flex-1 h-px mx-2',
          stepLabelWrapper: 'ml-2',
          stepPanel:
            'mt-4 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 motion-reduce:transition-none',
        },
        vertical: {
          root: 'flex-col',
          header: 'flex-col items-stretch',
          stepItem: 'flex-col items-start w-full',
          stepConnector: 'w-px min-h-6 ml-4 my-1 flex-1',
          stepLabelWrapper: 'ml-3',
          stepPanel:
            'ml-11 mt-2 mb-4 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 motion-reduce:transition-none',
        },
      },
    },
    compoundVariants: [
      // Dot variant indicator sizing
      { variant: 'dot', size: 'xs', class: { stepIndicator: 'size-2' } },
      { variant: 'dot', size: 'sm', class: { stepIndicator: 'size-2.5' } },
      { variant: 'dot', size: 'md', class: { stepIndicator: 'size-2.5' } },
      { variant: 'dot', size: 'lg', class: { stepIndicator: 'size-3' } },
      { variant: 'dot', size: 'xl', class: { stepIndicator: 'size-3' } },

      // Thicker connectors for lg / xl
      {
        orientation: 'horizontal',
        size: 'lg',
        class: { stepConnector: 'h-0.5' },
      },
      {
        orientation: 'horizontal',
        size: 'xl',
        class: { stepConnector: 'h-0.5' },
      },
      { orientation: 'vertical', size: 'lg', class: { stepConnector: 'w-0.5' } },
      { orientation: 'vertical', size: 'xl', class: { stepConnector: 'w-0.5' } },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      orientation: 'horizontal',
    },
  },
  { twMerge: true },
);

// ── Static class lookups (Tailwind v4 requires statically-written class strings) ──

type StepStyleState = 'pending' | 'active' | 'completed' | 'error' | 'disabled';

const INDICATOR_PENDING =
  'bg-surface-muted text-fg-muted border border-border';
const INDICATOR_DISABLED =
  'bg-surface-muted text-fg-subtle border border-border opacity-60';
const INDICATOR_ERROR =
  'bg-error-solid text-error-solid-fg border border-error-border-strong';

// Slot tokens own light/dark contrast — no `dark:`, no shade picks.
// The active-state ring uses `{role}-soft` (low-chroma in light, deep-tinted in
// dark) so the halo reads consistently against the surface in both modes.
const INDICATOR_ACTIVE: Record<TwColor, string> = {
  primary: 'bg-primary-solid text-primary-solid-fg border border-primary-border-strong ring-4 ring-primary-soft',
  secondary: 'bg-secondary-solid text-secondary-solid-fg border border-secondary-border-strong ring-4 ring-secondary-soft',
  accent: 'bg-accent-solid text-accent-solid-fg border border-accent-border-strong ring-4 ring-accent-soft',
  neutral: 'bg-neutral-solid text-neutral-solid-fg border border-neutral-border-strong ring-4 ring-neutral-soft',
  info: 'bg-info-solid text-info-solid-fg border border-info-border-strong ring-4 ring-info-soft',
  success: 'bg-success-solid text-success-solid-fg border border-success-border-strong ring-4 ring-success-soft',
  warning: 'bg-warning-solid text-warning-solid-fg border border-warning-border-strong ring-4 ring-warning-soft',
  error: 'bg-error-solid text-error-solid-fg border border-error-border-strong ring-4 ring-error-soft',
};

const INDICATOR_COMPLETED: Record<TwColor, string> = {
  primary: 'bg-primary-solid text-primary-solid-fg border border-primary-border-strong',
  secondary: 'bg-secondary-solid text-secondary-solid-fg border border-secondary-border-strong',
  accent: 'bg-accent-solid text-accent-solid-fg border border-accent-border-strong',
  neutral: 'bg-neutral-solid text-neutral-solid-fg border border-neutral-border-strong',
  info: 'bg-info-solid text-info-solid-fg border border-info-border-strong',
  success: 'bg-success-solid text-success-solid-fg border border-success-border-strong',
  warning: 'bg-warning-solid text-warning-solid-fg border border-warning-border-strong',
  error: 'bg-error-solid text-error-solid-fg border border-error-border-strong',
};

const LABEL_PENDING = 'text-fg-muted';
const LABEL_COMPLETED = 'text-fg';
const LABEL_DISABLED = 'text-fg-subtle';
const LABEL_ERROR = 'text-error-fg font-semibold';

const LABEL_ACTIVE: Record<TwColor, string> = {
  primary: 'text-primary-fg font-semibold',
  secondary: 'text-secondary-fg font-semibold',
  accent: 'text-accent-fg font-semibold',
  neutral: 'text-fg font-semibold',
  info: 'text-info-fg font-semibold',
  success: 'text-success-fg font-semibold',
  warning: 'text-warning-fg font-semibold',
  error: 'text-error-fg font-semibold',
};

const CONNECTOR_DEFAULT = 'bg-border';
const CONNECTOR_ERROR = 'bg-error-border-strong';
const CONNECTOR_REACHED: Record<TwColor, string> = {
  primary: 'bg-primary-border-strong',
  secondary: 'bg-secondary-border-strong',
  accent: 'bg-accent-border-strong',
  neutral: 'bg-neutral-border-strong',
  info: 'bg-info-border-strong',
  success: 'bg-success-border-strong',
  warning: 'bg-warning-border-strong',
  error: 'bg-error-border-strong',
};

function resolveIndicatorClasses(state: StepStyleState, color: TwColor): string {
  switch (state) {
    case 'pending':
      return INDICATOR_PENDING;
    case 'disabled':
      return INDICATOR_DISABLED;
    case 'error':
      return INDICATOR_ERROR;
    case 'active':
      return INDICATOR_ACTIVE[color];
    case 'completed':
      return INDICATOR_COMPLETED[color];
  }
}

function resolveLabelClasses(state: StepStyleState, color: TwColor): string {
  switch (state) {
    case 'pending':
      return LABEL_PENDING;
    case 'completed':
      return LABEL_COMPLETED;
    case 'disabled':
      return LABEL_DISABLED;
    case 'error':
      return LABEL_ERROR;
    case 'active':
      return LABEL_ACTIVE[color];
  }
}

function resolveConnectorClasses(state: StepStyleState, color: TwColor): string {
  if (state === 'error') return CONNECTOR_ERROR;
  if (state === 'completed' || state === 'active') return CONNECTOR_REACHED[color];
  return CONNECTOR_DEFAULT;
}

// ── StepperIconDirective ──

/**
 * Structural-style directive on an `<ng-template>` that replaces the default
 * indicator icon for a given step state.
 */
@Directive({
  selector: 'ng-template[twStepperIcon]',
})
export class StepperIconDirective {
  /** Step state this template overrides. Matches CDK's `StepState` values (`'number' | 'edit' | 'done' | 'error'`). */
  readonly state = input<StepState | undefined>(undefined);

  /** @internal */
  readonly templateRef = inject(TemplateRef<StepperIconContext>);
}

// ── StepLabelDirective ──

/**
 * Structural-style directive on an `<ng-template>` used as a custom step header
 * label. Consumers write `<ng-template twStepLabel>…</ng-template>` inside `<tw-step>`.
 */
@Directive({
  selector: 'ng-template[twStepLabel]',
  providers: [{ provide: CdkStepLabel, useExisting: StepLabelDirective }],
})
export class StepLabelDirective extends CdkStepLabel {}

// ── StepComponent ──

@Component({
  selector: 'tw-step',
  template: '<ng-template><ng-content/></ng-template>',
  exportAs: 'twStep',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: CdkStep, useExisting: StepComponent }],
})
export class StepComponent extends CdkStep {
  /** Optional descriptive text shown under the step label in the `'default'` variant. */
  readonly description = input('');

  /** @internal Custom indicator icon templates (one per state) projected into this step. */
  readonly iconTemplates = contentChildren(StepperIconDirective);
}

// ── StepperComponent ──

@Component({
  selector: 'tw-stepper',
  templateUrl: './stepper.html',
  exportAs: 'twStepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CdkStepHeader],
  providers: [{ provide: CdkStepper, useExisting: StepperComponent }],
  host: {
    '[class]': 'rootClasses()',
  },
})
export class StepperComponent extends CdkStepper implements AfterViewInit {
  /** Visual style of the indicator strip. `'default'` = numbered circles, `'dot'` = compact filled dots, `'simple'` = indicators only (labels hidden visually). Defaults to `'default'`. */
  readonly variant = input<StepperVariant>('default');

  /** Semantic color for active and completed indicators and connectors. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls indicator size and label typography. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** When true, steps with `hasError` render error styling, icon, and `aria-invalid`. Defaults to `true` — error states must be visible by default, since silently swallowing a stepped flow's failure state is a UX regression; the special case is opting out per step. */
  readonly showError = input(true);

  /** When true, clicking a navigable step header selects it. Set to `false` to only allow advancement via `twStepperNext` / `twStepperPrevious`. Defaults to `true` — free navigation is the standard stepper UX; the special case is a restricted flow such as a wizard that must complete in order. */
  readonly headerInteractive = input(true);

  private readonly _liveAnnouncer = inject(LiveAnnouncer);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _globalOptions = inject(STEPPER_GLOBAL_OPTIONS, { optional: true });

  /**
   * CdkStepper exposes its state via class properties (selectedIndex,
   * previousIndex, orientation), not signals. We mirror those into signals so
   * templates can react via @if/@for and OnPush change detection works without
   * manual `markForCheck`. Sync happens in the property setters and lifecycle
   * hooks below — keep these mirrors in lock-step with the CDK fields.
   */
  private readonly _orientationSignal = signal<StepperOrientation>('horizontal');
  private readonly _selectedIndexSignal = signal(0);
  private readonly _previousIndexSignal = signal(0);

  /** @internal Reactive mirror of CDK's `orientation` input. */
  readonly orientationValue = this._orientationSignal.asReadonly();

  /** @internal Reactive mirror of CDK's `selectedIndex`. */
  readonly selectedIndexValue = this._selectedIndexSignal.asReadonly();

  override set orientation(value: StepperOrientation) {
    super.orientation = value;
    this._orientationSignal.set(value);
  }
  override get orientation(): StepperOrientation {
    return super.orientation;
  }

  // ── ARIA shape ──
  //
  // Horizontal renders the WAI-ARIA tabs pattern (tablist / tab / tabpanel,
  // with the panel outside the strip). Vertical renders the panel INSIDE the
  // strip, and a tablist may own nothing but tabs — axe fails that with
  // "Element has children which are not allowed: [role=tabpanel]" — so the
  // vertical strip is exposed as a stack of disclosure buttons instead
  // (plain button + aria-expanded, panel as a named group).

  /** @internal Whether the header strip is exposed as a WAI-ARIA tablist. True for horizontal orientation only. */
  readonly usesTabPattern = computed(() => this._orientationSignal() === 'horizontal');

  /** @internal Whether a step renders its panel inline beneath its own header (vertical orientation, selected step, step has content). */
  hasInlinePanel(step: StepComponent, index: number): boolean {
    return (
      this._orientationSignal() === 'vertical' &&
      this._selectedIndexSignal() === index &&
      !!step.content
    );
  }

  /**
   * @internal Id the step header's `aria-controls` points at, or `null`.
   *
   * Vertical headers only claim control of a panel that is actually in the
   * DOM: an `aria-expanded="true"` button pointing at a missing id is an
   * invalid reference, whereas the collapsed steps simply carry no
   * `aria-controls` at all.
   */
  controlledPanelId(step: StepComponent, index: number): string | null {
    if (this.usesTabPattern()) return this._getStepContentId(index);
    return this.hasInlinePanel(step, index) ? this._getStepContentId(index) : null;
  }

  private readonly _variantResult = computed(() =>
    stepperVariants({
      variant: this.variant(),
      size: this.size(),
      orientation: this._orientationSignal(),
    }),
  );

  readonly rootClasses = computed(() => this._variantResult().root());
  readonly headerClasses = computed(() => this._variantResult().header());
  readonly stepItemClasses = computed(() => this._variantResult().stepItem());
  readonly stepHeaderClasses = computed(() => this._variantResult().stepHeader());
  readonly stepIndicatorBaseClasses = computed(() => this._variantResult().stepIndicator());
  readonly stepNumberClasses = computed(() => this._variantResult().stepNumber());
  readonly stepIconSlotClasses = computed(() => this._variantResult().stepIconSlot());
  readonly stepLabelWrapperClasses = computed(() => this._variantResult().stepLabelWrapper());
  readonly stepLabelBaseClasses = computed(() => this._variantResult().stepLabel());
  readonly stepDescriptionClasses = computed(() => this._variantResult().stepDescription());
  readonly stepOptionalHintClasses = computed(() => this._variantResult().stepOptionalHint());
  readonly stepConnectorBaseClasses = computed(() => this._variantResult().stepConnector());
  readonly stepPanelClasses = computed(() => this._variantResult().stepPanel());

  readonly panelAnimationClass = computed(() => {
    if (this._orientationSignal() === 'vertical') return null;
    return this._selectedIndexSignal() >= this._previousIndexSignal()
      ? 'step-panel-enter-forward'
      : 'step-panel-enter-backward';
  });

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._orientationSignal.set(this.orientation);
    this._selectedIndexSignal.set(this.selectedIndex);
    this._previousIndexSignal.set(this.selectedIndex);
    this.syncFocusIndex();

    this.selectionChange
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((event: StepperSelectionEvent) => {
        this.syncFocusIndex();
        this._previousIndexSignal.set(event.previouslySelectedIndex);
        this._selectedIndexSignal.set(event.selectedIndex);
        this._orientationSignal.set(this.orientation);

        const total = this.steps.length;
        const label =
          event.selectedStep.label || `Step ${event.selectedIndex + 1}`;
        this._liveAnnouncer.announce(
          `${label}, step ${event.selectedIndex + 1} of ${total}`,
        );
      });
  }

  /** @internal Typed view of projected steps. */
  get twSteps(): readonly StepComponent[] {
    return this.steps.toArray() as StepComponent[];
  }

  /** @internal Resolves the visual state of a step for color/theming purposes. */
  getStepStyleState(step: StepComponent, index: number): StepStyleState {
    if (this.shouldRenderError(step)) return 'error';
    if (index === this._selectedIndexSignal()) return 'active';
    const itype = step.indicatorType();
    if (itype === STEP_STATE.DONE || itype === STEP_STATE.EDIT) return 'completed';
    if (this.linear && !step.isNavigable()) return 'disabled';
    return 'pending';
  }

  /** @internal */
  getIndicatorClass(step: StepComponent, index: number): string {
    const state = this.getStepStyleState(step, index);
    return `${this.stepIndicatorBaseClasses()} ${resolveIndicatorClasses(state, this.color())}`;
  }

  /** @internal */
  getLabelClass(step: StepComponent, index: number): string {
    const state = this.getStepStyleState(step, index);
    return `${this.stepLabelBaseClasses()} ${resolveLabelClasses(state, this.color())}`;
  }

  /** @internal */
  getConnectorClass(step: StepComponent, index: number): string {
    const state = this.getStepStyleState(step, index);
    return `${this.stepConnectorBaseClasses()} ${resolveConnectorClasses(state, this.color())}`;
  }

  /** @internal Resolves which indicator glyph to render for a step. */
  getIndicatorType(step: StepComponent): StepState {
    if (this.shouldRenderError(step)) return STEP_STATE.ERROR as StepState;
    return step.indicatorType() as StepState;
  }

  /** @internal Looks up a consumer-supplied custom template for a given indicator state. */
  resolveIconTemplate(
    step: StepComponent,
    state: StepState,
  ): TemplateRef<StepperIconContext> | null {
    const templates = step.iconTemplates();
    const match = templates.find((t) => t.state() === state);
    return match ? match.templateRef : null;
  }

  /** @internal Context supplied to custom icon templates. */
  iconContext(index: number): StepperIconContext {
    return {
      $implicit: {
        index,
        active: index === this._selectedIndexSignal(),
      },
    };
  }

  /** @internal Click handler for the step header button. */
  /**
   * @internal Re-declares CdkStepper's `_stepHeader` query as a **view** query.
   *
   * CdkStepper declares it as `@ContentChildren`, which assumes the host
   * projects its own headers. `tw-stepper` renders the header strip inside its
   * own template instead, so the base query matched nothing: `_sortedHeaders`
   * stayed empty, the FocusKeyManager had zero items, and arrow-key navigation
   * silently did nothing at all. Angular Material overrides the same query for
   * the same reason.
   *
   * Decorator form, not `viewChildren()`, because CdkStepper subscribes to
   * `_stepHeader.changes` — a QueryList API that signal queries do not expose.
   */
  @ViewChildren(CdkStepHeader) override _stepHeader = new QueryList<CdkStepHeader>();

  /**
   * @internal Which step header currently holds the single tab stop.
   *
   * Mirrors CdkStepper's `_getFocusIndex()` into a signal because that method
   * reads `_keyManager.activeItemIndex`, a plain property — and CdkStepper's
   * `_onKeydown` does not call `_stateChanged()` on the arrow-key path, so an
   * OnPush template binding straight to `_getFocusIndex()` would render the
   * roving tabindex once and then go stale the moment the user arrows.
   */
  readonly focusIndexValue = signal(0);

  /** @internal Re-reads the CDK key manager's active item into `focusIndexValue`. */
  private syncFocusIndex(): void {
    this.focusIndexValue.set(this._getFocusIndex() ?? this.selectedIndex);
  }

  /** @internal Relays tablist keydown to CdkStepper, then republishes the tab stop. */
  onTablistKeydown(event: KeyboardEvent): void {
    this._onKeydown(event);
    this.syncFocusIndex();
  }

  /** @internal Selects a step from a header click. Ignored when `headerInteractive` is false or the step is not navigable. */
  onHeaderClick(step: StepComponent, index: number): void {
    if (!this.headerInteractive()) return;
    if (!step.isNavigable()) return;
    this.selectedIndex = index;
    this.syncFocusIndex();
  }

  /** @internal Whether the stepper should render the error state for a step. */
  shouldRenderError(step: StepComponent): boolean {
    if (!this.showError()) return false;
    if (this._globalOptions?.showError === false) return false;
    return step.hasError;
  }
}

// ── Next / Previous directives (hostDirectives over CDK) ──

@Directive({
  selector: 'button[twStepperNext]',
  hostDirectives: [{ directive: CdkStepperNext, inputs: ['type'] }],
})
export class StepperNextDirective {}

@Directive({
  selector: 'button[twStepperPrevious]',
  hostDirectives: [{ directive: CdkStepperPrevious, inputs: ['type'] }],
})
export class StepperPreviousDirective {}

// ── Provider helper ──

/** Provides app-wide stepper defaults via `STEPPER_GLOBAL_OPTIONS`. */
export function provideTwStepperOptions(options: StepperOptions): Provider[] {
  return [{ provide: STEPPER_GLOBAL_OPTIONS, useValue: options }];
}
