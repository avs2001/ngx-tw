import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-number-input-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- NumberInputDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">NumberInputDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: input[twNumberInput] — exportAs: twNumberInput</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Smallest accepted value; clamps the committed value (on blur, Enter, and stepping) and sets <code class="font-mono">aria-valuemin</code>. Does not clamp per keystroke.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">max</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Largest accepted value; clamps the committed value and sets <code class="font-mono">aria-valuemax</code>. Does not clamp per keystroke.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">step</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Amount added or subtracted by ArrowUp/ArrowDown and the stepper buttons; values <code class="font-mono">&lt;= 0</code> or non-finite fall back to <code class="font-mono">1</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">format</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Intl.NumberFormatOptions | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Drives the blurred display (grouping, decimals, currency); its resolved <code class="font-mono">maximumFractionDigits</code> sets rounding precision and switches <code class="font-mono">inputmode</code> to <code class="font-mono">numeric</code> when it is <code class="font-mono">0</code>. Percent style is not supported in v1.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">locale</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">BCP-47 locale for formatting and locale-aware parsing (decimal and group separators); defaults to the runtime locale.</td>
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
              <td class="px-4 py-2 font-mono text-xs">valueChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">OutputEmitterRef&lt;number | null&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the committed numeric value changes through user interaction; does not fire on <code class="font-mono">writeValue</code> (programmatic form writes).</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Signature</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">increment</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Steps the value up (empty field treated as <code class="font-mono">0</code>), clamps, rounds, formats, and emits <code class="font-mono">valueChange</code>; no-op when disabled or readonly. Does not move focus.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">decrement</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Steps the value down with the same clamp / round / format / emit behavior; no-op when disabled or readonly. Does not move focus.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">focus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(options?: FocusOptions): void</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the underlying input element.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Public signals</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;number | null&gt;</td>
              <td class="px-4 py-2 text-fg-muted">The current committed numeric value, or <code class="font-mono">null</code> when empty / unparseable.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when disabled via reactive forms (<code class="font-mono">control.disable()</code>) or a static <code class="font-mono">disabled</code> attribute; read by the companion stepper.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">readonly</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when the host input carries the <code class="font-mono">readonly</code> attribute; read by the companion stepper.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- NumberStepperComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">NumberStepperComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-number-stepper — exportAs: twNumberStepper</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">for</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">NumberInputDirective | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">The number-input directive this stepper controls; bind to a template ref (<code class="font-mono">[for]="qty"</code> with <code class="font-mono">#qty="twNumberInput"</code>). When omitted, the buttons disable.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Button and glyph density; match the field's size for visual alignment.</td>
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
export class NumberInputApi {
  protected readonly typesSnippet = `// 'format' accepts the standard library type:
interface Intl.NumberFormatOptions { /* style, currency, minimumFractionDigits, … */ }

// The stepper's 'size' reuses the library-global axis (ngx-tw/core):
type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// The form value round-trips as:
type NumberInputValue = number | null;`;
}
