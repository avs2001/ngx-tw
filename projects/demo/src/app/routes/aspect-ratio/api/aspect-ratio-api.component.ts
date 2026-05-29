import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-aspect-ratio-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- AspectRatioDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">AspectRatioDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twAspectRatio]</p>

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
              <td class="px-4 py-2 font-mono text-xs">twAspectRatio</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'1 / 1'</td>
              <td class="px-4 py-2 text-fg-muted">Sets the host's aspect ratio from a unitless number or a ratio string using <code class="font-mono">/</code> or <code class="font-mono">:</code>; the value is normalized to CSS <code class="font-mono">'w / h'</code> form and invalid or non-positive input falls back to the default square.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class AspectRatioApi {
  protected readonly typesSnippet = `// The twAspectRatio input accepts (no exported type to import):
//   • a unitless number    → [twAspectRatio]="1.7777"
//   • a '/' ratio string   → twAspectRatio="16/9"
//   • a ':' ratio string   → twAspectRatio="16:9"
// Every value normalizes to the CSS 'w / h' form; invalid input → '1 / 1'.`;
}
