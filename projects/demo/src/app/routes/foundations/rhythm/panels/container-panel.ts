import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AccordionComponent } from '@cdevhub/ngx-tw/accordion';
import {
  AlertComponent,
  AlertContentDirective,
  AlertIconDirective,
  AlertTitleDirective,
} from '@cdevhub/ngx-tw/alert';
import { CardBodyDirective, CardComponent, CardHeaderDirective } from '@cdevhub/ngx-tw/card';
import { CarouselComponent, CarouselSlideComponent } from '@cdevhub/ngx-tw/carousel';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import {
  CollapsibleComponent,
  CollapsibleTriggerDirective,
  type CollapsibleDisplay,
} from '@cdevhub/ngx-tw/collapsible';
import { EmptyStateComponent } from '@cdevhub/ngx-tw/empty-state';
import { FlipCardComponent } from '@cdevhub/ngx-tw/flip-card';
import {
  CellDefDirective,
  ColumnComponent,
  TableComponent,
  type TwTableAppearance,
} from '@cdevhub/ngx-tw/table';
import { TimelineComponent, TimelineItemComponent } from '@cdevhub/ngx-tw/timeline';
import { RhythmCell } from '../rhythm-cell';
import { RhythmPaper } from '../rhythm-paper';
import type { RhythmSettings } from '../rhythm-settings';

/** The single table row — one row, two columns is the structural minimum a table can be. */
interface RhythmRow {
  readonly label: string;
  readonly body: string;
}

/**
 * Containers and content surfaces on the rhythm paper.
 *
 * Unlike the form-row controls, nothing here has a fixed control height: every
 * component in this panel sizes to whatever is projected into it. A panel that
 * fed each cell its own realistic content would therefore measure the content,
 * not the component, and the readings would not be comparable to each other.
 *
 * So every cell is given the *same* single line of body text. The measured
 * number is then the component's own chrome plus its padding around one
 * identical line — which is exactly the number that says whether the container
 * padding scale (`p-2` / `p-3` / `p-4` / `p-6` / `p-8` for xs…xl) lands on the
 * baseline. Where a cell imposes geometry the component cannot supply itself
 * (flip-card's absolutely-positioned faces), the note says so.
 *
 * The two forced-open cells carry `[disabled]="true"`. Their open state is
 * bound one-way, and both `CollapsibleComponent.toggle()` and
 * `CollapsibleGroupComponent.toggleItem()` write the model directly — so one
 * click would close them with no binding left to restore the state, leaving a
 * cell labelled "(open)" measuring a closed panel. `disabled` costs only
 * `opacity-50 pointer-events-none` on the root; it touches no padding slot, so
 * the reading is unaffected. The closed cells are left interactive: they toggle
 * back to their labelled state on a second click.
 */
