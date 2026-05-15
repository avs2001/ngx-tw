import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ColumnComponent,
  DEFAULT_TABLE_LABELS,
  TableComponent,
  TwCellDefDirective,
  TwFooterCellDefDirective,
  TwNoDataRowDirective,
  TwRowExpansionDirective,
} from './table';
import type {
  TwRowClickEvent,
  TwRowExpansionChangeEvent,
  TwTableVariant,
} from './table';

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
  imports: [TableComponent, ColumnComponent, TwCellDefDirective],
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
  imports: [TableComponent, ColumnComponent, TwCellDefDirective],
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
  imports: [TableComponent, ColumnComponent, TwCellDefDirective, TwNoDataRowDirective],
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
  imports: [TableComponent, ColumnComponent, TwCellDefDirective, TwRowExpansionDirective],
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
  imports: [TableComponent, ColumnComponent, TwCellDefDirective, TwFooterCellDefDirective],
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
  imports: [TableComponent, ColumnComponent, TwCellDefDirective],
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
  imports: [TableComponent, ColumnComponent, TwCellDefDirective],
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
