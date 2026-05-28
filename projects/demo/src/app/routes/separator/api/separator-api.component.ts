import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-separator-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- SeparatorComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SeparatorComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-separator</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'horizontal' | 'vertical'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'horizontal'</td>
              <td class="px-4 py-2 text-fg-muted">Layout direction of the separator.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid' | 'dashed' | 'dotted'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid'</td>
              <td class="px-4 py-2 text-fg-muted">Line stroke style.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">weight</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'thin' | 'medium' | 'thick'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'thin'</td>
              <td class="px-4 py-2 text-fg-muted">Line thickness, mapping to 1px, 2px, and 3px respectively.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'neutral'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color applied to the line.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">decorative</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, hides the separator from assistive technology via <code class="font-mono">role="none"</code> and <code class="font-mono">aria-hidden="true"</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Slots</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">default</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Projected content renders as a centered label between two line segments; rendered only in horizontal orientation.</td>
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
export class SeparatorApi {
  protected readonly typesSnippet = `type SeparatorVariant = 'solid' | 'dashed' | 'dotted';

type SeparatorWeight = 'thin' | 'medium' | 'thick';`;
}
