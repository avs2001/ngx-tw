import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { InputDirective } from '@cdevhub/ngx-tw/input';
import { SelectComponent } from '@cdevhub/ngx-tw/select';
import { SwitchComponent } from '@cdevhub/ngx-tw/switch';
import { CheckboxComponent } from '@cdevhub/ngx-tw/checkbox';
import { RadioComponent, RadioGroupComponent } from '@cdevhub/ngx-tw/radio';
import {
  SegmentedControlComponent,
  SegmentedControlOptionComponent,
} from '@cdevhub/ngx-tw/segmented-control';
import { RhythmCell } from './rhythm-cell';
import { RhythmPaper } from './rhythm-paper';
import type { RhythmSettings } from './rhythm-settings';
import { FormControlsPanel } from './panels/form-controls-panel';
import { ActionNavPanel } from './panels/action-nav-panel';
import { DisplayPanel } from './panels/display-panel';
import { ContainerPanel } from './panels/container-panel';
import { OverlayPanel } from './panels/overlay-panel';
import { RhythmReport } from './rhythm-report';

const SIZES: readonly TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

/**
 * The rhythm grid — a diagnostic instrument, not a documentation page.
 *
 * Deliberately outside the `demo-doc-page` overview/examples/api canon: it
 * documents no single component, and its job is to make vertical size and
 * alignment failures *visible and numeric* across the whole library at once.
 *
 * Every control renders on one continuous ruled ground ("mill paper"). Each
 * slot reports its measured border-box height and whether that height lands on
 * the baseline unit. The alignment strip is the load-bearing view: the
 * components a consumer would place side by side in a filter bar, laid out in
 * one centred row, with their height spread stated in pixels.
 */
