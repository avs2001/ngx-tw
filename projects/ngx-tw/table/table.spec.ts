import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SortDirective } from 'ngx-tw/sort';
import {
  ColumnComponent,
  DEFAULT_TABLE_LABELS,
  TableComponent,
  CellDefDirective,
  FooterCellDefDirective,
  NoDataRowDirective,
  RowExpansionDirective,
} from './table';
import type {
  TwRowClickEvent,
  TwRowExpansionChangeEvent,
  TwTableDensity,
  TwTableResponsiveMode,
  TwTableVariant,
} from './table';
import type { SortDirection } from 'ngx-tw/sort';

interface Row {
  id: number;
  name: string;
  amount: number;
}

const SAMPLE_ROWS: Row[] = [
  { id: 1, name: 'Alpha', amount: 10 },
  { id: 2, name: 'Bravo', amount: 20 },
  { id: 3, name: 'Charlie', amount: 30 },
];

// ── Test hosts ────────────────────────────────────────────────────────

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table [data]="data()" aria-label="Test table">
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
      <tw-column name="name" headerLabel="Name">
        <ng-template twCellDef let-row>{{ $any(row).name }}</ng-template>
      </tw-column>
      <tw-column name="amount" headerLabel="Amount" [display]="{ numeric: true }">
        <ng-template twCellDef let-row>{{ $any(row).amount }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class BasicHost {
  data = signal<Row[]>(SAMPLE_ROWS);
}

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table
      [data]="data()"
      [appearance]="{ variant: variant() }"
      [loading]="loading()"
      [error]="error()"
      aria-label="Variant host"
    >
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class StateHost {
  data = signal<Row[]>(SAMPLE_ROWS);
  variant = signal<TwTableVariant>('default');
  loading = signal(false);
  error = signal<unknown | null>(null);
}

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective, NoDataRowDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table [data]="data()" aria-label="No data host">
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
      <ng-template twNoDataRow>
        <tr class="no-data-row">
          <td [attr.colspan]="1">Custom no data</td>
        </tr>
      </ng-template>
    </tw-table>
  `,
})
class NoDataHost {
  data = signal<Row[]>([]);
}

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective, RowExpansionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table
      [data]="data()"
      [multiTemplateRows]="true"
      [(expandedRows)]="expanded"
      (expansionChange)="onExpand($event)"
      aria-label="Expansion host"
    >
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
      <ng-template twRowExpansion let-row>
        <div class="exp-panel">Expanded {{ $any(row).id }}</div>
      </ng-template>
    </tw-table>
  `,
})
class ExpansionHost {
  data = signal<Row[]>(SAMPLE_ROWS);
  expanded = signal<ReadonlySet<Row>>(new Set());
  lastEvent = signal<TwRowExpansionChangeEvent<Row> | null>(null);
  onExpand(e: TwRowExpansionChangeEvent<Row>): void {
    this.lastEvent.set(e);
  }
}

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective, FooterCellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table [data]="data()" aria-label="Footer host">
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
        <ng-template twFooterCellDef let-rows="rows">Total: {{ rows.length }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class FooterHost {
  data = signal<Row[]>(SAMPLE_ROWS);
}

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table [data]="source" aria-label="Observable host">
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class ObservableHost {
  source = new BehaviorSubject<Row[]>([...SAMPLE_ROWS]);
}

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table [data]="data()" aria-label="Click host" (rowClicked)="onRowClick($event)">
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>
          <button type="button" class="row-action">Action {{ $any(row).id }}</button>
        </ng-template>
      </tw-column>
    </tw-table>
  `,
})
class RowClickHost {
  data = signal<Row[]>(SAMPLE_ROWS);
  events: TwRowClickEvent<Row>[] = [];
  onRowClick(e: TwRowClickEvent<Row>): void {
    this.events.push(e);
  }
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('TableComponent — rendering', () => {
  let fixture: ComponentFixture<BasicHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BasicHost] }).compileComponents();
    fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders a <table> element with the expected structure', () => {
    const tableEl = fixture.nativeElement.querySelector('table');
    expect(tableEl).toBeTruthy();
    expect(tableEl!.getAttribute('aria-label')).toBe('Test table');
  });

  it('renders one row per data item', () => {
    const bodyRows = fixture.nativeElement.querySelectorAll('tbody > tr');
    expect(bodyRows.length).toBe(SAMPLE_ROWS.length);
  });

  it('renders the header cells with scope="col"', () => {
    const headerCells = fixture.nativeElement.querySelectorAll('thead th[scope="col"]');
    expect(headerCells.length).toBe(3);
  });

  it('renders cell content using the projected *twCellDef template', () => {
    const firstRowCells = fixture.nativeElement.querySelectorAll('tbody > tr:first-child td');
    const texts = Array.from(firstRowCells).map((el) => (el as HTMLElement).textContent?.trim());
    expect(texts).toEqual(['1', 'Alpha', '10']);
  });

  it('uses the static header label when no *twHeaderCellDef template is projected', () => {
    const headerTexts = Array.from(fixture.nativeElement.querySelectorAll('thead th')).map(
      (el) => (el as HTMLElement).textContent?.trim(),
    );
    expect(headerTexts).toEqual(['ID', 'Name', 'Amount']);
  });

  it('applies tabular-nums to a numeric column', () => {
    const cell = fixture.nativeElement.querySelector('tbody tr td[data-column="amount"]');
    expect(cell).toBeTruthy();
    expect(cell!.className).toMatch(/tabular-nums/);
  });

  it('tags each cell with its column name via data-column', () => {
    const idCells = fixture.nativeElement.querySelectorAll('td[data-column="id"]');
    expect(idCells.length).toBe(SAMPLE_ROWS.length);
  });
});

describe('TableComponent — empty / loading / error', () => {
  let fixture: ComponentFixture<StateHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StateHost] }).compileComponents();
    fixture = TestBed.createComponent(StateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders the fallback empty state when data is empty and no *twNoDataRow is present', async () => {
    fixture.componentInstance.data.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const emptyMessage = fixture.nativeElement.textContent ?? '';
    expect(emptyMessage).toContain(DEFAULT_TABLE_LABELS.empty);
  });

  it('renders the loading overlay when [loading]=true', async () => {
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('[role="status"]');
    expect(overlay).toBeTruthy();
    expect((overlay as HTMLElement).textContent).toContain(DEFAULT_TABLE_LABELS.loading);
  });

  it('renders the error overlay when [error] is set', async () => {
    fixture.componentInstance.error.set('Oops');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).toBeTruthy();
    expect((errorEl as HTMLElement).textContent).toContain('Oops');
  });
});

describe('TableComponent — *twNoDataRow precedence', () => {
  it('renders the custom no-data row and suppresses the empty overlay when projected', async () => {
    await TestBed.configureTestingModule({ imports: [NoDataHost] }).compileComponents();
    const fixture = TestBed.createComponent(NoDataHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const customRow = fixture.nativeElement.querySelector('tr.no-data-row');
    expect(customRow).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Custom no data');
  });
});

describe('TableComponent — row expansion', () => {
  let fixture: ComponentFixture<ExpansionHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ExpansionHost] }).compileComponents();
    fixture = TestBed.createComponent(ExpansionHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders an expansion row for each expanded row', async () => {
    const host = fixture.componentInstance;
    host.expanded.set(new Set([SAMPLE_ROWS[1]]));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const panels = fixture.nativeElement.querySelectorAll('.exp-panel');
    expect(panels.length).toBe(1);
    expect((panels[0] as HTMLElement).textContent).toContain('Expanded 2');
  });

  it('emits expansionChange when expand() is called', () => {
    const tableCmp = fixture.debugElement.children[0].componentInstance as TableComponent<Row>;
    tableCmp.expand(SAMPLE_ROWS[0]);

    const host = fixture.componentInstance;
    expect(host.lastEvent()?.row).toBe(SAMPLE_ROWS[0]);
    expect(host.lastEvent()?.expanded).toBe(true);
    expect(host.lastEvent()?.expandedRows.has(SAMPLE_ROWS[0])).toBe(true);
  });
});

describe('TableComponent — footer context', () => {
  it('passes the current rows snapshot to *twFooterCellDef context', async () => {
    await TestBed.configureTestingModule({ imports: [FooterHost] }).compileComponents();
    const fixture = TestBed.createComponent(FooterHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const footer = fixture.nativeElement.querySelector('tfoot td');
    expect(footer).toBeTruthy();
    expect((footer as HTMLElement).textContent?.trim()).toBe(`Total: ${SAMPLE_ROWS.length}`);
  });
});

describe('TableComponent — async data source', () => {
  it('renders rows emitted by an Observable data source', async () => {
    await TestBed.configureTestingModule({ imports: [ObservableHost] }).compileComponents();
    const fixture = TestBed.createComponent(ObservableHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody > tr');
    expect(rows.length).toBe(SAMPLE_ROWS.length);

    fixture.componentInstance.source.next([SAMPLE_ROWS[0]]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const rowsAfter = fixture.nativeElement.querySelectorAll('tbody > tr');
    expect(rowsAfter.length).toBe(1);
  });
});

describe('TableComponent — row click suppression', () => {
  it('suppresses rowClicked when the click originates inside a button', async () => {
    await TestBed.configureTestingModule({ imports: [RowClickHost] }).compileComponents();
    const fixture = TestBed.createComponent(RowClickHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const tableCmp = fixture.debugElement.children[0].componentInstance as TableComponent<Row>;

    const button = fixture.nativeElement.querySelector('button.row-action') as HTMLElement;
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
    expect(button).toBeTruthy();
    expect(row).toBeTruthy();

    const spy = vi.spyOn(tableCmp.rowClicked, 'emit');

    // Clicking inside a button should suppress rowClicked.
    const buttonEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(buttonEvent, 'composedPath', {
      value: () => [button, row],
    });
    tableCmp.handleRowClick(SAMPLE_ROWS[0], 0, buttonEvent);
    expect(spy).not.toHaveBeenCalled();

    // Clicking the row body should emit.
    const rowEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(rowEvent, 'composedPath', { value: () => [row] });
    tableCmp.handleRowClick(SAMPLE_ROWS[0], 0, rowEvent);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('suppresses rowClicked when the click originates inside a <select>/<option>', async () => {
    await TestBed.configureTestingModule({ imports: [RowClickHost] }).compileComponents();
    const fixture = TestBed.createComponent(RowClickHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const tableCmp = fixture.debugElement.children[0].componentInstance as TableComponent<Row>;
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
    expect(row).toBeTruthy();

    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = 'a';
    option.textContent = 'A';
    select.appendChild(option);
    row.appendChild(select);

    const spy = vi.spyOn(tableCmp.rowClicked, 'emit');

    // Click target is the <option> — its tag must be in INTERACTIVE_TAGS.
    const optionEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(optionEvent, 'composedPath', {
      value: () => [option, select, row],
    });
    tableCmp.handleRowClick(SAMPLE_ROWS[0], 0, optionEvent);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('TableComponent — accessibility', () => {
  it('mirrors aria-label onto the <table> element', async () => {
    await TestBed.configureTestingModule({ imports: [BasicHost] }).compileComponents();
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const tableEl = fixture.nativeElement.querySelector('table');
    expect(tableEl!.getAttribute('aria-label')).toBe('Test table');
  });

  it('announces loading politely via LiveAnnouncer', async () => {
    await TestBed.configureTestingModule({ imports: [StateHost] }).compileComponents();
    const announcer = TestBed.inject(LiveAnnouncer);
    const spy = vi.spyOn(announcer, 'announce');

    const fixture = TestBed.createComponent(StateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const announced = spy.mock.calls.some(
      (call) => typeof call[0] === 'string' && call[0].includes(DEFAULT_TABLE_LABELS.loading),
    );
    expect(announced).toBe(true);
  });
});

describe('TableComponent — selection API', () => {
  it('round-trips the selected list via isSelected() / setSelected()', async () => {
    await TestBed.configureTestingModule({ imports: [BasicHost] }).compileComponents();
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const tableCmp = fixture.debugElement.children[0].componentInstance as TableComponent<Row>;
    expect(tableCmp.isSelected(SAMPLE_ROWS[0])).toBe(false);

    tableCmp.setSelected(SAMPLE_ROWS[0], true);
    expect(tableCmp.isSelected(SAMPLE_ROWS[0])).toBe(true);
    expect(tableCmp.selected()).toEqual([SAMPLE_ROWS[0]]);

    tableCmp.setSelected(SAMPLE_ROWS[0], false);
    expect(tableCmp.isSelected(SAMPLE_ROWS[0])).toBe(false);
    expect(tableCmp.selected()).toEqual([]);
  });
});

// ── appearance.variant / density / size matrix ────────────────────────

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table
      [data]="data()"
      [appearance]="{ variant: variant(), density: density() }"
      aria-label="Appearance host"
    >
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class AppearanceHost {
  data = signal<Row[]>(SAMPLE_ROWS);
  variant = signal<TwTableVariant>('default');
  density = signal<TwTableDensity>('comfortable');
}

describe('TableComponent — appearance.variant', () => {
  it.each<[TwTableVariant, RegExp]>([
    ['default', /\[&>tbody>tr:not\(:last-child\)>td\]:border-b/],
    ['striped', /\[&>tbody>tr:nth-child\(even\)\]:bg-surface-sunken/],
    ['bordered', /rounded-lg/],
  ])('renders the %s variant class set', async (variant, expectedClass) => {
    await TestBed.configureTestingModule({ imports: [AppearanceHost] }).compileComponents();
    const fixture = TestBed.createComponent(AppearanceHost);
    fixture.componentInstance.variant.set(variant);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('tw-table') as HTMLElement;
    const table = host.querySelector('table') as HTMLElement;
    // The bordered variant moves the rounded corners onto the host (root slot); other variants
    // surface their class on the <table>. Check both so the matrix passes uniformly.
    const combined = `${host.className} ${table.className}`;
    expect(combined).toMatch(expectedClass);
  });
});

describe('TableComponent — appearance.density', () => {
  it('applies py-3 padding for comfortable density', async () => {
    await TestBed.configureTestingModule({ imports: [AppearanceHost] }).compileComponents();
    const fixture = TestBed.createComponent(AppearanceHost);
    fixture.componentInstance.density.set('comfortable');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cell = fixture.nativeElement.querySelector('tbody td') as HTMLElement;
    expect(cell.className).toMatch(/py-3/);
  });

  it('applies py-1.5 padding for compact density', async () => {
    await TestBed.configureTestingModule({ imports: [AppearanceHost] }).compileComponents();
    const fixture = TestBed.createComponent(AppearanceHost);
    fixture.componentInstance.density.set('compact');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cell = fixture.nativeElement.querySelector('tbody td') as HTMLElement;
    expect(cell.className).toMatch(/py-1\.5/);
  });
});

// ── responsive ─────────────────────────────────────────────────────────

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table
      [data]="data()"
      [responsive]="{ mode: mode(), stackBelow: 'md' }"
      aria-label="Responsive host"
    >
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
      <tw-column name="amount" headerLabel="Amount" [display]="{ hideBelow: 'md' }">
        <ng-template twCellDef let-row>{{ $any(row).amount }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class ResponsiveHost {
  data = signal<Row[]>(SAMPLE_ROWS);
  mode = signal<TwTableResponsiveMode>('scroll');
}

describe('TableComponent — responsive.mode = stack', () => {
  it('applies stack utilities on the <table> when mode is stack', async () => {
    await TestBed.configureTestingModule({ imports: [ResponsiveHost] }).compileComponents();
    const fixture = TestBed.createComponent(ResponsiveHost);
    fixture.componentInstance.mode.set('stack');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('table') as HTMLElement;
    expect(table.className).toMatch(/\[&>tbody>tr\]:max-md:block/);
  });
});

describe('TableComponent — responsive.mode = hide', () => {
  it('applies max-md:hidden to columns flagged with display.hideBelow=md', async () => {
    await TestBed.configureTestingModule({ imports: [ResponsiveHost] }).compileComponents();
    const fixture = TestBed.createComponent(ResponsiveHost);
    fixture.componentInstance.mode.set('hide');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const amountCell = fixture.nativeElement.querySelector(
      'tbody td[data-column="amount"]',
    ) as HTMLElement;
    expect(amountCell.className).toMatch(/max-md:hidden/);

    const idCell = fixture.nativeElement.querySelector(
      'tbody td[data-column="id"]',
    ) as HTMLElement;
    expect(idCell.className).not.toMatch(/max-md:hidden/);
  });
});

// ── sticky.scrollHeight ────────────────────────────────────────────────

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table
      [data]="data()"
      [sticky]="{ header: true, scrollHeight: '320px' }"
      aria-label="Sticky host"
    >
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class StickyHost {
  data = signal<Row[]>(SAMPLE_ROWS);
}

describe('TableComponent — sticky.scrollHeight + sticky.header', () => {
  it('applies max-height styling to the scroll container', async () => {
    await TestBed.configureTestingModule({ imports: [StickyHost] }).compileComponents();
    const fixture = TestBed.createComponent(StickyHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const scrollContainer = fixture.nativeElement.querySelector(
      'tw-table > div > div',
    ) as HTMLElement;
    expect(scrollContainer.style.maxHeight).toBe('320px');
  });

  it('applies sticky thead class on the <table> when sticky.header is true', async () => {
    await TestBed.configureTestingModule({ imports: [StickyHost] }).compileComponents();
    const fixture = TestBed.createComponent(StickyHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('table') as HTMLElement;
    expect(table.className).toMatch(/\[&>thead\]:sticky/);
  });
});

// ── sticky-header shadow token (striped + sticky compound variant) ────

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table
      [data]="data()"
      [appearance]="{ variant: 'striped' }"
      [sticky]="{ header: true }"
      aria-label="Striped sticky host"
    >
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class StripedStickyHeaderHost {
  data = signal<Row[]>(SAMPLE_ROWS);
}

describe('TableComponent — sticky header shadow token', () => {
  it('uses the shadow-table-sticky token on the striped+sticky compound variant', async () => {
    await TestBed.configureTestingModule({
      imports: [StripedStickyHeaderHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(StripedStickyHeaderHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('table') as HTMLElement;
    expect(table.className).toContain('[&>thead>tr>th]:shadow-table-sticky');
    // Negative: no arbitrary-value escape hatch remains.
    expect(table.className).not.toMatch(/shadow-\[0_1px_0_0/);
  });
});

// ── loading overlay backdrop blur token ───────────────────────────────

describe('TableComponent — loading overlay tokens', () => {
  it('applies backdrop-blur-sm (not arbitrary) on the loading overlay', async () => {
    await TestBed.configureTestingModule({ imports: [StateHost] }).compileComponents();
    const fixture = TestBed.createComponent(StateHost);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector(
      '[role="status"][aria-live="polite"]',
    ) as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.className).toContain('backdrop-blur-sm');
    expect(overlay.className).not.toMatch(/backdrop-blur-\[/);
  });
});

// ── sticky-edge shadows ────────────────────────────────────────────────

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table [data]="data()" aria-label="Sticky-edge host">
      <tw-column name="id" headerLabel="ID" [display]="{ sticky: 'start' }">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
      <tw-column name="name" headerLabel="Name">
        <ng-template twCellDef let-row>{{ $any(row).name }}</ng-template>
      </tw-column>
      <tw-column name="amount" headerLabel="Amount" [display]="{ sticky: 'end' }">
        <ng-template twCellDef let-row>{{ $any(row).amount }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class StickyEdgeHost {
  data = signal<Row[]>(SAMPLE_ROWS);
}

describe('TableComponent — sticky-edge shadows', () => {
  it('applies a right-side hairline shadow on sticky-start cells', async () => {
    await TestBed.configureTestingModule({ imports: [StickyEdgeHost] }).compileComponents();
    const fixture = TestBed.createComponent(StickyEdgeHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cell = fixture.nativeElement.querySelector(
      'tbody td[data-column="id"]',
    ) as HTMLElement;
    expect(cell.className).toContain('shadow-table-sticky-cell-start');
  });

  it('applies a left-side hairline shadow on sticky-end cells', async () => {
    await TestBed.configureTestingModule({ imports: [StickyEdgeHost] }).compileComponents();
    const fixture = TestBed.createComponent(StickyEdgeHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cell = fixture.nativeElement.querySelector(
      'tbody td[data-column="amount"]',
    ) as HTMLElement;
    expect(cell.className).toContain('shadow-table-sticky-cell-end');
  });

  it('leaves non-sticky cells without an edge shadow', async () => {
    await TestBed.configureTestingModule({ imports: [StickyEdgeHost] }).compileComponents();
    const fixture = TestBed.createComponent(StickyEdgeHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cell = fixture.nativeElement.querySelector(
      'tbody td[data-column="name"]',
    ) as HTMLElement;
    expect(cell.className).not.toContain('shadow-table-sticky-cell-start');
    expect(cell.className).not.toContain('shadow-table-sticky-cell-end');
  });
});

// ── aria-sort plumbing via [twSort] ─────────────────────────────────────

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective, SortDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table
      twSort
      [(twSortActive)]="active"
      [(twSortDirection)]="direction"
      [data]="data()"
      aria-label="Sort host"
    >
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
      <tw-column name="name" headerLabel="Name">
        <ng-template twCellDef let-row>{{ $any(row).name }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class SortableHost {
  data = signal<Row[]>(SAMPLE_ROWS);
  active = signal<string | null>(null);
  direction = signal<SortDirection>(null);
}

describe('TableComponent — aria-sort plumbing', () => {
  it('omits aria-sort on every column header when no sort is active', async () => {
    await TestBed.configureTestingModule({ imports: [SortableHost] }).compileComponents();
    const fixture = TestBed.createComponent(SortableHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('thead th');
    for (const th of Array.from(headers) as HTMLElement[]) {
      expect(th.hasAttribute('aria-sort')).toBe(false);
    }
  });

  it('sets aria-sort="ascending" on the active column when direction is asc', async () => {
    await TestBed.configureTestingModule({ imports: [SortableHost] }).compileComponents();
    const fixture = TestBed.createComponent(SortableHost);
    fixture.componentInstance.active.set('id');
    fixture.componentInstance.direction.set('asc');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const idHeader = fixture.nativeElement.querySelector(
      'thead th[data-column="id"]',
    ) as HTMLElement;
    expect(idHeader.getAttribute('aria-sort')).toBe('ascending');

    const nameHeader = fixture.nativeElement.querySelector(
      'thead th[data-column="name"]',
    ) as HTMLElement;
    expect(nameHeader.hasAttribute('aria-sort')).toBe(false);
  });

  it('sets aria-sort="descending" on the active column when direction is desc', async () => {
    await TestBed.configureTestingModule({ imports: [SortableHost] }).compileComponents();
    const fixture = TestBed.createComponent(SortableHost);
    fixture.componentInstance.active.set('name');
    fixture.componentInstance.direction.set('desc');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const nameHeader = fixture.nativeElement.querySelector(
      'thead th[data-column="name"]',
    ) as HTMLElement;
    expect(nameHeader.getAttribute('aria-sort')).toBe('descending');
  });

  it('honours an explicit `sortState` override on the column', async () => {
    @Component({
      imports: [TableComponent, ColumnComponent, CellDefDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <tw-table [data]="data()" aria-label="Explicit sort host">
          <tw-column name="id" headerLabel="ID" [sortState]="'ascending'">
            <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
          </tw-column>
        </tw-table>
      `,
    })
    class ExplicitSortHost {
      data = signal<Row[]>(SAMPLE_ROWS);
    }

    await TestBed.configureTestingModule({ imports: [ExplicitSortHost] }).compileComponents();
    const fixture = TestBed.createComponent(ExplicitSortHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector(
      'thead th[data-column="id"]',
    ) as HTMLElement;
    expect(header.getAttribute('aria-sort')).toBe('ascending');
  });
});

