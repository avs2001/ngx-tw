import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputDirective } from '@cdevhub/ngx-tw/input';
import {
  NumberInputDirective,
  NumberStepperComponent,
} from '@cdevhub/ngx-tw/number-input';
import {
  FormFieldComponent,
  HintDirective,
  LabelDirective,
} from '@cdevhub/ngx-tw/form-field';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-number-input-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InputDirective,
    NumberInputDirective,
    NumberStepperComponent,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    CodeBlockComponent,
    FormsModule,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">NumberInputDirective</code>
        attaches to an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input twInput twNumberInput&gt;</code>
        and turns it into a numeric field <em>without</em>
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">type="number"</code>.
        The native number input is broken on mobile (no decimal/grouping control) and inconsistent
        across browsers; this directive keeps the element as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">type="text"</code>,
        adds the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">spinbutton</code>
        ARIA pattern, a correct
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inputmode</code>,
        arrow-key stepping, and locale-aware formatted display.
      </p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-3">
        It composes the sibling
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twInput</code>
        directive — that directive keeps owning the form-field chrome and error state, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twNumberInput</code>
        implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        so the value round-trips as a real
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">number | null</code>
        (never a string) through template-driven, reactive, and signal forms. Pair it with the
        companion
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-number-stepper&gt;</code>
        for visible up/down spinner buttons.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The input carries the WAI-ARIA
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">spinbutton</code>
        pattern: it exposes the current value and bounds to assistive tech and responds to the
        standard stepping keys. The companion stepper buttons stay out of the tab order — the
        input owns the value semantics.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Keyboard</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">↑ / ↓</td>
              <td class="px-4 py-2 text-fg-muted">Step the value up / down by <code class="font-mono">step</code>, clamping to <code class="font-mono">[min, max]</code>. An empty field is treated as <code class="font-mono">0</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Jump to <code class="font-mono">min</code> / <code class="font-mono">max</code> when those bounds are defined.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter</td>
              <td class="px-4 py-2 text-fg-muted">Commit and reformat the current value in place without losing focus or submitting twice.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">PageUp / PageDown</td>
              <td class="px-4 py-2 text-fg-muted">Left to native handling — not intercepted in v1.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">ARIA &amp; semantics</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Attribute</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">role="spinbutton"</td>
              <td class="px-4 py-2 text-fg-muted">Applied to the input — the value-bearing widget.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-valuemin / max</td>
              <td class="px-4 py-2 text-fg-muted">Reflect <code class="font-mono">min</code> / <code class="font-mono">max</code> when set; dropped when unbounded.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-valuenow</td>
              <td class="px-4 py-2 text-fg-muted">The numeric value; dropped while the field is empty (an indeterminate spinbutton per ARIA 1.2).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-valuetext</td>
              <td class="px-4 py-2 text-fg-muted">The formatted display (e.g. <code class="font-mono">$5.00</code>), always supplied so the reading matches the box.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">inputmode</td>
              <td class="px-4 py-2 text-fg-muted"><code class="font-mono">numeric</code> for integer formats, <code class="font-mono">decimal</code> otherwise — the correct mobile keypad.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Stepper buttons</td>
              <td class="px-4 py-2 text-fg-muted"><code class="font-mono">tabindex="-1"</code>, labeled <code class="font-mono">Increase</code> / <code class="font-mono">Decrease</code>, and refocus the input after stepping.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field class="max-w-xs">
          <label twLabel>Quantity</label>
          <input twInput twNumberInput #qty="twNumberInput" [(ngModel)]="quantity" name="qty" [min]="1" [max]="99" />
          <tw-number-stepper twSuffix [for]="qty" />
          <span twHint>Between 1 and 99.</span>
        </tw-form-field>
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
        <li>Replaces broken-on-mobile <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">type="number"</code> — the element stays <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">type="text"</code> with full control over keyboard and display</li>
        <li>Round-trips a real <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">number | null</code> via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code> — never a string, never <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">NaN</code></li>
        <li>Works with template-driven, reactive, and Angular v21 signal forms with no extra glue</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">min</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">max</code> clamp on commit (not mid-typing) and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">step</code> drives arrow keys and the spinner</li>
        <li>Locale-aware parsing and formatting via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Intl.NumberFormat</code> — grouping, decimals, currency</li>
        <li>WAI-ARIA <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">spinbutton</code> semantics with correct <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inputmode</code> for mobile keypads</li>
        <li>Companion <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-number-stepper&gt;</code> renders up/down spinner buttons that disable in lock-step with the field</li>
        <li>Composes the sibling <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twInput</code> directive — full <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code> chrome, hints, and error state for free</li>
        <li>Keeps the caret stable while typing intermediate states (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">-</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1.</code>); reformats on blur / Enter / step</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/input" class="text-primary-600 hover:underline">Input</a>
          — the base <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twInput</code> directive this one composes for text values.
        </li>
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — the wrapper that adds labels, hints, error regions, and the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSuffix]</code> slot the stepper mounts into.
        </li>
        <li>
          <a routerLink="/components/slider" class="text-primary-600 hover:underline">Slider</a>
          — for choosing a number from a continuous range by dragging instead of typing.
        </li>
        <li>
          <a routerLink="/components/time-picker" class="text-primary-600 hover:underline">Time Picker</a>
          — the same spinbutton + stepper pattern, specialized for hours / minutes / seconds.
        </li>
      </ul>
    </section>
  `,
})
export class NumberInputOverview {
  protected quantity = 1;

  protected readonly basicUsageSnippet = `<tw-form-field>
  <label twLabel>Quantity</label>
  <input twInput twNumberInput #qty="twNumberInput" [(ngModel)]="quantity" [min]="1" [max]="99" />
  <tw-number-stepper twSuffix [for]="qty" />
  <span twHint>Between 1 and 99.</span>
</tw-form-field>

<!-- Standalone — no form-field, no stepper -->
<input twInput twNumberInput [(ngModel)]="count" />`;

  protected readonly importSnippet = `import {
  NumberInputDirective,
  NumberStepperComponent,
} from '@cdevhub/ngx-tw/number-input';`;
}
