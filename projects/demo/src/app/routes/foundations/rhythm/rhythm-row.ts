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

/** One measured item inside an alignment row. */
export interface RowItemReading {
  /** Name taken from the item's `data-rg-item` attribute. */
  readonly label: string;
  /** Border-box height of the item element the consumer actually places. */
  readonly outer: number;
  /** Border-box height of the item's control box — its visible shell. */
  readonly control: number;
  /** Control-box top edge, relative to the row track's top. */
  readonly top: number;
  /** Control-box bottom edge, relative to the row track's top. */
  readonly bottom: number;
  /** Control-box vertical centre, relative to the row track's top. */
  readonly centre: number;
}

const ALIGN_LABEL: Record<string, string> = {
  start: 'items-start — tops must agree',
  center: 'items-center — centres must agree',
  end: 'items-end — bottoms must agree',
  baseline: 'items-baseline — text baselines must agree',
  stretch: 'items-stretch — every box is pulled to the tallest',
};

/**
 * A row of real components sitting next to each other, measured as a row.
 *
 * The complement to `app-rhythm-cell`, which measures one control alone. An
 * isolated cell cannot show the failure a consumer actually hits: two controls
 * that each measure correctly in isolation can still refuse to line up once
 * they share a flex row, because the row aligns *some* edge and the components
 * disagree about which box that edge belongs to.
 *
 * Two boxes are therefore measured per item, and they are not the same box:
 *
 * - **outer** — the element the consumer writes in their markup.
 * - **control** — the visible shell: the bordered or filled box a reader
 *   perceives as "the control". For `tw-form-field` the two differ by the
 *   label row above and the reserved subscript row below, so centring the
 *   wrapper against a bare button is not the same as centring the field.
 *
 * Naming the control box, in order of preference:
 *
 * - `data-rg-control` on a descendant, when the demo owns that element.
 * - `data-rg-control-selector` on the item, when the shell is a
 *   library-internal element the demo cannot annotate. `tw-form-field` draws
 *   its own shell and deliberately strips the projected input to
 *   `border-0 p-0`, so the input is NOT the control box — measuring it reports
 *   a bare 20px line box and invents a defect that does not exist. The shell
 *   is the field wrapper's first element child.
 * - the item itself, when it is its own shell.
 *
 * Four spreads are reported rather than one, because which spread matters is
 * decided by the row's own `align-items`, not by the components. A row of
 * mismatched heights under `items-center` reports a zero centre spread and a
 * non-zero top and bottom spread — that is not a contradiction, it is the
 * precise shape of the defect.
 */
