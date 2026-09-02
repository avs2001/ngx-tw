import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { IconComponent } from '@cdevhub/ngx-tw/icon';
import { BadgeComponent } from '@cdevhub/ngx-tw/badge';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import {
  StatComponent,
  StatDeltaComponent,
  StatDescriptionDirective,
  StatFooterDirective,
  StatIconDirective,
  StatLabelDirective,
  StatValueDirective,
} from '@cdevhub/ngx-tw/stat';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import type { StatDeltaDirection, StatDeltaVariant, StatVariant } from '@cdevhub/ngx-tw/stat';

const VARIANTS: StatVariant[] = ['outline', 'elevated', 'solid', 'ghost'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const DELTA_DIRECTIONS: StatDeltaDirection[] = ['up', 'down', 'neutral'];
const DELTA_VARIANTS: StatDeltaVariant[] = ['badge', 'inline', 'icon-only'];

@Component({
  selector: 'app-stat-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StatComponent,
    StatDeltaComponent,
    StatLabelDirective,
    StatValueDirective,
    StatDescriptionDirective,
    StatIconDirective,
    StatFooterDirective,
    ButtonDirective,
    IconComponent,
    BadgeComponent,
    CodeBlockComponent,
  ],
  template: `
    <!-- ─────────────── Variants ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>
        input controls the tile's surface treatment.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        (default) carries a thin border on the page surface — the workhorse for dashboards on white.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">elevated</code>
        adds shadow and uses the raised surface for tiles that should pop off the page.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        uses the muted surface with no border for dense layouts where borders would crowd.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
        strips chrome entirely for in-flow stats inside another container.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <tw-stat variant="outline">
            <span twStatLabel>Revenue</span>
            <span twStatValue>$24,580</span>
            <tw-stat-delta direction="up" comparisonLabel="vs last week">+12.5%</tw-stat-delta>
          </tw-stat>

          <tw-stat variant="elevated">
            <span twStatLabel>Orders</span>
            <span twStatValue>1,284</span>
            <tw-stat-delta direction="up" comparisonLabel="vs last week">+8.1%</tw-stat-delta>
          </tw-stat>

          <tw-stat variant="solid">
            <span twStatLabel>MRR</span>
            <span twStatValue>$48.2k</span>
            <tw-stat-delta direction="up" comparisonLabel="MoM">+6.0%</tw-stat-delta>
          </tw-stat>

          <tw-stat variant="ghost">
            <span twStatLabel>Churn</span>
            <span twStatValue>2.1%</span>
            <tw-stat-delta direction="down" inverted comparisonLabel="MoM">−0.4pp</tw-stat-delta>
          </tw-stat>
        </div>
      </div>

      <tw-code-block [code]="variantsSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Notice the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
        Churn tile uses
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inverted</code>
        — a falling churn rate is good news, so the down arrow paints success-colored. See the
        <em>Inverted sentiment</em> section below for the rationale.
      </p>
    </section>

    <!-- ─────────────── Sizes ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input drives padding, internal gap, and value typography. The value scale jumps from
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text-sm</code>
        at
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        up to a marquee
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text-3xl</code>
        at
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code> — use the larger steps when the metric must dominate the section, and the smaller steps for compact secondary indicators in a sidebar or table row.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          <tw-stat size="xs">
            <span twStatLabel>Tickets</span>
            <span twStatValue>27</span>
            <tw-stat-delta direction="neutral" variant="inline">±0</tw-stat-delta>
          </tw-stat>

          <tw-stat size="sm">
            <span twStatLabel>Sessions</span>
            <span twStatValue>3,412</span>
            <tw-stat-delta direction="up" variant="inline">+4.8%</tw-stat-delta>
          </tw-stat>

          <tw-stat size="md">
            <span twStatLabel>Page views</span>
            <span twStatValue>84,217</span>
            <tw-stat-delta direction="up">+11.0%</tw-stat-delta>
          </tw-stat>

          <tw-stat size="lg">
            <span twStatLabel>Active users</span>
            <span twStatValue>12,894</span>
            <tw-stat-delta direction="up" comparisonLabel="WoW">+5.2%</tw-stat-delta>
          </tw-stat>

          <tw-stat size="xl">
            <span twStatLabel>Revenue</span>
            <span twStatValue>$128,400</span>
            <tw-stat-delta direction="up" comparisonLabel="vs prior 7d">+18.6%</tw-stat-delta>
          </tw-stat>
        </div>
      </div>

      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- ─────────────── Trend delta ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Trend delta</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-stat-delta</code>
        component renders a trend chevron, the delta text (projected — consumers control formatting), and an optional comparison label. Three
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">direction</code>
        values map to three glyphs and color sentiments: up → chevron up, success color; down → chevron down, error color; neutral → horizontal line, neutral color.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <tw-stat>
            <span twStatLabel>Signups</span>
            <span twStatValue>1,402</span>
            <tw-stat-delta direction="up" comparisonLabel="vs last week">+14.2%</tw-stat-delta>
          </tw-stat>

          <tw-stat>
            <span twStatLabel>Trial conversions</span>
            <span twStatValue>312</span>
            <tw-stat-delta direction="down" comparisonLabel="vs last week">−6.8%</tw-stat-delta>
          </tw-stat>

          <tw-stat>
            <span twStatLabel>Active subscribers</span>
            <span twStatValue>8,940</span>
            <tw-stat-delta direction="neutral" comparisonLabel="vs last week">No change</tw-stat-delta>
          </tw-stat>
        </div>
      </div>

      <tw-code-block [code]="deltaSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The delta carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="img"</code>
        and a composed
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        (e.g. <em>"increased by 14.2% vs last week"</em>) so direction is conveyed non-visually. Pass an explicit
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaLabel</code>
        input to override the composed string for non-text or already-localized content.
      </p>
    </section>

    <!-- ─────────────── Inverted sentiment ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inverted sentiment</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Some metrics are inverted by nature — a falling bounce rate, error rate, latency, or churn count is success, not failure. Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inverted</code>
        on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-stat-delta</code>
        to swap the success/error color mapping: down becomes success-colored, up becomes error-colored. The literal direction (up/down) and the announced verb ("increased"/"decreased") stay the same — only the color sentiment flips.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <tw-stat>
            <span twStatLabel>Bounce rate</span>
            <span twStatValue>38.2%</span>
            <tw-stat-delta direction="down" inverted comparisonLabel="WoW">−4.1pp</tw-stat-delta>
          </tw-stat>

          <tw-stat>
            <span twStatLabel>Error rate</span>
            <span twStatValue>0.42%</span>
            <tw-stat-delta direction="up" inverted comparisonLabel="WoW">+0.12pp</tw-stat-delta>
          </tw-stat>

          <tw-stat>
            <span twStatLabel>p95 latency</span>
            <span twStatValue>184ms</span>
            <tw-stat-delta direction="down" inverted comparisonLabel="vs last deploy">−22ms</tw-stat-delta>
          </tw-stat>

          <tw-stat>
            <span twStatLabel>Churned accounts</span>
            <span twStatValue>14</span>
            <tw-stat-delta direction="down" inverted comparisonLabel="MoM">−3</tw-stat-delta>
          </tw-stat>
        </div>
      </div>

      <tw-code-block [code]="invertedSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Bounce rate and p95 latency went down — the down chevron paints in success color because
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inverted</code>
        is set. Error rate went up — the up chevron paints in error color for the same reason. Without
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inverted</code>,
        every "down" reads as bad news regardless of context, which is wrong for half the metrics on a real dashboard.
      </p>
    </section>

    <!-- ─────────────── Delta display variants + standalone use ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Delta display variants &amp; standalone use</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-stat-delta</code>
        has three display variants.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">badge</code>
        (default) wraps the value in a soft-colored pill chip — the canonical dashboard look.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inline</code>
        drops the chip background and pairs a colored chevron with colored text — quieter, fits well inside dense tiles.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">icon-only</code>
        shows just the chevron for ultra-dense layouts (sparkline tickers, mobile cards) — the text and comparison stay in the accessible name.
      </p>

      <div class="space-y-4">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Badge (default)</p>
          <div class="rounded-lg border border-border p-6 bg-surface-raised">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <tw-stat>
                <span twStatLabel>Revenue</span>
                <span twStatValue>$24,580</span>
                <tw-stat-delta direction="up" comparisonLabel="WoW">+12.5%</tw-stat-delta>
              </tw-stat>
              <tw-stat>
                <span twStatLabel>Refunds</span>
                <span twStatValue>$1,204</span>
                <tw-stat-delta direction="up" inverted comparisonLabel="WoW">+8.0%</tw-stat-delta>
              </tw-stat>
              <tw-stat>
                <span twStatLabel>Active sessions</span>
                <span twStatValue>3,412</span>
                <tw-stat-delta direction="neutral" comparisonLabel="WoW">±0</tw-stat-delta>
              </tw-stat>
            </div>
          </div>
        </div>

        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Inline</p>
          <div class="rounded-lg border border-border p-6 bg-surface-raised">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <tw-stat>
                <span twStatLabel>Revenue</span>
                <span twStatValue>$24,580</span>
                <tw-stat-delta direction="up" variant="inline" comparisonLabel="WoW">+12.5%</tw-stat-delta>
              </tw-stat>
              <tw-stat>
                <span twStatLabel>Refunds</span>
                <span twStatValue>$1,204</span>
                <tw-stat-delta direction="up" variant="inline" inverted comparisonLabel="WoW">+8.0%</tw-stat-delta>
              </tw-stat>
              <tw-stat>
                <span twStatLabel>Active sessions</span>
                <span twStatValue>3,412</span>
                <tw-stat-delta direction="neutral" variant="inline" comparisonLabel="WoW">±0</tw-stat-delta>
              </tw-stat>
            </div>
          </div>
        </div>

        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Icon-only</p>
          <div class="rounded-lg border border-border p-6 bg-surface-raised">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <tw-stat>
                <span twStatLabel>Revenue</span>
                <span twStatValue>$24,580</span>
                <tw-stat-delta direction="up" variant="icon-only" comparisonLabel="WoW">+12.5%</tw-stat-delta>
              </tw-stat>
              <tw-stat>
                <span twStatLabel>Refunds</span>
                <span twStatValue>$1,204</span>
                <tw-stat-delta direction="up" variant="icon-only" inverted comparisonLabel="WoW">+8.0%</tw-stat-delta>
              </tw-stat>
              <tw-stat>
                <span twStatLabel>Active sessions</span>
                <span twStatValue>3,412</span>
                <tw-stat-delta direction="neutral" variant="icon-only" comparisonLabel="WoW">±0</tw-stat-delta>
              </tw-stat>
            </div>
          </div>
        </div>
      </div>

      <tw-code-block [code]="deltaVariantsSnippet" language="html" class="mt-4" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-stat-delta</code>
        also works standalone, outside a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-stat</code> — use it inline next to any metric in a table cell, a list row, or a section header:
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mt-4 mb-4">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-fg-muted">
              <th class="pb-2 pr-4 font-medium">Channel</th>
              <th class="pb-2 pr-4 font-medium text-right">Sessions</th>
              <th class="pb-2 font-medium text-right">7d trend</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="py-2 pr-4">Organic search</td>
              <td class="py-2 pr-4 text-right font-mono">21,408</td>
              <td class="py-2 text-right">
                <tw-stat-delta direction="up" variant="inline">+5.4%</tw-stat-delta>
              </td>
            </tr>
            <tr>
              <td class="py-2 pr-4">Paid social</td>
              <td class="py-2 pr-4 text-right font-mono">8,912</td>
              <td class="py-2 text-right">
                <tw-stat-delta direction="down" variant="inline">−3.1%</tw-stat-delta>
              </td>
            </tr>
            <tr>
              <td class="py-2 pr-4">Direct</td>
              <td class="py-2 pr-4 text-right font-mono">4,201</td>
              <td class="py-2 text-right">
                <tw-stat-delta direction="neutral" variant="inline">±0</tw-stat-delta>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <tw-code-block [code]="standaloneDeltaSnippet" language="html" />
    </section>

    <!-- ─────────────── Icon-leading layout ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Icon-leading layout</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project an element with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStatIcon]</code>
        to switch the layout from a vertical stack to an icon-leading row — the icon sits on the leading edge and the label/value/description stack flows beside it. Use this when the icon adds semantic context (a chart glyph for analytics, a cart for orders, a clock for time-on-page). Any element works:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-icon</code>,
        a hand-authored SVG, or an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;img&gt;</code>.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <tw-stat variant="elevated">
            <span twStatIcon class="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <tw-icon name="user" size="md" aria-hidden="true" />
            </span>
            <span twStatLabel>Active users</span>
            <span twStatValue>12,894</span>
            <tw-stat-delta direction="up" variant="inline" comparisonLabel="WoW">+5.2%</tw-stat-delta>
          </tw-stat>

          <tw-stat variant="elevated">
            <span twStatIcon class="flex size-10 items-center justify-center rounded-lg bg-success-50 text-success-600">
              <tw-icon name="check-circle" size="md" aria-hidden="true" />
            </span>
            <span twStatLabel>Orders</span>
            <span twStatValue>1,284</span>
            <tw-stat-delta direction="up" variant="inline" comparisonLabel="WoW">+8.1%</tw-stat-delta>
          </tw-stat>

          <tw-stat variant="elevated">
            <span twStatIcon class="flex size-10 items-center justify-center rounded-lg bg-info-50 text-info-600">
              <tw-icon name="search" size="md" aria-hidden="true" />
            </span>
            <span twStatLabel>Page views</span>
            <span twStatValue>84,217</span>
            <tw-stat-delta direction="up" variant="inline" comparisonLabel="WoW">+11.0%</tw-stat-delta>
          </tw-stat>

          <tw-stat variant="elevated">
            <span twStatIcon class="flex size-10 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
              <tw-icon name="x-mark" size="md" aria-hidden="true" />
            </span>
            <span twStatLabel>Error rate</span>
            <span twStatValue>0.42%</span>
            <tw-stat-delta direction="up" variant="inline" inverted comparisonLabel="WoW">+0.12pp</tw-stat-delta>
          </tw-stat>
        </div>
      </div>

      <tw-code-block [code]="iconLeadingSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Decorative icons should carry
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden="true"</code> —
        the label already conveys the semantics to screen readers. The chip background around each icon is the consumer's responsibility; Stat keeps the slot styling-free so you can tint by domain (primary for product, success for revenue, etc.).
      </p>
    </section>

    <!-- ─────────────── Loading state ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Loading state</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[loading]="true"</code>
        and Stat swaps label, value, and delta for internally-managed
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-skeleton</code>
        placeholders sized to the density — exactly the dashboard ergonomic where you bind
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[loading]="isLoading()"</code> to a single signal. The host carries a permanent
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="polite"</code>
        region; only
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-busy</code>
        toggles, so assistive tech announces resolved content when loading completes.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs text-fg-muted">
            Click to toggle loading — every tile swaps to skeletons in unison.
          </p>
          <button twButton variant="outline" size="sm" (click)="toggleLoading()">
            {{ loadingDemo() ? 'Show data' : 'Show loading' }}
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (tile of dashboardTiles; track tile.label) {
            <tw-stat [loading]="loadingDemo()">
              <span twStatLabel>{{ tile.label }}</span>
              <span twStatValue>{{ tile.value }}</span>
              <tw-stat-delta [direction]="tile.direction" [inverted]="!!tile.inverted" comparisonLabel="vs last week">
                {{ tile.delta }}
              </tw-stat-delta>
            </tw-stat>
          }
        </div>
      </div>

      <tw-code-block [code]="loadingSnippet" language="html" />
    </section>

    <!-- ─────────────── Footer slot (sparklines) ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Footer slot</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project any element with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStatFooter]</code>
        for auxiliary content below the main metric — a sparkline, a target progress bar, a Badge for status, or short comparison text. The footer is separated from the primary content by a thin border and always renders, even when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loading</code>
        is true (project your own skeleton if needed). Grid layout for a multi-tile dashboard is the consumer's responsibility — Stat ships as a single tile, not a grid container.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <tw-stat variant="elevated" size="lg">
            <span twStatLabel>Revenue</span>
            <span twStatValue>$128,400</span>
            <tw-stat-delta direction="up" variant="inline">+18.6%</tw-stat-delta>
            <div twStatFooter>
              <svg viewBox="0 0 100 28" preserveAspectRatio="none" class="w-full h-7 text-success-500" aria-hidden="true">
                <path
                  d="M0,22 L12,18 L24,20 L36,14 L48,16 L60,10 L72,12 L84,6 L100,4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </tw-stat>

          <tw-stat variant="elevated" size="lg">
            <span twStatLabel>p95 latency</span>
            <span twStatValue>184ms</span>
            <tw-stat-delta direction="down" inverted variant="inline">−22ms</tw-stat-delta>
            <div twStatFooter>
              <svg viewBox="0 0 100 28" preserveAspectRatio="none" class="w-full h-7 text-success-500" aria-hidden="true">
                <path
                  d="M0,8 L12,12 L24,10 L36,16 L48,14 L60,18 L72,16 L84,22 L100,24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </tw-stat>

          <tw-stat variant="elevated" size="lg">
            <span twStatLabel>Active subscribers</span>
            <span twStatValue>8,940</span>
            <tw-stat-delta direction="neutral" variant="inline">±0</tw-stat-delta>
            <div twStatFooter class="flex items-center gap-2">
              <span twBadge color="success" size="sm">Live</span>
              <span class="text-xs text-fg-muted">Updated 2 min ago</span>
            </div>
          </tw-stat>
        </div>
      </div>

      <tw-code-block [code]="footerSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The grid above uses
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">grid grid-cols-1 md:grid-cols-3 gap-4</code> —
        that's consumer code, not Stat. Lay the tiles out however the dashboard needs (uniform grid, asymmetric featured tile, masonry); Stat does not opine on container layout.
      </p>
    </section>

    <!-- ─────────────── Playground ─────────────── -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input on both
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-stat</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-stat-delta</code> at once. Try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size = xl</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant = elevated</code>
        for the marquee dashboard headline, or toggle
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inverted</code>
        with a down direction to see the success-coloured "lower is better" case.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-6 mb-6">
          <div class="flex flex-wrap gap-4">
            <p class="basis-full text-xs font-semibold text-fg uppercase tracking-wide">Tile</p>

            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
              <div class="flex gap-1">
                @for (v of variants; track v) {
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playVariant() === v"
                    [class.!text-primary-700]="playVariant() === v"
                    (click)="playVariant.set(v)"
                  >{{ v }}</button>
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
              <label class="block text-xs font-medium text-fg-muted mb-1">Loading</label>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playLoading()"
                [class.!text-primary-700]="playLoading()"
                (click)="playLoading.set(!playLoading())"
              >{{ playLoading() ? 'on' : 'off' }}</button>
            </div>
          </div>

          <div class="flex flex-wrap gap-4">
            <p class="basis-full text-xs font-semibold text-fg uppercase tracking-wide">Delta</p>

            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Direction</label>
              <div class="flex gap-1">
                @for (d of deltaDirections; track d) {
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playDirection() === d"
                    [class.!text-primary-700]="playDirection() === d"
                    (click)="playDirection.set(d)"
                  >{{ d }}</button>
                }
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Delta variant</label>
              <div class="flex gap-1">
                @for (dv of deltaVariants; track dv) {
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playDeltaVariant() === dv"
                    [class.!text-primary-700]="playDeltaVariant() === dv"
                    (click)="playDeltaVariant.set(dv)"
                  >{{ dv }}</button>
                }
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Inverted</label>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playInverted()"
                [class.!text-primary-700]="playInverted()"
                (click)="playInverted.set(!playInverted())"
              >{{ playInverted() ? 'on' : 'off' }}</button>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-stat
            [variant]="playVariant()"
            [size]="playSize()"
            [loading]="playLoading()"
            class="max-w-sm"
          >
            <span twStatLabel>Revenue</span>
            <span twStatValue>$128,400</span>
            <span twStatDescription>Past 7 days</span>
            <tw-stat-delta
              [direction]="playDirection()"
              [inverted]="playInverted()"
              [variant]="playDeltaVariant()"
              comparisonLabel="vs prior 7d"
            >+12.5%</tw-stat-delta>
          </tw-stat>
        </div>
      </div>
    </section>
  `,
})
export class StatExamples {
  protected readonly variants = VARIANTS;
  protected readonly sizes = SIZES;
  protected readonly deltaDirections = DELTA_DIRECTIONS;
  protected readonly deltaVariants = DELTA_VARIANTS;

