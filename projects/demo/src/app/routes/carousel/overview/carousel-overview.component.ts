import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CarouselComponent,
  CarouselIndicatorsComponent,
  CarouselNextDirective,
  CarouselPrevDirective,
  CarouselSlideComponent,
} from '@cdevhub/ngx-tw/carousel';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-carousel-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CarouselComponent,
    CarouselSlideComponent,
    CarouselIndicatorsComponent,
    CarouselPrevDirective,
    CarouselNextDirective,
    CodeBlockComponent,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Carousel is a slide / swipe gallery built on native CSS scroll-snap.
        Consumers project
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-carousel-slide</code>
        children; the container owns geometry (axis, slides per view, gap), behavior
        (loop, autoplay, drag, keyboard), and the two-way bound
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">activeIndex</code>.
        The implementation follows the W3C APG "Carousel with Buttons for Rotation
        Control" pattern: the host carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="region"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-roledescription="carousel"</code>,
        each slide carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="group"</code>
        with an "X of N" label, and an integrated pause control satisfies WCAG 2.2.2
        whenever autoplay is on.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The inner scrollable viewport receives keyboard focus (it carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex="0"</code>),
        and its
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live</code>
        attribute switches between
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'polite'</code>
        (manual mode) and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'off'</code>
        (autoplay mode) per APG. Slides outside the current page are marked
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden="true"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inert</code>
        so their focusable descendants leave the tab order. Always provide an
        accessible name via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaLabel</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaLabelledBy</code>.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft / ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Retreat / advance one page (horizontal). Semantics flip under <code class="font-mono">dir="rtl"</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowUp / ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Retreat / advance one page (vertical orientation, or as alternates in horizontal).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">PageUp / PageDown</td>
              <td class="px-4 py-2 text-fg-muted">Same as Arrow keys — advance / retreat by one page.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the first slide.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">End</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the last slide.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Mouse drag</td>
              <td class="px-4 py-2 text-fg-muted">Pan the slides freely; releases snap to the nearest slide. A 6-pixel threshold preserves click semantics inside slide content.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Touch swipe</td>
              <td class="px-4 py-2 text-fg-muted">Native scroll with momentum and snap-back. The pointer-drag handler intentionally ignores <code class="font-mono">pointerType: 'touch'</code> so platform gestures work as users expect.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-carousel ariaLabel="Featured promotions">
          <tw-carousel-slide label="Spring sale">
            <div class="flex h-44 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-info-500 text-white text-lg font-semibold">
              Spring sale — 30% off
            </div>
          </tw-carousel-slide>
          <tw-carousel-slide label="New collection">
            <div class="flex h-44 items-center justify-center rounded-lg bg-gradient-to-br from-success-500 to-accent-500 text-white text-lg font-semibold">
              New collection live
            </div>
          </tw-carousel-slide>
          <tw-carousel-slide label="Free shipping">
            <div class="flex h-44 items-center justify-center rounded-lg bg-gradient-to-br from-warning-500 to-error-500 text-white text-lg font-semibold">
              Free shipping this week
            </div>
          </tw-carousel-slide>

          <button twCarouselPrev class="absolute start-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-surface-raised/90 border border-border shadow-sm flex items-center justify-center text-fg hover:bg-surface-muted disabled:opacity-40 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button twCarouselNext class="absolute end-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-surface-raised/90 border border-border shadow-sm flex items-center justify-center text-fg hover:bg-surface-muted disabled:opacity-40 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <tw-carousel-indicators />
        </tw-carousel>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Native CSS scroll-snap with momentum, touch swipe, and an opt-in mouse-drag handler</li>
        <li>Horizontal and vertical orientations, with logical-property RTL support on the horizontal axis</li>
        <li>Fractional <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">slidesPerView</code> (e.g. <code class="font-mono">1.2</code>) for "peek" / preview layouts</li>
        <li>Independent <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">slidesToScroll</code> for paging through groups</li>
        <li>Looping via a jumpless opacity mask (no duplicated slides in the DOM)</li>
        <li>Autoplay with pause-on-hover, pause-on-focus, post-interaction pause, and tab-visibility pause</li>
        <li>Integrated WCAG 2.2.2 pause control rendered automatically when autoplay is on</li>
        <li>W3C APG carousel pattern: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="region"</code> + <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-roledescription="carousel"</code>, per-slide <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden</code> + <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inert</code> via <code class="font-mono">IntersectionObserver</code></li>
        <li>Three indicator styles (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dots</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lines</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numbers</code>) with overlay or below placement</li>
        <li>Prev / Next as attribute directives — apply them to your own button primitive without inheriting library styling</li>
        <li>Two-way <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">activeIndex</code> model + a rich <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">slideChange</code> event with trigger attribution</li>
        <li>Localizable labels with template-variable interpolation</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/tabs" class="text-primary-600 hover:underline">Tabs</a>
          — explicit selection of one panel out of many; not for linear paging.
        </li>
        <li>
          <a routerLink="/components/stepper" class="text-primary-600 hover:underline">Stepper</a>
          — interactive multi-step wizard with completion state and form integration.
        </li>
        <li>
          <a routerLink="/components/dialog" class="text-primary-600 hover:underline">Dialog</a>
          — compose a carousel inside a dialog for lightbox-style image viewers.
        </li>
        <li>
          <a routerLink="/components/paginator" class="text-primary-600 hover:underline">Paginator</a>
          — when the user navigates discrete pages of data, not a visual slide track.
        </li>
      </ul>
    </section>
  `,
})
export class CarouselOverview {
  protected readonly basicUsageSnippet = `<tw-carousel ariaLabel="Featured promotions">
  <tw-carousel-slide label="Spring sale">
    <img src="/hero-spring.jpg" alt="Spring sale — 30% off" />
  </tw-carousel-slide>
  <tw-carousel-slide label="New collection">
    <img src="/hero-collection.jpg" alt="New collection live" />
  </tw-carousel-slide>

  <button twCarouselPrev>‹</button>
  <button twCarouselNext>›</button>
  <tw-carousel-indicators />
</tw-carousel>`;

  protected readonly importSnippet = `import {
  CarouselComponent,
  CarouselSlideComponent,
  CarouselIndicatorsComponent,
  CarouselPrevDirective,
  CarouselNextDirective,
} from '@cdevhub/ngx-tw/carousel';`;
}