@Component({
  selector: 'app-rhythm-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[attr.data-rg-row]': 'label()',
    '[attr.data-rg-row-align]': 'align()',
    '[attr.data-rg-row-outer-spread]': 'outerSpread()',
    '[attr.data-rg-row-control-spread]': 'controlSpread()',
    '[attr.data-rg-row-top-spread]': 'topSpread()',
    '[attr.data-rg-row-bottom-spread]': 'bottomSpread()',
    '[attr.data-rg-row-centre-spread]': 'centreSpread()',
  },
  template: `
    <div class="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span class="text-sm font-semibold text-fg">{{ label() }}</span>
      <span class="rg-measure text-fg-subtle">{{ alignLabel() }}</span>
    </div>

    @if (note()) {
      <p class="mb-3 max-w-3xl text-sm text-fg-muted">{{ note() }}</p>
    }

    <div
      class="rg-paper overflow-x-auto rounded-lg border border-border-muted p-8"
      [attr.data-rg-unit]="unit()"
      [attr.data-rg-rows]="rowUnit()"
      [attr.data-rg-grid]="gridOn() ? 'on' : 'off'"
      [attr.data-rg-axis]="'y'"
    >
      <div
        #track
        class="flex min-w-max gap-3"
        [class.items-start]="align() === 'start'"
        [class.items-center]="align() === 'center'"
        [class.items-end]="align() === 'end'"
        [class.items-baseline]="align() === 'baseline'"
        [class.items-stretch]="align() === 'stretch'"
      >
        <ng-content />
      </div>
    </div>

    <!-- Readings. The verdict that matters is the one named by this row's align mode. -->
    <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      @for (v of verdicts(); track v.key) {
        <div
          class="rounded-lg border p-3"
          [class.border-border-muted]="!v.primary"
          [class.border-primary-300]="v.primary"
          [class.bg-surface-raised]="!v.primary"
          [class.bg-primary-50]="v.primary"
        >
          <p class="rg-measure uppercase text-fg-subtle">{{ v.name }}</p>
          <p
            class="mt-1 font-mono text-xl"
            [class.text-error-600]="v.enforced && v.value > 0.5"
            [class.text-success-600]="v.enforced && v.value <= 0.5"
            [class.text-fg-muted]="!v.enforced"
          >
            {{ v.value }}px
          </p>
        </div>
      }
    </div>

    <table class="mt-3 w-full text-left font-mono text-xs">
      <thead class="text-fg-subtle">
        <tr>
          <th class="py-1 pr-3 font-normal">item</th>
          <th class="py-1 pr-3 font-normal">outer</th>
          <th class="py-1 pr-3 font-normal">control</th>
          <th class="py-1 pr-3 font-normal">top</th>
          <th class="py-1 pr-3 font-normal">bottom</th>
        </tr>
      </thead>
      <tbody class="text-fg-muted">
        @for (r of readings(); track r.label) {
          <tr
            class="border-t border-border-muted"
            [attr.data-rg-item-row]="r.label"
            [attr.data-rg-item-outer]="r.outer"
            [attr.data-rg-item-control]="r.control"
            [attr.data-rg-item-top]="r.top"
            [attr.data-rg-item-bottom]="r.bottom"
          >
            <td class="py-1 pr-3 text-fg">{{ r.label }}</td>
            <td class="py-1 pr-3">{{ r.outer }}</td>
            <td class="py-1 pr-3" [class.text-error-600]="r.control !== r.outer">
              {{ r.control }}
            </td>
            <td class="py-1 pr-3">{{ r.top }}</td>
            <td class="py-1 pr-3">{{ r.bottom }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class RhythmRow {
  /** Name shown above the row and used as the Playwright selector key. */
  readonly label = input.required<string>();

  /**
   * Cross-axis alignment applied to the row. This is the knob under audit —
   * each mode makes a different edge load-bearing, so the same components can
   * pass in one mode and fail in another.
   */
  readonly align = input<'start' | 'center' | 'end' | 'baseline' | 'stretch'>('center');

  /** Explanatory line describing what this particular row is testing. */
  readonly note = input<string>('');

  /** Baseline unit for the ruled ground. Defaults to `4`. */
  readonly unit = input(4);

  /** Major ruling pitch, in px. Defaults to `32`. */
  readonly rowUnit = input(32);

  /** Whether the ruling is painted. Defaults to `true`. */
  readonly gridOn = input(true);

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly destroyRef = inject(DestroyRef);

  /** Per-item measurements, in DOM order. */
  readonly readings = signal<readonly RowItemReading[]>([]);

  /** Peak-to-peak spread of the outer boxes, in CSS pixels. */
  readonly outerSpread = computed(() => this.spread('outer'));

  /** Peak-to-peak spread of the control boxes, in CSS pixels. */
  readonly controlSpread = computed(() => this.spread('control'));

  /** Peak-to-peak spread of the control-box top edges. */
  readonly topSpread = computed(() => this.spread('top'));

  /** Peak-to-peak spread of the control-box bottom edges. */
  readonly bottomSpread = computed(() => this.spread('bottom'));

  /** Peak-to-peak spread of the control-box vertical centres. */
  readonly centreSpread = computed(() => this.spread('centre'));

  /** Human-readable statement of which edge this row's align mode makes load-bearing. */
  readonly alignLabel = computed(() => ALIGN_LABEL[this.align()] ?? this.align());

  /**
   * The five readings, with the one this row's align mode makes load-bearing
   * marked `primary`. `enforced` marks the readings that carry a pass or fail
   * verdict; the rest are reported for context and stay neutral, because a
   * non-zero top spread under `items-center` is correct behaviour, not a bug.
   */
  readonly verdicts = computed(() => {
    const mode = this.align();
    const primaryKey =
      mode === 'center' ? 'centre' : mode === 'end' ? 'bottom' : mode === 'baseline' ? 'top' : 'top';
    const rows = [
      { key: 'outer', name: 'outer spread', value: this.outerSpread() },
      { key: 'control', name: 'control spread', value: this.controlSpread() },
      { key: 'top', name: 'top spread', value: this.topSpread() },
      { key: 'bottom', name: 'bottom spread', value: this.bottomSpread() },
      { key: 'centre', name: 'centre spread', value: this.centreSpread() },
    ];
    return rows.map(r => ({
      ...r,
      primary: r.key === primaryKey,
      enforced: r.key === primaryKey || r.key === 'control',
    }));
  });

  private spread(key: keyof Omit<RowItemReading, 'label'>): number {
    const values = this.readings().map(r => r[key]);
    if (!values.length) {
      return 0;
    }
    return Math.round((Math.max(...values) - Math.min(...values)) * 100) / 100;
  }

  constructor() {
    afterNextRender(() => {
      const trackEl = this.track().nativeElement;
      const items = [...trackEl.querySelectorAll<HTMLElement>('[data-rg-item]')];

      const measure = () => {
        const origin = trackEl.getBoundingClientRect().top;
        this.readings.set(
          items.map(item => {
            // Three ways to name the control box, in order of directness. A
            // wrapper whose shell is a library-internal element cannot carry a
            // marker attribute, so it names a selector instead — see the note
            // on data-rg-control-selector below.
            const selector = item.dataset['rgControlSelector'];
            const control =
              (selector ? item.querySelector<HTMLElement>(selector) : null) ??
              item.querySelector<HTMLElement>('[data-rg-control]') ??
              item;
            const outerRect = item.getBoundingClientRect();
            const controlRect = control.getBoundingClientRect();
            return {
              label: item.dataset['rgItem'] ?? '?',
              outer: round(outerRect.height),
              control: round(controlRect.height),
              top: round(controlRect.top - origin),
              bottom: round(controlRect.bottom - origin),
              centre: round(controlRect.top + controlRect.height / 2 - origin),
            };
          })
        );
      };

      const observer = new ResizeObserver(measure);
      observer.observe(trackEl);
      for (const item of items) {
        observer.observe(item);
      }
      measure();

      this.destroyRef.onDestroy(function cleanup() {
        observer.disconnect();
      });
    });
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