  // Playground state
  protected readonly playVariant = signal<StatVariant>('outline');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playLoading = signal(false);
  protected readonly playDirection = signal<StatDeltaDirection>('up');
  protected readonly playDeltaVariant = signal<StatDeltaVariant>('badge');
  protected readonly playInverted = signal(false);

  // Loading-demo state
  protected readonly loadingDemo = signal(true);
  protected readonly dashboardTiles: readonly {
    label: string;
    value: string;
    delta: string;
    direction: StatDeltaDirection;
    inverted?: boolean;
  }[] = [
    { label: 'Revenue', value: '$24,580', delta: '+12.5%', direction: 'up' },
    { label: 'Orders', value: '1,284', delta: '+8.1%', direction: 'up' },
    { label: 'Bounce rate', value: '38.2%', delta: '−4.1pp', direction: 'down', inverted: true },
    { label: 'Active users', value: '12,894', delta: '+5.2%', direction: 'up' },
  ];

  protected toggleLoading(): void {
    this.loadingDemo.set(!this.loadingDemo());
  }

  // ── snippets ──

  protected readonly variantsSnippet = `<!-- Outlined (default) -->
<tw-stat variant="outline">
  <span twStatLabel>Revenue</span>
  <span twStatValue>$24,580</span>
  <tw-stat-delta direction="up" comparisonLabel="vs last week">+12.5%</tw-stat-delta>
</tw-stat>

<!-- Elevated -->
<tw-stat variant="elevated">
  <span twStatLabel>Orders</span>
  <span twStatValue>1,284</span>
  <tw-stat-delta direction="up" comparisonLabel="vs last week">+8.1%</tw-stat-delta>
</tw-stat>

<!-- Filled -->
<tw-stat variant="solid">
  <span twStatLabel>MRR</span>
  <span twStatValue>$48.2k</span>
  <tw-stat-delta direction="up" comparisonLabel="MoM">+6.0%</tw-stat-delta>
</tw-stat>

<!-- Plain (no chrome) -->
<tw-stat variant="ghost">
  <span twStatLabel>Churn</span>
  <span twStatValue>2.1%</span>
  <tw-stat-delta direction="down" inverted comparisonLabel="MoM">−0.4pp</tw-stat-delta>
</tw-stat>`;

