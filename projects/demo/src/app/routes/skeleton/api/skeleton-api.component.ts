import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-skeleton-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SkeletonComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-skeleton</p>

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
              <td class="px-4 py-2 font-mono text-xs">shape</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SkeletonShape</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'text'</td>
              <td class="px-4 py-2 text-fg-muted">Geometric shape of the placeholder.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">animation</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SkeletonAnimation</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'pulse'</td>
              <td class="px-4 py-2 text-fg-muted">Animation style applied to the placeholder.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">width</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Explicit width; numbers render as pixels and strings pass through verbatim.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">height</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Explicit height; numbers render as pixels and strings pass through verbatim.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">lines</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Number of stacked text rows to render when <code class="font-mono text-xs">shape="text"</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">announce</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, exposes the skeleton as a polite live region with a visually hidden "Loading" label.</td>
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
export class SkeletonApi {
  protected readonly typesSnippet = `
type SkeletonShape = 'text' | 'rectangle' | 'circle';

type SkeletonAnimation = 'pulse' | 'wave' | 'none';`.trim();
}
