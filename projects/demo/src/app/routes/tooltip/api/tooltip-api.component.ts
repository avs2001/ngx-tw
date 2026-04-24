import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-tooltip-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- TooltipDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TooltipDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twTooltip] &middot; Export: twTooltip</p>

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
              <td class="px-4 py-2 font-mono text-xs">twTooltip</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | TemplateRef&lt;void&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">required</td>
              <td class="px-4 py-2 text-fg-muted">The tooltip content; strings render as text and are registered with <code class="font-mono">AriaDescriber</code>, while a <code class="font-mono">TemplateRef</code> renders via <code class="font-mono">ngTemplateOutlet</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twTooltipPosition</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TooltipPosition</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'top'</td>
              <td class="px-4 py-2 text-fg-muted">Preferred placement relative to the trigger; CDK flips to a fallback side if the preferred position doesn't fit the viewport.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twTooltipColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'neutral'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color palette for the tooltip panel and arrow.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twTooltipSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TooltipSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls panel padding, font size, and maximum width.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twTooltipShowDelay</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">200</td>
              <td class="px-4 py-2 text-fg-muted">Milliseconds to wait before showing after the trigger event.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twTooltipHideDelay</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Milliseconds to wait before hiding after the trigger ends.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twTooltipDisabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, suppresses all triggers and tears down any visible overlay immediately.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twTooltipArrow</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">When true, renders an arrow pointing to the trigger side.</td>
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
              <td class="px-4 py-2 font-mono text-xs">twTooltipShown</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the tooltip becomes visible after the show delay elapses.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twTooltipHidden</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the tooltip is fully detached from the overlay.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">show</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Schedules the tooltip to appear after <code class="font-mono">twTooltipShowDelay</code>; no-op when disabled or content is empty.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hide</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Schedules the tooltip to hide after <code class="font-mono">twTooltipHideDelay</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">toggle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Calls <code class="font-mono">hide()</code> if currently visible, otherwise <code class="font-mono">show()</code>.</td>
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
export class TooltipApi {
  protected readonly typesSnippet = `type TooltipPosition =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

type TooltipSize = 'sm' | 'md' | 'lg';`;
}
