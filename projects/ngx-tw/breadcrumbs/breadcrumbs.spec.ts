import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TwSize } from 'ngx-tw/core';
import { provideTwIcons } from 'ngx-tw/icon';
import type { TwIconData } from 'ngx-tw/icon';
import {
  BreadcrumbsComponent,
  BreadcrumbsItemTemplateDirective,
  BreadcrumbsLinkDirective,
  BreadcrumbsSeparatorTemplateDirective,
  type TwBreadcrumbsItem,
} from './breadcrumbs';

// Minimal icons to satisfy <tw-icon> registry lookups across the suite.
const CHEVRON_RIGHT: TwIconData = [['polyline', { points: '9 18 15 12 9 6' }]];
const SLASH: TwIconData = [['line', { x1: '4', y1: '20', x2: '20', y2: '4' }]];
const TEST_ICONS = { ChevronRight: CHEVRON_RIGHT, Slash: SLASH };

// ── Test host components (hoisted to file scope; each has a unique selector to
//    avoid the NG0912 component-id collision that recurs when sibling `@Component`
//    declarations live inside describe() blocks). ──────────────────────────────

@Component({
  selector: 'tw-bc-test-basic',
  imports: [BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-breadcrumbs
      [items]="items()"
      [size]="size()"
      [maxItems]="maxItems()"
      [separator]="separator()"
      [aria-label]="ariaLabel()"
    />
  `,
})
class BasicHost {
  items = signal<readonly TwBreadcrumbsItem[]>([
    { label: 'Home', href: '/' },
    { label: 'Library', href: '/library' },
    { label: 'Books' },
  ]);
  size = signal<TwSize>('md');
  maxItems = signal(0);
  separator = signal('chevron-right');
  ariaLabel = signal('Breadcrumb');
}

@Component({
  selector: 'tw-bc-test-custom-item',
  imports: [BreadcrumbsComponent, BreadcrumbsItemTemplateDirective, BreadcrumbsLinkDirective, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-breadcrumbs [items]="items()">
      <ng-template twBreadcrumbsItem let-item let-isCurrent="isCurrent">
        @if (isCurrent) {
          <span twBreadcrumbsLink [current]="true" data-test="current-item">{{ item.label }}</span>
        } @else if (toRouter(item.data); as data) {
          <a twBreadcrumbsLink [routerLink]="data.routerLink" data-test="router-link">{{ item.label }}</a>
        } @else {
          <span twBreadcrumbsLink>{{ item.label }}</span>
        }
      </ng-template>
    </tw-breadcrumbs>
  `,
})
class CustomItemHost {
  items = signal<readonly TwBreadcrumbsItem[]>([
    { label: 'Root', data: { routerLink: '/' } },
    { label: 'Books', data: { routerLink: '/books' } },
    { label: 'Current' },
  ]);
  toRouter(data: unknown): { routerLink: string } | null {
    return data && typeof data === 'object' && 'routerLink' in data
      ? (data as { routerLink: string })
      : null;
  }
}

@Component({
  selector: 'tw-bc-test-custom-sep',
  imports: [BreadcrumbsComponent, BreadcrumbsSeparatorTemplateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-breadcrumbs [items]="items">
      <ng-template twBreadcrumbsSeparator>
        <span data-test="custom-sep">|</span>
      </ng-template>
    </tw-breadcrumbs>
  `,
})
class CustomSeparatorHost {
  items: readonly TwBreadcrumbsItem[] = [
    { label: 'A', href: '/a' },
    { label: 'B', href: '/b' },
    { label: 'C' },
  ];
}

@Component({
  selector: 'tw-bc-test-overflow',
  imports: [BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-breadcrumbs [items]="items" [maxItems]="maxItems()" />
  `,
})
class OverflowHost {
  items: readonly TwBreadcrumbsItem[] = [
    { label: 'One', href: '/1' },
    { label: 'Two', href: '/2' },
    { label: 'Three', href: '/3' },
    { label: 'Four', href: '/4' },
    { label: 'Five', href: '/5' },
    { label: 'Current' },
  ];
  maxItems = signal(3);
}

@Component({
  selector: 'tw-bc-test-disabled',
  imports: [BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-breadcrumbs [items]="items" />`,
})
class DisabledHost {
  items: readonly TwBreadcrumbsItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Restricted', href: '/restricted', disabled: true },
    { label: 'Current' },
  ];
}

@Component({
  selector: 'tw-bc-test-hrefless',
  imports: [BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-breadcrumbs [items]="items" />`,
})
class HrefLessHost {
  items: readonly TwBreadcrumbsItem[] = [
    { label: 'Section' },
    { label: 'Subsection' },
    { label: 'Current' },
  ];
}

@Component({
  selector: 'tw-bc-test-link-directive',
  imports: [BreadcrumbsComponent, BreadcrumbsItemTemplateDirective, BreadcrumbsLinkDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-breadcrumbs [items]="items">
      <ng-template twBreadcrumbsItem let-item let-isCurrent="isCurrent">
        <a twBreadcrumbsLink [current]="isCurrent" [disabled]="!!item.disabled" href="#">
          {{ item.label }}
        </a>
      </ng-template>
    </tw-breadcrumbs>
  `,
})
class LinkDirectiveHost {
  items: readonly TwBreadcrumbsItem[] = [
    { label: 'A' },
    { label: 'B', disabled: true },
    { label: 'C' },
  ];
}

@Component({
  selector: 'tw-bc-test-router',
  imports: [BreadcrumbsComponent, BreadcrumbsItemTemplateDirective, BreadcrumbsLinkDirective, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-breadcrumbs [items]="items">
      <ng-template twBreadcrumbsItem let-item let-isCurrent="isCurrent">
        @if (isCurrent) {
          <span twBreadcrumbsLink [current]="true">{{ item.label }}</span>
        } @else if (toRouter(item.data); as data) {
          <a twBreadcrumbsLink [routerLink]="data.routerLink">{{ item.label }}</a>
        }
      </ng-template>
    </tw-breadcrumbs>
  `,
})
class RouterHost {
  items: readonly TwBreadcrumbsItem[] = [
    { label: 'Home', data: { routerLink: '/' } },
    { label: 'Detail' },
  ];
  toRouter(data: unknown): { routerLink: string } | null {
    return data && typeof data === 'object' && 'routerLink' in data
      ? (data as { routerLink: string })
      : null;
  }
}

@Component({
  selector: 'tw-bc-test-empty',
  imports: [BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<tw-breadcrumbs [items]="[]" />',
})
class EmptyHost {}

@Component({
  selector: 'tw-bc-test-single',
  imports: [BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-breadcrumbs [items]="items" />`,
})
class SingleHost {
  items: readonly TwBreadcrumbsItem[] = [{ label: 'Lonely' }];
}

// ── Helpers ──

function getNav(fixture: ComponentFixture<unknown>): HTMLElement {
  const nav = fixture.nativeElement.querySelector('nav');
  if (!nav) throw new Error('nav element not found');
  return nav as HTMLElement;
}

function getList(fixture: ComponentFixture<unknown>): HTMLOListElement {
  const list = fixture.nativeElement.querySelector('ol');
  if (!list) throw new Error('ol element not found');
  return list as HTMLOListElement;
}

function getItemListItems(fixture: ComponentFixture<unknown>): HTMLLIElement[] {
  // Visible <li>s that are not separators (aria-hidden) and do not house the
  // overflow trigger. We identify the overflow <li> by its `<button>` child.
  return Array.from(
    fixture.nativeElement.querySelectorAll('li:not([aria-hidden="true"])'),
  ).filter((li) => !(li as HTMLElement).querySelector('button[aria-label="Show more breadcrumbs"]')) as HTMLLIElement[];
}

function getSeparatorListItems(fixture: ComponentFixture<unknown>): HTMLLIElement[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('li[aria-hidden="true"]'),
  ) as HTMLLIElement[];
}

function cleanupOverlays(): void {
  document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
}

function setup<T>(host: new () => T, extraProviders: unknown[] = []): ComponentFixture<T> {
  TestBed.configureTestingModule({
    imports: [host as never, OverlayModule],
    providers: [provideTwIcons(TEST_ICONS), ...(extraProviders as never[])],
  });
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  return fixture;
}

// ── Tests ──

describe('BreadcrumbsComponent', () => {
  afterEach(() => {
    cleanupOverlays();
    TestBed.resetTestingModule();
  });

  describe('default render', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(() => {
      fixture = setup(BasicHost);
    });

    it('should create without errors', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render a <nav> landmark', () => {
      expect(getNav(fixture)).toBeTruthy();
    });

    it('should render an <ol> list inside the nav', () => {
      expect(getList(fixture)).toBeTruthy();
    });

    it('should render one <li> per item plus n-1 separator <li>s', () => {
      expect(getItemListItems(fixture).length).toBe(3);
      expect(getSeparatorListItems(fixture).length).toBe(2);
    });

    it('should render item labels in order', () => {
      const itemLis = getItemListItems(fixture);
      expect(itemLis[0].textContent?.trim()).toBe('Home');
      expect(itemLis[1].textContent?.trim()).toBe('Library');
      expect(itemLis[2].textContent?.trim()).toBe('Books');
    });
  });

  describe('ARIA — landmark and current page', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(() => {
      fixture = setup(BasicHost);
    });

    it('should set aria-label="Breadcrumb" by default on the nav', () => {
      expect(getNav(fixture).getAttribute('aria-label')).toBe('Breadcrumb');
    });

    it('should reflect a custom aria-label', () => {
      fixture.componentInstance.ariaLabel.set('Section navigation');
      fixture.detectChanges();
      expect(getNav(fixture).getAttribute('aria-label')).toBe('Section navigation');
    });

    it('should set aria-current="page" on the last item only', () => {
      const currents = fixture.nativeElement.querySelectorAll('[aria-current="page"]');
      expect(currents.length).toBe(1);
      expect((currents[0] as HTMLElement).textContent?.trim()).toBe('Books');
    });

    it('should render the current item as a <span>, not an <a>', () => {
      const current = fixture.nativeElement.querySelector('[aria-current="page"]') as HTMLElement;
      expect(current.tagName.toLowerCase()).toBe('span');
    });

    it('should render non-current items with href as <a>', () => {
      const itemLis = getItemListItems(fixture);
      const firstAnchor = itemLis[0].querySelector('a');
      expect(firstAnchor).toBeTruthy();
      expect(firstAnchor?.getAttribute('href')).toBe('/');
    });

    it('should not set aria-current on non-current items', () => {
      const itemLis = getItemListItems(fixture);
      expect(itemLis[0].querySelector('a')?.getAttribute('aria-current')).toBeNull();
      expect(itemLis[1].querySelector('a')?.getAttribute('aria-current')).toBeNull();
    });

    it('should set aria-hidden="true" on separator <li>s', () => {
      for (const sep of getSeparatorListItems(fixture)) {
        expect(sep.getAttribute('aria-hidden')).toBe('true');
      }
    });
  });

  describe('disabled items', () => {
    it('should render disabled items as <span> with aria-disabled="true"', () => {
      const fixture = setup(DisabledHost);
      const itemLis = getItemListItems(fixture);
      const disabledEl = itemLis[1].querySelector('[aria-disabled="true"]') as HTMLElement;
      expect(disabledEl).toBeTruthy();
      expect(disabledEl.tagName.toLowerCase()).toBe('span');
      expect(itemLis[1].querySelector('a')).toBeNull();
    });
  });

  describe('non-current items without href', () => {
    it('should render non-current href-less items as plain <span>', () => {
      const fixture = setup(HrefLessHost);
      const itemLis = getItemListItems(fixture);
      const first = itemLis[0].querySelector('span') as HTMLElement;
      expect(first).toBeTruthy();
      expect(first.getAttribute('aria-current')).toBeNull();
      expect(itemLis[0].querySelector('a')).toBeNull();
    });
  });

  describe('separator', () => {
    it('should render a tw-icon by default', () => {
      const fixture = setup(BasicHost);
      const sepLis = getSeparatorListItems(fixture);
      expect(sepLis.length).toBeGreaterThan(0);
      expect(sepLis[0].querySelector('tw-icon')).toBeTruthy();
    });

    it('should accept a custom separator icon name', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.separator.set('slash');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('tw-icon')).toBeTruthy();
    });

    it('should replace the icon with the projected separator template when provided', () => {
      const fixture = setup(CustomSeparatorHost);
      const customSeps = fixture.nativeElement.querySelectorAll('[data-test="custom-sep"]');
      expect(customSeps.length).toBe(2);
      expect(fixture.nativeElement.querySelector('tw-icon')).toBeNull();
    });

    it('should include rtl:rotate-180 class on the separator <li>', () => {
      const fixture = setup(BasicHost);
      const sep = getSeparatorListItems(fixture)[0];
      expect(sep.className).toContain('rtl:rotate-180');
    });
  });

  describe('custom item template', () => {
    let fixture: ComponentFixture<CustomItemHost>;

    beforeEach(() => {
      fixture = setup(CustomItemHost, [provideRouter([])]);
    });

    it('should render the custom template for every item', () => {
      const itemLis = getItemListItems(fixture);
      expect(itemLis.length).toBe(3);
      expect(itemLis[0].querySelector('[data-test="router-link"]')).toBeTruthy();
      expect(itemLis[1].querySelector('[data-test="router-link"]')).toBeTruthy();
      expect(itemLis[2].querySelector('[data-test="current-item"]')).toBeTruthy();
    });

    it('should set isCurrent=true only for the last item', () => {
      const currentEls = fixture.nativeElement.querySelectorAll('[data-test="current-item"]');
      expect(currentEls.length).toBe(1);
      expect((currentEls[0] as HTMLElement).textContent?.trim()).toBe('Current');
    });

    it('should apply aria-current="page" to the current span via twBreadcrumbsLink', () => {
      const current = fixture.nativeElement.querySelector('[data-test="current-item"]') as HTMLElement;
      expect(current.getAttribute('aria-current')).toBe('page');
    });

    it('should resolve [routerLink] to an href on the projected anchor', () => {
      const routerLinkAnchors = fixture.nativeElement.querySelectorAll(
        'a[data-test="router-link"]',
      ) as NodeListOf<HTMLAnchorElement>;
      expect(routerLinkAnchors[0].getAttribute('href')).toBe('/');
      expect(routerLinkAnchors[1].getAttribute('href')).toBe('/books');
    });
  });

  describe('BreadcrumbsLinkDirective', () => {
    it('should apply current styling and aria-current to the last item', () => {
      const fixture = setup(LinkDirectiveHost);
      const anchors = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
      expect(anchors[2].getAttribute('aria-current')).toBe('page');
      expect(anchors[0].getAttribute('aria-current')).toBeNull();
      expect(anchors[1].getAttribute('aria-current')).toBeNull();
      expect(anchors[1].className).toContain('opacity-50');
    });
  });

  describe('overflow / truncation', () => {
    it('should not collapse when maxItems is 0', () => {
      const fixture = setup(OverflowHost);
      fixture.componentInstance.maxItems.set(0);
      fixture.detectChanges();
      expect(getItemListItems(fixture).length).toBe(6);
      expect(
        fixture.nativeElement.querySelector('button[aria-label="Show more breadcrumbs"]'),
      ).toBeNull();
    });

    it('should not collapse when items.length <= maxItems', () => {
      const fixture = setup(OverflowHost);
      fixture.componentInstance.maxItems.set(10);
      fixture.detectChanges();
      expect(getItemListItems(fixture).length).toBe(6);
    });

    it('should render first + ellipsis + last (maxItems-1) items when collapsing', () => {
      const fixture = setup(OverflowHost);
      fixture.componentInstance.maxItems.set(3);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector(
        'button[aria-label="Show more breadcrumbs"]',
      );
      expect(trigger).toBeTruthy();

      const itemLis = getItemListItems(fixture);
      expect(itemLis.length).toBe(3);
      expect(itemLis[0].textContent?.trim()).toBe('One');
      expect(itemLis[1].textContent?.trim()).toBe('Five');
      expect(itemLis[2].textContent?.trim()).toBe('Current');

      const allLis = fixture.nativeElement.querySelectorAll('li');
      // Visible items = 3 + overflow trigger = 4 non-hidden, plus 3 separator <li>s.
      expect(allLis.length).toBe(4 + 3);
    });

    it('should clamp maxItems < 2 to 2 (first + overflow + last)', () => {
      const fixture = setup(OverflowHost);
      fixture.componentInstance.maxItems.set(1);
      fixture.detectChanges();

      const itemLis = getItemListItems(fixture);
      expect(itemLis.length).toBe(2);
      expect(itemLis[0].textContent?.trim()).toBe('One');
      expect(itemLis[1].textContent?.trim()).toBe('Current');
      expect(
        fixture.nativeElement.querySelector('button[aria-label="Show more breadcrumbs"]'),
      ).toBeTruthy();
    });

    it('should open the overflow menu on trigger click and list hidden items', () => {
      const fixture = setup(OverflowHost);
      fixture.componentInstance.maxItems.set(3);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector(
        'button[aria-label="Show more breadcrumbs"]',
      ) as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();

      const panel = document.querySelector('tw-menu');
      expect(panel).toBeTruthy();
      const hiddenLinks = panel?.querySelectorAll('[twMenuItem]') ?? [];
      expect(hiddenLinks.length).toBe(3);
      expect(hiddenLinks[0].textContent?.trim()).toBe('Two');
      expect(hiddenLinks[1].textContent?.trim()).toBe('Three');
      expect(hiddenLinks[2].textContent?.trim()).toBe('Four');
    });
  });

  describe('size variants', () => {
    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

    for (const size of sizes) {
      it(`should mount and render in size="${size}"`, () => {
        const fixture = setup(BasicHost);
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        const list = getList(fixture);
        expect(list).toBeTruthy();
        expect(list.className.length).toBeGreaterThan(0);
      });
    }
  });

  describe('focus indicators', () => {
    it('should apply the canonical focus-visible ring classes on anchors', () => {
      const fixture = setup(BasicHost);
      const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
      expect(link.className).toContain('focus-visible:outline-2');
      expect(link.className).toContain('focus-visible:outline-offset-2');
      expect(link.className).toContain('focus-visible:outline-primary-500');
    });

    it('should apply the canonical focus-visible ring classes on the overflow trigger', () => {
      const fixture = setup(OverflowHost);
      fixture.componentInstance.maxItems.set(3);
      fixture.detectChanges();
      const trigger = fixture.nativeElement.querySelector(
        'button[aria-label="Show more breadcrumbs"]',
      ) as HTMLButtonElement;
      expect(trigger.className).toContain('focus-visible:outline-2');
      expect(trigger.className).toContain('focus-visible:outline-primary-500');
    });
  });

  describe('keyboard activation on anchors', () => {
    it('should let click() fire on the focused anchor', () => {
      const fixture = setup(BasicHost);
      const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
      const clickSpy = vi.fn();
      link.addEventListener('click', (e) => {
        e.preventDefault();
        clickSpy();
      });
      link.focus();
      expect(document.activeElement).toBe(link);
      link.click();
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('router integration smoke', () => {
    it('should resolve [routerLink] to a real href', async () => {
      const fixture = setup(RouterHost, [provideRouter([])]);
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
      expect(anchor.getAttribute('href')).toBe('/');
    });
  });

  describe('empty items', () => {
    it('should render an empty ol when items is empty', () => {
      const fixture = setup(EmptyHost);
      expect(getNav(fixture)).toBeTruthy();
      expect(getList(fixture).children.length).toBe(0);
    });
  });

  describe('single item', () => {
    it('should render a single item with aria-current="page" and no separators', () => {
      const fixture = setup(SingleHost);
      expect(getItemListItems(fixture).length).toBe(1);
      expect(getSeparatorListItems(fixture).length).toBe(0);
      const current = fixture.nativeElement.querySelector('[aria-current="page"]') as HTMLElement;
      expect(current).toBeTruthy();
      expect(current.tagName.toLowerCase()).toBe('span');
    });
  });
});
