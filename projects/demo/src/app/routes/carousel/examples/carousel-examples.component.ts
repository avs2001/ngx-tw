import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  CarouselComponent,
  CarouselIndicatorsComponent,
  CarouselNextDirective,
  CarouselPrevDirective,
  CarouselSlideComponent,
  type TwCarouselIndicatorPosition,
  type TwCarouselIndicatorVariant,
} from '@cdevhub/ngx-tw/carousel';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

interface HeroSlide {
  readonly id: number;
  readonly title: string;
  readonly subtitle: string;
  readonly tint: string;
}

interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: string;
  readonly accent: string;
  readonly glyph: string;
}

interface Testimonial {
  readonly id: number;
  readonly quote: string;
  readonly author: string;
  readonly role: string;
  readonly avatar: string;
}

interface OnboardingStep {
  readonly id: number;
  readonly title: string;
  readonly body: string;
}

interface Headline {
  readonly id: number;
  readonly tag: string;
  readonly title: string;
}

const HEROES: readonly HeroSlide[] = [
  {
    id: 1,
    title: 'Spring sale',
    subtitle: '30% off everything through Sunday',
    tint: 'from-primary-500 to-info-500',
  },
  {
    id: 2,
    title: 'New collection',
    subtitle: 'The Atelier 2026 line is live',
    tint: 'from-success-500 to-accent-500',
  },
  {
    id: 3,
    title: 'Free shipping',
    subtitle: 'On every order, no minimum',
    tint: 'from-warning-500 to-error-500',
  },
  {
    id: 4,
    title: 'Members get more',
    subtitle: 'Early access two weeks before launch',
    tint: 'from-accent-500 to-primary-500',
  },
];

const PRODUCTS: readonly Product[] = [
  { id: 1, name: 'Studio headphones',  price: '€349', accent: 'bg-primary-100',  glyph: '🎧' },
  { id: 2, name: 'Mechanical keyboard', price: '€189', accent: 'bg-info-100',     glyph: '⌨️' },
  { id: 3, name: 'Field notebook',      price: '€24',  accent: 'bg-warning-100',  glyph: '📓' },
  { id: 4, name: 'Travel mug',          price: '€32',  accent: 'bg-success-100',  glyph: '☕' },
  { id: 5, name: 'Desk lamp',           price: '€89',  accent: 'bg-accent-100',   glyph: '💡' },
  { id: 6, name: 'Linen tote',          price: '€42',  accent: 'bg-secondary-100', glyph: '👜' },
];

const TESTIMONIALS: readonly Testimonial[] = [
  {
    id: 1,
    quote:
      'We shipped our redesigned dashboard in a fraction of the time. The component library does the heavy lifting so our team can focus on product decisions.',
    author: 'Maya Patel',
    role: 'Head of Design, Northwind',
    avatar: 'MP',
  },
  {
    id: 2,
    quote:
      'Accessibility used to be the last thing we got to. Now it ships in the same PR as the feature itself — the defaults are right out of the box.',
    author: 'Diego Rivera',
    role: 'Staff Engineer, Lumen Labs',
    avatar: 'DR',
  },
  {
    id: 3,
    quote:
      'The theming layer is the part I keep recommending. One CSS file and a fresh brand drops into every component, dark mode included.',
    author: 'Anaïs Cheng',
    role: 'Design Systems Lead, Kinder',
    avatar: 'AC',
  },
  {
    id: 4,
    quote:
      'Best DX I have had with an Angular library. Signals everywhere, no NgModules, and the docs actually walk you through the hard cases.',
    author: 'Owen Brooks',
    role: 'Frontend Lead, Stride',
    avatar: 'OB',
  },
  {
    id: 5,
    quote:
      'We replaced three different in-house carousels with this one and our bundle dropped 80 KB. The peek layout alone made the case.',
    author: 'Priya Nair',
    role: 'Senior Engineer, Mosaic',
    avatar: 'PN',
  },
];

