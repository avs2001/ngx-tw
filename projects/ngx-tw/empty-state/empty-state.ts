import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import { IconComponent } from '@cdevhub/ngx-tw/icon';

/** Layout style of the empty state. */
export type EmptyStateVariant = 'centered' | 'inline';

/** Heading level for the title element. Matches native `<h1>`–`<h6>`. */
export type EmptyStateTitleLevel = 1 | 2 | 3 | 4 | 5 | 6;

const emptyState = tv({
  slots: {
    root: 'text-fg',
    iconWrapper: 'text-fg-subtle shrink-0',
    // Title typography is constant across all sizes per CLAUDE.md typography
    // rules: `text-base` is permitted only for the codified tw-item lg
    // exception. Consumers wanting a larger heading project
    // `*twEmptyStateTitle` with their own typography.
    title: 'text-sm font-semibold text-fg',
    description: 'text-fg-muted',
    actions: 'flex flex-wrap items-center gap-2',
  },
  variants: {
    variant: {
      centered: {
        root: 'flex flex-col items-center justify-center text-center',
        actions: 'justify-center',
      },
      inline: {
        root: 'flex flex-row items-center text-left',
        actions: 'ml-auto',
      },
    },
    size: {
      xs: {
        root: 'p-2 gap-1.5',
        description: 'text-xs',
      },
      sm: {
        root: 'p-3 gap-2',
        description: 'text-sm',
      },
      md: {
        root: 'p-4 gap-3',
        description: 'text-sm',
      },
      lg: {
        root: 'p-6 gap-3',
        description: 'text-sm',
      },
      xl: {
        root: 'p-8 gap-3',
        description: 'text-sm',
      },
    },
  },
  compoundVariants: [
    // Inline variant tightens vertical padding regardless of size so the
    // empty state can act as a table row without dominating row height. The
    // horizontal padding still comes from the size's root entry.
    //
    // The py-1.5 → py-2 → py-3 → py-4 → py-5 progression is design-specified
    // off the canonical inline-padding scale: each step keeps the inline
    // empty state visually distinct from adjacent rows without jumping a
    // full container-padding step (py-6 / py-8) and crowding the row.
    // py-1.5 matches the sm inline-padding density; py-5 is the in-between
    // step before xl rows take a container-padding step.
    { variant: 'inline', size: 'xs', class: { root: 'py-1.5 gap-2' } },
    { variant: 'inline', size: 'sm', class: { root: 'py-2 gap-3' } },
    { variant: 'inline', size: 'md', class: { root: 'py-3 gap-3' } },
    { variant: 'inline', size: 'lg', class: { root: 'py-4 gap-3' } },
    { variant: 'inline', size: 'xl', class: { root: 'py-5 gap-3' } },
  ],
  defaultVariants: {
    variant: 'centered',
    size: 'md',
  },
}, {
  twMerge: true,
});

/**
 * Icon-slot marker. Project an icon element with `twEmptyStateIcon` to
 * replace the fallback `<tw-icon name="inbox">`.
 *
 * @example
 * ```html
 * <tw-empty-state>
 *   <tw-icon twEmptyStateIcon name="search" />
 * </tw-empty-state>
 * ```
 */
@Directive({
  selector: '[twEmptyStateIcon]',
})
export class EmptyStateIconDirective {}

/**
 * Structural title slot. Captures a `TemplateRef` so the heading can be
 * rendered into the dynamic `<h1>`–`<h6>` wrapper at runtime.
 *
 * @example
 * ```html
 * <tw-empty-state>
 *   <span *twEmptyStateTitle>No results <tw-badge>0</tw-badge></span>
 * </tw-empty-state>
 * ```
 */