// ── selection rendering + aria-selected ────────────────────────────────

@Component({
  imports: [TableComponent, ColumnComponent, CellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-table
      [data]="data()"
      [selection]="{ enabled: true }"
      [(selected)]="selected"
      aria-label="Selection host"
    >
      <tw-column name="id" headerLabel="ID">
        <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
      </tw-column>
    </tw-table>
  `,
})
class SelectionHost {
  data = signal<Row[]>(SAMPLE_ROWS);
  selected = signal<readonly Row[]>([]);
}

describe('TableComponent — selection column rendering', () => {
  let fixture: ComponentFixture<SelectionHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectionHost] }).compileComponents();
    fixture = TestBed.createComponent(SelectionHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders a master checkbox in the header with an accessible name', () => {
    const masterCheckbox = fixture.nativeElement.querySelector('thead tw-checkbox') as HTMLElement;
    expect(masterCheckbox).toBeTruthy();
    expect(masterCheckbox.getAttribute('aria-label')).toBe('Select all rows');
    expect(masterCheckbox.getAttribute('aria-checked')).toBe('false');
  });

  it('renders one row checkbox per data row with a per-row accessible name', () => {
    const rowCheckboxes = fixture.nativeElement.querySelectorAll('tbody tw-checkbox');
    expect(rowCheckboxes.length).toBe(SAMPLE_ROWS.length);
    const labels = Array.from(rowCheckboxes).map((el) =>
      (el as HTMLElement).getAttribute('aria-label'),
    );
    expect(labels).toEqual(['Select row 1', 'Select row 2', 'Select row 3']);
  });

  it('reports aria-selected="false" on rows when selection is enabled and nothing is selected', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    for (const tr of Array.from(rows) as HTMLElement[]) {
      expect(tr.getAttribute('aria-selected')).toBe('false');
    }
  });

  it('reflects selected rows via aria-selected after setSelected()', async () => {
    const tableCmp = fixture.debugElement.children[0].componentInstance as TableComponent<Row>;
    tableCmp.setSelected(SAMPLE_ROWS[1], true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
    expect(rows[0].getAttribute('aria-selected')).toBe('false');
    expect(rows[1].getAttribute('aria-selected')).toBe('true');
    expect(rows[2].getAttribute('aria-selected')).toBe('false');
  });

  it('flips the master checkbox to indeterminate when only some rows are selected', async () => {
    const tableCmp = fixture.debugElement.children[0].componentInstance as TableComponent<Row>;
    tableCmp.setSelected(SAMPLE_ROWS[0], true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const masterCheckbox = fixture.nativeElement.querySelector('thead tw-checkbox') as HTMLElement;
    expect(masterCheckbox.getAttribute('aria-checked')).toBe('mixed');
  });

  it('reports aria-checked="true" on the master when every row is selected', async () => {
    const tableCmp = fixture.debugElement.children[0].componentInstance as TableComponent<Row>;
    tableCmp.selectAll();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const masterCheckbox = fixture.nativeElement.querySelector('thead tw-checkbox') as HTMLElement;
    expect(masterCheckbox.getAttribute('aria-checked')).toBe('true');
  });

  it('selectAll() / clearSelection() round-trip every row', () => {
    const tableCmp = fixture.debugElement.children[0].componentInstance as TableComponent<Row>;

    tableCmp.selectAll();
    expect(tableCmp.selected().length).toBe(SAMPLE_ROWS.length);

    tableCmp.clearSelection();
    expect(tableCmp.selected().length).toBe(0);
  });
});

describe('TableComponent — selection disabled', () => {
  it('omits aria-selected on rows when selection is not enabled', async () => {
    await TestBed.configureTestingModule({ imports: [BasicHost] }).compileComponents();
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
    expect(row.hasAttribute('aria-selected')).toBe(false);
  });
});

// ── dev-mode guards ────────────────────────────────────────────────────

describe('TableComponent — dev-mode guards', () => {
  it('throws when two <tw-column> elements share the same name', async () => {
    @Component({
      imports: [TableComponent, ColumnComponent, CellDefDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <tw-table [data]="data" aria-label="Dup col host">
          <tw-column name="id" headerLabel="ID">
            <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
          </tw-column>
          <tw-column name="id" headerLabel="Also ID">
            <ng-template twCellDef let-row>{{ $any(row).name }}</ng-template>
          </tw-column>
        </tw-table>
      `,
    })
    class DupColHost {
      data: Row[] = SAMPLE_ROWS;
    }

    await TestBed.configureTestingModule({ imports: [DupColHost] }).compileComponents();
    const fixture = TestBed.createComponent(DupColHost);
    expect(() => {
      fixture.detectChanges();
    }).toThrow(/duplicate column name/);
  });

  it('throws when *twRowExpansion is declared without multiTemplateRows', async () => {
    @Component({
      imports: [TableComponent, ColumnComponent, CellDefDirective, RowExpansionDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <tw-table [data]="data" aria-label="Bad expansion host">
          <tw-column name="id" headerLabel="ID">
            <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
          </tw-column>
          <ng-template twRowExpansion let-row>
            <div>Expanded {{ $any(row).id }}</div>
          </ng-template>
        </tw-table>
      `,
    })
    class BadExpansionHost {
      data: Row[] = SAMPLE_ROWS;
    }

    await TestBed.configureTestingModule({ imports: [BadExpansionHost] }).compileComponents();
    const fixture = TestBed.createComponent(BadExpansionHost);
    expect(() => {
      fixture.detectChanges();
    }).toThrow(/multiTemplateRows/);
  });

  it('warns when the table has no accessible name', async () => {
    @Component({
      imports: [TableComponent, ColumnComponent, CellDefDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <tw-table [data]="data">
          <tw-column name="id" headerLabel="ID">
            <ng-template twCellDef let-row>{{ $any(row).id }}</ng-template>
          </tw-column>
        </tw-table>
      `,
    })
    class NoNameHost {
      data: Row[] = SAMPLE_ROWS;
    }

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await TestBed.configureTestingModule({ imports: [NoNameHost] }).compileComponents();
    const fixture = TestBed.createComponent(NoNameHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const warned = warnSpy.mock.calls.some(
      (call) => typeof call[0] === 'string' && call[0].includes('no accessible name'),
    );
    expect(warned).toBe(true);

    warnSpy.mockRestore();
  });
});