  protected readonly sizesSnippet = `<tw-stat size="xs"><!-- 27 tickets, neutral --></tw-stat>
<tw-stat size="sm"><!-- 3,412 sessions, +4.8% --></tw-stat>
<tw-stat size="md"><!-- 84,217 page views, +11.0% --></tw-stat>
<tw-stat size="lg"><!-- 12,894 active users, +5.2% --></tw-stat>
<tw-stat size="xl"><!-- $128,400 revenue, +18.6% --></tw-stat>`;

  protected readonly deltaSnippet = `<tw-stat>
  <span twStatLabel>Signups</span>
  <span twStatValue>1,402</span>
  <tw-stat-delta direction="up" comparisonLabel="vs last week">+14.2%</tw-stat-delta>
</tw-stat>

<tw-stat>
  <span twStatLabel>Trial conversions</span>
  <span twStatValue>312</span>
  <tw-stat-delta direction="down" comparisonLabel="vs last week">−6.8%</tw-stat-delta>
</tw-stat>

<tw-stat>
  <span twStatLabel>Active subscribers</span>
  <span twStatValue>8,940</span>
  <tw-stat-delta direction="neutral" comparisonLabel="vs last week">No change</tw-stat-delta>
</tw-stat>`;

  protected readonly invertedSnippet = `<!-- Bounce rate fell — down is GOOD here -->
<tw-stat>
  <span twStatLabel>Bounce rate</span>
  <span twStatValue>38.2%</span>
  <tw-stat-delta direction="down" inverted comparisonLabel="WoW">−4.1pp</tw-stat-delta>
</tw-stat>

<!-- Error rate rose — up is BAD here -->
<tw-stat>
  <span twStatLabel>Error rate</span>
  <span twStatValue>0.42%</span>
  <tw-stat-delta direction="up" inverted comparisonLabel="WoW">+0.12pp</tw-stat-delta>
</tw-stat>

<!-- p95 latency dropped — down is GOOD here -->
<tw-stat>
  <span twStatLabel>p95 latency</span>
  <span twStatValue>184ms</span>
  <tw-stat-delta direction="down" inverted comparisonLabel="vs last deploy">−22ms</tw-stat-delta>
</tw-stat>`;