@Directive({
  selector: '[twEmptyStateTitle]',
})
export class EmptyStateTitleDirective {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Structural description slot. Captures a `TemplateRef` so the content can
 * be rendered into the `<p>` wrapper.
 *
 * @example
 * ```html
 * <tw-empty-state>
 *   <span *twEmptyStateDescription>Try a <a href="…">different search</a>.</span>
 * </tw-empty-state>
 * ```
 */
@Directive({
  selector: '[twEmptyStateDescription]',
})
export class EmptyStateDescriptionDirective {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Actions-slot directive. Carries the actions row classes (`flex gap-2` etc.) on its host. */
@Directive({
  selector: '[twEmptyStateActions]',
  host: {
    '[class]': 'classes()',
  },
})
export class EmptyStateActionsDirective {
  private readonly emptyStateRef = inject(EmptyStateComponent);
  readonly classes = this.emptyStateRef.actionsClasses;
}

/**
 * Zero-data layout primitive. Renders an icon, title, description, and
 * actions for surfaces that have nothing to display.
 *
 * The component is intentionally neutral — accent comes from projected
 * action buttons. It does not announce itself: consumers that want a live
 * announcement (e.g. "no search results found") wrap the component with
 * `<div role="status" aria-live="polite">…</div>` themselves.
 */
@Component({
  selector: 'tw-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet],
  host: {
    '[class]': 'rootClasses()',
  },
  template: `
    <ng-template #titleBody>
      @if (titleSlot(); as slot) {
        <ng-container [ngTemplateOutlet]="slot.templateRef" />
      } @else {
        {{ title() }}
      }
    </ng-template>

    <ng-template #descriptionBody>
      @if (descriptionSlot(); as slot) {
        <ng-container [ngTemplateOutlet]="slot.templateRef" />
      } @else {
        {{ description() }}
      }
    </ng-template>

    <ng-template #titleBlock>
      @switch (titleLevel()) {
        @case (1) { <h1 [class]="titleClasses()"><ng-container [ngTemplateOutlet]="titleBody" /></h1> }
        @case (2) { <h2 [class]="titleClasses()"><ng-container [ngTemplateOutlet]="titleBody" /></h2> }
        @case (4) { <h4 [class]="titleClasses()"><ng-container [ngTemplateOutlet]="titleBody" /></h4> }
        @case (5) { <h5 [class]="titleClasses()"><ng-container [ngTemplateOutlet]="titleBody" /></h5> }
        @case (6) { <h6 [class]="titleClasses()"><ng-container [ngTemplateOutlet]="titleBody" /></h6> }
        @default { <h3 [class]="titleClasses()"><ng-container [ngTemplateOutlet]="titleBody" /></h3> }
      }
    </ng-template>

    <ng-template #descriptionBlock>
      <p [class]="descriptionClasses()"><ng-container [ngTemplateOutlet]="descriptionBody" /></p>
    </ng-template>

    <div [class]="iconWrapperClasses()">
      <ng-content select="[twEmptyStateIcon]">
        <tw-icon name="inbox" [size]="iconSize()" aria-hidden="true" />
      </ng-content>
    </div>

    @if (variant() === 'inline' && (hasTitle() || hasDescription())) {
      <div class="min-w-0 flex-1">
        @if (hasTitle()) { <ng-container [ngTemplateOutlet]="titleBlock" /> }
        @if (hasDescription()) { <ng-container [ngTemplateOutlet]="descriptionBlock" /> }
      </div>
    } @else {
      @if (hasTitle()) { <ng-container [ngTemplateOutlet]="titleBlock" /> }
      @if (hasDescription()) { <ng-container [ngTemplateOutlet]="descriptionBlock" /> }
    }

    <ng-content select="[twEmptyStateActions]" />
  `,
})
export class EmptyStateComponent {
  /** Controls overall spacing and icon scale. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Layout style. `'centered'` stacks icon/title/description/actions vertically with center alignment for full-region usage; `'inline'` arranges them horizontally for compact rows. Defaults to `'centered'`. */
  readonly variant = input<EmptyStateVariant>('centered');

  /** Primary heading text. Projected `*twEmptyStateTitle` content takes precedence. Defaults to `undefined`. */
  readonly title = input<string>();

  /** Secondary descriptive text. Projected `*twEmptyStateDescription` content takes precedence. Defaults to `undefined`. */
  readonly description = input<string>();

  /** Heading level used for the title element. Set to match the surrounding document outline. Defaults to `3`. */
  readonly titleLevel = input<EmptyStateTitleLevel>(3);

  /** @internal */
  readonly titleSlot = contentChild(EmptyStateTitleDirective);
  /** @internal */
  readonly descriptionSlot = contentChild(EmptyStateDescriptionDirective);

  readonly hasTitleSlot = computed(() => !!this.titleSlot());
  readonly hasDescriptionSlot = computed(() => !!this.descriptionSlot());

  readonly hasTitle = computed(
    () => this.hasTitleSlot() || !!this.title()?.trim(),
  );
  readonly hasDescription = computed(
    () => this.hasDescriptionSlot() || !!this.description()?.trim(),
  );

  /** Size passed to the fallback `<tw-icon>` per CLAUDE.md glyph sub-scale. */
  readonly iconSize = computed<TwSize>(() => {
    const size = this.size();
    if (this.variant() === 'inline') {
      switch (size) {
        case 'xs': return 'xs';
        case 'sm': return 'sm';
        case 'md': return 'md';
        case 'lg': return 'lg';
        case 'xl': return 'lg';
      }
    }
    switch (size) {
      case 'xs': return 'sm';
      case 'sm': return 'md';
      case 'md': return 'xl';
      case 'lg': return 'xl';
      case 'xl': return 'xl';
    }
  });

  private readonly variantResult = computed(() =>
    emptyState({ variant: this.variant(), size: this.size() }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly iconWrapperClasses = computed(() => this.variantResult().iconWrapper());
  readonly titleClasses = computed(() => this.variantResult().title());
  readonly descriptionClasses = computed(() => this.variantResult().description());
  readonly actionsClasses = computed(() => this.variantResult().actions());
}
