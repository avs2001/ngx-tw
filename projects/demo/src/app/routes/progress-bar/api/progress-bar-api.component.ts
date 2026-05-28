import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-progress-bar-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- ProgressBarComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ProgressBarComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-progress-bar</p>

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
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | null | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Current progress value. When null or undefined, the bar renders indeterminate. Values outside <code class="font-mono">[options.min, options.max]</code> are clamped.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ProgressBarVariant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'linear'</td>
              <td class="px-4 py-2 text-fg-muted">Visual style of the bar. <code class="font-mono">'linear'</code> renders a single fill; <code class="font-mono">'segmented'</code> splits the rail into discrete steps. Defaults to <code class="font-mono">'linear'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color of the filled portion. Defaults to <code class="font-mono">'primary'</code>. Use status colors (<code class="font-mono">success</code>/<code class="font-mono">warning</code>/<code class="font-mono">error</code>) to reflect task outcome.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ProgressBarSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Bar thickness. <code class="font-mono">'sm'</code> = h-1, <code class="font-mono">'md'</code> = h-2, <code class="font-mono">'lg'</code> = h-3. Defaults to <code class="font-mono">'md'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Visible label rendered above the bar. When set, the bar is wired to the label via <code class="font-mono">aria-labelledby</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">options</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ProgressBarOptions | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Bundles non-visual configuration: value range (<code class="font-mono">min</code>/<code class="font-mono">max</code>/<code class="font-mono">segments</code>), value readout (<code class="font-mono">showValue</code>/<code class="font-mono">formatter</code>), and accessibility fallbacks (<code class="font-mono">ariaLabel</code>/<code class="font-mono">ariaLabelledby</code>). Every field is optional. See the table below for the field shape.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">ProgressBarOptions fields</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Field</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">min</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Lower bound of the value range.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">max</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">100</td>
              <td class="px-4 py-2 text-fg-muted">Upper bound of the value range.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">segments</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">5</td>
              <td class="px-4 py-2 text-fg-muted">Number of equal cells when <code class="font-mono">variant</code> is <code class="font-mono">'segmented'</code>; ignored for <code class="font-mono">'linear'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showValue</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, renders the formatted progress value next to the label.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">formatter</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ProgressBarValueFormatter</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">integer %</td>
              <td class="px-4 py-2 text-fg-muted">Custom formatter for the displayed and announced value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name when no visible <code class="font-mono">label</code> is provided.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that labels the progress bar.</td>
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
export class ProgressBarApi {
  protected readonly typesSnippet = `type ProgressBarVariant = 'linear' | 'segmented';

type ProgressBarSize = 'sm' | 'md' | 'lg';

type ProgressBarValueFormatter = (value: number, max: number, min: number) => string;

interface ProgressBarOptions {
  min?: number;
  max?: number;
  segments?: number;
  showValue?: boolean;
  formatter?: ProgressBarValueFormatter;
  ariaLabel?: string;
  ariaLabelledby?: string;
}`;
}
