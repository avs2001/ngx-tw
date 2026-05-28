import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TimelineComponent,
  TimelineItemComponent,
} from 'ngx-tw/timeline';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-timeline-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimelineComponent, TimelineItemComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Timeline component renders a chronological sequence of events along a
        single vertical or horizontal axis. Each
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-timeline-item</code>
        pairs a marker (dot or circle) with content; the container styles the connector
        line that runs through the markers. Timeline is purely presentational —
        unlike
        <a routerLink="/components/stepper" class="text-primary-600 hover:underline">Stepper</a>,
        it does not own panels, navigation, or form integration, and item hosts are
        not focusable.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The container is rendered as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="list"</code>;
        each item is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="listitem"</code>.
        Items in the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'current'</code>
        state carry
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="step"</code>
        on the host. Marker bubbles are
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden</code>;
        the semantic state is announced via a visually-hidden
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sr-only</code>
        label inside the item body so screen readers are not relying on color alone.
        Timeline deliberately installs no keyboard map — projected interactive
        children (a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-item interactive&gt;</code>,
        a button, an anchor) own activation.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Role / Attribute</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Where</th>
              <th class="px-4 py-2 font-medium text-fg-muted">When</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">role="list"</td>
              <td class="px-4 py-2 text-fg-muted">tw-timeline host</td>
              <td class="px-4 py-2 text-fg-muted">Always.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-orientation="horizontal"</td>
              <td class="px-4 py-2 text-fg-muted">tw-timeline host</td>
              <td class="px-4 py-2 text-fg-muted">Only when orientation is horizontal (vertical is implicit for lists).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">role="listitem"</td>
              <td class="px-4 py-2 text-fg-muted">tw-timeline-item host</td>
              <td class="px-4 py-2 text-fg-muted">Always.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-current="step"</td>
              <td class="px-4 py-2 text-fg-muted">tw-timeline-item host</td>
              <td class="px-4 py-2 text-fg-muted">When state is 'current'.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">sr-only state label</td>
              <td class="px-4 py-2 text-fg-muted">First child of item body</td>
              <td class="px-4 py-2 text-fg-muted">When state is 'pending', 'current', or 'error' ("Pending: " / "Current: " / "Error: ").</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">&lt;time datetime&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Inside item body</td>
              <td class="px-4 py-2 text-fg-muted">When timestamp is a Date or dateTime input is provided.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-timeline>
          <tw-timeline-item color="success" state="reached" timestamp="Apr 10, 2026">
            <p class="text-sm">Alice Morgan opened pull request <strong>#421</strong>.</p>
          </tw-timeline-item>
          <tw-timeline-item color="primary" state="reached" timestamp="Apr 11, 2026">
            <p class="text-sm">Ben Rivera left a review with 3 comments.</p>
          </tw-timeline-item>
          <tw-timeline-item color="success" state="current" timestamp="Apr 12, 2026">
            <p class="text-sm">CI checks running on commit <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">e83a4c1</code>.</p>
          </tw-timeline-item>
          <tw-timeline-item color="neutral" state="pending">
            <p class="text-sm text-fg-muted">Merge to <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">main</code>.</p>
          </tw-timeline-item>
        </tw-timeline>
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
        <li>Vertical and horizontal orientations with four vertical alignments (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">left</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">right</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">alternate</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">split</code>)</li>
        <li>Four semantic states (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reached</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pending</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">current</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>) driving marker fill, halo ring, and connector color</li>
        <li>Two marker geometries — small dot or larger circle with auto-numbering or projected content</li>
        <li>Projected icon, avatar, or custom node inside the circle marker via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twTimelineMarker]</code></li>
        <li>Native <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;time datetime&gt;</code> rendering for <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Date</code> inputs, or custom relative-time templates via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twTimelineTimestamp]</code></li>
        <li>Solid or dashed connector style</li>
        <li>Alternating layouts via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twTimelineOpposite]</code></li>
        <li>Eight semantic colors and five sizes</li>
        <li>RTL-aware via logical-property utilities; no manual <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dir="rtl"</code> overrides needed</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="step"</code>, visually-hidden state labels, and reduced-motion–aware enter animation</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/stepper" class="text-primary-600 hover:underline">Stepper</a>
          — interactive multi-step wizard with panels and form integration. Use the stepper when the user navigates through steps; use the timeline when the user reads a history.
        </li>
        <li>
          <a routerLink="/components/item" class="text-primary-600 hover:underline">Item</a>
          — compose <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-item interactive&gt;</code> inside a timeline item to make a row clickable.
        </li>
        <li>
          <a routerLink="/components/avatar" class="text-primary-600 hover:underline">Avatar</a>
          — project as the marker content for activity feeds (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twTimelineMarker</code>).
        </li>
        <li>
          <a routerLink="/components/icon" class="text-primary-600 hover:underline">Icon</a>
          — project as the marker content for process timelines (order tracking, build pipelines).
        </li>
      </ul>
    </section>
  `,
})
export class TimelineOverview {
  protected readonly basicUsageSnippet = `<tw-timeline>
  <tw-timeline-item color="success" state="reached" timestamp="Apr 10, 2026">
    <p class="text-sm">Alice Morgan opened pull request <strong>#421</strong>.</p>
  </tw-timeline-item>
  <tw-timeline-item color="primary" state="reached" timestamp="Apr 11, 2026">
    <p class="text-sm">Ben Rivera left a review with 3 comments.</p>
  </tw-timeline-item>
  <tw-timeline-item color="success" state="current" timestamp="Apr 12, 2026">
    <p class="text-sm">CI checks running on commit <code>e83a4c1</code>.</p>
  </tw-timeline-item>
  <tw-timeline-item color="neutral" state="pending">
    <p class="text-sm text-fg-muted">Merge to <code>main</code>.</p>
  </tw-timeline-item>
</tw-timeline>`;

  protected readonly importSnippet = `import {
  TimelineComponent,
  TimelineItemComponent,
  TimelineMarkerDirective,
  TimelineTimestampDirective,
  TimelineOppositeDirective,
} from 'ngx-tw/timeline';`;
}
