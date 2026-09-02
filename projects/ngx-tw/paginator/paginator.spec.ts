import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import {
  PaginatorComponent,
  PaginatorLabelDirective,
  PaginatorEmptyDirective,
  PaginatorPageSizeSelectorDirective,
  buildPaginationRange,
} from './paginator';
import type {
  TwPaginatorLayout,
  TwPaginatorType,
  TwPaginatorPageChangeEvent,
} from './paginator';

// ── Host components ──

@Component({
  imports: [PaginatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-paginator
      [totalItems]="totalItems()"
      [(page)]="page"
      [(pageSize)]="pageSize"
      (paginated)="onPageChange($event)"
    />
  `,
})
class BasicHost {
  totalItems = signal(100);
  page = signal(1);
  pageSize = signal(10);
  lastEvent = signal<TwPaginatorPageChangeEvent | null>(null);
  events: TwPaginatorPageChangeEvent[] = [];
  onPageChange(e: TwPaginatorPageChangeEvent): void {
    this.lastEvent.set(e);
    this.events.push(e);
  }
}

@Component({
  imports: [PaginatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-paginator
      [totalItems]="totalItems()"
      [(page)]="page"
      [(pageSize)]="pageSize"
      [type]="type()"
      [layout]="layout()"
      [size]="size()"
      [color]="color()"
      [showFirstLastButtons]="showFirstLast()"
      [showPageInfo]="showPageInfo()"
      [showPageSizeSelector]="showPageSizeSelector()"
      [pageSizeOptions]="pageSizeOptions()"
      [siblingCount]="siblingCount()"
      [boundaryCount]="boundaryCount()"
      [hideOnEmpty]="hideOnEmpty()"
      [hideOnSinglePage]="hideOnSinglePage()"
      [disabled]="disabled()"
      [labels]="labels()"
      [linkFactory]="linkFactory()"
      (paginated)="onPageChange($event)"
    />
  `,
})
class VariantHost {
  totalItems = signal(100);
  page = signal(1);
  pageSize = signal(10);
  type = signal<TwPaginatorType>('numbered');
  layout = signal<TwPaginatorLayout>('compact');
  size = signal<TwSize>('md');
  color = signal<TwColor>('primary');
  showFirstLast = signal(true);
  showPageInfo = signal(true);
  showPageSizeSelector = signal(false);
  pageSizeOptions = signal<readonly number[]>([10, 25, 50, 100]);
  siblingCount = signal(1);
  boundaryCount = signal(1);
  hideOnEmpty = signal(true);
  hideOnSinglePage = signal(false);
  disabled = signal(false);
  // `string | undefined` so the spec can drive the explicitly-undefined case.
  labels = signal<Record<string, string | undefined>>({});
  linkFactory = signal<((p: number) => string) | undefined>(undefined);

  events: TwPaginatorPageChangeEvent[] = [];
  onPageChange(e: TwPaginatorPageChangeEvent): void {
    this.events.push(e);
  }
}

@Component({
  imports: [
    PaginatorComponent,
    PaginatorLabelDirective,
    PaginatorEmptyDirective,
    PaginatorPageSizeSelectorDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-paginator
      [totalItems]="totalItems()"
      [(page)]="page"
      [(pageSize)]="pageSize"
      [hideOnEmpty]="false"
      [showPageSizeSelector]="showSelector()"
    >
      <ng-template twPaginatorLabel slot="pageInfo" let-ctx>
        <span class="custom-page-info"
          >Showing {{ ctx.start }}&ndash;{{ ctx.end }} of {{ ctx.totalItems }}</span
        >
      </ng-template>
      <ng-template twPaginatorEmpty>
        <span class="custom-empty">Nothing here yet.</span>
      </ng-template>
      <ng-template twPaginatorPageSizeSelector let-ctx>
        <button
          type="button"
          class="custom-size-button"
          (click)="ctx.setPageSize(25)"
        >
          {{ ctx.pageSize }}
        </button>
      </ng-template>
    </tw-paginator>
  `,
})
class ProjectionHost {
  totalItems = signal(100);
  page = signal(1);
  pageSize = signal(10);
  showSelector = signal(true);
}

// ── Helpers ──

function queryNavButton(
  fixture: ComponentFixture<unknown>,
  kind: string,
): HTMLButtonElement | HTMLAnchorElement | null {
  return rootEl(fixture).querySelector(
    `[data-tw-paginator-nav="${kind}"]`,
  ) as HTMLButtonElement | HTMLAnchorElement | null;
}

function queryPageButtons(
  fixture: ComponentFixture<unknown>,
): (HTMLButtonElement | HTMLAnchorElement)[] {
  return Array.from(
    rootEl(fixture).querySelectorAll('[data-tw-paginator-nav="page"]'),
  ) as (HTMLButtonElement | HTMLAnchorElement)[];
}

function rootEl(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

// ── buildPaginationRange — pure unit tests ──

describe('buildPaginationRange', () => {
  it('returns an empty array when totalPages is 0', () => {
    expect(buildPaginationRange(1, 0, 1, 1)).toEqual([]);
  });

  it('returns [1] when totalPages is 1', () => {
    expect(buildPaginationRange(1, 1, 1, 1)).toEqual([1]);
  });

  it('returns all pages without ellipses when totalPages is small', () => {
    expect(buildPaginationRange(3, 5, 1, 1)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPaginationRange(1, 7, 1, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('inserts a right ellipsis when current is near start', () => {
    const result = buildPaginationRange(2, 100, 1, 1);
    expect(result).toEqual([1, 2, 3, 'ellipsis-right', 100]);
  });

  it('inserts a left ellipsis when current is near end', () => {
    const result = buildPaginationRange(99, 100, 1, 1);
    expect(result).toEqual([1, 'ellipsis-left', 98, 99, 100]);
  });

  it('inserts both ellipses when current is in the middle', () => {
    const result = buildPaginationRange(50, 100, 1, 1);
    expect(result).toEqual([
      1,
      'ellipsis-left',
      49,
      50,
      51,
      'ellipsis-right',
      100,
    ]);
  });

  it('handles very large totals (10000 pages) correctly', () => {
    const result = buildPaginationRange(5000, 10000, 1, 1);
    expect(result).toEqual([
      1,
      'ellipsis-left',
      4999,
      5000,
      5001,
      'ellipsis-right',
      10000,
    ]);
  });

  it('honours siblingCount=0 with boundaryCount=1', () => {
    const result = buildPaginationRange(50, 100, 0, 1);
    expect(result).toEqual([
      1,
      'ellipsis-left',
      50,
      'ellipsis-right',
      100,
    ]);
  });

  it('honours larger sibling/boundary counts', () => {
    const result = buildPaginationRange(50, 100, 2, 2);
    expect(result).toEqual([
      1,
      2,
      'ellipsis-left',
      48,
      49,
      50,
      51,
      52,
      'ellipsis-right',
      99,
      100,
    ]);
  });

  it('coerces out-of-range currentPage into the valid interval', () => {
    expect(buildPaginationRange(0, 5, 1, 1)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPaginationRange(9999, 5, 1, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles boundaryCount=0 with siblings', () => {
    const result = buildPaginationRange(5, 20, 1, 0);
    // No boundary pages — just a window around the current.
    expect(result).toContain(4);
    expect(result).toContain(5);
    expect(result).toContain(6);
  });
});

// ── Component tests ──

describe('PaginatorComponent', () => {
  let fixture: ComponentFixture<BasicHost>;
  let host: BasicHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicHost],
    }).compileComponents();
    fixture = TestBed.createComponent(BasicHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Rendering', () => {
    it('creates', () => {
      expect(fixture.nativeElement.querySelector('tw-paginator')).toBeTruthy();
    });

    it('renders the root nav with role=navigation', () => {
      const nav = fixture.nativeElement.querySelector('tw-paginator');
      expect(nav.getAttribute('role')).toBe('navigation');
    });

    it('uses the default aria-label "Pagination"', () => {
      const nav = fixture.nativeElement.querySelector('tw-paginator');
      expect(nav.getAttribute('aria-label')).toBe('Pagination');
    });

    it('renders prev and next buttons by default', () => {
      expect(queryNavButton(fixture, 'prev')).toBeTruthy();
      expect(queryNavButton(fixture, 'next')).toBeTruthy();
    });

    it('renders first and last buttons by default', () => {
      expect(queryNavButton(fixture, 'first')).toBeTruthy();
      expect(queryNavButton(fixture, 'last')).toBeTruthy();
    });

    it('renders numbered page buttons by default', () => {
      const pages = queryPageButtons(fixture);
      expect(pages.length).toBeGreaterThan(0);
    });

    it('renders no content when totalItems=0 and hideOnEmpty is true', () => {
      host.totalItems.set(0);
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('tw-paginator');
      expect(nav.querySelector('[data-tw-paginator-nav]')).toBeNull();
    });
  });

  describe('Pagination math', () => {
    it('computes totalPages from totalItems and pageSize', () => {
      // totalItems=100, pageSize=10 → 10 pages
      // The first/last buttons should be enabled/disabled correctly on page=1
      const first = queryNavButton(fixture, 'first') as HTMLButtonElement;
      const prev = queryNavButton(fixture, 'prev') as HTMLButtonElement;
      const last = queryNavButton(fixture, 'last') as HTMLButtonElement;
      expect(first.disabled).toBe(true);
      expect(prev.disabled).toBe(true);
      expect(last.disabled).toBe(false);
    });

    it('shows "Page X of Y" by default for numbered type', () => {
      const info = fixture.nativeElement.textContent ?? '';
      expect(info).toContain('Page 1 of 10');
    });

    it('updates page info when page changes', async () => {
      host.page.set(3);
      fixture.detectChanges();
      await fixture.whenStable();
      const info = fixture.nativeElement.textContent ?? '';
      expect(info).toContain('Page 3 of 10');
    });
  });

  describe('Clamping', () => {
    it('clamps an out-of-bounds page back into range', async () => {
      host.page.set(999);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.page()).toBe(10);
    });

    it('clamps a zero page up to 1', async () => {
      host.page.set(0);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.page()).toBe(1);
    });

    it('clamps the current page when totalItems shrinks', async () => {
      host.page.set(9);
      fixture.detectChanges();
      await fixture.whenStable();
      host.totalItems.set(20); // 2 pages now
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.page()).toBe(2);
    });
  });

  describe('Interactions', () => {
    it('advances page when Next is clicked', async () => {
      const next = queryNavButton(fixture, 'next') as HTMLButtonElement;
      next.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.page()).toBe(2);
    });

    it('jumps to last page when Last is clicked', async () => {
      const last = queryNavButton(fixture, 'last') as HTMLButtonElement;
      last.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.page()).toBe(10);
    });

    it('jumps to first page when First is clicked', async () => {
      host.page.set(5);
      fixture.detectChanges();
      await fixture.whenStable();
      const first = queryNavButton(fixture, 'first') as HTMLButtonElement;
      first.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.page()).toBe(1);
    });

    it('goes back when Previous is clicked', async () => {
      host.page.set(5);
      fixture.detectChanges();
      await fixture.whenStable();
      const prev = queryNavButton(fixture, 'prev') as HTMLButtonElement;
      prev.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.page()).toBe(4);
    });

    it('navigates to a specific page on page-button click', async () => {
      const pages = queryPageButtons(fixture);
      const pageTwoBtn = pages.find((b) => b.textContent?.trim() === '2');
      pageTwoBtn?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.page()).toBe(2);
    });

    it('emits pageChange with source=click on button click', async () => {
      const next = queryNavButton(fixture, 'next') as HTMLButtonElement;
      next.click();
      fixture.detectChanges();
      await fixture.whenStable();
      const last = host.events[host.events.length - 1];
      expect(last?.source).toBe('click');
      expect(last?.page).toBe(2);
      expect(last?.previousPage).toBe(1);
      expect(last?.totalPages).toBe(10);
      expect(last?.start).toBe(11);
      expect(last?.end).toBe(20);
    });
  });

});

describe('PaginatorComponent — disabled state', () => {
  let fixture: ComponentFixture<VariantHost>;
  let host: VariantHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantHost],
    }).compileComponents();
    fixture = TestBed.createComponent(VariantHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('disables all nav buttons when disabled=true', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    const buttons = rootEl(fixture).querySelectorAll<HTMLButtonElement>(
      'button[data-tw-paginator-nav]',
    );
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => expect(btn.disabled).toBe(true));
  });

  it('blocks clicks when disabled', async () => {
    host.disabled.set(true);
    fixture.detectChanges();
    const pages = Array.from(
      rootEl(fixture).querySelectorAll('[data-tw-paginator-nav="page"]'),
    ) as HTMLButtonElement[];
    const before = host.page();
    pages.forEach((p) => p.click());
    fixture.detectChanges();
    expect(host.page()).toBe(before);
  });
});

// ── Variant, type, layout ──

describe('PaginatorComponent — variants', () => {
  let fixture: ComponentFixture<VariantHost>;
  let host: VariantHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantHost],
    }).compileComponents();
    fixture = TestBed.createComponent(VariantHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('hides numbered page list when type=basic', () => {
    host.type.set('basic');
    fixture.detectChanges();
    const pages = queryPageButtons(fixture);
    expect(pages.length).toBe(0);
  });

  it('renders range info for type=basic via pageRange template', () => {
    host.type.set('basic');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('1');
    expect(text).toContain('10');
    expect(text).toContain('100');
  });

  it('does not render first/last when showFirstLastButtons=false', () => {
    host.showFirstLast.set(false);
    fixture.detectChanges();
    expect(queryNavButton(fixture, 'first')).toBeNull();
    expect(queryNavButton(fixture, 'last')).toBeNull();
  });

  it('does not render page info when showPageInfo=false', () => {
    host.showPageInfo.set(false);
    host.showPageSizeSelector.set(false);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).not.toContain('Page 1 of 10');
  });

  it('renders the page-size selector when showPageSizeSelector=true', () => {
    host.showPageSizeSelector.set(true);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select');
    expect(select).toBeTruthy();
    const options = Array.from(
      (select as HTMLSelectElement).querySelectorAll('option'),
    ).map((o) => o.value);
    expect(options).toEqual(['10', '25', '50', '100']);
  });

  it('hides page-size selector when pageSizeOptions is empty', () => {
    host.showPageSizeSelector.set(true);
    host.pageSizeOptions.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
  });

  it('re-anchors the page when pageSize changes via the selector', async () => {
    host.page.set(5);
    fixture.detectChanges();
    await fixture.whenStable();

    host.showPageSizeSelector.set(true);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      'select',
    ) as HTMLSelectElement;
    select.value = '25';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    // First item was (5-1)*10+1 = 41. New page = ceil(41/25) = 2.
    expect(host.pageSize()).toBe(25);
    expect(host.page()).toBe(2);

    const event = host.events[host.events.length - 1];
    expect(event?.source).toBe('pageSizeChange');
    expect(event?.page).toBe(2);
    expect(event?.pageSize).toBe(25);
    expect(event?.previousPage).toBe(5);
    expect(event?.previousPageSize).toBe(10);
  });

  it('applies responsive container class when responsive=auto (default)', () => {
    const nav = fixture.nativeElement.querySelector('tw-paginator');
    // Tailwind @container utility compiles to a class; we assert the container token.
    expect(nav.getAttribute('class') ?? '').toContain('@container');
  });

  it('renders the disabled empty shell when hideOnEmpty=false', () => {
    host.totalItems.set(0);
    host.hideOnEmpty.set(false);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('No results');
  });

  it('renders nothing when hideOnSinglePage=true and totalPages=1', () => {
    host.totalItems.set(5);
    host.pageSize.set(10);
    host.hideOnSinglePage.set(true);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('tw-paginator');
    expect(nav.querySelector('[data-tw-paginator-nav]')).toBeNull();
  });

  it('routes the `color` input through the active page button tokens', () => {
    host.color.set('error');
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector(
      '[data-tw-paginator-nav="page"][aria-current="page"]',
    ) as HTMLElement;
    expect(active).toBeTruthy();
    const cls = active.className;
    expect(cls).toContain('bg-error-600');
    expect(cls).toContain('text-on-error');
    expect(cls).toContain('border-error-600');
    expect(cls).not.toContain('text-white');
  });

  it('uses the warning-specific `-500` shade on the active page when color=warning', () => {
    host.color.set('warning');
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector(
      '[data-tw-paginator-nav="page"][aria-current="page"]',
    ) as HTMLElement;
    const cls = active.className;
    // Warning role keeps -500 per `theme/_semantic.css` ("yellow signage convention").
    expect(cls).toContain('bg-warning-500');
    expect(cls).toContain('text-on-warning');
  });
});

// ── ARIA + keyboard ──

describe('PaginatorComponent — accessibility', () => {
  let fixture: ComponentFixture<BasicHost>;
  let host: BasicHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicHost],
    }).compileComponents();
    fixture = TestBed.createComponent(BasicHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('marks the current page with aria-current="page"', () => {
    const activePage = fixture.nativeElement.querySelector(
      '[data-tw-paginator-nav="page"][aria-current="page"]',
    );
    expect(activePage).toBeTruthy();
    expect(activePage.textContent.trim()).toBe('1');
  });

  it('applies descriptive aria-label to page buttons', () => {
    const pages = queryPageButtons(fixture);
    const two = pages.find((b) => b.textContent?.trim() === '2');
    expect(two?.getAttribute('aria-label')).toBe('Go to page 2');
  });

  it('applies current-page aria-label to the active page button', () => {
    const active = fixture.nativeElement.querySelector(
      '[data-tw-paginator-nav="page"][aria-current="page"]',
    );
    expect(active.getAttribute('aria-label')).toBe('Page 1, current page');
  });

  it('names ellipsis items with visually-hidden text and hides the glyph from AT', async () => {
    host.totalItems.set(1000);
    host.page.set(50);
    fixture.detectChanges();
    await fixture.whenStable();
    const srLabels: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.sr-only'),
    );
    const ellipsisLabels = srLabels.filter((el) => el.textContent?.trim() === 'More pages');
    expect(ellipsisLabels.length).toBeGreaterThan(0);

    const ellipsis = ellipsisLabels[0].parentElement!;
    // The glyph itself stays out of the accessibility tree; only the sr-only
    // text names the gap.
    expect(ellipsis.querySelector('[aria-hidden="true"]')).toBeTruthy();
    // A span has no role, so ARIA prohibits naming it with aria-label.
    expect(ellipsis.hasAttribute('aria-label')).toBe(false);
  });


  it('moves focus with ArrowRight / ArrowLeft', async () => {
    const pages = queryPageButtons(fixture);
    const pageOne = pages[0];
    pageOne.focus();
    expect(document.activeElement).toBe(pageOne);

    // CDK FocusKeyManager reads `event.keyCode`, NOT `event.key` (jsdom does not
    // populate `keyCode` from `key`). All paginator keyboard tests must dispatch
    // both fields explicitly. ArrowRight=39, ArrowLeft=37, Home=36, End=35.
    pageOne.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, bubbles: true }),
    );
    fixture.detectChanges();
    // ArrowRight from page 1 (index of pageOne in focusables) moves to page 2.
    expect(document.activeElement).not.toBe(pageOne);
  });

  it('moves focus to the first focusable on Home', async () => {
    const last = queryNavButton(fixture, 'last') as HTMLButtonElement;
    last.focus();
    last.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', keyCode: 36, bubbles: true }),
    );
    fixture.detectChanges();
    // First focusable should receive focus — `prev`/`first` are disabled on page 1,
    // so the first non-disabled focusable is the first page button.
    expect(document.activeElement).not.toBe(last);
  });

  it('moves focus to the last focusable on End', async () => {
    const pages = queryPageButtons(fixture);
    const pageOne = pages[0];
    pageOne.focus();
    pageOne.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', keyCode: 35, bubbles: true }),
    );
    fixture.detectChanges();
    // Last focusable should receive focus — `next`/`last` are enabled on page 1
    // (we're not at the last page), so focus lands on one of them.
    expect(document.activeElement).not.toBe(pageOne);
    expect(document.activeElement).not.toBe(document.body);
  });

  it('skips disabled controls during arrow navigation', async () => {
    // On page 1 the `first` and `prev` buttons are disabled. ArrowLeft from
    // page 1 should NOT move focus (the manager skips disabled items, and
    // there is no enabled focusable to the left).
    const pages = queryPageButtons(fixture);
    const pageOne = pages[0];
    pageOne.focus();
    pageOne.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', keyCode: 37, bubbles: true }),
    );
    fixture.detectChanges();
    // The disabled `first`/`prev` controls must be skipped; pageOne keeps focus.
    expect(document.activeElement).toBe(pageOne);
  });

  it('renders the default-color active page button with the primary semantic tokens (no raw `text-white`)', () => {
    const active = fixture.nativeElement.querySelector(
      '[data-tw-paginator-nav="page"][aria-current="page"]',
    ) as HTMLElement;
    expect(active).toBeTruthy();
    const cls = active.className;
    expect(cls).toContain('bg-primary-600');
    expect(cls).toContain('text-on-primary');
    expect(cls).toContain('border-primary-600');
    expect(cls).not.toContain('text-white');
  });

  it('announces page changes via LiveAnnouncer', async () => {
    const announcer = TestBed.inject(LiveAnnouncer);
    const announceSpy = vi.spyOn(announcer, 'announce');

    const next = queryNavButton(fixture, 'next') as HTMLButtonElement;
    next.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(announceSpy).toHaveBeenCalled();
    const [msg, politeness] = announceSpy.mock.calls[0];
    expect(msg).toContain('Page 2');
    expect(msg).toContain('10');
    expect(politeness).toBe('polite');
  });

  it('does not announce on initial render', async () => {
    // Fresh fixture — spy BEFORE first render.
    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [BasicHost] })
      .compileComponents();
    const freshFixture = TestBed.createComponent(BasicHost);
    const announcer = TestBed.inject(LiveAnnouncer);
    const announceSpy = vi.spyOn(announcer, 'announce');
    freshFixture.detectChanges();
    await freshFixture.whenStable();
    expect(announceSpy).not.toHaveBeenCalled();
  });
});

// ── Link mode ──

describe('PaginatorComponent — link mode', () => {
  let fixture: ComponentFixture<VariantHost>;
  let host: VariantHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantHost],
    }).compileComponents();
    fixture = TestBed.createComponent(VariantHost);
    host = fixture.componentInstance;
    host.linkFactory.set((p: number) => `/list?page=${p}`);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders page buttons as anchors with an href', () => {
    const pages = queryPageButtons(fixture) as HTMLAnchorElement[];
    expect(pages[0].tagName).toBe('A');
    expect(pages[0].getAttribute('href')).toBe('/list?page=1');
    expect(pages[1].getAttribute('href')).toBe('/list?page=2');
  });

  it('strips href and marks aria-disabled on disabled nav anchors', () => {
    const first = queryNavButton(fixture, 'first') as HTMLAnchorElement;
    // On page=1, first is disabled.
    expect(first.getAttribute('aria-disabled')).toBe('true');
    expect(first.getAttribute('href')).toBeNull();
  });

  it('keeps a link role on href-less nav anchors so their name survives', () => {
    // An <a> without href exposes no role, and ARIA prohibits aria-label /
    // aria-disabled on a roleless generic (axe: aria-prohibited-attr) — the
    // name would be silently dropped. Restoring role="link" keeps both.
    const first = queryNavButton(fixture, 'first') as HTMLAnchorElement;
    const prev = queryNavButton(fixture, 'prev') as HTMLAnchorElement;
    expect(first.getAttribute('role')).toBe('link');
    expect(first.getAttribute('aria-label')).toBe('First page');
    expect(prev.getAttribute('role')).toBe('link');

    // Enabled anchors keep their native link role — no redundant attribute.
    const next = queryNavButton(fixture, 'next') as HTMLAnchorElement;
    expect(next.getAttribute('href')).toBe('/list?page=2');
    expect(next.hasAttribute('role')).toBe(false);
  });

  it('still emits pageChange when a link is clicked', async () => {
    const pages = queryPageButtons(fixture) as HTMLAnchorElement[];
    const pageTwo = pages.find((p) => p.textContent?.trim() === '2');
    expect(pageTwo).toBeTruthy();
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    pageTwo!.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.page()).toBe(2);
    const last = host.events[host.events.length - 1];
    expect(last?.source).toBe('click');
  });
});

// ── Labels & i18n ──

describe('PaginatorComponent — labels', () => {
  let fixture: ComponentFixture<VariantHost>;
  let host: VariantHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantHost],
    }).compileComponents();
    fixture = TestBed.createComponent(VariantHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('merges partial labels with defaults', () => {
    host.labels.set({
      previous: 'Précédent',
      next: 'Suivant',
    });
    fixture.detectChanges();
    const prev = queryNavButton(fixture, 'prev') as HTMLButtonElement;
    const next = queryNavButton(fixture, 'next') as HTMLButtonElement;
    expect(prev.getAttribute('aria-label')).toBe('Précédent');
    expect(next.getAttribute('aria-label')).toBe('Suivant');
    // Untouched label still English:
    const last = queryNavButton(fixture, 'last') as HTMLButtonElement;
    expect(last.getAttribute('aria-label')).toBe('Last page');
  });

  it('substitutes {page} in pageButtonAriaLabel', () => {
    host.labels.set({ pageButtonAriaLabel: 'Navigate to page {page}' });
    fixture.detectChanges();
    const pages = queryPageButtons(fixture);
    const two = pages.find((b) => b.textContent?.trim() === '2');
    expect(two?.getAttribute('aria-label')).toBe('Navigate to page 2');
  });

  // Regression guard for pass-4 API H4. `exactOptionalPropertyTypes` is off, so
  // `[labels]="{ pageButtonAriaLabel: i18n.pageBtn }"` compiles when the i18n
  // bundle has no such key. A plain spread let that `undefined` overwrite the
  // default and reach `formatLabel()`'s `template.replace(...)`, throwing
  // inside a `computed` and taking the page down on first render.
  it('ignores explicitly-undefined label keys instead of throwing', () => {
    expect(() => {
      host.labels.set({
        pageButtonAriaLabel: undefined,
        currentPageAriaLabel: undefined,
        announcement: undefined,
        pageRange: undefined,
        previous: undefined,
      });
      fixture.detectChanges();
    }).not.toThrow();

    const prev = queryNavButton(fixture, 'prev') as HTMLButtonElement;
    expect(prev.getAttribute('aria-label')).toBe('Previous');

    const pages = queryPageButtons(fixture);
    const two = pages.find((b) => b.textContent?.trim() === '2');
    expect(two?.getAttribute('aria-label')).toBe('Go to page 2');
    const one = pages.find((b) => b.textContent?.trim() === '1');
    expect(one?.getAttribute('aria-label')).toBe('Page 1, current page');
  });

  it('localises the ellipsis name rendered as visually-hidden text', () => {
    host.totalItems.set(1000);
    host.page.set(50);
    host.labels.set({ ellipsis: 'Plus de pages' });
    fixture.detectChanges();
    const texts = Array.from(
      fixture.nativeElement.querySelectorAll('.sr-only') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(texts).toContain('Plus de pages');
  });
});

// ── Content projection ──

describe('PaginatorComponent — content projection', () => {
  let fixture: ComponentFixture<ProjectionHost>;
  let host: ProjectionHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectionHost],
    }).compileComponents();
    fixture = TestBed.createComponent(ProjectionHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders the projected page-info template', () => {
    const custom = fixture.nativeElement.querySelector('.custom-page-info');
    expect(custom).toBeTruthy();
    expect(custom.textContent).toContain('1');
    expect(custom.textContent).toContain('10');
    expect(custom.textContent).toContain('100');
  });

  it('renders the projected empty template when totalItems=0', () => {
    host.totalItems.set(0);
    fixture.detectChanges();
    const custom = fixture.nativeElement.querySelector('.custom-empty');
    expect(custom).toBeTruthy();
    expect(custom.textContent).toContain('Nothing here yet.');
  });

  it('replaces the default page-size selector with the projected template', async () => {
    const customBtn = fixture.nativeElement.querySelector(
      '.custom-size-button',
    ) as HTMLButtonElement;
    expect(customBtn).toBeTruthy();
    expect(fixture.nativeElement.querySelector('select')).toBeNull();

    // Context.setPageSize should mutate state.
    customBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.pageSize()).toBe(25);
  });
});
