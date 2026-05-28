import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { provideRouter, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import {
  TabNavComponent,
  TabLinkDirective,
  TabNavPanel,
  type TabNavVariant,
} from './tab-nav';

// ── Test host components ──

@Component({
  imports: [TabNavComponent, TabLinkDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav twTabNav>
      <a
        twTabLink
        href="#a"
        [active]="activeLink() === 'a'"
        (click)="activeLink.set('a'); $event.preventDefault()"
      >
        Tab A
      </a>
      <a
        twTabLink
        href="#b"
        [active]="activeLink() === 'b'"
        (click)="activeLink.set('b'); $event.preventDefault()"
      >
        Tab B
      </a>
      <a
        twTabLink
        href="#c"
        [active]="activeLink() === 'c'"
        [disabled]="true"
        (click)="activeLink.set('c'); $event.preventDefault()"
      >
        Tab C
      </a>
    </nav>
  `,
})
class BasicHost {
  activeLink = signal('a');
}

@Component({
  imports: [TabNavComponent, TabLinkDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      twTabNav
      [variant]="variant()"
      [color]="color()"
      [size]="size()"
      [fitted]="fitted()"
    >
      <a twTabLink href="#a" [active]="activeLink() === 'a'">A</a>
      <a twTabLink href="#b" [active]="activeLink() === 'b'">B</a>
      <a twTabLink href="#c" [active]="activeLink() === 'c'">C</a>
    </nav>
  `,
})
class VariantHost {
  variant = signal<TabNavVariant>('underline');
  color = signal<TwColor>('primary');
  size = signal<TwSize>('md');
  fitted = signal(false);
  activeLink = signal('a');
}

@Component({
  imports: [TabNavComponent, TabLinkDirective, TabNavPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav twTabNav [tabPanel]="panel()">
      <a
        twTabLink
        linkId="link-a"
        href="#a"
        [active]="activeLink() === 'a'"
        (click)="activeLink.set('a'); $event.preventDefault()"
      >
        A
      </a>
      <a
        twTabLink
        linkId="link-b"
        href="#b"
        [active]="activeLink() === 'b'"
        (click)="activeLink.set('b'); $event.preventDefault()"
      >
        B
      </a>
      <a
        twTabLink
        linkId="link-c"
        href="#c"
        [active]="activeLink() === 'c'"
        [disabled]="true"
      >
        C
      </a>
    </nav>
    <tw-tab-nav-panel id="panel-1">Panel content</tw-tab-nav-panel>
  `,
})
class TabPatternHost {
  readonly panel = viewChild.required(TabNavPanel);
  activeLink = signal('a');
}

@Component({
  imports: [TabNavComponent, TabLinkDirective, TabNavPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav twTabNav>
      <a
        twTabLink
        linkId="link-a"
        href="#a"
        [active]="activeLink() === 'a'"
        (click)="activeLink.set('a'); $event.preventDefault()"
      >
        A
      </a>
      <a
        twTabLink
        linkId="link-b"
        href="#b"
        [active]="activeLink() === 'b'"
        (click)="activeLink.set('b'); $event.preventDefault()"
      >
        B
      </a>
      <tw-tab-nav-panel id="projected-panel">Inner panel content</tw-tab-nav-panel>
    </nav>
  `,
})
class ProjectedPanelHost {
  activeLink = signal('a');
}

@Component({
  imports: [TabNavComponent, TabLinkDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      twTabNav
      [navClass]="navClass()"
      [linkClass]="linkClass()"
    >
      <a twTabLink href="#a" [active]="true">A</a>
      <a twTabLink href="#b">B</a>
    </nav>
  `,
})
class SlotClassHost {
  navClass = signal('custom-nav');
  linkClass = signal('custom-link');
}

@Component({
  imports: [RouterLink, RouterLinkActive, TabNavComponent, TabLinkDirective, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav twTabNav>
      <a twTabLink routerLink="/alpha" routerLinkActive #alphaActive="routerLinkActive" [active]="alphaActive.isActive">Alpha</a>
      <a twTabLink routerLink="/beta" routerLinkActive #betaActive="routerLinkActive" [active]="betaActive.isActive">Beta</a>
    </nav>
    <router-outlet />
  `,
})
class RouterIntegrationHost {}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p>Alpha route</p>',
})
class AlphaRoute {}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p>Beta route</p>',
})
class BetaRoute {}

