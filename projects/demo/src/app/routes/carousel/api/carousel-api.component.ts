import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-carousel-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- CarouselComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CarouselComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-carousel</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">orientation</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwOrientation</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'horizontal'</td>
              <td class="px-4 py-2 text-fg-muted">Axis along which slides flow; horizontal is the canonical case, vertical is supported for tickers and feature lists.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">slidesPerView</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Number of slides visible in the viewport; may be fractional (e.g. <code class="font-mono">1.2</code>) for a peek of the next slide.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">slidesToScroll</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Number of slides advanced per navigation action; non-integer values are floored.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">gap</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Inter-slide gap on the scroll axis, mapped via the canonical spacing scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">loop</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Wraps navigation at the boundaries via a jumpless opacity mask; no cloned slides are emitted to the DOM.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">autoplay</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Auto-advances by <code class="font-mono">slidesToScroll</code> every <code class="font-mono">autoplayInterval</code> ms; pauses on hover, focus-in, drag, hidden tab, and post-interaction.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">autoplayInterval</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">5000</td>
              <td class="px-4 py-2 text-fg-muted">Milliseconds between autoplay advances; values below 1000 are clamped to 1000 per WCAG 2.2.2.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">pauseOnHover</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Pauses autoplay while the pointer is over the container.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">pauseOnFocusIn</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Pauses autoplay while keyboard focus is anywhere inside the container.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">draggable</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Enables mouse-pointer pan via a 6-pixel drag threshold; touch is left to native scroll.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">keyboard</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Enables Arrow / Home / End / PageUp / PageDown handling on the focused viewport.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">snapAlign</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'start' | 'center' | 'end'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'start'</td>
              <td class="px-4 py-2 text-fg-muted">CSS <code class="font-mono">scroll-snap-align</code> applied to each slide.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">activeIndex</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number (model)</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound 0-based index of the first visible slide in the current page.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the carousel region; either this or <code class="font-mono">ariaLabelledBy</code> should be provided.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabelledBy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">ID of an element labeling the carousel.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">labels</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Partial&lt;TwCarouselLabels&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Localizable strings for prev/next/pause/resume/indicator/slide-of templates; unset keys fall back to English defaults.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Outputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">activeIndexChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;number&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Synthesized by the <code class="font-mono">model()</code>; fires with the new 0-based active index after the scroll settles.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">slideChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwCarouselSlideChangeEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the active index changes; payload includes <code class="font-mono">from</code>, <code class="font-mono">to</code>, and the trigger source.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">autoplayPaused</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwCarouselAutoplayReason&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when autoplay transitions from running to paused; payload is the pause reason.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">autoplayResumed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when autoplay transitions from paused to running.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Signature</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">next</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Advances by <code class="font-mono">slidesToScroll</code>; wraps when <code class="font-mono">loop</code> is true.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">prev</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Retreats by <code class="font-mono">slidesToScroll</code>; wraps when <code class="font-mono">loop</code> is true.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">scrollTo</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(index: number, opts?: {{ '{' }} behavior?: 'smooth' | 'instant' {{ '}' }}): void</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to a specific 0-based slide index.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">pause</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(reason?: TwCarouselAutoplayReason): void</td>
              <td class="px-4 py-2 text-fg-muted">Pauses autoplay; reason defaults to <code class="font-mono">'manual'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">resume</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Resumes autoplay if <code class="font-mono">autoplay</code> is true.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">pageCount</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;number&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Number of distinct pages (groups of <code class="font-mono">slidesToScroll</code> slides) the carousel can land on.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">activePage</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;number&gt;</td>
              <td class="px-4 py-2 text-fg-muted">0-based page index that contains <code class="font-mono">activeIndex</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">isAtStart</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when the active index is at slide 0; drives the prev directive's disabled state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">isAtEnd</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when the active index is at the last page; drives the next directive's disabled state.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CarouselSlideComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CarouselSlideComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-carousel-slide</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Optional human-readable label appended to the slide's <code class="font-mono">"X of N"</code> accessible name.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders the slide but skips it during prev/next, indicators, keyboard nav, and autoplay.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CarouselIndicatorsComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CarouselIndicatorsComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-carousel-indicators</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'dots' | 'lines' | 'numbers'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'dots'</td>
              <td class="px-4 py-2 text-fg-muted">Visual style; dots are filled circles, lines are short bars, numbers are pill-shaped 1, 2, 3.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Color of the active indicator.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Indicator diameter or length and the gap between indicators.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">position</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'overlay' | 'below'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'below'</td>
              <td class="px-4 py-2 text-fg-muted">Overlay places the indicators absolutely over the viewport with a backdrop capsule; below stacks them under the viewport.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CarouselPrevDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CarouselPrevDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCarouselPrev]</p>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Applied to any focusable element inside a <code class="font-mono">tw-carousel</code>.
        The directive listens to <code class="font-mono">click</code>, sets
        <code class="font-mono">aria-label</code> to <code class="font-mono">labels.previous</code>
        unless the host already carries <code class="font-mono">aria-label</code> or
        <code class="font-mono">aria-labelledby</code>, and toggles
        <code class="font-mono">disabled</code> + <code class="font-mono">aria-disabled="true"</code>
        at the first slide when <code class="font-mono">loop</code> is false.
        Takes no inputs and emits no outputs.
      </p>
    </section>

    <!-- CarouselNextDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CarouselNextDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCarouselNext]</p>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Mirror of <code class="font-mono">CarouselPrevDirective</code> for forward
        navigation. Auto-disables at the last page when <code class="font-mono">loop</code>
        is false and sets <code class="font-mono">aria-label</code> to
        <code class="font-mono">labels.next</code> when the consumer has not provided
        one. Takes no inputs and emits no outputs.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class CarouselApi {
  protected readonly typesSnippet = `type TwCarouselIndicatorVariant = 'dots' | 'lines' | 'numbers';

type TwCarouselIndicatorPosition = 'overlay' | 'below';

type TwCarouselSlideChangeTrigger =
  | 'pointer'
  | 'keyboard'
  | 'autoplay'
  | 'indicator'
  | 'button'
  | 'programmatic';

interface TwCarouselSlideChangeEvent {
  /** Previous active slide index (0-based). */
  from: number;
  /** New active slide index (0-based). */
  to: number;
  /** What triggered the change. */
  trigger: TwCarouselSlideChangeTrigger;
}

type TwCarouselAutoplayReason =
  | 'hover'
  | 'focus'
  | 'interaction'
  | 'visibility'
  | 'manual';

interface TwCarouselLabels {
  previous: string;
  next: string;
  pauseAutoplay: string;
  resumeAutoplay: string;
  /** Template — variable: {page}. */
  indicator: string;
  /** Template — variables: {index}, {total}, {label}. */
  slideOfWithLabel: string;
  /** Template — variables: {index}, {total}. */
  slideOf: string;
}

// English defaults exported as DEFAULT_CAROUSEL_LABELS.`;
}