  protected readonly deltaVariantsSnippet = `<!-- Badge (default) — pill chip with colored background -->
<tw-stat-delta direction="up" comparisonLabel="WoW">+12.5%</tw-stat-delta>

<!-- Inline — no chip, colored chevron + colored text -->
<tw-stat-delta direction="up" variant="inline" comparisonLabel="WoW">+12.5%</tw-stat-delta>

<!-- Icon-only — chevron alone, text + comparison stay in aria-label -->
<tw-stat-delta direction="up" variant="icon-only" comparisonLabel="WoW">+12.5%</tw-stat-delta>`;

  protected readonly standaloneDeltaSnippet = `<table>
  <thead>
    <tr><th>Channel</th><th>Sessions</th><th>7d trend</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>Organic search</td>
      <td>21,408</td>
      <td><tw-stat-delta direction="up" variant="inline">+5.4%</tw-stat-delta></td>
    </tr>
    <tr>
      <td>Paid social</td>
      <td>8,912</td>
      <td><tw-stat-delta direction="down" variant="inline">−3.1%</tw-stat-delta></td>
    </tr>
  </tbody>
</table>`;

  protected readonly iconLeadingSnippet = `<tw-stat variant="elevated">
  <span twStatIcon class="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
    <tw-icon name="user" size="md" aria-hidden="true" />
  </span>
  <span twStatLabel>Active users</span>
  <span twStatValue>12,894</span>
  <tw-stat-delta direction="up" variant="inline" comparisonLabel="WoW">+5.2%</tw-stat-delta>
</tw-stat>`;

