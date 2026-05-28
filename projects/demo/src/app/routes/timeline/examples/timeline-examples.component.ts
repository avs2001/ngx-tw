import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  TimelineComponent,
  TimelineItemComponent,
  TimelineMarkerDirective,
  TimelineTimestampDirective,
  TimelineOppositeDirective,
  type TimelineAlign,
  type TimelineLineStyle,
  type TimelineMarker,
  type TimelineState,
} from 'ngx-tw/timeline';
import {
  ItemComponent,
  ItemTitleDirective,
  ItemDescriptionDirective,
} from 'ngx-tw/item';
import { AvatarComponent } from 'ngx-tw/avatar';
import { IconComponent } from 'ngx-tw/icon';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwOrientation, TwSize } from 'ngx-tw/core';

const COLORS: TwColor[] = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'info',
  'success',
  'warning',
  'error',
];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const MARKERS: TimelineMarker[] = ['dot', 'circle'];
const STATES: TimelineState[] = ['reached', 'pending', 'current', 'error'];
const ALIGNS: TimelineAlign[] = ['left', 'right', 'alternate', 'split'];
const LINE_STYLES: TimelineLineStyle[] = ['solid', 'dashed'];
const ORIENTATIONS: TwOrientation[] = ['vertical', 'horizontal'];

interface Hop {
  readonly id: number;
  readonly label: string;
  readonly when: string;
  readonly state: TimelineState;
  readonly color: TwColor;
  readonly icon: string;
}

const ORDER_HOPS: readonly Hop[] = [
  { id: 1, label: 'Order placed',     when: 'Mar 14, 09:02', state: 'reached', color: 'success', icon: 'check-circle' },
  { id: 2, label: 'Shipped',          when: 'Mar 15, 11:14', state: 'reached', color: 'success', icon: 'package' },
  { id: 3, label: 'Out for delivery', when: 'Mar 17, 10:30', state: 'current', color: 'primary', icon: 'arrow-right' },
  { id: 4, label: 'Delivered',        when: '',              state: 'pending', color: 'neutral', icon: 'home' },
];

// 14-item CI/CD pipeline. Overflows the standard demo well at every desktop
// width (size="sm" → min-w-36 = 144px per item → 14 × 144 ≈ 2016px), so the
// horizontal scroll chevrons reliably appear and can be exercised.
const BUILD_PIPELINE: readonly Hop[] = [
  { id:  1, label: 'Clone',              when: '14:00:02', state: 'reached', color: 'success', icon: 'download' },
  { id:  2, label: 'Install deps',       when: '14:00:48', state: 'reached', color: 'success', icon: 'package' },
  { id:  3, label: 'Lint',               when: '14:01:31', state: 'reached', color: 'success', icon: 'check-circle' },
  { id:  4, label: 'Unit tests',         when: '14:02:14', state: 'reached', color: 'success', icon: 'file-text' },
  { id:  5, label: 'E2E tests',          when: '14:04:09', state: 'reached', color: 'success', icon: 'eye' },
  { id:  6, label: 'Build images',       when: '14:05:33', state: 'reached', color: 'success', icon: 'layers' },
  { id:  7, label: 'Push to registry',   when: '14:06:21', state: 'reached', color: 'success', icon: 'upload' },
  { id:  8, label: 'Deploy staging',     when: '14:07:02', state: 'current', color: 'primary', icon: 'play-circle' },
  { id:  9, label: 'Smoke tests',        when: '',         state: 'pending', color: 'neutral', icon: 'eye' },
  { id: 10, label: 'Canary 10%',         when: '',         state: 'pending', color: 'neutral', icon: 'arrow-right' },
  { id: 11, label: 'Canary 50%',         when: '',         state: 'pending', color: 'neutral', icon: 'arrow-right' },
  { id: 12, label: 'Promote to prod',    when: '',         state: 'pending', color: 'neutral', icon: 'arrow-right' },
  { id: 13, label: 'Cache warmup',       when: '',         state: 'pending', color: 'neutral', icon: 'inbox' },
  { id: 14, label: 'Post-deploy verify', when: '',         state: 'pending', color: 'neutral', icon: 'check-circle' },
];

interface AuditEntry {
  readonly id: number;
  readonly actor: string;
  readonly initials: string;
  readonly action: string;
  readonly when: string;
}