const ONBOARDING: readonly OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Acme',
    body: 'Three quick steps and you’re ready to ship. Use the buttons below or your keyboard arrows to move through the tour.',
  },
  {
    id: 2,
    title: 'Connect your data',
    body: 'Hook up GitHub, Linear, or upload a CSV. We’ll automatically detect duplicate items and offer to merge them.',
  },
  {
    id: 3,
    title: 'Invite your team',
    body: 'Send an invite by email or copy a join link. Roles are flexible — viewers, editors, and admins all coexist.',
  },
];

const HEADLINES: readonly Headline[] = [
  { id: 1, tag: 'PLATFORM', title: 'Edge regions now available in São Paulo and Mumbai' },
  { id: 2, tag: 'SECURITY', title: 'Quarterly compliance report posted to the trust portal' },
  { id: 3, tag: 'PRODUCT',  title: 'Workflow Studio enters public beta this week' },
  { id: 4, tag: 'CHANGELOG', title: 'CLI v3.4 — faster builds and smarter cache invalidation' },
  { id: 5, tag: 'EVENTS',   title: 'Office hours Thursday at 16:00 UTC — bring your questions' },
];

const INDICATOR_VARIANTS: TwCarouselIndicatorVariant[] = ['dots', 'lines', 'numbers'];
const INDICATOR_POSITIONS: TwCarouselIndicatorPosition[] = ['below', 'overlay'];
const COLORS: TwColor[] = [
  'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const GAPS: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-carousel-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CarouselComponent,
    CarouselSlideComponent,
    CarouselIndicatorsComponent,
    CarouselPrevDirective,
    CarouselNextDirective,
    CodeBlockComponent,
    ButtonDirective,
  ],
  template: `
    <!-- Hero gallery -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Hero gallery</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The canonical marketing-page configuration: full-bleed slides, looping
        autoplay, and overlay dots. The pause control rendered in the lower-left
        corner is required when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">autoplay</code>
        is on (WCAG 2.2.2) — the carousel renders it for you. Hover or focus inside
        the region also pauses autoplay automatically.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-carousel
          ariaLabel="Featured promotions"
          [autoplay]="true"
          [autoplayInterval]="4000"
          [loop]="true"
        >
          @for (hero of heroes; track hero.id) {
            <tw-carousel-slide [label]="hero.title">
              <div
                class="flex h-56 flex-col items-start justify-end rounded-lg p-6 bg-gradient-to-br text-white"
                [class]="hero.tint"
              >
                <p class="text-2xl font-semibold mb-1">{{ hero.title }}</p>
                <p class="text-sm opacity-90">{{ hero.subtitle }}</p>
              </div>
            </tw-carousel-slide>
          }
          <tw-carousel-indicators position="overlay" color="neutral" />
        </tw-carousel>
      </div>
      <tw-code-block [code]="heroSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Always pair autoplay with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loop</code>
        for hero galleries — without looping, autoplay stops the moment the user
        reaches the last slide and the rotation appears broken.
      </p>
    </section>

    <!-- Product gallery -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Product gallery</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Side-controlled gallery with explicit Prev / Next buttons and dots placed
        below the viewport. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twCarouselPrev]</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twCarouselNext]</code>
        directives attach to whatever button primitive you use — they handle
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>,
        the disabled state at boundaries, and the click → navigation wiring without
        forcing a particular visual style.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-carousel ariaLabel="Featured products">
          @for (product of products; track product.id) {
            <tw-carousel-slide [label]="product.name">
              <div class="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-8">
                <div
                  class="flex size-24 items-center justify-center rounded-full text-4xl"
                  [class]="product.accent"
                >
                  {{ product.glyph }}
                </div>
                <div class="text-center">
                  <p class="text-base font-semibold text-fg">{{ product.name }}</p>
                  <p class="text-sm text-fg-muted mt-1">{{ product.price }}</p>
                </div>
              </div>
            </tw-carousel-slide>
          }

          <button
            twCarouselPrev
            class="absolute start-2 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-surface-raised/95 border border-border shadow-sm flex items-center justify-center text-fg hover:bg-surface-muted disabled:opacity-40 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            twCarouselNext
            class="absolute end-2 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-surface-raised/95 border border-border shadow-sm flex items-center justify-center text-fg hover:bg-surface-muted disabled:opacity-40 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <tw-carousel-indicators />
        </tw-carousel>
      </div>
      <tw-code-block [code]="productSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        At the first slide the Prev button auto-disables (the directive sets
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled="true"</code>);
        same for Next at the last slide. Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loop</code>
        if you want the buttons to wrap around instead.
      </p>
    </section>

    <!-- Peek / testimonials -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Peek layout (testimonials)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Setting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">slidesPerView</code>
        to a fractional value like
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1.2</code>
        shows ~20% of the next slide, hinting that more content is available. Pair
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">slidesToScroll="1"</code>
        so each Next click advances one card at a time rather than jumping a full
        page.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-carousel
          ariaLabel="Customer testimonials"
          [slidesPerView]="1.2"
          [slidesToScroll]="1"
          gap="md"
        >
          @for (t of testimonials; track t.id) {
            <tw-carousel-slide [label]="t.author">
              <figure class="flex h-full flex-col gap-4 rounded-lg border border-border bg-surface p-6">
                <svg viewBox="0 0 24 24" class="size-6 text-primary-500 shrink-0" fill="currentColor" aria-hidden="true">
                  <path d="M6 17h3l2-4V7H5v6h3l-2 4Zm8 0h3l2-4V7h-6v6h3l-2 4Z" />
                </svg>
                <blockquote class="text-sm text-fg leading-relaxed">{{ t.quote }}</blockquote>
                <figcaption class="flex items-center gap-3 mt-auto">
                  <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                    {{ t.avatar }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-fg truncate">{{ t.author }}</p>
                    <p class="text-xs text-fg-muted truncate">{{ t.role }}</p>
                  </div>
                </figcaption>
              </figure>
            </tw-carousel-slide>
          }
        </tw-carousel>
      </div>
      <tw-code-block [code]="peekSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The peek layout works well without prev/next buttons — the partially visible
        next card already signals "swipe / scroll for more". Add controls when the
        carousel sits in an area where touch is unlikely (e.g. a desktop-only marketing page).
      </p>
    </section>

    <!-- Onboarding deck -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Onboarding deck</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A linear, non-looping flow driven by full-width buttons. Loop and autoplay
        are off; the user is in charge of pacing. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lines</code>
        indicator style reads as a progress bar — three slides, three lit segments
        as the user advances.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-carousel ariaLabel="Onboarding tour" [(activeIndex)]="onboardingStep">
          @for (step of onboardingSteps; track step.id) {
            <tw-carousel-slide [label]="step.title">
              <div class="flex h-52 flex-col items-center justify-center gap-3 rounded-lg bg-gradient-to-br from-primary-50 to-info-50 px-8 text-center">
                <span class="inline-flex size-10 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-semibold">
                  {{ step.id }}
                </span>
                <p class="text-base font-semibold text-fg">{{ step.title }}</p>
                <p class="text-sm text-fg-muted max-w-md">{{ step.body }}</p>
              </div>
            </tw-carousel-slide>
          }

          <div class="flex items-center justify-between mt-5">
            <button twButton twCarouselPrev variant="ghost" color="neutral">Back</button>
            <tw-carousel-indicators variant="lines" />
            <button twButton twCarouselNext>Next</button>
          </div>
        </tw-carousel>
      </div>
      <tw-code-block [code]="onboardingSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(activeIndex)]</code>
        two-way binding gives the host component a stable handle on the current
        step — useful when "Next" on the last slide should advance the parent
        wizard, or when an analytics event needs the step name.
      </p>
    </section>

    <!-- Vertical ticker -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Vertical news ticker</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">orientation="vertical"</code>
        for compact tickers and feature lists. With autoplay + loop on a fixed
        height, the slides cycle in place — the kind of update strip you'd see at
        the top of a dashboard.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-carousel
          ariaLabel="Latest updates"
          orientation="vertical"
          [autoplay]="true"
          [autoplayInterval]="3500"
          [loop]="true"
          class="h-16"
        >
          @for (headline of headlines; track headline.id) {
            <tw-carousel-slide [label]="headline.title">
              <div class="flex h-16 items-center gap-3 px-1">
                <span class="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                  {{ headline.tag }}
                </span>
                <p class="text-sm text-fg truncate">{{ headline.title }}</p>
              </div>
            </tw-carousel-slide>
          }
        </tw-carousel>
      </div>
      <tw-code-block [code]="tickerSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        For a true ticker, fix the carousel's height to one slide's height (here
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">class="h-16"</code>);
        otherwise the viewport grows to fit all slides and looks like a normal
        list. Hover the strip to pause autoplay — useful when the headline is
        long enough that the user needs a moment to read it.
      </p>
    </section>

    <!-- Indicator variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Indicator variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Three built-in indicator styles —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dots</code>
        for ambient hint-of-position,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lines</code>
        for progress-bar semantics, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numbers</code>
        when there are enough slides that "X of Y" matters. The active state of
        each variant carries a non-color signal (scale, width, fill) so it remains
        distinguishable in monochrome contexts (WCAG 1.4.1).
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-8">
        @for (variant of indicatorVariants; track variant) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ variant }}</p>
            <tw-carousel ariaLabel="Indicator variant {{ variant }}">
              @for (hero of heroes.slice(0, 3); track hero.id) {
                <tw-carousel-slide [label]="hero.title">
                  <div class="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br text-white text-sm font-medium" [class]="hero.tint">
                    {{ hero.title }}
                  </div>
                </tw-carousel-slide>
              }
              <tw-carousel-indicators [variant]="variant" />
            </tw-carousel>
          </div>
        }
      </div>
      <tw-code-block [code]="indicatorVariantsSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Toggle every meaningful axis at once. Useful starting points: turn on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">autoplay</code>
        + <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loop</code>
        for a marketing-style hero, or bump
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">slidesPerView</code>
        to <code class="font-mono">1.5</code> with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">snapAlign="center"</code>
        for a centered peek layout.
      </p>
      <p class="text-xs text-fg-muted leading-relaxed max-w-2xl mb-4">
        Note: indicators only render when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">slidesPerView === 1</code>.
        A single dot can never match a viewport that shows two or more slides,
        so the indicators auto-hide for multi-item layouts. Use Prev/Next
        directives for paging at <code class="font-mono">slidesPerView &gt; 1</code>.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-6 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Orientation</label>
            <div class="flex gap-1">
              @for (o of ['horizontal', 'vertical']; track o) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playOrientation() === o"
                  [class.!text-primary-700]="playOrientation() === o"
                  (click)="playOrientation.set($any(o))"
                >{{ o }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Slides per view</label>
            <div class="flex gap-1">
              @for (n of slidesPerViewOptions; track n) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playSlidesPerView() === n"
                  [class.!text-primary-700]="playSlidesPerView() === n"
                  (click)="playSlidesPerView.set(n)"
                >{{ n }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Slides to scroll</label>
            <div class="flex gap-1">
              @for (n of slidesToScrollOptions; track n) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playSlidesToScroll() === n"
                  [class.!text-primary-700]="playSlidesToScroll() === n"
                  (click)="playSlidesToScroll.set(n)"
                >{{ n }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Gap</label>
            <div class="flex gap-1">
              @for (g of gaps; track g) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playGap() === g"
                  [class.!text-primary-700]="playGap() === g"
                  (click)="playGap.set(g)"
                >{{ g }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Snap align</label>
            <div class="flex gap-1">
              @for (s of snapOptions; track s) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playSnapAlign() === s"
                  [class.!text-primary-700]="playSnapAlign() === s"
                  (click)="playSnapAlign.set($any(s))"
                >{{ s }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Behavior</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playLoop()"
                [class.!text-primary-700]="playLoop()"
                (click)="playLoop.set(!playLoop())"
              >loop</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playAutoplay()"
                [class.!text-primary-700]="playAutoplay()"
                (click)="playAutoplay.set(!playAutoplay())"
              >autoplay</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDraggable()"
                [class.!text-primary-700]="playDraggable()"
                (click)="playDraggable.set(!playDraggable())"
              >drag</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playKeyboard()"
                [class.!text-primary-700]="playKeyboard()"
                (click)="playKeyboard.set(!playKeyboard())"
              >keyboard</button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Indicator variant</label>
            <div class="flex gap-1">
              @for (v of indicatorVariants; track v) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playIndicatorVariant() === v"
                  [class.!text-primary-700]="playIndicatorVariant() === v"
                  (click)="playIndicatorVariant.set(v)"
                >{{ v }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Indicator position</label>
            <div class="flex gap-1">
              @for (p of indicatorPositions; track p) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playIndicatorPosition() === p"
                  [class.!text-primary-700]="playIndicatorPosition() === p"
                  (click)="playIndicatorPosition.set(p)"
                >{{ p }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Indicator color</label>
            <div class="flex flex-wrap gap-1">
              @for (c of colors; track c) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playIndicatorColor() === c"
                  [class.!text-primary-700]="playIndicatorColor() === c"
                  (click)="playIndicatorColor.set(c)"
                >{{ c }}</button>
              }
            </div>
          </div>
        </div>

        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-carousel
            ariaLabel="Playground carousel"
            [orientation]="playOrientation()"
            [slidesPerView]="playSlidesPerView()"
            [slidesToScroll]="playSlidesToScroll()"
            [gap]="playGap()"
            [snapAlign]="playSnapAlign()"
            [loop]="playLoop()"
            [autoplay]="playAutoplay()"
            [autoplayInterval]="4000"
            [draggable]="playDraggable()"
            [keyboard]="playKeyboard()"
            [(activeIndex)]="playActiveIndex"
            [class]="playOrientation() === 'vertical' ? 'h-64' : ''"
          >
            @for (hero of heroes; track hero.id) {
              <tw-carousel-slide [label]="hero.title">
                <div
                  class="flex h-40 items-center justify-center rounded-lg bg-gradient-to-br text-white text-base font-semibold px-4 text-center"
                  [class]="hero.tint"
                >
                  {{ hero.title }}
                </div>
              </tw-carousel-slide>
            }
            <tw-carousel-indicators
              [variant]="playIndicatorVariant()"
              [position]="playIndicatorPosition()"
              [color]="playIndicatorColor()"
            />
          </tw-carousel>
        </div>

        <p class="text-xs text-fg-muted mt-4 font-mono">
          activeIndex = {{ playActiveIndex() }}
        </p>
      </div>
    </section>
  `,
})
export class CarouselExamples {
  protected readonly heroes = HEROES;
  protected readonly products = PRODUCTS;
  protected readonly testimonials = TESTIMONIALS;
  protected readonly onboardingSteps = ONBOARDING;
  protected readonly headlines = HEADLINES;
  protected readonly indicatorVariants = INDICATOR_VARIANTS;
  protected readonly indicatorPositions = INDICATOR_POSITIONS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly gaps = GAPS;
  protected readonly snapOptions = ['start', 'center', 'end'] as const;
  protected readonly slidesPerViewOptions = [1, 1.2, 2, 3];
  protected readonly slidesToScrollOptions = [1, 2, 3];