  protected readonly loadingSnippet = `<div class="grid grid-cols-4 gap-4">
  @for (tile of tiles(); track tile.id) {
    <tw-stat [loading]="isLoading()">
      <span twStatLabel>{{ tile.label }}</span>
      <span twStatValue>{{ tile.value }}</span>
      <tw-stat-delta [direction]="tile.direction" comparisonLabel="vs last week">
        {{ tile.delta }}
      </tw-stat-delta>
    </tw-stat>
  }
</div>`;

  protected readonly footerSnippet = `<tw-stat variant="elevated" size="lg">
  <span twStatLabel>Revenue</span>
  <span twStatValue>$128,400</span>
  <tw-stat-delta direction="up" variant="inline">+18.6%</tw-stat-delta>
  <div twStatFooter>
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" class="w-full h-7 text-success-500" aria-hidden="true">
      <path d="M0,22 L12,18 L24,20 L36,14 L48,16 L60,10 L72,12 L84,6 L100,4"
            fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </div>
</tw-stat>

<tw-stat variant="elevated" size="lg">
  <span twStatLabel>Active subscribers</span>
  <span twStatValue>8,940</span>
  <tw-stat-delta direction="neutral" variant="inline">±0</tw-stat-delta>
  <div twStatFooter class="flex items-center gap-2">
    <span twBadge color="success" size="sm">Live</span>
    <span class="text-xs text-fg-muted">Updated 2 min ago</span>
  </div>
</tw-stat>`;
}