// ── Tests ──

describe('TabNavComponent', () => {
  describe('default render', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BasicHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
    });

    it('should create without errors', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render a <nav> element', () => {
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav).toBeTruthy();
    });

    it('should render all tab links', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links.length).toBe(3);
    });

    it('should render link text content', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links[0].textContent).toContain('Tab A');
      expect(links[1].textContent).toContain('Tab B');
      expect(links[2].textContent).toContain('Tab C');
    });

    it('should not apply role=tablist without an associated panel', () => {
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav.getAttribute('role')).toBeNull();
    });

    it('should not apply role=tab on links without an associated panel', () => {
      const link = fixture.nativeElement.querySelector('a[twTabLink]');
      expect(link.getAttribute('role')).toBeNull();
    });
  });

  describe('navigation pattern (no tabPanel)', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BasicHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
    });

    it('should set aria-current="page" on the active link', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links[0].getAttribute('aria-current')).toBe('page');
      expect(links[1].getAttribute('aria-current')).toBeNull();
    });

    it('should update aria-current when active changes', () => {
      fixture.componentInstance.activeLink.set('b');
      fixture.detectChanges();

      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links[0].getAttribute('aria-current')).toBeNull();
      expect(links[1].getAttribute('aria-current')).toBe('page');
    });

    it('should not set aria-selected on links', () => {
      const link = fixture.nativeElement.querySelector('a[twTabLink]');
      expect(link.getAttribute('aria-selected')).toBeNull();
    });
  });

  describe('tabs pattern (with tabPanel)', () => {
    let fixture: ComponentFixture<TabPatternHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TabPatternHost],
      }).compileComponents();
      fixture = TestBed.createComponent(TabPatternHost);
      fixture.detectChanges();
    });

    it('should set role="tablist" on the nav', () => {
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav.getAttribute('role')).toBe('tablist');
    });

    it('should set aria-orientation="horizontal" on the nav', () => {
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('should set role="tab" on each link', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      for (const link of Array.from(links)) {
        expect((link as HTMLElement).getAttribute('role')).toBe('tab');
      }
    });

    it('should set aria-selected on active and inactive links', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links[0].getAttribute('aria-selected')).toBe('true');
      expect(links[1].getAttribute('aria-selected')).toBe('false');
    });

    it('should not set aria-current in the tabs pattern', () => {
      const link = fixture.nativeElement.querySelector('a[twTabLink]');
      expect(link.getAttribute('aria-current')).toBeNull();
    });

    it('should set aria-controls pointing to the panel id', () => {
      const link = fixture.nativeElement.querySelector('a[twTabLink]');
      expect(link.getAttribute('aria-controls')).toBe('panel-1');
    });

    it('should link panel aria-labelledby to the active link id', () => {
      const panel = fixture.nativeElement.querySelector(
        '[role="tabpanel"]',
      ) as HTMLElement;
      expect(panel.getAttribute('aria-labelledby')).toBe('link-a');
    });

    it('should update panel aria-labelledby when the active link changes', () => {
      fixture.componentInstance.activeLink.set('b');
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector(
        '[role="tabpanel"]',
      ) as HTMLElement;
      expect(panel.getAttribute('aria-labelledby')).toBe('link-b');
    });

    it('should set tabindex=0 on the active link and -1 on inactive links', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links[0].getAttribute('tabindex')).toBe('0');
      expect(links[1].getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('panel auto-discovery via content projection', () => {
    let fixture: ComponentFixture<ProjectedPanelHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectedPanelHost],
      }).compileComponents();
      fixture = TestBed.createComponent(ProjectedPanelHost);
      fixture.detectChanges();
    });

    it('should activate the tabs pattern when a panel is projected as a child', () => {
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav.getAttribute('role')).toBe('tablist');
    });

    it('should give links role="tab" when the panel is projected', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      for (const link of Array.from(links)) {
        expect((link as HTMLElement).getAttribute('role')).toBe('tab');
      }
    });

    it('should wire aria-controls to the projected panel id', () => {
      const link = fixture.nativeElement.querySelector('a[twTabLink]');
      expect(link.getAttribute('aria-controls')).toBe('projected-panel');
    });

    it('should set the projected panel aria-labelledby to the active link id', () => {
      const panel = fixture.nativeElement.querySelector('[role="tabpanel"]') as HTMLElement;
      expect(panel.getAttribute('aria-labelledby')).toBe('link-a');
    });
  });

  describe('disabled links', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BasicHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
    });

    it('should set aria-disabled="true" on disabled link', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links[2].getAttribute('aria-disabled')).toBe('true');
    });

    it('should set tabindex=-1 on disabled link', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links[2].getAttribute('tabindex')).toBe('-1');
    });

    it('should apply pointer-events-none class to disabled link', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links[2].className).toContain('pointer-events-none');
    });

    it('should call preventDefault on click to block navigation on disabled link', () => {
      const links = fixture.nativeElement.querySelectorAll(
        'a[twTabLink]',
      ) as NodeListOf<HTMLElement>;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      links[2].dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('should call preventDefault on Enter/Space key for disabled link', () => {
      const links = fixture.nativeElement.querySelectorAll(
        'a[twTabLink]',
      ) as NodeListOf<HTMLElement>;
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      links[2].dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('variants', () => {
    let fixture: ComponentFixture<VariantHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VariantHost],
      }).compileComponents();
      fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
    });

    const variants: TabNavVariant[] = ['underline', 'enclosed', 'pill'];
    for (const variant of variants) {
      it(`should render ${variant} variant without errors`, () => {
        fixture.componentInstance.variant.set(variant);
        fixture.detectChanges();
        const nav = fixture.nativeElement.querySelector('nav');
        expect(nav).toBeTruthy();
        const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
        expect(links.length).toBe(3);
      });
    }

    it('should consume slot tokens on the active link for underline variant', () => {
      fixture.componentInstance.variant.set('underline');
      fixture.componentInstance.color.set('primary');
      fixture.detectChanges();
      const activeLink = fixture.nativeElement.querySelector(
        'a[twTabLink]',
      ) as HTMLElement;
      expect(activeLink.className).toContain('border-primary-border-strong');
      expect(activeLink.className).toContain('text-primary-fg');
      expect(activeLink.className).not.toMatch(/\bdark:/);
    });

    it('should consume slot tokens on the active link for pill variant', () => {
      fixture.componentInstance.variant.set('pill');
      fixture.componentInstance.color.set('success');
      fixture.detectChanges();
      const activeLink = fixture.nativeElement.querySelector(
        'a[twTabLink]',
      ) as HTMLElement;
      expect(activeLink.className).toContain('text-success-fg');
      expect(activeLink.className).not.toMatch(/\bdark:/);
    });
  });

  describe('sizes', () => {
    let fixture: ComponentFixture<VariantHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VariantHost],
      }).compileComponents();
      fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
    });

    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    for (const size of sizes) {
      it(`should render ${size} size without errors`, () => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
        expect(links.length).toBe(3);
      });
    }
  });

  describe('colors', () => {
    let fixture: ComponentFixture<VariantHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VariantHost],
      }).compileComponents();
      fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
    });

    const colors: TwColor[] = [
      'primary',
      'secondary',
      'accent',
      'neutral',
      'info',
      'success',
      'warning',
      'error',
    ];
    for (const color of colors) {
      it(`should render ${color} color without errors`, () => {
        fixture.componentInstance.color.set(color);
        fixture.detectChanges();
        const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
        expect(links.length).toBe(3);
      });
    }
  });

  describe('fitted mode', () => {
    let fixture: ComponentFixture<VariantHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VariantHost],
      }).compileComponents();
      fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
    });

    it('should render fitted links without errors', () => {
      fixture.componentInstance.fitted.set(true);
      fixture.detectChanges();
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links.length).toBe(3);
    });

    it('should apply flex-1 class to links when fitted', () => {
      fixture.componentInstance.fitted.set(true);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a[twTabLink]');
      expect(link.className).toContain('flex-1');
    });
  });

  describe('focus ring', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BasicHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
    });

    it('should apply focus-visible outline classes to links', () => {
      const link = fixture.nativeElement.querySelector('a[twTabLink]');
      expect(link.className).toContain('focus-visible:outline-2');
      expect(link.className).toContain('focus-visible:outline-primary-500');
    });
  });

  describe('keyboard navigation in tabs pattern', () => {
    let fixture: ComponentFixture<TabPatternHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TabPatternHost],
      }).compileComponents();
      fixture = TestBed.createComponent(TabPatternHost);
      fixture.detectChanges();
    });

    it('should move focus to the next enabled link on ArrowRight', () => {
      const links = fixture.nativeElement.querySelectorAll(
        'a[twTabLink]',
      ) as NodeListOf<HTMLElement>;
      links[0].focus();
      fixture.detectChanges();

      links[0].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, bubbles: true }),
      );
      fixture.detectChanges();

      expect(document.activeElement).toBe(links[1]);
    });

    it('should skip disabled links when navigating with arrows', () => {
      const links = fixture.nativeElement.querySelectorAll(
        'a[twTabLink]',
      ) as NodeListOf<HTMLElement>;
      links[1].focus();
      fixture.detectChanges();

      // ArrowRight from link B should skip disabled C and wrap to A
      links[1].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, bubbles: true }),
      );
      fixture.detectChanges();

      expect(document.activeElement).toBe(links[0]);
    });

    it('should move focus to the previous enabled link on ArrowLeft', () => {
      const links = fixture.nativeElement.querySelectorAll(
        'a[twTabLink]',
      ) as NodeListOf<HTMLElement>;
      links[1].focus();
      fixture.detectChanges();

      links[1].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', keyCode: 37, bubbles: true }),
      );
      fixture.detectChanges();

      expect(document.activeElement).toBe(links[0]);
    });

    it('should move focus to the first enabled link on Home', () => {
      const links = fixture.nativeElement.querySelectorAll(
        'a[twTabLink]',
      ) as NodeListOf<HTMLElement>;
      links[1].focus();
      fixture.detectChanges();

      links[1].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Home', keyCode: 36, bubbles: true }),
      );
      fixture.detectChanges();

      expect(document.activeElement).toBe(links[0]);
    });

    it('should move focus to the last enabled link on End', () => {
      const links = fixture.nativeElement.querySelectorAll(
        'a[twTabLink]',
      ) as NodeListOf<HTMLElement>;
      links[0].focus();
      fixture.detectChanges();

      links[0].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', keyCode: 35, bubbles: true }),
      );
      fixture.detectChanges();

      // Disabled C is skipped — End should land on B (last enabled).
      expect(document.activeElement).toBe(links[1]);
    });
  });

  describe('Space-key activation on links', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BasicHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
    });

    it('should call click() on the link when Space is pressed', () => {
      const links = fixture.nativeElement.querySelectorAll(
        'a[twTabLink]',
      ) as NodeListOf<HTMLAnchorElement>;
      const clickSpy = vi.spyOn(links[1], 'click');

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      links[1].dispatchEvent(event);

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not call click() on disabled link when Space is pressed', () => {
      const links = fixture.nativeElement.querySelectorAll(
        'a[twTabLink]',
      ) as NodeListOf<HTMLAnchorElement>;
      const clickSpy = vi.spyOn(links[2], 'click');

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      links[2].dispatchEvent(event);

      expect(clickSpy).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('per-slot class hooks', () => {
    let fixture: ComponentFixture<SlotClassHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SlotClassHost],
      }).compileComponents();
      fixture = TestBed.createComponent(SlotClassHost);
      fixture.detectChanges();
    });

    it('should merge navClass onto the nav host', () => {
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav.className).toContain('custom-nav');
    });

    it('should merge linkClass onto every link', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      for (const link of Array.from(links)) {
        expect((link as HTMLElement).className).toContain('custom-link');
      }
    });

    it('should preserve internal classes when navClass is empty', () => {
      fixture.componentInstance.navClass.set('');
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('nav');
      expect(nav.className).toContain('flex');
      expect(nav.className).not.toContain('custom-nav');
    });
  });

  describe('LiveAnnouncer announcements in tabs pattern', () => {
    let fixture: ComponentFixture<TabPatternHost>;
    let mockAnnouncer: { announce: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
      mockAnnouncer = { announce: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [TabPatternHost],
        providers: [{ provide: LiveAnnouncer, useValue: mockAnnouncer }],
      }).compileComponents();
      fixture = TestBed.createComponent(TabPatternHost);
      fixture.detectChanges();
    });

    it('should not announce on initial render', () => {
      expect(mockAnnouncer.announce).not.toHaveBeenCalled();
    });

    it('should announce when the active link changes', () => {
      fixture.componentInstance.activeLink.set('b');
      fixture.detectChanges();

      expect(mockAnnouncer.announce).toHaveBeenCalledTimes(1);
      expect(mockAnnouncer.announce.mock.calls[0][0]).toContain('B');
      expect(mockAnnouncer.announce.mock.calls[0][0]).toContain('2 of 3');
    });

    it('should not re-announce when the active link does not actually change', () => {
      fixture.componentInstance.activeLink.set('b');
      fixture.detectChanges();
      fixture.detectChanges();
      // The signal is set to the same value — the effect re-runs but the id is unchanged.
      fixture.componentInstance.activeLink.set('b');
      fixture.detectChanges();

      expect(mockAnnouncer.announce).toHaveBeenCalledTimes(1);
    });
  });

  describe('LiveAnnouncer with custom label formatter', () => {
    @Component({
      imports: [TabNavComponent, TabLinkDirective, TabNavPanel],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <nav twTabNav [tabPanel]="panel()" [labels]="labels">
          <a twTabLink linkId="link-a" href="#a" [active]="activeLink() === 'a'">Alpha</a>
          <a twTabLink linkId="link-b" href="#b" [active]="activeLink() === 'b'">Bravo</a>
        </nav>
        <tw-tab-nav-panel id="panel-2">Content</tw-tab-nav-panel>
      `,
    })
    class CustomLabelsHost {
      readonly panel = viewChild.required(TabNavPanel);
      activeLink = signal('a');
      labels = {
        activeTabAnnouncement: (label: string, index: number, total: number) =>
          `Tab ${index}/${total}: ${label}`,
      };
    }

    let fixture: ComponentFixture<CustomLabelsHost>;
    let mockAnnouncer: { announce: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
      mockAnnouncer = { announce: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [CustomLabelsHost],
        providers: [{ provide: LiveAnnouncer, useValue: mockAnnouncer }],
      }).compileComponents();
      fixture = TestBed.createComponent(CustomLabelsHost);
      fixture.detectChanges();
    });

    it('should use the consumer formatter for the announcement', () => {
      fixture.componentInstance.activeLink.set('b');
      fixture.detectChanges();
      expect(mockAnnouncer.announce).toHaveBeenCalledWith('Tab 2/2: Bravo');
    });
  });

  describe('router integration', () => {
    let fixture: ComponentFixture<RouterIntegrationHost>;
    let router: Router;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [RouterIntegrationHost],
        providers: [
          provideRouter([
            { path: 'alpha', component: AlphaRoute },
            { path: 'beta', component: BetaRoute },
          ]),
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(RouterIntegrationHost);
      router = TestBed.inject(Router);
      await router.navigateByUrl('/alpha');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should set aria-current="page" on the matching route link', () => {
      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links[0].getAttribute('aria-current')).toBe('page');
      expect(links[1].getAttribute('aria-current')).toBeNull();
    });

    it('should flip aria-current when the URL changes', async () => {
      await router.navigateByUrl('/beta');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const links = fixture.nativeElement.querySelectorAll('a[twTabLink]');
      expect(links[0].getAttribute('aria-current')).toBeNull();
      expect(links[1].getAttribute('aria-current')).toBe('page');
    });
  });

  describe('TabNavPanel', () => {
    let fixture: ComponentFixture<TabPatternHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TabPatternHost],
      }).compileComponents();
      fixture = TestBed.createComponent(TabPatternHost);
      fixture.detectChanges();
    });

    it('should render with role="tabpanel"', () => {
      const panel = fixture.nativeElement.querySelector('tw-tab-nav-panel');
      expect(panel.getAttribute('role')).toBe('tabpanel');
    });

    it('should have tabindex=0', () => {
      const panel = fixture.nativeElement.querySelector('tw-tab-nav-panel');
      expect(panel.getAttribute('tabindex')).toBe('0');
    });

    it('should project content', () => {
      const panel = fixture.nativeElement.querySelector('tw-tab-nav-panel');
      expect(panel.textContent).toContain('Panel content');
    });
  });
});