  protected readonly onboardingStep = signal(0);

  // Playground signals
  protected readonly playOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  protected readonly playSlidesPerView = signal<number>(1);
  protected readonly playSlidesToScroll = signal<number>(1);
  protected readonly playGap = signal<TwSize>('md');
  protected readonly playSnapAlign = signal<'start' | 'center' | 'end'>('start');
  protected readonly playLoop = signal(false);
  protected readonly playAutoplay = signal(false);
  protected readonly playDraggable = signal(true);
  protected readonly playKeyboard = signal(true);
  protected readonly playIndicatorVariant = signal<TwCarouselIndicatorVariant>('dots');
  protected readonly playIndicatorPosition = signal<TwCarouselIndicatorPosition>('below');
  protected readonly playIndicatorColor = signal<TwColor>('primary');
  protected readonly playActiveIndex = signal(0);

  protected readonly heroSnippet = `<tw-carousel
  ariaLabel="Featured promotions"
  [autoplay]="true"
  [autoplayInterval]="4000"
  [loop]="true"
>
  @for (hero of heroes; track hero.id) {
    <tw-carousel-slide [label]="hero.title">
      <div class="flex h-56 flex-col items-start justify-end rounded-lg p-6
                  bg-gradient-to-br text-white" [class]="hero.tint">
        <p class="text-2xl font-semibold mb-1">{{ '{{' }} hero.title {{ '}}' }}</p>
        <p class="text-sm opacity-90">{{ '{{' }} hero.subtitle {{ '}}' }}</p>
      </div>
    </tw-carousel-slide>
  }
  <tw-carousel-indicators position="overlay" color="neutral" />
</tw-carousel>`;

