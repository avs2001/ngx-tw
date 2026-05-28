import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  StatComponent,
  StatDeltaComponent,
  StatLabelDirective,
  StatValueDirective,
  StatDescriptionDirective,
} from 'ngx-tw/stat';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-stat-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StatComponent,
    StatDeltaComponent,
    StatLabelDirective,
    StatValueDirective,
    StatDescriptionDirective,
    CodeBlockComponent,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Stat component is the KPI tile primitive — a single dominant numeric value
        paired with a short label, optional description, and an optional trend delta that
        shows how the metric has changed against a comparison period. It is purpose-built
        for analytics dashboards, admin overviews, and reporting surfaces where four to
        twelve metrics share a grid. Stat is display-only: it has no inputs for the value
        itself (content projection owns the number) and no form integration. Composes
        cleanly with
        <a routerLink="/components/skeleton" class="text-primary-600 hover:underline">Skeleton</a>
        for loading states, and with
        <a routerLink="/components/icon" class="text-primary-600 hover:underline">Icon</a>
        and
        <a routerLink="/components/badge" class="text-primary-600 hover:underline">Badge</a>
        for projected slots.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-stat>
          <span twStatLabel>Revenue</span>
          <span twStatValue>$24,580</span>
          <span twStatDescription>Past 30 days</span>
          <tw-stat-delta direction="up" comparisonLabel="vs prior period">+12.5%</tw-stat-delta>
        </tw-stat>
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
        <li>
          Four surface variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outlined</code>
          (default),
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">elevated</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code>, and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">plain</code>
        </li>
        <li>
          Five sizes (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>) drive padding and value typography from
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text-sm</code>
          up to a marquee
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text-3xl</code>
          dashboard headline
        </li>
        <li>
          Companion
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-stat-delta</code>
          component renders a trend chevron + value + comparison label, with three display variants
          (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">badge</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inline</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">icon-only</code>)
        </li>
        <li>
          Sentiment inversion via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inverted</code>
          for "lower is better" metrics (bounce rate, error rate, latency, churn) — flips the success/error colors without changing the literal direction or the announced verb
        </li>
        <li>
          Five projection slots:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStatLabel]</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStatValue]</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStatDescription]</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStatIcon]</code>, and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStatFooter]</code>
          for sparklines or auxiliary metadata
        </li>
        <li>
          Built-in loading state: set
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[loading]="true"</code>
          to swap label / value / delta for internally-managed
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-skeleton</code> placeholders sized to the density
        </li>
        <li>
          Value formatting is the consumer's job — project pre-formatted strings or use Angular's
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">decimal</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">currency</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">percent</code> pipes inside
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStatValue]</code>
        </li>
        <li>
          Semantic
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;dl&gt;</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;dt&gt;</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;dd&gt;</code> structure announces the label-to-value pairing naturally; permanent
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="polite"</code> region announces resolved content when loading completes
        </li>
        <li>
          The trend delta carries
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="img"</code> and a composed
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code> ("increased by 12.5% vs prior period") so direction is conveyed non-visually
        </li>
        <li>Dashboard grid layout is the consumer's responsibility — Stat ships as a single tile, not a container</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/skeleton" class="text-primary-600 hover:underline">Skeleton</a>
          — Stat instantiates this internally when
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loading</code>
          is true; reach for it directly when you need a placeholder outside a Stat tile.
        </li>
        <li>
          <a routerLink="/components/card" class="text-primary-600 hover:underline">Card</a>
          — for dashboard sections that group multiple stat tiles plus a chart; Stat is the tile, Card is the section frame.
        </li>
        <li>
          <a routerLink="/components/badge" class="text-primary-600 hover:underline">Badge</a>
          — project a Badge into
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStatFooter]</code>
          for status tags ("Live", "Beta") alongside the metric.
        </li>
        <li>
          <a routerLink="/components/progress-bar" class="text-primary-600 hover:underline">Progress Bar</a>
          — for KPIs that read as progress against a target rather than delta-vs-previous; use Progress Bar instead of (or alongside) Stat.
        </li>
      </ul>
    </section>
  `,
})
export class StatOverview {
  protected readonly basicUsageSnippet = `<tw-stat>
  <span twStatLabel>Revenue</span>
  <span twStatValue>$24,580</span>
  <span twStatDescription>Past 30 days</span>
  <tw-stat-delta direction="up" comparisonLabel="vs prior period">+12.5%</tw-stat-delta>
</tw-stat>`;

  protected readonly importSnippet = `import {
  StatComponent,
  StatDeltaComponent,
  StatLabelDirective,
  StatValueDirective,
  StatDescriptionDirective,
  StatIconDirective,
  StatFooterDirective,
} from 'ngx-tw/stat';`;
}
