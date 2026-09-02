import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TwSize } from '@cdevhub/ngx-tw/core';

import {
  CarouselComponent,
  CarouselIndicatorsComponent,
  CarouselNextDirective,
  CarouselPrevDirective,
  CarouselSlideComponent,
  DEFAULT_CAROUSEL_LABELS,
} from './carousel';

// ── Test scaffolding ──────────────────────────────────────────────
//
// Stub IntersectionObserver + ResizeObserver in jsdom. Each test gets a fresh
// instance map so we can drive callbacks manually for the slide-visibility
// tests.

class IOStub {
  static instances: IOStub[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    IOStub.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {
    /* noop */
  }
  disconnect() {
    this.observed = [];
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  root = null;
  rootMargin = '';
  thresholds = [];
}

class ROStub {
  static instances: ROStub[] = [];
  callback: ResizeObserverCallback;
  observed: Element[] = [];
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    ROStub.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {
    /* noop */
  }
  disconnect() {
    this.observed = [];
  }
}

beforeEach(() => {
  IOStub.instances = [];
  ROStub.instances = [];
  (globalThis as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    IOStub as unknown as typeof IntersectionObserver;
  (globalThis as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    ROStub as unknown as typeof ResizeObserver;
});

@Component({
  imports: [
    CarouselComponent,
    CarouselSlideComponent,
    CarouselIndicatorsComponent,
    CarouselPrevDirective,
    CarouselNextDirective,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <tw-carousel
      [aria-label]="ariaLabel()"
      [autoplay]="autoplay()"
      [autoplayInterval]="autoplayInterval()"
      [loop]="loop()"
      [slidesPerView]="slidesPerView()"
      [slidesToScroll]="slidesToScroll()"
      [(activeIndex)]="activeIndex"
      (slideChange)="lastSlideChange.set($event)"
    >
      @for (slide of slides(); track slide.id) {
        <tw-carousel-slide [label]="slide.label">
          <div [attr.data-id]="slide.id">{{ slide.body }}</div>
        </tw-carousel-slide>
      }
      <button twCarouselPrev>‹</button>
      <button twCarouselNext>›</button>
      <tw-carousel-indicators />
    </tw-carousel>
  `,
})
class TestHost {
  readonly ariaLabel = signal<string | null>('Hero gallery');
  readonly autoplay = signal(false);
  readonly autoplayInterval = signal(5000);
  readonly loop = signal(false);
  readonly slidesPerView = signal(1);
  readonly slidesToScroll = signal(1);
  readonly activeIndex = signal(0);
  readonly slides = signal([
    { id: 1, label: 'One', body: 'A' },
    { id: 2, label: 'Two', body: 'B' },
    { id: 3, label: 'Three', body: 'C' },
  ]);
  readonly lastSlideChange = signal<unknown>(null);
}

function setup(): {
  fixture: ComponentFixture<TestHost>;
  host: TestHost;
  carouselHost: HTMLElement;
  viewport: HTMLElement;
  carousel: CarouselComponent;
} {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const carouselHost = fixture.nativeElement.querySelector('tw-carousel') as HTMLElement;
  const viewport = carouselHost.querySelector(
    '[data-tw-carousel-viewport]',
  ) as HTMLElement;
  const carousel = fixture.debugElement
    .query((d) => d.componentInstance instanceof CarouselComponent)
    .componentInstance as CarouselComponent;
  return { fixture, host, carouselHost, viewport, carousel };
}

/**
 * Dispatch a pointer event. `pointerdown` is bound on the viewport element in
 * the carousel template; `pointermove` / `pointerup` are registered on `window`
 * from `_onPointerDown`, so a drag needs two different targets.
 */
function dispatchPointer(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  clientX: number,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY: 10,
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
    }),
  );
}

// ── Rendering ─────────────────────────────────────────────────────

describe('CarouselComponent — rendering', () => {
  it('renders the carousel region with APG roles', () => {
    const { carouselHost, viewport } = setup();
    expect(carouselHost.getAttribute('role')).toBe('region');
    expect(carouselHost.getAttribute('aria-roledescription')).toBe('carousel');
    expect(carouselHost.getAttribute('aria-label')).toBe('Hero gallery');
    expect(viewport).toBeTruthy();
    expect(viewport.getAttribute('tabindex')).toBe('0');
    expect(viewport.getAttribute('aria-live')).toBe('polite');
  });

  it('renders each slide with group role and computed aria-label', () => {
    const { carouselHost } = setup();
    const slides = carouselHost.querySelectorAll('tw-carousel-slide');
    expect(slides.length).toBe(3);
    expect(slides[0].getAttribute('role')).toBe('group');
    expect(slides[0].getAttribute('aria-roledescription')).toBe('slide');
    expect(slides[0].getAttribute('aria-label')).toBe('1 of 3: One');
    expect(slides[1].getAttribute('aria-label')).toBe('2 of 3: Two');
  });

  it('switches viewport aria-live to "off" when autoplay is on', () => {
    const { host, viewport, fixture } = setup();
    host.autoplay.set(true);
    fixture.detectChanges();
    expect(viewport.getAttribute('aria-live')).toBe('off');
  });

  it('applies orientation-specific overflow utilities', () => {
    const { viewport } = setup();
    // Default orientation is horizontal.
    expect(viewport.className).toContain('overflow-x-auto');
    expect(viewport.className).toContain('snap-x');
  });

  // Regression guard for the slide-sizing wiring fix. This is a binding check,
  // not a layout check — jsdom cannot resolve `calc(...)` against real
  // geometry, and the CSS engine normalizes `calc((100% - 0px) / 1)` into
  // `calc(1 * (100% - 0px))` so an exact-string compare against
  // `carousel.slideBasis()` is unreliable. What this asserts: each slide host
  // carries a non-empty inline `flex-basis`, the value contains the `100%`
  // primitive `slideBasis()` is built from, and the binding is reactive to
  // `slidesPerView` changes. The browser-side discriminating regression lives
  // in `e2e/specs/01-components/carousel.spec.ts`.
  it('wires carousel.slideBasis() through to each slide host as inline flex-basis', () => {
    const { carouselHost } = setup();
    const slideHosts = carouselHost.querySelectorAll(
      'tw-carousel-slide',
    ) as NodeListOf<HTMLElement>;
    expect(slideHosts.length).toBe(3);
    for (const slideHost of slideHosts) {
      expect(slideHost.style.flexBasis).not.toBe('');
      expect(slideHost.style.flexBasis).not.toBe('auto');
      expect(slideHost.style.flexBasis).toContain('100%');
    }
  });

  it('updates the slide flex-basis when slidesPerView changes', () => {
    const { carouselHost, host, fixture } = setup();
    const slideHosts = () =>
      carouselHost.querySelectorAll('tw-carousel-slide') as NodeListOf<HTMLElement>;
    const initial = slideHosts()[0].style.flexBasis;
    expect(initial).not.toBe('');

    host.slidesPerView.set(2);
    fixture.detectChanges();
    const updated = slideHosts()[0].style.flexBasis;
    expect(updated).not.toBe('');
    expect(updated).not.toBe(initial);
    // The gap-md contribution (16px) appears once the divisor is no longer 1.
    expect(updated).toContain('16px');
  });

  it('renders indicators with one button per page', () => {
    const { carouselHost } = setup();
    const indicators = carouselHost.querySelectorAll(
      'tw-carousel-indicators button',
    );
    // slidesPerView=1, slidesToScroll=1, 3 slides → 3 pages.
    expect(indicators.length).toBe(3);
    expect(indicators[0].getAttribute('aria-current')).toBe('true');
    expect(indicators[1].getAttribute('aria-current')).toBeNull();
  });
});

// ── Inputs / outputs ──────────────────────────────────────────────

describe('CarouselComponent — navigation', () => {
  it('next() advances activeIndex and emits slideChange', () => {
    const { carousel, host } = setup();
    const spy = vi.fn();
    carousel.slideChange.subscribe(spy);
    carousel.next();
    expect(carousel.activeIndex()).toBe(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ from: 0, to: 1, trigger: 'programmatic' }),
    );
    expect(host.activeIndex()).toBe(1); // two-way binding updates host
  });

  it('prev() at slide 0 is a no-op when loop is false', () => {
    const { carousel } = setup();
    const spy = vi.fn();
    carousel.slideChange.subscribe(spy);
    carousel.prev();
    expect(carousel.activeIndex()).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('next() at last slide is a no-op when loop is false', () => {
    const { carousel } = setup();
    carousel.activeIndex.set(2);
    const spy = vi.fn();
    carousel.slideChange.subscribe(spy);
    carousel.next();
    expect(carousel.activeIndex()).toBe(2);
    expect(spy).not.toHaveBeenCalled();
  });

  it('isAtStart and isAtEnd reflect boundary positions', () => {
    const { carousel } = setup();
    expect(carousel.isAtStart()).toBe(true);
    expect(carousel.isAtEnd()).toBe(false);
    carousel.activeIndex.set(2);
    expect(carousel.isAtEnd()).toBe(true);
  });

  it('Prev/Next directive hosts disable at boundaries when !loop', () => {
    const { carouselHost } = setup();
    const prev = carouselHost.querySelector('[twCarouselPrev]') as HTMLButtonElement;
    const next = carouselHost.querySelector('[twCarouselNext]') as HTMLButtonElement;
    // activeIndex = 0 → prev disabled, next enabled.
    expect(prev.hasAttribute('disabled')).toBe(true);
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    expect(next.hasAttribute('disabled')).toBe(false);
  });

  it('Prev/Next directive applies default aria-label', () => {
    const { carouselHost } = setup();
    const prev = carouselHost.querySelector('[twCarouselPrev]') as HTMLButtonElement;
    const next = carouselHost.querySelector('[twCarouselNext]') as HTMLButtonElement;
    expect(prev.getAttribute('aria-label')).toBe(DEFAULT_CAROUSEL_LABELS.previous);
    expect(next.getAttribute('aria-label')).toBe(DEFAULT_CAROUSEL_LABELS.next);
  });

  it('clicking the Next directive emits slideChange with trigger "button"', () => {
    const { carouselHost, carousel } = setup();
    const next = carouselHost.querySelector('[twCarouselNext]') as HTMLButtonElement;
    const spy = vi.fn();
    carousel.slideChange.subscribe(spy);
    next.click();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: 'button' }),
    );
  });
});

// ── Loop ──────────────────────────────────────────────────────────

describe('CarouselComponent — loop', () => {
  // Loop wraps run through `_loopJumpTo`, which defers the swap behind a
  // setTimeout so the opacity mask reaches its nadir before the scroll. Use
  // fake timers so the test can drive past the 80 ms gate without sleeping.
  it('next() past last wraps to slide 0 when loop is true', () => {
    vi.useFakeTimers();
    try {
      const { carousel, host, fixture } = setup();
      host.loop.set(true);
      fixture.detectChanges();
      carousel.activeIndex.set(2);
      const spy = vi.fn();
      carousel.slideChange.subscribe(spy);
      carousel.next();
      vi.advanceTimersByTime(100);
      expect(carousel.activeIndex()).toBe(0);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ from: 2, to: 0 }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('prev() at slide 0 wraps to last when loop is true', () => {
    vi.useFakeTimers();
    try {
      const { carousel, host, fixture } = setup();
      host.loop.set(true);
      fixture.detectChanges();
      const spy = vi.fn();
      carousel.slideChange.subscribe(spy);
      carousel.prev();
      vi.advanceTimersByTime(100);
      expect(carousel.activeIndex()).toBe(2);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ from: 0, to: 2 }));
    } finally {
      vi.useRealTimers();
    }
  });
});

// ── Indicators ────────────────────────────────────────────────────

describe('CarouselIndicatorsComponent', () => {
  it('clicking an indicator emits slideChange with trigger "indicator"', () => {
    const { carouselHost, carousel } = setup();
    const indicators = carouselHost.querySelectorAll(
      'tw-carousel-indicators button',
    ) as NodeListOf<HTMLButtonElement>;
    const spy = vi.fn();
    carousel.slideChange.subscribe(spy);
    indicators[2].click();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: 'indicator', to: 2 }),
    );
  });

  // The painted dot is a child of the button, not the button itself, so the
  // button can carry the WCAG 2.2 SC 2.5.8 24x24 target while the mark keeps
  // its 12px geometry. Everything the user actually points at is inside the
  // button, so a click landing on the mark must still navigate.
  it('renders the painted mark inside the indicator button, not as the button', () => {
    const { carouselHost } = setup();
    const buttons = carouselHost.querySelectorAll<HTMLButtonElement>(
      'tw-carousel-indicators button',
    );
    expect(buttons.length).toBe(3);
    for (const button of buttons) {
      expect(button.children.length).toBe(1);
      expect(button.firstElementChild!.tagName).toBe('SPAN');
    }
  });

  it('clicking the painted mark inside an indicator still navigates', () => {
    const { carouselHost, carousel } = setup();
    const mark = carouselHost.querySelectorAll<HTMLElement>(
      'tw-carousel-indicators button > span',
    )[2];
    const spy = vi.fn();
    carousel.slideChange.subscribe(spy);
    mark.click();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: 'indicator', to: 2 }),
    );
  });

  it('marks the active indicator with aria-current="true"', () => {
    const { carousel, fixture, carouselHost } = setup();
    carousel.activeIndex.set(1);
    fixture.detectChanges();
    const indicators = carouselHost.querySelectorAll(
      'tw-carousel-indicators button',
    );
    expect(indicators[0].getAttribute('aria-current')).toBeNull();
    expect(indicators[1].getAttribute('aria-current')).toBe('true');
    expect(indicators[2].getAttribute('aria-current')).toBeNull();
  });
});

// ── Keyboard ──────────────────────────────────────────────────────

describe('CarouselComponent — keyboard', () => {
  it('ArrowRight on focused viewport advances (horizontal)', () => {
    const { viewport, carousel } = setup();
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    viewport.dispatchEvent(event);
    expect(carousel.activeIndex()).toBe(1);
  });

  it('Home jumps to slide 0', () => {
    const { viewport, carousel } = setup();
    carousel.activeIndex.set(2);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(carousel.activeIndex()).toBe(0);
  });

  it('End jumps to the last slide', () => {
    const { viewport, carousel } = setup();
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    expect(carousel.activeIndex()).toBe(2);
  });
});

// ── Autoplay ──────────────────────────────────────────────────────

describe('CarouselComponent — autoplay', () => {
  it('renders the pause control only when autoplay is true', () => {
    const { carouselHost, host, fixture } = setup();
    expect(
      carouselHost.querySelectorAll('button[aria-label*="autoplay" i]').length,
    ).toBe(0);
    host.autoplay.set(true);
    fixture.detectChanges();
    const pauseButton = carouselHost.querySelector(
      'button[aria-label="Pause autoplay"]',
    );
    expect(pauseButton).toBeTruthy();
  });

  it('advances activeIndex via setInterval when autoplay is on', () => {
    vi.useFakeTimers();
    try {
      const { host, fixture, carousel } = setup();
      host.autoplay.set(true);
      host.autoplayInterval.set(1000);
      fixture.detectChanges();
      vi.advanceTimersByTime(1000);
      expect(carousel.activeIndex()).toBe(1);
      vi.advanceTimersByTime(1000);
      expect(carousel.activeIndex()).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clicking the pause control toggles manual pause and emits autoplayPaused', () => {
    const { host, carouselHost, fixture, carousel } = setup();
    host.autoplay.set(true);
    fixture.detectChanges();
    const pauseSpy = vi.fn();
    const resumeSpy = vi.fn();
    carousel.autoplayPaused.subscribe(pauseSpy);
    carousel.autoplayResumed.subscribe(resumeSpy);
    const button = carouselHost.querySelector(
      'button[aria-label="Pause autoplay"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(pauseSpy).toHaveBeenCalledWith('manual');
    // After click, the button label switches to resume.
    const resumeButton = carouselHost.querySelector(
      'button[aria-label="Resume autoplay"]',
    ) as HTMLButtonElement;
    expect(resumeButton).toBeTruthy();
    resumeButton.click();
    fixture.detectChanges();
    expect(resumeSpy).toHaveBeenCalled();
  });

  it('uses bg-overlay-control + hover:bg-overlay-control-hover on the pause control (no raw bg-black)', () => {
    const { host, carouselHost, fixture } = setup();
    host.autoplay.set(true);
    fixture.detectChanges();
    const pauseButton = carouselHost.querySelector(
      'button[aria-label="Pause autoplay"]',
    ) as HTMLButtonElement;
    expect(pauseButton.className).toContain('bg-overlay-control');
    expect(pauseButton.className).toContain('hover:bg-overlay-control-hover');
    expect(pauseButton.className).not.toMatch(/\bbg-black\b/);
  });
});

// ── Slide visibility ──────────────────────────────────────────────

describe('CarouselComponent — slide visibility (IntersectionObserver)', () => {
  it('marks slides aria-hidden + inert when IO reports them not visible', () => {
    const { carouselHost, fixture } = setup();
    const slides = carouselHost.querySelectorAll(
      'tw-carousel-slide',
    ) as NodeListOf<HTMLElement>;
    // Fire IO callback simulating: slide 0 visible, slides 1 and 2 hidden.
    const io = IOStub.instances[0];
    expect(io).toBeTruthy();
    io.callback(
      [
        {
          target: slides[0],
          isIntersecting: true,
          intersectionRatio: 1,
        } as unknown as IntersectionObserverEntry,
        {
          target: slides[1],
          isIntersecting: false,
          intersectionRatio: 0,
        } as unknown as IntersectionObserverEntry,
        {
          target: slides[2],
          isIntersecting: false,
          intersectionRatio: 0,
        } as unknown as IntersectionObserverEntry,
      ],
      io as unknown as IntersectionObserver,
    );
    fixture.detectChanges();
    expect(slides[0].getAttribute('aria-hidden')).toBeNull();
    expect(slides[0].hasAttribute('inert')).toBe(false);
    expect(slides[1].getAttribute('aria-hidden')).toBe('true');
    expect(slides[1].hasAttribute('inert')).toBe(true);
  });
});

// ── Disabled slides ───────────────────────────────────────────────

describe('CarouselComponent — disabled slides', () => {
  @Component({
    imports: [CarouselComponent, CarouselSlideComponent],
    template: `
      <tw-carousel aria-label="Test" [(activeIndex)]="active">
        <tw-carousel-slide><div>A</div></tw-carousel-slide>
        <tw-carousel-slide [disabled]="true"><div>B</div></tw-carousel-slide>
        <tw-carousel-slide><div>C</div></tw-carousel-slide>
      </tw-carousel>
    `,
  })
  class DisabledHost {
    readonly active = signal(0);
  }

  it('next() skips disabled slides', () => {
    const fixture = TestBed.createComponent(DisabledHost);
    fixture.detectChanges();
    const carousel = fixture.debugElement
      .query((d) => d.componentInstance instanceof CarouselComponent)
      .componentInstance as CarouselComponent;
    carousel.next();
    expect(carousel.activeIndex()).toBe(2); // skipped index 1
  });
});

// ── Labels ────────────────────────────────────────────────────────

describe('CarouselComponent — labels', () => {
  it('uses overridden indicator label when provided', () => {
    @Component({
      imports: [CarouselComponent, CarouselSlideComponent, CarouselIndicatorsComponent],
      template: `
        <tw-carousel
          aria-label="Test"
          [labels]="{ indicator: 'Slide {page}' }"
        >
          <tw-carousel-slide><div>A</div></tw-carousel-slide>
          <tw-carousel-slide><div>B</div></tw-carousel-slide>
          <tw-carousel-indicators />
        </tw-carousel>
      `,
    })
    class LabelHost {}

    const fixture = TestBed.createComponent(LabelHost);
    fixture.detectChanges();
    const indicators = fixture.nativeElement.querySelectorAll(
      'tw-carousel-indicators button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(indicators[0].getAttribute('aria-label')).toBe('Slide 1');
    expect(indicators[1].getAttribute('aria-label')).toBe('Slide 2');
  });

  // Pass-4 size-axis correction. The `dots` indicator — the *default* variant —
  // used to render 2/2.5/3/3/3, freezing md/lg/xl at 12px so two of the five
  // advertised steps did nothing. It now follows CLAUDE.md's dot-indicator
  // sub-scale (2 / 2.5 / 3 / 3.5 / 4). Nothing asserted indicator size before,
  // which is why the dead steps survived.
  it('renders a distinct dots-indicator size for every step', () => {
    @Component({
      imports: [CarouselComponent, CarouselSlideComponent, CarouselIndicatorsComponent],
      template: `
        <tw-carousel aria-label="Test">
          <tw-carousel-slide><div>A</div></tw-carousel-slide>
          <tw-carousel-slide><div>B</div></tw-carousel-slide>
          <tw-carousel-indicators variant="dots" [size]="size()" />
        </tw-carousel>
      `,
    })
    class DotSizeHost {
      readonly size = signal<TwSize>('md');
    }

    const expected: Record<TwSize, string> = {
      xs: 'size-2',
      sm: 'size-2.5',
      md: 'size-3',
      lg: 'size-3.5',
      xl: 'size-4',
    };

    const fixture = TestBed.createComponent(DotSizeHost);
    fixture.detectChanges();
    const seen = new Set<string>();

    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      fixture.componentInstance.size.set(size);
      fixture.detectChanges();
      // The painted mark is the <span> inside the indicator button.
      const mark = fixture.nativeElement.querySelector(
        'tw-carousel-indicators button > span',
      ) as HTMLElement;
      const match = /(^|\s)(size-[\d.]+)(\s|$)/.exec(mark.className);
      expect(match).toBeTruthy();
      expect(match![2]).toBe(expected[size]);
      seen.add(match![2]);
    }

    expect(seen.size).toBe(5);
  });

  // Regression guard for pass-4 API H4. `exactOptionalPropertyTypes` is off, so
  // `[labels]="{ indicator: t('carousel.indicator') }"` compiles when `t()`
  // returns `string | undefined`. A plain spread let that `undefined` overwrite
  // the default and reach `formatLabel()`'s `template.replace(...)`, throwing
  // inside a `computed`.
  it('ignores explicitly-undefined label keys instead of throwing', () => {
    @Component({
      imports: [CarouselComponent, CarouselSlideComponent, CarouselIndicatorsComponent],
      template: `
        <tw-carousel aria-label="Test" [labels]="labels">
          <tw-carousel-slide><div>A</div></tw-carousel-slide>
          <tw-carousel-slide><div>B</div></tw-carousel-slide>
          <tw-carousel-indicators />
        </tw-carousel>
      `,
    })
    class UndefinedLabelHost {
      readonly labels: Record<string, string | undefined> = {
        indicator: undefined,
        slideOf: undefined,
        slideOfWithLabel: undefined,
        previous: undefined,
      };
    }

    const fixture = TestBed.createComponent(UndefinedLabelHost);
    expect(() => fixture.detectChanges()).not.toThrow();

    const indicators = fixture.nativeElement.querySelectorAll(
      'tw-carousel-indicators button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(indicators[0].getAttribute('aria-label')).toBe('Go to slide 1');

    const slides = fixture.nativeElement.querySelectorAll(
      'tw-carousel-slide',
    ) as NodeListOf<HTMLElement>;
    expect(slides[0].getAttribute('aria-label')).toBe(
      DEFAULT_CAROUSEL_LABELS.slideOf.replace('{index}', '1').replace('{total}', '2'),
    );
  });

  it('consumer aria-label on prev/next host wins over directive default', () => {
    @Component({
      imports: [CarouselComponent, CarouselSlideComponent, CarouselPrevDirective],
      template: `
        <tw-carousel aria-label="Test">
          <tw-carousel-slide><div>A</div></tw-carousel-slide>
          <tw-carousel-slide><div>B</div></tw-carousel-slide>
          <button twCarouselPrev aria-label="Custom previous">‹</button>
        </tw-carousel>
      `,
    })
    class ConsumerLabelHost {}

    const fixture = TestBed.createComponent(ConsumerLabelHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      '[twCarouselPrev]',
    ) as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Custom previous');
  });
});

// ── Empty / single slide ──────────────────────────────────────────

describe('CarouselComponent — edge cases', () => {
  it('renders without errors when there are no slides', () => {
    @Component({
      imports: [CarouselComponent],
      template: `<tw-carousel aria-label="Empty"></tw-carousel>`,
    })
    class EmptyHost {}
    const fixture = TestBed.createComponent(EmptyHost);
    expect(() => fixture.detectChanges()).not.toThrow();
    const region = fixture.nativeElement.querySelector(
      '[role="region"]',
    ) as HTMLElement;
    expect(region).toBeTruthy();
  });
});

// ── Consumer-supplied accessible name ─────────────────────────────
//
// The host binds `[attr.aria-label]` / `[attr.aria-labelledby]` straight to the
// inputs. Unless those inputs are aliased to the attribute names, a consumer
// writing the plain attributes never reaches them, the bindings resolve to
// `null`, and Angular REMOVES the attributes the consumer wrote — the region
// ends up unnamed and the component even warns about the missing name. Both
// tests below use the static-attribute form on purpose: driving the input
// directly (`setInput`) skips the attribute path entirely and would have
// passed with the bug present.

describe('CarouselComponent — consumer-supplied accessible name', () => {
  it('keeps a plain aria-label attribute written by the consumer', () => {
    @Component({
      imports: [CarouselComponent, CarouselSlideComponent],
      template: `
        <tw-carousel aria-label="Consumer name">
          <tw-carousel-slide label="One">A</tw-carousel-slide>
        </tw-carousel>
      `,
    })
    class LabelHost {}

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(LabelHost);
    fixture.detectChanges();

    const region = fixture.nativeElement.querySelector('tw-carousel') as HTMLElement;
    expect(region.getAttribute('aria-label')).toBe('Consumer name');
    // The dev-mode "provide an accessible name" warning must not fire for a
    // consumer who did supply one.
    expect(
      warn.mock.calls.some((call) => String(call[0]).includes('accessible name')),
    ).toBe(false);
    warn.mockRestore();
  });

  it('keeps a plain aria-labelledby attribute written by the consumer', () => {
    @Component({
      imports: [CarouselComponent, CarouselSlideComponent],
      template: `
        <h2 id="gallery-heading">Gallery</h2>
        <tw-carousel aria-labelledby="gallery-heading">
          <tw-carousel-slide label="One">A</tw-carousel-slide>
        </tw-carousel>
      `,
    })
    class LabelledByHost {}

    const fixture = TestBed.createComponent(LabelledByHost);
    fixture.detectChanges();

    const region = fixture.nativeElement.querySelector('tw-carousel') as HTMLElement;
    expect(region.getAttribute('aria-labelledby')).toBe('gallery-heading');
  });
});

// ── Page count math ───────────────────────────────────────────────

describe('CarouselComponent — page count', () => {
  it('pageCount reflects slidesPerView and slidesToScroll math', () => {
    const { carousel, host, fixture } = setup();
    expect(carousel.pageCount()).toBe(3);
    host.slidesPerView.set(2);
    host.slidesToScroll.set(2);
    fixture.detectChanges();
    // 3 slides, perView 2, toScroll 2 → ceil((3-2)/2)+1 = 2 pages
    expect(carousel.pageCount()).toBe(2);
  });

  it('activePage reflects activeIndex / slidesToScroll', () => {
    const { carousel, host, fixture } = setup();
    host.slidesToScroll.set(2);
    fixture.detectChanges();
    carousel.activeIndex.set(2);
    expect(carousel.activePage()).toBe(1);
  });
});

// ── Teardown ──────────────────────────────────────────────────────
//
// Releasing a drag arms a post-interaction autoplay-pause timer for two
// autoplay intervals. It shipped unstored, so teardown could not clear it: it
// fired long after destroy and wrote a signal on a dead component. The guard is
// the platform interaction — the handle `setTimeout` returned must reach
// `clearTimeout` when the fixture is destroyed — not the private field itself.

describe('CarouselComponent — teardown', () => {
  it('clears the post-interaction autoplay-pause timer when the carousel is destroyed', () => {
    vi.useFakeTimers();
    const setSpy = vi.spyOn(globalThis, 'setTimeout');
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    try {
      const { fixture, viewport } = setup();

      dispatchPointer(viewport, 'pointerdown', 100);
      // Past the 6px engage threshold.
      dispatchPointer(window, 'pointermove', 140);

      // Preconditions, asserted separately so a failure names its own cause:
      // these two are the DOM side effects `_onPointerMove` applies once a drag
      // engages. If the pointer events never reached the handlers, this is
      // where it shows.
      expect(viewport.style.scrollSnapType).toBe('none');
      expect(viewport.className).toContain('cursor-grabbing');

      dispatchPointer(window, 'pointerup', 140);
      expect(viewport.style.scrollSnapType).toBe('');
      expect(viewport.className).not.toContain('cursor-grabbing');

      // `_onPointerUp` arms the pause timer at `interval * 2 + 16`. The host
      // uses the default 5000ms interval and autoplay is off, so nothing else
      // in the component schedules at this delay.
      const pauseDelay = 5000 * 2 + 16;
      const armedHandles = setSpy.mock.calls
        .map((call, i) => ({ delay: call[1], handle: setSpy.mock.results[i]?.value }))
        .filter((entry) => entry.delay === pauseDelay)
        .map((entry) => entry.handle);
      expect(armedHandles.length).toBe(1);

      fixture.destroy();

      expect(clearSpy.mock.calls.map((call) => call[0])).toContain(armedHandles[0]);
    } finally {
      setSpy.mockRestore();
      clearSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('detaches the window-level drag listeners when destroyed mid-drag', () => {
    const { fixture, viewport } = setup();

    dispatchPointer(viewport, 'pointerdown', 100);
    dispatchPointer(window, 'pointermove', 140);
    expect(viewport.style.scrollSnapType).toBe('none');
    expect(viewport.className).toContain('cursor-grabbing');

    // Destroyed mid-drag: `pointerup` never arrives while the component is
    // alive, so the natural cleanup in `_onPointerUp` never runs. Only the
    // DestroyRef hook can detach the window-level listeners.
    fixture.destroy();

    // A leaked `pointerup` listener would run `_onPointerUp` on the dead
    // component, which restores `scrollSnapType` and drops `cursor-grabbing`.
    // Both staying put is the proof the listener is gone.
    dispatchPointer(window, 'pointerup', 140);
    expect(viewport.style.scrollSnapType).toBe('none');
    expect(viewport.className).toContain('cursor-grabbing');
  });
});