  protected readonly productSnippet = `<tw-carousel ariaLabel="Featured products">
  @for (product of products; track product.id) {
    <tw-carousel-slide [label]="product.name">
      <div class="flex flex-col items-center gap-4 rounded-lg border
                  border-border bg-surface p-8">
        <!-- product cell -->
      </div>
    </tw-carousel-slide>
  }
  <button twCarouselPrev class="absolute start-2 top-1/2 -translate-y-1/2 z-10
                                size-9 rounded-full bg-surface-raised/95 ...">
    <!-- chevron-left -->
  </button>
  <button twCarouselNext class="absolute end-2 top-1/2 -translate-y-1/2 z-10
                                size-9 rounded-full bg-surface-raised/95 ...">
    <!-- chevron-right -->
  </button>
  <tw-carousel-indicators />
</tw-carousel>`;

  protected readonly peekSnippet = `<tw-carousel
  ariaLabel="Customer testimonials"
  [slidesPerView]="1.2"
  [slidesToScroll]="1"
  gap="md"
>
  @for (t of testimonials; track t.id) {
    <tw-carousel-slide [label]="t.author">
      <figure class="flex h-full flex-col gap-4 rounded-lg border
                     border-border bg-surface p-6">
        <blockquote class="text-sm text-fg leading-relaxed">
          {{ '{{' }} t.quote {{ '}}' }}
        </blockquote>
        <figcaption>{{ '{{' }} t.author {{ '}}' }}</figcaption>
      </figure>
    </tw-carousel-slide>
  }
</tw-carousel>`;

