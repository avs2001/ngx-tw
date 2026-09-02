import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RhythmReport } from './rhythm-report';

/**
 * One measured slot on the rhythm paper.
 *
 * The instrument, not the subject: this deliberately uses plain markup rather
 * than library components, so a regression in the library can never disguise
 * itself as a correct reading.
 *
 * Measurement contract — `.rg-body` is `display:flex; align-items:flex-start`,
 * which makes the wrapper's border box exactly the height of its tallest child.
 * Measuring the wrapper therefore measures the component, not the inline line
 * box an `inline-flex` control would otherwise generate inside a block parent.
 */
@Component({
  selector: 'app-rhythm-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[attr.data-rg-cell]': 'label()',
    '[attr.data-rg-height]': 'na() ? null : height()',
    '[attr.data-rg-ongrid]': 'na() ? null : onGrid()',
    '[attr.data-rg-group]': 'group() || null',
  },
  template: `
    <div class="flex items-baseline justify-between gap-2 pb-1">
      <span class="rg-measure text-fg-muted uppercase">{{ label() }}</span>

      @if (na()) {
        <span class="rg-measure rounded-md bg-surface-muted px-1.5 py-0.5 text-fg-subtle" [title]="na()">
          n/a
        </span>
      } @else {
        <span
          class="rg-measure rounded-md px-1.5 py-0.5"
          [class.bg-surface-muted]="onGrid()"
          [class.text-fg-subtle]="onGrid()"
          [class.bg-error-100]="!onGrid()"
          [class.text-error-700]="!onGrid()"
          [title]="onGrid() ? 'On the ' + unit() + 'px grid' : 'Off the ' + unit() + 'px grid by ' + drift() + 'px'"
        >
          {{ height() }}px
        </span>
      }
    </div>

    <div
      #body
      class="rg-body"
      [attr.data-rg-align]="align()"
      [class.rg-flag-off]="flagOffGrid() && !na() && !onGrid()"
    >
      <ng-content />
    </div>

    @if (note()) {
      <p class="rg-measure pt-1 text-fg-subtle normal-case">{{ note() }}</p>
    }
  `,
})
export class RhythmCell {
  /** Name shown above the slot and used as the Playwright selector key. */
  readonly label = input.required<string>();

  /** Baseline unit the measured height is checked against. Defaults to `4`. */
  readonly unit = input(4);

  /**
   * Marks the slot as unmeasurable and shows this string as the reason.
   * Overlay-only components (dialog, sheet, toast, tooltip) have no resting
   * inline box — they are listed rather than silently dropped.
   */
  readonly na = input<string>('');

  /** Cross-axis alignment of the measured body. Defaults to `'start'`. */
  readonly align = input<'start' | 'center'>('start');

  /** Optional caption rendered under the slot. */
  readonly note = input<string>('');

  /** Draws a hairline outline around bodies whose height misses the grid. */
  readonly flagOffGrid = input(true);

  /**
   * Groups the cell for spread analysis. Cells sharing a group are expected to
   * resolve to the same height — `'form-row'` is the set a consumer would place
   * side by side in a filter bar.
   */
  readonly group = input<string>('');

  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');
  private readonly destroyRef = inject(DestroyRef);
  private readonly report = inject(RhythmReport, { optional: true });

  /** Measured border-box height of the slot body, in CSS pixels. */
  readonly height = signal(0);

  /** Distance from the nearest baseline gridline, in CSS pixels. */
  readonly drift = computed(() => {
    const u = this.unit();
    const h = this.height();
    return Math.round(Math.abs(h - Math.round(h / u) * u) * 100) / 100;
  });

  /** True when the measured height lands on the baseline grid (±0.5px). */
  readonly onGrid = computed(() => this.height() > 0 && this.drift() < 0.5);

  constructor() {
    afterNextRender(() => {
      const el = this.body().nativeElement;
      const measure = () => this.height.set(Math.round(el.getBoundingClientRect().height * 100) / 100);
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      measure();
      this.report?.register(this);
      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        this.report?.unregister(this);
      });
    });
  }
}
