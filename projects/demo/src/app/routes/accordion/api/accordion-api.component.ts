import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-accordion-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent, RouterLink],
  template: `
    <!-- AccordionComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">AccordionComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-accordion</p>

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
              <td class="px-4 py-2 font-mono text-xs">type</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'single' | 'multiple'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'single'</td>
              <td class="px-4 py-2 text-fg-muted">Controls whether a single panel or multiple panels may be open at once.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'default' | 'bordered' | 'ghost'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'default'</td>
              <td class="px-4 py-2 text-fg-muted">Visual style of the accordion container.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">collapsible</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">In single mode, controls whether re-clicking the open panel closes it.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Value(s) of currently open panel(s); two-way bindable with a string in single mode and a string[] in multiple mode.</td>
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
              <td class="px-4 py-2 font-mono text-xs">tw-collapsible</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">yes</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1+</td>
              <td class="px-4 py-2 text-fg-muted">Each child panel is a <a routerLink="/collapsible" class="text-primary-600 hover:underline">Collapsible</a> with a unique <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>.</td>
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
export class AccordionApi {
  protected readonly typesSnippet = `type AccordionType = 'single' | 'multiple';

type AccordionVariant = 'default' | 'bordered' | 'ghost';`;
}