@Component({
  selector: 'app-rhythm-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RhythmReport],
  imports: [
    RhythmCell,
    RhythmPaper,
    FormControlsPanel,
    ActionNavPanel,
    DisplayPanel,
    ContainerPanel,
    OverlayPanel,
    ButtonDirective,
    InputDirective,
    SelectComponent,
    SwitchComponent,
    CheckboxComponent,
    RadioComponent,
    RadioGroupComponent,
    SegmentedControlComponent,
    SegmentedControlOptionComponent,
  ],
  template: `
    <div class="mx-auto max-w-6xl px-6 py-8">
      <!-- ===================== Header ===================== -->
      <header class="mb-6">
        <p class="rg-measure mb-2 uppercase text-fg-subtle">Foundations</p>
        <h1 class="font-display text-3xl tracking-tight text-fg">Rhythm grid</h1>
        <p class="mt-2 max-w-2xl text-sm text-fg-muted">
          Every component laid on one continuous ruled ground, so vertical size and alignment can be
          judged against a shared baseline instead of by eye. Each slot reports its measured
          border-box height; a red reading means the height misses the baseline unit.
        </p>
      </header>

      <!-- ===================== Toolbar ===================== -->
      <div
        class="sticky top-0 z-20 mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-border-muted
               bg-surface/80 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70"
      >
        <div class="flex items-center gap-2">
          <span class="rg-measure uppercase text-fg-subtle">Size</span>
          <div class="flex gap-1" role="group" aria-label="Component size">
            @for (s of sizes; track s) {
              <button
                type="button"
                (click)="size.set(s)"
                [attr.aria-pressed]="size() === s"
                class="rounded-md px-2 py-1 font-mono text-xs transition-colors duration-200
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                [class.bg-primary-500]="size() === s"
                [class.text-white]="size() === s"
                [class.text-fg-muted]="size() !== s"
                [class.hover:bg-surface-muted]="size() !== s"
              >
                {{ s }}
              </button>
            }
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="rg-measure uppercase text-fg-subtle">Baseline</span>
          <div class="flex gap-1" role="group" aria-label="Baseline unit">
            @for (u of units; track u) {
              <button
                type="button"
                (click)="unit.set(u)"
                [attr.aria-pressed]="unit() === u"
                class="rounded-md px-2 py-1 font-mono text-xs transition-colors duration-200
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                [class.bg-primary-500]="unit() === u"
                [class.text-white]="unit() === u"
                [class.text-fg-muted]="unit() !== u"
                [class.hover:bg-surface-muted]="unit() !== u"
              >
                {{ u }}px
              </button>
            }
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="rg-measure uppercase text-fg-subtle">Row</span>
          <div class="flex gap-1" role="group" aria-label="Row unit">
            @for (r of rowUnits; track r) {
              <button
                type="button"
                (click)="rowUnit.set(r)"
                [attr.aria-pressed]="rowUnit() === r"
                class="rounded-md px-2 py-1 font-mono text-xs transition-colors duration-200
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                [class.bg-primary-500]="rowUnit() === r"
                [class.text-white]="rowUnit() === r"
                [class.text-fg-muted]="rowUnit() !== r"
                [class.hover:bg-surface-muted]="rowUnit() !== r"
              >
                {{ r }}
              </button>
            }
          </div>
        </div>

        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            [checked]="gridOn()"
            (change)="gridOn.set(!gridOn())"
            class="size-4 accent-primary-500"
          />
          <span class="rg-measure uppercase text-fg-subtle">Ruling</span>
        </label>

        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            [checked]="axisY()"
            (change)="axisY.set(!axisY())"
            class="size-4 accent-primary-500"
          />
          <span class="rg-measure uppercase text-fg-subtle">Horizontal only</span>
        </label>

        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            [checked]="flagOffGrid()"
            (change)="flagOffGrid.set(!flagOffGrid())"
            class="size-4 accent-primary-500"
          />
          <span class="rg-measure uppercase text-fg-subtle">Flag off-grid</span>
        </label>
      </div>

      <!-- ===================== Verdict ===================== -->
      <div class="mb-8 grid gap-3 sm:grid-cols-3" data-rg-verdict>
        <div class="rounded-lg border border-border-muted bg-surface-raised p-4">
          <p class="rg-measure uppercase text-fg-subtle">Measured slots</p>
          <p class="mt-1 font-mono text-2xl text-fg" data-rg-measured-count>
            {{ report.measured().length }}
          </p>
          <p class="rg-measure mt-1 text-fg-subtle">
            {{ report.skipped().length }} unmeasurable (overlay-only)
          </p>
        </div>
        <div class="rounded-lg border border-border-muted bg-surface-raised p-4">
          <p class="rg-measure uppercase text-fg-subtle">Off the {{ unit() }}px grid</p>
          <p
            class="mt-1 font-mono text-2xl"
            [class.text-error-600]="report.offGrid().length > 0"
            [class.text-success-600]="report.offGrid().length === 0"
            data-rg-offgrid-count
          >
            {{ report.offGrid().length }}
          </p>
          <p class="rg-measure mt-1 text-fg-subtle">of {{ report.measured().length }} measured</p>
        </div>
        <div class="rounded-lg border border-border-muted bg-surface-raised p-4">
          <p class="rg-measure uppercase text-fg-subtle">Form-row height spread</p>
          <p
            class="mt-1 font-mono text-2xl"
            [class.text-error-600]="formRowSpread() > 0"
            [class.text-success-600]="formRowSpread() === 0"
            data-rg-formrow-spread
          >
            {{ formRowSpread() }}px
          </p>
          <p class="rg-measure mt-1 text-fg-subtle">
            heights: {{ formRowHeights().join(' · ') || '—' }}
          </p>
        </div>
      </div>

      <!-- ===================== Alignment strip ===================== -->
      <section class="mb-10">
        <h2 class="mb-1 text-sm font-semibold text-fg">Alignment strip</h2>
        <p class="mb-3 max-w-2xl text-sm text-fg-muted">
          The box-matched controls — those with a bordered or filled shell that must agree on
          height. Switch, checkbox and radio are shown alongside but tracked as a separate
          cohort: they are glyph-scale by design and box-matching them would mean inflating a
          checkbox to the height of a text input. They are placed side by side in a filter bar, centred on one row at
          <span class="font-mono">{{ size() }}</span>. If their heights disagree, the vertical
          centres still line up but the boxes do not — which is exactly what makes a toolbar look
          unfinished. The spread above states the disagreement in pixels.
        </p>

        <div
          class="rg-paper overflow-x-auto rounded-lg border border-border-muted p-8"
          [attr.data-rg-unit]="unit()"
          [attr.data-rg-rows]="rowUnit()"
          [attr.data-rg-grid]="gridOn() ? 'on' : 'off'"
          [attr.data-rg-axis]="axisY() ? 'y' : 'xy'"
        >
          <div class="flex min-w-max items-center gap-3">
            <button twButton [size]="size()">Button</button>
            <input twInput [size]="size()" placeholder="Input" class="w-32" />
            <tw-select [options]="fruits" [size]="size()" placeholder="Select" class="w-36" />
            <tw-segmented-control [size]="size()" [value]="'a'" aria-label="Segmented">
              <tw-segmented-option value="a">One</tw-segmented-option>
              <tw-segmented-option value="b">Two</tw-segmented-option>
            </tw-segmented-control>
            <tw-switch [size]="size()" label="Switch" />
            <tw-checkbox [size]="size()" label="Checkbox" />
            <tw-radio-group aria-label="Radio">
              <tw-radio [size]="size()" value="x" label="Radio" />
            </tw-radio-group>
          </div>
        </div>

        <!-- The same set, measured individually, on the same ruled ground. -->
        <app-rhythm-paper
          heading="Measured individually"
          [settings]="settings()"
          class="mt-4"
        >
          <app-rhythm-cell
            label="Button"
            group="form-row"
            [unit]="unit()"
            [flagOffGrid]="flagOffGrid()"
          >
            <button twButton [size]="size()">Button</button>
          </app-rhythm-cell>

          <app-rhythm-cell
            label="Input"
            group="form-row"
            [unit]="unit()"
            [flagOffGrid]="flagOffGrid()"
          >
            <input twInput [size]="size()" placeholder="Input" class="w-full" />
          </app-rhythm-cell>

          <app-rhythm-cell
            label="Select"
            group="form-row"
            [unit]="unit()"
            [flagOffGrid]="flagOffGrid()"
          >
            <tw-select [options]="fruits" [size]="size()" placeholder="Select" class="w-full" />
          </app-rhythm-cell>

          <app-rhythm-cell
            label="Segmented control"
            group="form-row"
            [unit]="unit()"
            [flagOffGrid]="flagOffGrid()"
          >
            <tw-segmented-control [size]="size()" [value]="'a'" aria-label="Segmented">
              <tw-segmented-option value="a">One</tw-segmented-option>
              <tw-segmented-option value="b">Two</tw-segmented-option>
            </tw-segmented-control>
          </app-rhythm-cell>

          <app-rhythm-cell
            label="Switch"
            group="selection"
            [unit]="unit()"
            [flagOffGrid]="flagOffGrid()"
          >
            <tw-switch [size]="size()" label="Switch" />
          </app-rhythm-cell>

          <app-rhythm-cell
            label="Checkbox"
            group="selection"
            [unit]="unit()"
            [flagOffGrid]="flagOffGrid()"
          >
            <tw-checkbox [size]="size()" label="Checkbox" />
          </app-rhythm-cell>

          <app-rhythm-cell
            label="Radio"
            group="selection"
            [unit]="unit()"
            [flagOffGrid]="flagOffGrid()"
          >
            <tw-radio-group aria-label="Radio">
              <tw-radio [size]="size()" value="x" label="Radio" />
            </tw-radio-group>
          </app-rhythm-cell>
        </app-rhythm-paper>
      </section>

      <!-- ===================== Off-grid ledger ===================== -->
      @if (report.offGrid().length > 0) {
        <section class="mb-10">
          <h2 class="mb-1 text-sm font-semibold text-fg">Off-grid ledger</h2>
          <p class="mb-3 max-w-2xl text-sm text-fg-muted">
            Slots whose measured height misses the {{ unit() }}px baseline, worst drift first.
          </p>
          <div class="overflow-x-auto rounded-lg border border-border-muted">
            <table class="w-full text-sm">
              <thead class="bg-surface-muted">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold text-fg">Slot</th>
                  <th class="px-3 py-2 text-right font-semibold text-fg">Height</th>
                  <th class="px-3 py-2 text-right font-semibold text-fg">Drift</th>
                  <th class="px-3 py-2 text-right font-semibold text-fg">Nearest on-grid</th>
                </tr>
              </thead>
              <tbody>
                @for (row of offGridRows(); track row.label) {
                  <tr class="border-t border-border-muted">
                    <td class="px-3 py-2 text-fg">{{ row.label }}</td>
                    <td class="px-3 py-2 text-right font-mono text-fg-muted">{{ row.height }}px</td>
                    <td class="px-3 py-2 text-right font-mono text-error-600">{{ row.drift }}px</td>
                    <td class="px-3 py-2 text-right font-mono text-fg-subtle">{{ row.nearest }}px</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <!-- ===================== Panels =====================
           Mounted directly, never projected. Cells reach the page-level
           RhythmReport through an optional inject. A projected panel is
           declared in the ANCESTOR's template, so its element injector never
           crosses this component and the token resolves to null — every cell
           would silently vanish from the verdict counters, with a green build
           and no error to show for it. -->
      <app-form-controls-panel [settings]="settings()" />
      <app-action-nav-panel [settings]="settings()" />
      <app-display-panel [settings]="settings()" />
      <app-container-panel [settings]="settings()" />
      <app-overlay-panel [settings]="settings()" />
    </div>
  `,
})
export class RhythmPage {
  protected readonly report = inject(RhythmReport);

