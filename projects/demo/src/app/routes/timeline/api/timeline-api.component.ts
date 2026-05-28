import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-timeline-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- TimelineComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TimelineComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-timeline</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'vertical'</td>
              <td class="px-4 py-2 text-fg-muted">Axis along which items are laid out; horizontal is RTL-aware.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">align</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TimelineAlign</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'left'</td>
              <td class="px-4 py-2 text-fg-muted">Vertical layout strategy; ignored when orientation is horizontal.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Density and typography scale for marker diameter, item gap, and body text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">lineStyle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TimelineLineStyle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid'</td>
              <td class="px-4 py-2 text-fg-muted">Connector line style applied to every gap between items.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">scrollControls</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TimelineScrollControls</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'auto'</td>
              <td class="px-4 py-2 text-fg-muted">
                Visibility policy for the horizontal-overflow chevron buttons.
                <code class="font-mono">'auto'</code> shows them only when the inner scroll region can scroll in that direction;
                <code class="font-mono">'always'</code> renders both regardless of scroll state (disabled at an edge);
                <code class="font-mono">'never'</code> hides them entirely (consumer manages overflow externally).
                Ignored when orientation is <code class="font-mono">'vertical'</code>.
                <span class="block mt-1 text-2xs text-fg-subtle">Counts as the 5th container input, justified by the "Overflow-control axis on layout primitives" cap exception — a single tri-state that toggles overflow-navigation affordances, inert on axis values where overflow cannot occur.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-fg-muted">No outputs. Item-level interactions bubble naturally from projected children.</p>
    </section>

    <!-- TimelineItemComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TimelineItemComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-timeline-item</p>

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
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color for marker fill and trailing connector; ignored when state is <code class="font-mono">'error'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">marker</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TimelineMarker</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'dot'</td>
              <td class="px-4 py-2 text-fg-muted">Marker geometry — <code class="font-mono">'dot'</code> (small filled circle) or <code class="font-mono">'circle'</code> (larger ring).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">state</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TimelineState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reached'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic state driving marker fill, ring, and trailing-connector color.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">timestamp</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | Date | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Timestamp shown in the timestamp slot; a Date is formatted via <code class="font-mono">Intl.DateTimeFormat</code>, a string renders verbatim, null omits the element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateTime</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Machine-readable ISO 8601 datetime for <code class="font-mono">&lt;time datetime&gt;</code>; derived from a Date timestamp when null.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-fg-muted">No outputs. The item is not focusable; project an interactive primitive (<code class="font-mono">tw-item interactive</code>, button, anchor) inside the default slot for row activation.</p>
    </section>

    <!-- Slot directives -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Slot directives</h2>
      <p class="text-xs text-fg-muted mb-4">Marker directives detected via <code class="font-mono">contentChild</code>. They carry no host styling — they exist only to flag slot presence.</p>

      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Class</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twTimelineMarker]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TimelineMarkerDirective</td>
              <td class="px-4 py-2 text-fg-muted">Rendered inside the marker bubble when <code class="font-mono">marker="circle"</code>; ignored (with a dev warning) when <code class="font-mono">marker="dot"</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twTimelineTimestamp]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TimelineTimestampDirective</td>
              <td class="px-4 py-2 text-fg-muted">Replaces the rendered timestamp; use for relative-time components and custom locales.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twTimelineOpposite]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TimelineOppositeDirective</td>
              <td class="px-4 py-2 text-fg-muted">Renders in the opposite column for <code class="font-mono">align="alternate"</code> and <code class="font-mono">align="split"</code> (vertical only).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class TimelineApi {
  protected readonly typesSnippet = `import type { TwColor, TwOrientation, TwSize } from '@cdevhub/ngx-tw/core';

type TimelineMarker = 'dot' | 'circle';
type TimelineState = 'reached' | 'pending' | 'current' | 'error';
type TimelineAlign = 'left' | 'right' | 'alternate' | 'split';
type TimelineLineStyle = 'solid' | 'dashed';
type TimelineScrollControls = 'auto' | 'always' | 'never';`;
}
