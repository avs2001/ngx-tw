import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-spinner-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- SpinnerComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SpinnerComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-spinner</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SpinnerVariant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'circular'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the visual style of the spinner.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SpinnerColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'current'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color; <code class="font-mono">'current'</code> inherits the surrounding text color for composition inside buttons and form-field slots.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SpinnerSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Spinner dimensions; <code class="font-mono">'inherit'</code> sizes to <code class="font-mono">1em</code> for inline text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">track</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Renders a subtle ring behind the rotating stroke on the circular variant.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Loading'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible label announced by assistive technology via a visually-hidden span.</td>
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
export class SpinnerApi {
  protected readonly typesSnippet = `type SpinnerVariant = 'circular' | 'dots' | 'bars';

type SpinnerColor = TwColor | 'current';

type SpinnerSize = TwSize | 'inherit';`;
}