  protected readonly sizes = SIZES;
  protected readonly units = [4, 8] as const;
  protected readonly rowUnits = [24, 32, 40] as const;

  protected readonly size = signal<TwSize>('md');
  protected readonly unit = signal<number>(4);
  protected readonly rowUnit = signal<number>(32);
  protected readonly gridOn = signal(true);
  protected readonly axisY = signal(true);
  protected readonly flagOffGrid = signal(true);

  protected readonly fruits = ['Apple', 'Banana', 'Cherry'];

  /** Toolbar state as one object, forwarded to every paper section and panel. */
  protected readonly settings = computed<RhythmSettings>(() => ({
    size: this.size(),
    unit: this.unit(),
    rowUnit: this.rowUnit(),
    gridOn: this.gridOn(),
    axisY: this.axisY(),
    flagOffGrid: this.flagOffGrid(),
  }));

  protected readonly formRowHeights = computed(() => this.report.heightsIn('form-row'));
  protected readonly formRowSpread = computed(() => this.report.spreadIn('form-row'));

  protected readonly offGridRows = computed(() =>
    this.report
      .offGrid()
      .map(c => ({
        label: c.label(),
        height: c.height(),
        drift: c.drift(),
        nearest: Math.round(c.height() / this.unit()) * this.unit(),
      }))
      .sort((a, b) => b.drift - a.drift),
  );
}
