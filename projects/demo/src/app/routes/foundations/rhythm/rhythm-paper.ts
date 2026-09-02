import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RhythmSettings } from './rhythm-settings';

/**
 * A titled section of ruled paper holding a grid of measured slots.
 *
 * Panels project `<app-rhythm-cell>` children into this; it owns the heading,
 * the lede, and the `data-rg-*` attributes that drive the ruling — so no panel
 * has to restate them and they cannot drift apart between families.
 */
@Component({
  selector: 'app-rhythm-paper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block mb-10' },
  template: `
    <h2 class="mb-1 text-sm font-semibold text-fg">{{ heading() }}</h2>
    @if (lede()) {
      <p class="mb-3 max-w-2xl text-sm text-fg-muted">{{ lede() }}</p>
    }
    <div
      class="rg-paper grid gap-8 rounded-lg border border-border-muted p-8"
      [class]="columns()"
      [attr.data-rg-unit]="settings().unit"
      [attr.data-rg-rows]="settings().rowUnit"
      [attr.data-rg-grid]="settings().gridOn ? 'on' : 'off'"
      [attr.data-rg-axis]="settings().axisY ? 'y' : 'xy'"
    >
      <ng-content />
    </div>
  `,
})
export class RhythmPaper {
  /** Section heading. */
  readonly heading = input.required<string>();

  /** Optional explanatory line under the heading. */
  readonly lede = input<string>('');

  /** Toolbar state, forwarded from the page. */
  readonly settings = input.required<RhythmSettings>();

  /**
   * Grid track classes for the slot grid. Widen it for panels whose components
   * need horizontal room (tables, timelines). Defaults to a 4-up grid.
   */
  readonly columns = input<string>('sm:grid-cols-2 lg:grid-cols-4');
}
