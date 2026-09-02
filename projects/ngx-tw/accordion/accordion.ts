import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import { CollapsibleGroupComponent } from '@cdevhub/ngx-tw/collapsible';

/** Open mode of the accordion. */
export type AccordionType = 'single' | 'multiple';

/** Visual style of the accordion container. */
export type AccordionVariant = 'default' | 'bordered' | 'ghost';

// ── tv() config ──

const accordionVariants = tv(
  {
    slots: {
      root: 'block',
    },
    variants: {
      variant: {
        default: {
          root: 'rounded-lg overflow-hidden divide-y divide-border',
        },
        bordered: {
          root: 'rounded-lg overflow-hidden divide-y divide-border border border-border',
        },
        ghost: {
          root: '',
        },
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
  {
    twMerge: true,
  },
);

// ── AccordionComponent ──

/**
 * Accordion — single- or multiple-open-panel group built on top of
 * `<tw-collapsible>` children. Extends `CollapsibleGroupComponent` to inherit
 * the keyboard navigation, value-sync, and toggle wiring; overrides the
 * virtual `isAccordionMode()` / `canCollapseSingleMode()` hooks so the
 * single-mode behaviour is driven from the local `type` + `collapsible`
 * inputs instead of the parent's `accordion` input. The `hostRole` and
 * `hostClasses` signals are also overridden so the accordion drops APG's
 * `role="group"` and renders the variant-driven container classes.
 *
 * The `providers` block exposes the accordion instance to its descendant
 * collapsibles via the `CollapsibleGroupComponent` DI token — Angular DI
 * uses class identity rather than the prototype chain, so the explicit
 * `useExisting` is required even though `AccordionComponent extends
 * CollapsibleGroupComponent`.
 */
@Component({
  selector: 'tw-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // `[class]` + `[attr.role]` are inherited from the parent's host metadata
    // and read the overridden `hostClasses` / `hostRole` computeds below.
    // We only need to add accordion-specific bindings here.
    '[attr.aria-multiselectable]': "type() === 'multiple' ? 'true' : 'false'",
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-labelledby]': 'ariaLabelledby() ?? null',
  },
  template: `<ng-content />`,
  providers: [
    {
      provide: CollapsibleGroupComponent,
      useExisting: forwardRef(() => AccordionComponent),
    },
  ],
})
export class AccordionComponent extends CollapsibleGroupComponent {
  /** Open mode. `'single'` allows one panel open at a time; `'multiple'` allows many. Defaults to `'single'`. */
  readonly type = input<AccordionType>('single');

  /** Visual style of the accordion container. Defaults to `'default'`. */
  readonly variant = input<AccordionVariant>('default');

  /** In `'single'` mode, whether re-clicking the open panel closes it. Defaults to `true` — accordions are collapsible by definition; opt-out only. */
  readonly collapsible = input(true, { transform: booleanAttribute });

  /** Accessible name for the accordion. Use when surrounding context doesn't make the purpose obvious. Defaults to `undefined`. Alias: `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID(s) of element(s) that label the accordion. Use instead of `aria-label` when a visible heading is available. Defaults to `undefined`. Alias: `aria-labelledby`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  // ── Inherited-binding overrides ──

  /** @internal APG: accordions don't carry `role="group"`. */
  override readonly hostRole = computed<string | null>(() => null);

  /** @internal Variant-driven container classes; replaces the parent's default group string. */
  override readonly hostClasses = computed(() =>
    accordionVariants({ variant: this.variant() }).root(),
  );

  // ── Virtual-hook overrides ──

  /** @internal Drive single-open-panel behaviour from `type`, ignoring the inherited `accordion` input. */
  protected override isAccordionMode(): boolean {
    return this.type() === 'single';
  }

  /** @internal Honour the `collapsible` opt-out in single mode. */
  protected override canCollapseSingleMode(): boolean {
    return this.collapsible();
  }
}
