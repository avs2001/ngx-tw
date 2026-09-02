import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TooltipDirective } from '@cdevhub/ngx-tw/tooltip';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-tooltip-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TooltipDirective, ButtonDirective, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Tooltip directive attaches to any element and shows a floating label on hover, focus, or
        touch, implementing the WAI-ARIA "Tooltip" pattern via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="tooltip"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>.
        It composes Angular CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Overlay</code>
        for positioning with viewport-aware fallbacks, and its
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">AriaDescriber</code>
        for assistive-tech announcements. Use it to surface short supplemental hints — keyboard
        shortcuts, abbreviated labels, icon descriptions — not to carry interactive content.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        String content is announced to assistive tech through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">AriaDescriber</code>,
        and the rendered overlay carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="tooltip"</code>
        with an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>
        link back to the trigger while visible. Tooltips must supplement — never replace — an
        accessible name on the trigger itself; icon-only buttons still need
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>.
        Content is not interactive: do not place links or buttons inside a tooltip, and reserve
        <a routerLink="/popover" class="text-primary-600 hover:underline">Popover</a>
        or
        <a routerLink="/dialog" class="text-primary-600 hover:underline">Dialog</a>
        for that.
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
              <td class="px-4 py-2 font-mono text-xs">Focus (Tab)</td>
              <td class="px-4 py-2 text-fg-muted">Shows the tooltip after <code class="font-mono">twTooltipShowDelay</code> elapses.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Blur (Tab away)</td>
              <td class="px-4 py-2 text-fg-muted">Hides the tooltip after <code class="font-mono">twTooltipHideDelay</code> elapses.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Immediately dismisses the tooltip without moving focus.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Pointer enter / leave</td>
              <td class="px-4 py-2 text-fg-muted">Show and hide on mouse hover, honouring the configured delays.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Touch start / end</td>
              <td class="px-4 py-2 text-fg-muted">Long-press to show on touch devices; release dismisses.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Ancestor scroll</td>
              <td class="px-4 py-2 text-fg-muted">Any scroll in an ancestor container detaches the overlay to keep the pointer-trigger relationship honest.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <button twButton twTooltip="Save your changes" [twTooltipShowDelay]="0">Hover me</button>
          <button twButton variant="outline" twTooltip="Delete this item" twTooltipColor="error" [twTooltipShowDelay]="0">Delete</button>
          <button twButton variant="soft" twTooltip="View more information" twTooltipPosition="bottom" [twTooltipShowDelay]="0">Bottom tip</button>
        </div>
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
        <li>Twelve placement positions (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">top</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bottom</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">left</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">right</code>, each with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">-start</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">-end</code> variants)</li>
        <li>Viewport-aware fallback via CDK <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">flexibleConnectedTo</code> — the arrow follows the resolved side</li>
        <li>Eight semantic colors (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwColor</code>) and three sizes (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>)</li>
        <li>Optional arrow indicator, enabled by default</li>
        <li>Independent show and hide delays in milliseconds</li>
        <li>Rich content via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TemplateRef&lt;void&gt;</code></li>
        <li>Programmatic control through <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">show()</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hide()</code>, and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">toggle()</code> via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">exportAs: twTooltip</code></li>
        <li>ARIA-describedby integration with CDK <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">AriaDescriber</code></li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Escape</code> key dismissal from anywhere on the page, and automatic detach on ancestor scroll</li>
        <li>WCAG 2.1 SC 1.4.13 compliant — the panel is hoverable, so the pointer can move onto it to read or copy the text, and it stays up until the pointer leaves or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Escape</code> is pressed</li>
        <li>Touch support with long-press to show</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/popover" class="text-primary-600 hover:underline">Popover</a>
          — for interactive floating content (links, buttons, forms).
        </li>
        <li>
          <a routerLink="/dialog" class="text-primary-600 hover:underline">Dialog</a>
          — for modal content that demands a decision.
        </li>
        <li>
          <a routerLink="/menu" class="text-primary-600 hover:underline">Menu</a>
          — for a list of commands triggered from a button.
        </li>
      </ul>
    </section>
  `,
})
export class TooltipOverview {
  protected readonly basicUsageSnippet = `<button twButton twTooltip="Save your changes">Hover me</button>
<button twButton variant="outline" twTooltip="Delete this item" twTooltipColor="error">Delete</button>
<button twButton variant="soft" twTooltip="View more information" twTooltipPosition="bottom">Bottom tip</button>`;

  protected readonly importSnippet = `import { TooltipDirective } from '@cdevhub/ngx-tw/tooltip';`;
}
