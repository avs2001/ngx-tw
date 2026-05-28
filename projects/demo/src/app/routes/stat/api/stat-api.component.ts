import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-stat-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- ─────────────── StatComponent ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">StatComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-stat</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">StatVariant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'outlined'</td>
              <td class="px-4 py-2 text-fg-muted">Surface treatment. <code class="font-mono text-xs">'plain'</code> removes border and background; <code class="font-mono text-xs">'outlined'</code> (default) adds a border on the surface token; <code class="font-mono text-xs">'elevated'</code> adds shadow and uses the raised surface; <code class="font-mono text-xs">'filled'</code> uses the muted surface with no border.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Density scale — drives padding, internal gaps, value/label typography, and the skeleton placeholder dimensions. Defaults to <code class="font-mono text-xs">'md'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">loading</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, replaces label, value, and delta regions with <code class="font-mono text-xs">&lt;tw-skeleton&gt;</code> placeholders and toggles <code class="font-mono text-xs">aria-busy="true"</code> on the host. Projected footer content still renders. Defaults to <code class="font-mono text-xs">false</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Slots</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Required</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Cardinality</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twStatLabel]</td>
              <td class="px-4 py-2 text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Short caption rendered inside the <code class="font-mono text-xs">&lt;dt&gt;</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twStatValue]</td>
              <td class="px-4 py-2 text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Dominant numeric or text element rendered inside the first <code class="font-mono text-xs">&lt;dd&gt;</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twStatDescription]</td>
              <td class="px-4 py-2 text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Secondary text rendered as a second <code class="font-mono text-xs">&lt;dd&gt;</code> below the value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twStatIcon]</td>
              <td class="px-4 py-2 text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Leading icon — switches the layout to an icon-leading flex row.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twStatFooter]</td>
              <td class="px-4 py-2 text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Auxiliary region (sparkline, badge, metadata) rendered below the primary content; always renders, even during loading.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">tw-stat-delta</td>
              <td class="px-4 py-2 text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Trend indicator rendered next to the value; hidden and replaced with a skeleton during loading.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ─────────────── StatDeltaComponent ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">StatDeltaComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-stat-delta</p>

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
              <td class="px-4 py-2 font-mono text-xs">direction</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">StatDeltaDirection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'neutral'</td>
              <td class="px-4 py-2 text-fg-muted">Direction of change. <code class="font-mono text-xs">'up'</code> renders an up-chevron and (by default) the <code class="font-mono text-xs">success</code> color; <code class="font-mono text-xs">'down'</code> renders a down-chevron and the <code class="font-mono text-xs">error</code> color; <code class="font-mono text-xs">'neutral'</code> renders a horizontal-line glyph and the neutral color. Defaults to <code class="font-mono text-xs">'neutral'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">inverted</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, swaps success/error semantics so <code class="font-mono text-xs">down</code> reads as success and <code class="font-mono text-xs">up</code> reads as error — use for metrics where lower is better (bounce rate, error rate, latency, churn). <code class="font-mono text-xs">neutral</code> direction is unaffected. Defaults to <code class="font-mono text-xs">false</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">StatDeltaVariant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'badge'</td>
              <td class="px-4 py-2 text-fg-muted">Display style. <code class="font-mono text-xs">'badge'</code> (default) wraps the delta in a pill chip; <code class="font-mono text-xs">'inline'</code> is icon + text only with no chip; <code class="font-mono text-xs">'icon-only'</code> shows just the chevron for ultra-dense layouts.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">comparisonLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Optional comparison label rendered next to the delta value (e.g. <code class="font-mono text-xs">"vs last week"</code>, <code class="font-mono text-xs">"since launch"</code>). Defaults to <code class="font-mono text-xs">undefined</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Explicit accessible label. When omitted, the component composes one from <code class="font-mono text-xs">direction</code> + projected text + <code class="font-mono text-xs">comparisonLabel</code>. Override when projected content is purely symbolic or already localized. Defaults to <code class="font-mono text-xs">undefined</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ─────────────── Slot directives ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Slot directives</h2>
      <p class="text-xs text-fg-muted mb-4">Marker directives consumed by <code class="font-mono text-xs">contentChild</code> on <code class="font-mono text-xs">StatComponent</code>. Apply each as an attribute on the slot's projected element.</p>

      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Class</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">StatLabelDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twStatLabel]</td>
              <td class="px-4 py-2 text-fg-muted">Marks the projected element as the label slot.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">StatValueDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twStatValue]</td>
              <td class="px-4 py-2 text-fg-muted">Marks the projected element as the value slot.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">StatDescriptionDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twStatDescription]</td>
              <td class="px-4 py-2 text-fg-muted">Marks the projected element as the description slot.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">StatIconDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twStatIcon]</td>
              <td class="px-4 py-2 text-fg-muted">Marks the projected element as the leading icon slot.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">StatFooterDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twStatFooter]</td>
              <td class="px-4 py-2 text-fg-muted">Marks the projected element as the footer slot.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ─────────────── Types ─────────────── -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class StatApi {
  protected readonly typesSnippet = `export type StatVariant = 'plain' | 'outlined' | 'elevated' | 'filled';

export type StatDeltaDirection = 'up' | 'down' | 'neutral';

export type StatDeltaVariant = 'badge' | 'inline' | 'icon-only';

// Imported from '@cdevhub/ngx-tw/core' — included here for reference:
export type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