  protected readonly onboardingSnippet = `<tw-carousel
  ariaLabel="Onboarding tour"
  [(activeIndex)]="step"
>
  @for (s of onboardingSteps; track s.id) {
    <tw-carousel-slide [label]="s.title">
      <div class="...">{{ '{{' }} s.body {{ '}}' }}</div>
    </tw-carousel-slide>
  }

  <!-- Footer controls nest inside <tw-carousel> so the prev/next
       directives find the parent carousel via DI. -->
  <div class="flex items-center justify-between mt-5">
    <button twButton twCarouselPrev variant="ghost" color="neutral">Back</button>
    <tw-carousel-indicators variant="lines" />
    <button twButton twCarouselNext>Next</button>
  </div>
</tw-carousel>`;

  protected readonly tickerSnippet = `<tw-carousel
  ariaLabel="Latest updates"
  orientation="vertical"
  [autoplay]="true"
  [autoplayInterval]="3500"
  [loop]="true"
  class="h-16"
>
  @for (h of headlines; track h.id) {
    <tw-carousel-slide [label]="h.title">
      <p class="text-sm text-fg truncate">{{ '{{' }} h.title {{ '}}' }}</p>
    </tw-carousel-slide>
  }
</tw-carousel>`;

  protected readonly indicatorVariantsSnippet = `<tw-carousel ariaLabel="Demo">
  <!-- slides -->
  <tw-carousel-indicators variant="dots" />
  <tw-carousel-indicators variant="lines" />
  <tw-carousel-indicators variant="numbers" />
</tw-carousel>`;
}
