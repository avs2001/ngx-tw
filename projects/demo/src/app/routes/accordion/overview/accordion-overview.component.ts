import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AccordionComponent } from '@cdevhub/ngx-tw/accordion';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import {
  CollapsibleComponent,
  CollapsibleTriggerDirective,
} from '@cdevhub/ngx-tw/collapsible';

@Component({
  selector: 'app-accordion-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccordionComponent, CodeBlockComponent, CollapsibleComponent, CollapsibleTriggerDirective],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Accordion groups multiple <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-collapsible</code>
        panels with a coordinated open state, supporting single or multiple simultaneously-open panels and optional
        forced-open behavior. It reuses the collapsible primitive for panel styling, ARIA, and animations while
        adding keyboard roving focus across triggers.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The accordion host carries <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="group"</code>.
        Each trigger exposes <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>; panels use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="region"</code>. State changes are
        announced via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>, and
        disabled panels are skipped by keyboard navigation.
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
              <td class="px-4 py-2 font-mono text-xs">Space / Enter</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the focused panel.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the next enabled trigger, wrapping to the first.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the previous enabled trigger, wrapping to the last.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the first enabled trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">End</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the last enabled trigger.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-accordion variant="bordered">
          <tw-collapsible value="a">
            <button twCollapsibleTrigger>What is ngx-tw?</button>
            <p>An Angular component library built with Tailwind CSS v4, designed for flexibility and accessibility.</p>
          </tw-collapsible>
          <tw-collapsible value="b">
            <button twCollapsibleTrigger>How do I install it?</button>
            <p>Install via npm: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">npm install ngx-tw</code></p>
          </tw-collapsible>
          <tw-collapsible value="c">
            <button twCollapsibleTrigger>Does it work with dark mode?</button>
            <p>Yes. Components use semantic tokens that adapt automatically to the current theme.</p>
          </tw-collapsible>
        </tw-accordion>
      </div>
      <tw-code-block [code]="usageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Two modes: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">single</code> or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">multiple</code></li>
        <li>Three container variants: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">default</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bordered</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code></li>
        <li>Optional forced-open behavior via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[collapsible]="false"</code> in single mode</li>
        <li>Composes <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-collapsible</code> through DI — no duplicated ARIA, animation, or trigger logic</li>
        <li>Two-way bindable <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(value)]</code>: string in single mode, string[] in multiple mode</li>
        <li>Arrow / Home / End navigation between triggers, skipping disabled panels</li>
        <li>Accessible: group role, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code> on triggers, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">region</code> on panels, LiveAnnouncer feedback</li>
      </ul>
    </section>
  `,
})
export class AccordionOverview {
  protected readonly usageSnippet = `<tw-accordion variant="bordered">
  <tw-collapsible value="a">
    <button twCollapsibleTrigger>What is ngx-tw?</button>
    <p>An Angular component library...</p>
  </tw-collapsible>
</tw-accordion>`;

  protected readonly importSnippet = `import { AccordionComponent } from '@cdevhub/ngx-tw/accordion';
import { CollapsibleComponent, CollapsibleTriggerDirective } from '@cdevhub/ngx-tw/collapsible';`;
}