@Component({
  selector: 'app-container-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RhythmPaper,
    RhythmCell,
    CardComponent,
    CardHeaderDirective,
    CardBodyDirective,
    AlertComponent,
    AlertIconDirective,
    AlertTitleDirective,
    AlertContentDirective,
    AccordionComponent,
    CollapsibleComponent,
    CollapsibleTriggerDirective,
    CodeBlockComponent,
    TableComponent,
    ColumnComponent,
    CellDefDirective,
    TimelineComponent,
    TimelineItemComponent,
    CarouselComponent,
    CarouselSlideComponent,
    FlipCardComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-rhythm-paper
      heading="Containers &amp; content"
      lede="These size to their content, so the number to read is not a fixed control height — it is the component's own chrome plus its padding around one line of text. Every cell is fed the same single line, so what varies between them is the container padding scale (p-2 / p-3 / p-4 / p-6 / p-8 for xs…xl) and nothing else."
      columns="sm:grid-cols-2 lg:grid-cols-3"
      [settings]="settings()"
    >
      <!-- ── Card ── -->
      <app-rhythm-cell
        label="Card"
        note="Header + one-line body. The per-section padding step is the only variable."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-card class="block w-full" [size]="settings().size">
          <div twCardHeader>Card</div>
          <div twCardBody>{{ line }}</div>
        </tw-card>
      </app-rhythm-cell>

      <!-- ── Alert ── -->
      <app-rhythm-cell
        label="Alert"
        note="No size input — padding is a fixed p-4. Icon + title + one line; politeness off so measuring does not announce."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-alert class="w-full" color="info" politeness="off">
          <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9Z"
              clip-rule="evenodd"
            />
          </svg>
          <span twAlertTitle>Alert</span>
          <span twAlertContent>{{ line }}</span>
        </tw-alert>
      </app-rhythm-cell>

      <!-- ── Accordion, closed ── -->
      <app-rhythm-cell
        label="Accordion (closed)"
        note="Closed is the resting height — trigger padding only. Size reaches it through the inner collapsible's display.size, not a size input on tw-accordion."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-accordion class="w-full" variant="outline" aria-label="Accordion, closed">
          <tw-collapsible value="a" [display]="collapsibleDisplay()">
            <button twCollapsibleTrigger>Accordion</button>
            <p>{{ line }}</p>
          </tw-collapsible>
        </tw-accordion>
      </app-rhythm-cell>

      <!-- ── Accordion, open ── -->
      <app-rhythm-cell
        label="Accordion (open)"
        note="Same panel forced open — trigger padding plus content padding around one line. Disabled on purpose: value is bound one-way, so a click would set it to null with nothing to restore it. Disabled adds only opacity and pointer-events, never padding."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-accordion
          class="w-full"
          variant="outline"
          [value]="'a'"
          aria-label="Accordion, open"
        >
          <tw-collapsible value="a" [display]="collapsibleDisplay()" [disabled]="true">
            <button twCollapsibleTrigger>Accordion</button>
            <p>{{ line }}</p>
          </tw-collapsible>
        </tw-accordion>
      </app-rhythm-cell>

      <!-- ── Collapsible, closed ── -->
      <app-rhythm-cell
        label="Collapsible (closed)"
        note="Standalone panel, closed — its resting height. Size is a key of the display config object, not a top-level size input."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-collapsible class="w-full" [display]="collapsibleDisplay()">
          <button twCollapsibleTrigger>Collapsible</button>
          <p>{{ line }}</p>
        </tw-collapsible>
      </app-rhythm-cell>

      <!-- ── Collapsible, open ── -->
      <app-rhythm-cell
        label="Collapsible (open)"
        note="Same panel forced open, and disabled for the same reason — open is bound one-way, so a click would close it permanently. Compare against the accordion pair: the wrapper should add chrome, not padding."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-collapsible
          class="w-full"
          [display]="collapsibleDisplay()"
          [open]="true"
          [disabled]="true"
        >
          <button twCollapsibleTrigger>Collapsible</button>
          <p>{{ line }}</p>
        </tw-collapsible>
      </app-rhythm-cell>

      <!-- ── Code block ── -->
      <app-rhythm-cell
        label="Code block"
        note="No size input. The header strip with the copy button renders unconditionally, so the floor is header + one code line — not padding alone."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-code-block class="w-full" [code]="line" language="text" />
      </app-rhythm-cell>

      <!-- ── Flip card ── -->
      <app-rhythm-cell
        label="Flip card"
        note="No size input, and no intrinsic height at all — both faces are absolute inset-0. The 96px reading is imposed here by h-24, not measured from the component."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-flip-card class="block h-24 w-full" aria-label="Flip card, rhythm sample">
          <div slot="front" class="flex h-full w-full items-center justify-center p-4 text-sm">
            {{ line }}
          </div>
          <div slot="back" class="flex h-full w-full items-center justify-center p-4 text-sm">
            {{ line }}
          </div>
        </tw-flip-card>
      </app-rhythm-cell>

      <!-- ── Empty state ── -->
      <app-rhythm-cell
        label="Empty state"
        note="Title + one-line description over the default inbox icon. Size scales both the padding and the icon, so the icon sub-scale rides the same axis."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-empty-state
          class="w-full"
          [size]="settings().size"
          title="Empty state"
          [description]="line"
        />
      </app-rhythm-cell>
    </app-rhythm-paper>

    <!--
      Table, timeline and carousel need horizontal room: at three tracks a
      two-column table wraps its cells and the measured height stops being a
      statement about padding. Same paper, same settings, wider tracks.
    -->
    <app-rhythm-paper
      heading="Containers &amp; content — wide"
      lede="The same one-line rule, on wider tracks. A table, a timeline item and a carousel slide all wrap their content at three-up widths, and a wrapped line would be measured as padding."
      columns="lg:grid-cols-2"
      [settings]="settings()"
    >
      <!-- ── Table ── -->
      <app-rhythm-cell
        label="Table"
        note="Two columns, one header row, one data row — the structural minimum. Size is a key of the appearance config object and drives font size only; row padding is the separate density axis."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-table
          class="w-full"
          [data]="rows"
          [appearance]="tableAppearance()"
          aria-label="Table, rhythm sample"
        >
          <tw-column name="label" headerLabel="Column">
            <ng-template twCellDef let-row>{{ asRow(row).label }}</ng-template>
          </tw-column>
          <tw-column name="body" headerLabel="Content">
            <ng-template twCellDef let-row>{{ asRow(row).body }}</ng-template>
          </tw-column>
        </tw-table>
      </app-rhythm-cell>

      <!-- ── Timeline ── -->
      <app-rhythm-cell
        label="Timeline"
        note="One item. Its height still includes the trailing pb-3…pb-10 that separates it from a successor that does not exist — that padding, not the gap-3…gap-8 marker offset, is what moves the number."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-timeline class="w-full" [size]="settings().size">
          <tw-timeline-item color="primary" state="reached">
            <p class="text-sm">{{ line }}</p>
          </tw-timeline-item>
        </tw-timeline>
      </app-rhythm-cell>

      <!-- ── Carousel ── -->
      <app-rhythm-cell
        label="Carousel"
        note="No size input. Two slides is the minimum that makes it a carousel; no height is imposed, so the reading is the viewport chrome around one content-sized slide."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-carousel class="w-full" aria-label="Carousel, rhythm sample">
          <tw-carousel-slide label="First">
            <p class="text-sm">{{ line }}</p>
          </tw-carousel-slide>
          <tw-carousel-slide label="Second">
            <p class="text-sm">{{ line }}</p>
          </tw-carousel-slide>
        </tw-carousel>
      </app-rhythm-cell>
    </app-rhythm-paper>
  `,
})
export class ContainerPanel {
  /** Toolbar state forwarded from the rhythm page. */
  readonly settings = input.required<RhythmSettings>();

  /**
   * The one line every cell is given. A single shared string, not a per-cell
   * sentence: identical content is the only thing that makes the measured
   * heights comparable across components that size to what is inside them.
   */
  protected readonly line = 'One line of content.';

  /** The single table row. */
  protected readonly rows: readonly RhythmRow[] = [
    { label: 'Row', body: 'One line of content.' },
  ];

  /** `tw-collapsible` takes its size through the `display` config object, not a `size` input. */
  protected readonly collapsibleDisplay = computed<CollapsibleDisplay>(() => ({
    variant: 'outline',
    size: this.settings().size,
  }));

  /**
   * `tw-table` takes its size through the `appearance` config object, not a `size` input.
   *
   * `'bordered'` here is **not** the deprecated surface-treatment spelling that
   * `tw-accordion` / `tw-collapsible` alias onto `'outline'`. `TwTableVariant` is a
   * grid-style axis (`default | striped | bordered`) where `bordered` means "draw cell
   * gridlines", and it has no legacy alias. Leave it alone — `tv()` returns base classes
   * only for an unrecognised variant, so "modernising" this to `'outline'` would silently
   * unstyle the table.
   */
  protected readonly tableAppearance = computed<TwTableAppearance>(() => ({
    variant: 'bordered',
    size: this.settings().size,
  }));

  /** `*twCellDef` hands the row through as `unknown` — the column is a sibling, so `T` cannot infer. */
  protected asRow(row: unknown): RhythmRow {
    return row as RhythmRow;
  }
}