const AUDIT_LOG: readonly AuditEntry[] = [
  { id: 1, actor: 'Alice Morgan', initials: 'AM', action: 'rotated production API keys',     when: '2 hours ago' },
  { id: 2, actor: 'Ben Rivera',   initials: 'BR', action: 'enabled SSO for the marketing org', when: 'yesterday at 4:32 pm' },
  { id: 3, actor: 'Chen Liu',     initials: 'CL', action: 'archived 14 inactive users',      when: 'Apr 11' },
  { id: 4, actor: 'Dana Khan',    initials: 'DK', action: 'updated the audit retention policy', when: 'Apr 10' },
];

@Component({
  selector: 'app-timeline-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TimelineComponent,
    TimelineItemComponent,
    TimelineMarkerDirective,
    TimelineTimestampDirective,
    TimelineOppositeDirective,
    ItemComponent,
    ItemTitleDirective,
    ItemDescriptionDirective,
    AvatarComponent,
    IconComponent,
    ButtonDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Orientation -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Orientation</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Vertical is the default layout — items stack top-to-bottom with a connector running through the marker column. Horizontal lays the items left-to-right and is ideal for compact progress ribbons (shipping hops, race splits) where the chronology is short and the page already constrains vertical space. The same content composes into either shape by switching the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">orientation</code>
        input.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-8">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Vertical</p>
            <tw-timeline>
              @for (h of orderHops; track h.id) {
                <tw-timeline-item
                  marker="circle"
                  [color]="h.color"
                  [state]="h.state"
                  [timestamp]="h.when || null"
                >
                  <tw-icon twTimelineMarker [name]="h.icon" size="sm" />
                  <p class="text-sm font-semibold">{{ h.label }}</p>
                </tw-timeline-item>
              }
            </tw-timeline>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Horizontal</p>
            <tw-timeline orientation="horizontal" size="sm">
              @for (h of orderHops; track h.id) {
                <tw-timeline-item
                  marker="circle"
                  [color]="h.color"
                  [state]="h.state"
                  [timestamp]="h.when || null"
                >
                  <tw-icon twTimelineMarker [name]="h.icon" size="xs" />
                  <p class="text-xs font-medium">{{ h.label }}</p>
                </tw-timeline-item>
              }
            </tw-timeline>
          </div>
        </div>
      </div>
      <tw-code-block [code]="orientationSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">align</code>
        input is ignored in horizontal orientation — items always render with the body above the marker row. To put the body below, swap the projected children's order in your template, not via an input.
      </p>

      <h3 class="text-sm font-semibold mt-8 mb-3">Horizontal — long timeline (overflow + chevrons)</h3>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        When the horizontal timeline outgrows its container, the inner viewport scrolls and overlay chevron buttons appear at the edges. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">scrollControls</code>
        input governs visibility:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'auto'</code>
        (default) shows a chevron only when its direction can actually scroll,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'always'</code>
        keeps both visible and disables the one at an edge, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'never'</code>
        hides them entirely (the consumer manages overflow). Each click pages ~75% of the viewport width with smooth scrolling; users with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>
        get an instant snap instead.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-full overflow-hidden">
          <tw-timeline orientation="horizontal" size="sm">
            @for (h of buildPipeline; track h.id) {
              <tw-timeline-item
                marker="circle"
                [color]="h.color"
                [state]="h.state"
                [timestamp]="h.when || null"
              >
                <tw-icon twTimelineMarker [name]="h.icon" size="xs" />
                <p class="text-xs font-medium">{{ h.label }}</p>
              </tw-timeline-item>
            }
          </tw-timeline>
        </div>
      </div>
      <tw-code-block [code]="longHorizontalSnippet" language="html" />
    </section>

    <!-- Alignment -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Alignment</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Vertical timelines support four alignments.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">left</code>
        is the default — marker on the left, body on the right, no opposite column.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">right</code>
        mirrors that for right-leaning layouts.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">alternate</code>
        centers the marker and flips body and opposite slot per item — common for product roadmaps and year-in-review pages.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">split</code>
        also centers the marker but keeps the opposite slot consistently on the left, useful when one column carries the metadata (date, version) and the other carries the description.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-8">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Alternate (roadmap)</p>
            <tw-timeline align="alternate">
              <tw-timeline-item marker="circle" color="primary" state="reached">
                <span twTimelineOpposite class="text-sm font-semibold text-fg">Q1 2026</span>
                <p class="text-sm font-semibold">Auth rewrite</p>
                <p class="text-xs text-fg-muted">Migrated to OAuth 2.1 and retired the legacy session token store.</p>
              </tw-timeline-item>
              <tw-timeline-item marker="circle" color="primary" state="current">
                <span twTimelineOpposite class="text-sm font-semibold text-fg">Q2 2026</span>
                <p class="text-sm font-semibold">Mobile beta</p>
                <p class="text-xs text-fg-muted">iOS and Android shipping to a closed beta cohort of 500 teams.</p>
              </tw-timeline-item>
              <tw-timeline-item marker="circle" color="neutral" state="pending">
                <span twTimelineOpposite class="text-sm font-semibold text-fg-muted">Q3 2026</span>
                <p class="text-sm text-fg-muted">Enterprise pilot</p>
                <p class="text-xs text-fg-muted">SSO, audit log retention, and the admin console redesign.</p>
              </tw-timeline-item>
              <tw-timeline-item marker="circle" color="neutral" state="pending">
                <span twTimelineOpposite class="text-sm font-semibold text-fg-muted">Q4 2026</span>
                <p class="text-sm text-fg-muted">GA launch</p>
              </tw-timeline-item>
            </tw-timeline>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Split (timestamp on the left)</p>
            <tw-timeline align="split">
              <tw-timeline-item marker="circle" color="info" state="reached">
                <span twTimelineOpposite class="text-xs text-fg-muted font-mono">14:00:02</span>
                <p class="text-sm">Lint check passed.</p>
              </tw-timeline-item>
              <tw-timeline-item marker="circle" color="info" state="reached">
                <span twTimelineOpposite class="text-xs text-fg-muted font-mono">14:01:48</span>
                <p class="text-sm">Unit tests passed <span class="text-fg-muted">(312 tests, 4 skipped)</span>.</p>
              </tw-timeline-item>
              <tw-timeline-item marker="circle" color="primary" state="current">
                <span twTimelineOpposite class="text-xs text-fg-muted font-mono">14:02:31</span>
                <p class="text-sm">Deploy in progress…</p>
              </tw-timeline-item>
              <tw-timeline-item marker="circle" color="neutral" state="pending">
                <span twTimelineOpposite class="text-xs text-fg-muted font-mono">—</span>
                <p class="text-sm text-fg-muted">Smoke tests</p>
              </tw-timeline-item>
            </tw-timeline>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Right</p>
            <tw-timeline align="right">
              <tw-timeline-item color="success" state="reached" timestamp="Apr 12">
                <p class="text-sm">Alice merged PR #421.</p>
              </tw-timeline-item>
              <tw-timeline-item color="primary" state="current" timestamp="Apr 13">
                <p class="text-sm">CI checks running.</p>
              </tw-timeline-item>
              <tw-timeline-item color="neutral" state="pending">
                <p class="text-sm text-fg-muted">Release tag.</p>
              </tw-timeline-item>
            </tw-timeline>
          </div>
        </div>
      </div>
      <tw-code-block [code]="alignmentSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The opposite slot is rendered only in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">alternate</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">split</code>
        alignments. In
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">alternate</code>
        layouts the visual flip uses CSS order utilities — reading order in the source is preserved so assistive tech encounters opposite content first when it logically comes first.
      </p>
    </section>

    <!-- Markers -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Markers</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Marker geometry is either
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'dot'</code>
        (a small filled circle, default) or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'circle'</code>
        (a larger ring that holds either an auto-computed 1-based index, a projected icon, or a projected avatar). When
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">marker="circle"</code>
        and the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twTimelineMarker]</code>
        slot is empty, the timeline renders the item's 1-based DOM index inside the bubble.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid md:grid-cols-2 gap-8">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Dot (compact activity)</p>
            <tw-timeline size="sm">
              <tw-timeline-item color="success" state="reached" timestamp="08:42">
                <p class="text-sm">Build succeeded.</p>
              </tw-timeline-item>
              <tw-timeline-item color="info" state="reached" timestamp="08:48">
                <p class="text-sm">Image pushed to registry.</p>
              </tw-timeline-item>
              <tw-timeline-item color="primary" state="current" timestamp="08:50">
                <p class="text-sm">Rolling restart in progress.</p>
              </tw-timeline-item>
            </tw-timeline>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Circle with auto-number</p>
            <tw-timeline>
              <tw-timeline-item marker="circle" color="primary" state="reached">
                <p class="text-sm font-semibold">Sign up</p>
                <p class="text-xs text-fg-muted">Create your workspace with email or Google.</p>
              </tw-timeline-item>
              <tw-timeline-item marker="circle" color="primary" state="reached">
                <p class="text-sm font-semibold">Invite teammates</p>
                <p class="text-xs text-fg-muted">Send invites by email or share a join link.</p>
              </tw-timeline-item>
              <tw-timeline-item marker="circle" color="primary" state="current">
                <p class="text-sm font-semibold">Connect a repository</p>
                <p class="text-xs text-fg-muted">Authorize GitHub, GitLab, or Bitbucket.</p>
              </tw-timeline-item>
              <tw-timeline-item marker="circle" color="neutral" state="pending">
                <p class="text-sm text-fg-muted">Ship your first PR.</p>
              </tw-timeline-item>
            </tw-timeline>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Circle with icon</p>
            <tw-timeline>
              @for (h of orderHops; track h.id) {
                <tw-timeline-item
                  marker="circle"
                  [color]="h.color"
                  [state]="h.state"
                  [timestamp]="h.when || null"
                >
                  <tw-icon twTimelineMarker [name]="h.icon" size="sm" />
                  <p class="text-sm font-semibold">{{ h.label }}</p>
                </tw-timeline-item>
              }
            </tw-timeline>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Circle with avatar (audit log)</p>
            <tw-timeline size="sm">
              @for (e of auditLog; track e.id) {
                <tw-timeline-item marker="circle" color="neutral" [timestamp]="e.when">
                  <tw-avatar twTimelineMarker [initials]="e.initials" alt="" size="sm" />
                  <p class="text-sm"><strong>{{ e.actor }}</strong> {{ e.action }}.</p>
                </tw-timeline-item>
              }
            </tw-timeline>
          </div>
        </div>
      </div>
      <tw-code-block [code]="markersSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        When a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twTimelineMarker]</code>
        slot is projected, the bubble switches to a softer background so the projected glyph or avatar reads clearly against a tinted surface rather than competing with a solid fill. Projecting marker content with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">marker="dot"</code>
        is a no-op and logs a dev warning.
      </p>
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">state</code>
        input drives the visual semantics of an event.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reached</code>
        is the default — solid fill in the item's color, colored trailing connector.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pending</code>
        renders an outlined marker and a neutral connector.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">current</code>
        adds a soft halo ring, applies <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="step"</code>, and keeps the trailing connector neutral (subsequent items haven't been reached yet).
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        forces the error palette regardless of the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input and renders an inline exclamation glyph in circle markers.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-timeline>
          <tw-timeline-item marker="circle" color="success" state="reached" timestamp="14:00">
            <tw-icon twTimelineMarker name="check-circle" size="sm" />
            <p class="text-sm font-semibold">Lint passed</p>
            <p class="text-xs text-fg-muted">0 warnings across 312 files.</p>
          </tw-timeline-item>
          <tw-timeline-item marker="circle" color="success" state="reached" timestamp="14:02">
            <tw-icon twTimelineMarker name="check-circle" size="sm" />
            <p class="text-sm font-semibold">Tests passed</p>
            <p class="text-xs text-fg-muted">2,323 tests in 7.8s.</p>
          </tw-timeline-item>
          <tw-timeline-item marker="circle" color="primary" state="current" timestamp="14:05">
            <tw-icon twTimelineMarker name="play-circle" size="sm" />
            <p class="text-sm font-semibold">Deploying to staging</p>
            <p class="text-xs text-fg-muted">Rolling restart, 2 of 6 instances replaced.</p>
          </tw-timeline-item>
          <tw-timeline-item marker="circle" color="neutral" state="pending">
            <tw-icon twTimelineMarker name="eye" size="sm" />
            <p class="text-sm text-fg-muted">Smoke tests</p>
            <p class="text-xs text-fg-muted">Waiting for healthy /readyz responses across the fleet.</p>
          </tw-timeline-item>
          <tw-timeline-item marker="circle" color="primary" state="error" timestamp="14:14">
            <p class="text-sm font-semibold text-error-fg">Canary aborted</p>
            <p class="text-xs text-fg-muted">5xx rate exceeded 2% on instance <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">api-7b</code>.</p>
          </tw-timeline-item>
        </tw-timeline>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input applies to the marker fill (when state is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reached</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">current</code>)
        and to the trailing connector that exits the item. Use the semantic colors to match an event's meaning — successes in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>,
        warnings in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>,
        informational events in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">info</code>,
        and so on.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          @for (c of colors; track c) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 font-mono">{{ c }}</p>
              <tw-timeline size="sm">
                <tw-timeline-item [color]="c" state="reached" timestamp="now">
                  <p class="text-xs">Created</p>
                </tw-timeline-item>
                <tw-timeline-item [color]="c" state="current">
                  <p class="text-xs">In progress</p>
                </tw-timeline-item>
              </tw-timeline>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input scales marker diameter, gap between items, and the typography step inside the body.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        suit dense audit logs and activity feeds;
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        is the canonical default;
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        give prominence to small process timelines (onboarding, checkout flows).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6">
          @for (s of sizes; track s) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ s }}</p>
              <tw-timeline [size]="s">
                <tw-timeline-item marker="circle" color="primary" state="reached" timestamp="Mar 14">
                  <p>Order placed</p>
                </tw-timeline-item>
                <tw-timeline-item marker="circle" color="primary" state="current" timestamp="Mar 15">
                  <p>Shipped</p>
                </tw-timeline-item>
                <tw-timeline-item marker="circle" color="neutral" state="pending">
                  <p>Delivered</p>
                </tw-timeline-item>
              </tw-timeline>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Line styles -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Line styles</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Solid is the default — a confident line that suggests definite chronology. Dashed reads as projected or uncertain — use it when the timeline represents a plan, a draft schedule, or a sequence where the gaps between events are estimated rather than recorded.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid md:grid-cols-2 gap-8">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Solid (recorded)</p>
            <tw-timeline lineStyle="solid">
              <tw-timeline-item color="success" state="reached" timestamp="Mar 14"><p class="text-sm">Tag <code class="font-mono text-xs">v2.4.0</code> cut.</p></tw-timeline-item>
              <tw-timeline-item color="success" state="reached" timestamp="Mar 15"><p class="text-sm">Deployed to staging.</p></tw-timeline-item>
              <tw-timeline-item color="primary" state="current" timestamp="Mar 17"><p class="text-sm">Promoted to production.</p></tw-timeline-item>
            </tw-timeline>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Dashed (projected)</p>
            <tw-timeline lineStyle="dashed">
              <tw-timeline-item color="primary" state="current"><p class="text-sm font-semibold">Today — UX review</p></tw-timeline-item>
              <tw-timeline-item color="neutral" state="pending"><p class="text-sm text-fg-muted">+3 days — eng kickoff</p></tw-timeline-item>
              <tw-timeline-item color="neutral" state="pending"><p class="text-sm text-fg-muted">+10 days — beta cut</p></tw-timeline-item>
              <tw-timeline-item color="neutral" state="pending"><p class="text-sm text-fg-muted">+18 days — GA target</p></tw-timeline-item>
            </tw-timeline>
          </div>
        </div>
      </div>
      <tw-code-block [code]="lineStyleSnippet" language="html" />
    </section>

    <!-- Timestamps -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Timestamps</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Date</code>
        timestamp renders as a native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;time datetime&gt;</code>
        element with the locale-formatted display text and the ISO string as the machine-readable
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">datetime</code>
        attribute. A string timestamp renders as a plain
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;span&gt;</code>
        unless you also provide
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dateTime</code>
        explicitly. For relative-time labels and custom localisation, project a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twTimelineTimestamp]</code>
        slot.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-timeline>
          <tw-timeline-item marker="circle" color="primary" state="reached" [timestamp]="postedAt">
            <p class="text-sm">Date input — machine-readable via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;time&gt;</code>.</p>
          </tw-timeline-item>
          <tw-timeline-item marker="circle" color="primary" state="reached" timestamp="Apr 12, 2026" dateTime="2026-04-12">
            <p class="text-sm">String + dateTime — verbatim text, machine-readable attribute.</p>
          </tw-timeline-item>
          <tw-timeline-item marker="circle" color="primary" state="current" timestamp="last week">
            <p class="text-sm">Plain string — renders as a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;span&gt;</code>, no datetime attribute.</p>
          </tw-timeline-item>
          <tw-timeline-item marker="circle" color="info" state="reached">
            <span twTimelineTimestamp class="text-xs text-fg-muted">2 hours ago</span>
            <p class="text-sm">Projected slot — full control over the timestamp DOM.</p>
          </tw-timeline-item>
        </tw-timeline>
      </div>
      <tw-code-block [code]="timestampsSnippet" language="html" />
    </section>

    <!-- Interactive items -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Interactive items</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The timeline item itself is not focusable — there is no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">(selected)</code>
        output. For row-level activation, project a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-item interactive&gt;</code>
        (or a button, an anchor) inside the default slot. Keeping interactivity in a projected primitive avoids nested-interactive ARIA failures and lets the consumer choose the right semantics (link vs button).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-timeline>
          @for (e of auditLog; track e.id) {
            <tw-timeline-item marker="circle" color="neutral" [timestamp]="e.when">
              <tw-avatar twTimelineMarker [initials]="e.initials" alt="" size="sm" />
              <tw-item interactive (selected)="onAuditSelected(e.id)">
                <span twItemTitle><strong>{{ e.actor }}</strong> {{ e.action }}</span>
                <span twItemDescription>Click to view full audit record.</span>
              </tw-item>
            </tw-timeline-item>
          }
        </tw-timeline>
        <p class="text-xs text-fg-muted mt-4 font-mono">last clicked id = {{ lastSelected() ?? '—' }}</p>
      </div>
      <tw-code-block [code]="interactiveSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every container input at once. A good starting configuration is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">vertical</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        — switch
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">orientation</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">horizontal</code>
        to confirm the alignment input is properly ignored. Item-level inputs (color, marker, state) are demonstrated above in their own sections; this playground focuses on container-level composition.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-6 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Orientation</label>
            <div class="flex gap-1">
              @for (o of orientations; track o) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playOrientation() === o"
                  [class.!text-primary-700]="playOrientation() === o"
                  (click)="playOrientation.set(o)"
                >{{ o }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Align (vertical only)</label>
            <div class="flex gap-1">
              @for (a of aligns; track a) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [disabled]="playOrientation() === 'horizontal'"
                  [class.!bg-primary-100]="playAlign() === a && playOrientation() === 'vertical'"
                  [class.!text-primary-700]="playAlign() === a && playOrientation() === 'vertical'"
                  (click)="playAlign.set(a)"
                >{{ a }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playSize() === s"
                  [class.!text-primary-700]="playSize() === s"
                  (click)="playSize.set(s)"
                >{{ s }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Line style</label>
            <div class="flex gap-1">
              @for (l of lineStyles; track l) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playLineStyle() === l"
                  [class.!text-primary-700]="playLineStyle() === l"
                  (click)="playLineStyle.set(l)"
                >{{ l }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Item marker</label>
            <div class="flex gap-1">
              @for (m of markers; track m) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playMarker() === m"
                  [class.!text-primary-700]="playMarker() === m"
                  (click)="playMarker.set(m)"
                >{{ m }}</button>
              }
            </div>
          </div>
        </div>

        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-timeline
            [orientation]="playOrientation()"
            [align]="playAlign()"
            [size]="playSize()"
            [lineStyle]="playLineStyle()"
          >
            @for (h of orderHops; track h.id) {
              <tw-timeline-item
                [marker]="playMarker()"
                [color]="h.color"
                [state]="h.state"
                [timestamp]="h.when || null"
              >
                @if (playMarker() === 'circle') {
                  <tw-icon twTimelineMarker [name]="h.icon" size="sm" />
                }
                @if (playOrientation() === 'vertical' && (playAlign() === 'alternate' || playAlign() === 'split')) {
                  <span twTimelineOpposite class="text-xs text-fg-muted font-mono">{{ h.when || '—' }}</span>
                }
                <p class="text-sm font-semibold">{{ h.label }}</p>
              </tw-timeline-item>
            }
          </tw-timeline>
        </div>
      </div>
    </section>
  `,
})
export class TimelineExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly markers = MARKERS;
  protected readonly states = STATES;
  protected readonly aligns = ALIGNS;
  protected readonly lineStyles = LINE_STYLES;
  protected readonly orientations = ORIENTATIONS;
  protected readonly orderHops = ORDER_HOPS;
  protected readonly buildPipeline = BUILD_PIPELINE;
  protected readonly auditLog = AUDIT_LOG;

  protected readonly postedAt = new Date('2026-04-12T09:14:00Z');

  protected readonly lastSelected = signal<number | null>(null);
  protected onAuditSelected(id: number): void {
    this.lastSelected.set(id);
  }

  // Playground state
  protected readonly playOrientation = signal<TwOrientation>('vertical');
  protected readonly playAlign = signal<TimelineAlign>('left');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playLineStyle = signal<TimelineLineStyle>('solid');
  protected readonly playMarker = signal<TimelineMarker>('circle');

  // ── Snippets ──────────────────────────────────────────────

  protected readonly orientationSnippet = `<!-- Vertical (default) -->
<tw-timeline>
  @for (h of hops; track h.id) {
    <tw-timeline-item
      marker="circle"
      [color]="h.color"
      [state]="h.state"
      [timestamp]="h.when || null"
    >
      <tw-icon twTimelineMarker [name]="h.icon" size="sm" />
      <p class="text-sm font-semibold">{{ h.label }}</p>
    </tw-timeline-item>
  }
</tw-timeline>

<!-- Horizontal -->
<tw-timeline orientation="horizontal" size="sm">
  @for (h of hops; track h.id) { ... }
</tw-timeline>`;

  protected readonly longHorizontalSnippet = `<!-- Long horizontal timeline — chevrons appear when overflow exists -->
<div class="max-w-full overflow-hidden">
  <tw-timeline orientation="horizontal" size="sm">
    @for (h of buildPipeline; track h.id) {
      <tw-timeline-item
        marker="circle"
        [color]="h.color"
        [state]="h.state"
        [timestamp]="h.when || null"
      >
        <tw-icon twTimelineMarker [name]="h.icon" size="xs" />
        <p class="text-xs font-medium">{{ h.label }}</p>
      </tw-timeline-item>
    }
  </tw-timeline>
</div>

<!-- Force chevrons even at edges (disabled when there's nowhere to scroll) -->
<tw-timeline orientation="horizontal" scrollControls="always">…</tw-timeline>

<!-- Hide chevrons entirely (consumer-managed overflow) -->
<tw-timeline orientation="horizontal" scrollControls="never">…</tw-timeline>`;

  protected readonly alignmentSnippet = `<!-- Alternate -->
<tw-timeline align="alternate">
  <tw-timeline-item marker="circle" color="primary" state="reached">
    <span twTimelineOpposite class="text-sm font-semibold">Q1 2026</span>
    <p class="text-sm font-semibold">Auth rewrite</p>
  </tw-timeline-item>
  <!-- ... -->
</tw-timeline>

<!-- Split -->
<tw-timeline align="split">
  <tw-timeline-item marker="circle" color="info" state="reached">
    <span twTimelineOpposite class="text-xs font-mono">14:00:02</span>
    <p class="text-sm">Lint check passed.</p>
  </tw-timeline-item>
  <!-- ... -->
</tw-timeline>

<!-- Right -->
<tw-timeline align="right">
  <tw-timeline-item color="success" state="reached" timestamp="Apr 12">
    <p class="text-sm">Alice merged PR #421.</p>
  </tw-timeline-item>
  <!-- ... -->
</tw-timeline>`;

  protected readonly markersSnippet = `<!-- Dot (default, compact) -->
<tw-timeline size="sm">
  <tw-timeline-item color="success" state="reached" timestamp="08:42">
    <p class="text-sm">Build succeeded.</p>
  </tw-timeline-item>
</tw-timeline>

<!-- Circle with auto-number -->
<tw-timeline>
  <tw-timeline-item marker="circle" color="primary" state="reached">
    <p class="text-sm font-semibold">Sign up</p>
  </tw-timeline-item>
</tw-timeline>

<!-- Circle with projected icon -->
<tw-timeline-item marker="circle" color="success" state="reached">
  <tw-icon twTimelineMarker name="check-circle" size="sm" />
  <p class="text-sm font-semibold">Order placed</p>
</tw-timeline-item>

<!-- Circle with projected avatar -->
<tw-timeline-item marker="circle" color="neutral">
  <tw-avatar twTimelineMarker initials="AM" size="sm" />
  <p class="text-sm"><strong>Alice Morgan</strong> rotated API keys.</p>
</tw-timeline-item>`;

  protected readonly statesSnippet = `<tw-timeline>
  <tw-timeline-item marker="circle" color="success" state="reached" timestamp="14:00">
    <tw-icon twTimelineMarker name="check-circle" size="sm" />
    <p class="text-sm font-semibold">Lint passed</p>
  </tw-timeline-item>
  <tw-timeline-item marker="circle" color="primary" state="current" timestamp="14:05">
    <tw-icon twTimelineMarker name="play-circle" size="sm" />
    <p class="text-sm font-semibold">Deploying to staging</p>
  </tw-timeline-item>
  <tw-timeline-item marker="circle" color="neutral" state="pending">
    <tw-icon twTimelineMarker name="eye" size="sm" />
    <p class="text-sm text-fg-muted">Smoke tests</p>
  </tw-timeline-item>
  <tw-timeline-item marker="circle" color="primary" state="error" timestamp="14:14">
    <p class="text-sm font-semibold text-error-fg">Canary aborted</p>
  </tw-timeline-item>
</tw-timeline>`;

  protected readonly colorsSnippet = `<tw-timeline size="sm">
  <tw-timeline-item color="success" state="reached" timestamp="now">
    <p class="text-xs">Created</p>
  </tw-timeline-item>
  <tw-timeline-item color="success" state="current">
    <p class="text-xs">In progress</p>
  </tw-timeline-item>
</tw-timeline>

@for (c of colors; track c) { ... }`;

  protected readonly sizesSnippet = `@for (s of sizes; track s) {
  <tw-timeline [size]="s">
    <tw-timeline-item marker="circle" color="primary" state="reached" timestamp="Mar 14">
      <p>Order placed</p>
    </tw-timeline-item>
    <tw-timeline-item marker="circle" color="primary" state="current" timestamp="Mar 15">
      <p>Shipped</p>
    </tw-timeline-item>
    <tw-timeline-item marker="circle" color="neutral" state="pending">
      <p>Delivered</p>
    </tw-timeline-item>
  </tw-timeline>
}`;

  protected readonly lineStyleSnippet = `<!-- Solid (recorded chronology) -->
<tw-timeline lineStyle="solid">
  <tw-timeline-item color="success" state="reached" timestamp="Mar 14">
    <p class="text-sm">Tag v2.4.0 cut.</p>
  </tw-timeline-item>
</tw-timeline>

<!-- Dashed (projected schedule) -->
<tw-timeline lineStyle="dashed">
  <tw-timeline-item color="primary" state="current">
    <p class="text-sm font-semibold">Today — UX review</p>
  </tw-timeline-item>
  <tw-timeline-item color="neutral" state="pending">
    <p class="text-sm text-fg-muted">+3 days — eng kickoff</p>
  </tw-timeline-item>
</tw-timeline>`;

  protected readonly timestampsSnippet = `<!-- Date input → <time datetime="…"> -->
<tw-timeline-item color="primary" state="reached" [timestamp]="postedAt">
  <p class="text-sm">Date input — machine-readable via &lt;time&gt;.</p>
</tw-timeline-item>

<!-- String + explicit dateTime -->
<tw-timeline-item color="primary" state="reached" timestamp="Apr 12, 2026" dateTime="2026-04-12">
  <p class="text-sm">Verbatim text with machine-readable attribute.</p>
</tw-timeline-item>

<!-- Plain string (no datetime) -->
<tw-timeline-item color="primary" state="current" timestamp="last week">
  <p class="text-sm">Renders as a &lt;span&gt;.</p>
</tw-timeline-item>

<!-- Projected slot (full DOM control) -->
<tw-timeline-item color="info" state="reached">
  <span twTimelineTimestamp class="text-xs text-fg-muted">2 hours ago</span>
  <p class="text-sm">Custom relative-time component.</p>
</tw-timeline-item>`;

  protected readonly interactiveSnippet = `<tw-timeline>
  @for (e of auditLog; track e.id) {
    <tw-timeline-item marker="circle" color="neutral" [timestamp]="e.when">
      <tw-avatar twTimelineMarker [initials]="e.initials" size="sm" />
      <tw-item interactive (selected)="onAuditSelected(e.id)">
        <span twItemTitle><strong>{{ e.actor }}</strong> {{ e.action }}</span>
        <span twItemDescription>Click to view full audit record.</span>
      </tw-item>
    </tw-timeline-item>
  }
</tw-timeline>`;
}
