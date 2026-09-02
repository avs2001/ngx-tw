import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-slider-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SliderComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-slider</p>

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
              <td class="px-4 py-2 font-mono text-xs">min</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Lower bound of the slider scale. Accepts <code class="font-mono">undefined</code> so <code class="font-mono">[formField]</code> type-checks under <code class="font-mono">strictTemplates</code>; <code class="font-mono">undefined</code> resolves back to the default.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">max</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">100</td>
              <td class="px-4 py-2 text-fg-muted">Upper bound of the slider scale. Accepts <code class="font-mono">undefined</code> for the same reason as <code class="font-mono">min</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">step</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Step increment used for snapping, keyboard nav, and auto-generated marks; pass null for continuous values.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color applied to the filled segment, thumb border, and focus ring.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Overall scale of the rail, thumb, marks, and typography.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SliderVariant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid'</td>
              <td class="px-4 py-2 text-fg-muted">Visual style of the rail fill.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, prevents interaction and applies muted styling.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Sets aria-required on each thumb for assistive technology. Also inferred from <code class="font-mono">Validators.required</code> on a bound control.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ErrorStateMatcher | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance override of the default <code class="font-mono">TW_ERROR_STATE_MATCHER</code>; when omitted the global matcher is used. Drives <code class="font-mono">aria-invalid</code> on each thumb.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">range</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, selects a [start, end] range and renders two thumbs.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">marks</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SliderMark[] | boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Tick marks — true auto-generates one per step, an array supplies custom marks.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showMarkLabels</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders labels beneath each mark.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showMinMax</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders min and max values at the ends of the scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showValue</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Shows a value bubble over the active thumb and the current value in the header.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Optional visible label wired to each thumb via aria-labelledby.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">description</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Optional description rendered under the label and wired via aria-describedby.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">valueFormatter</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SliderValueFormatter | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Custom formatter for the bubble text, min/max labels, and aria-valuetext.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">name</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Optional form name attribute, informational only.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabelStart</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Minimum'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the start thumb in range mode.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabelEnd</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Maximum'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the end thumb in range mode.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name used when no visible label is provided.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that labels the slider.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that describes the slider.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Two-Way Binding</h3>
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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SliderValue</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound value; a number for single mode or [start, end] for range mode.</td>
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
              <td class="px-4 py-2 font-mono text-xs">input</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;SliderValue&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires continuously while the user drags a thumb or holds an arrow key.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">change</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;SliderValue&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires on commit (pointer release, key press) and skips programmatic writeValue updates.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Form Integration</h3>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        and works with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ngModel</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formControl</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formControlName</code>,
        and Angular v21
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>.
      </p>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class SliderApi {
  protected readonly typesSnippet = `type SliderVariant = 'solid' | 'soft' | 'outline';

type SliderValue = number | readonly [number, number];

interface SliderMark {
  value: number;
  label?: string;
}

type SliderValueFormatter = (value: number) => string;

// From '@cdevhub/ngx-tw/core':
type TwColor =
  | 'primary' | 'secondary' | 'accent' | 'neutral'
  | 'info' | 'success' | 'warning' | 'error';

type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
