import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SliderComponent, type SliderValue } from 'ngx-tw/slider';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-slider-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SliderComponent, CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Slider component lets the user choose a numeric value (or a contiguous range of
        two values) from a continuous or stepped scale. It implements the WAI-ARIA
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">slider</code>
        pattern with full pointer and keyboard support, and integrates with every form strategy
        via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Each thumb is a focusable button with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="slider"</code>
        and the full set of
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuemin</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuemax</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuenow</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuetext</code>
        attributes. Always provide an accessible name via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>,
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>;
        in range mode,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaLabelStart</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaLabelEnd</code>
        supply per-thumb fallbacks. Orientation and direction respect the ambient CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Directionality</code>,
        so Arrow Right/Left invert in RTL.
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
              <td class="px-4 py-2 font-mono text-xs">ArrowRight / ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Increments the focused thumb by one step. RTL inverts Left/Right.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft / ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Decrements the focused thumb by one step. RTL inverts Left/Right.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">PageUp</td>
              <td class="px-4 py-2 text-fg-muted">Increments by 10% of the scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">PageDown</td>
              <td class="px-4 py-2 text-fg-muted">Decrements by 10% of the scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the minimum value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">End</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the maximum value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab / Shift+Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus between thumbs and surrounding focusable elements.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-slider label="Volume" [showValue]="true" [(value)]="basicValue" />
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ basicValue() }}</p>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Single-value and range modes via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[range]</code>
        </li>
        <li>3 variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        </li>
        <li>5 sizes and 8 semantic colors</li>
        <li>Configurable scale —
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">min</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">max</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">step</code>
          (or
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">null</code>
          for continuous)
        </li>
        <li>Tick marks — auto from step or a custom
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">SliderMark[]</code>
          with optional labels
        </li>
        <li>Value bubble on the active thumb plus optional min/max end labels</li>
        <li>Custom
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valueFormatter</code>
          feeds bubble, min/max labels, and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuetext</code>
        </li>
        <li>Two-way binding via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(value)]</code>
        </li>
        <li>Works with template-driven forms, reactive forms, and Angular v21 signal forms</li>
        <li>Pointer dragging with pointer capture; track click jumps the nearest thumb</li>
        <li>Full ARIA APG keyboard model with RTL-aware arrow keys</li>
        <li>Respects
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>
        </li>
      </ul>
    </section>
  `,
})
export class SliderOverview {
  protected readonly basicValue = signal<SliderValue>(40);

  protected readonly basicUsageSnippet = `<tw-slider label="Volume" [showValue]="true" [(value)]="volume" />`;

  protected readonly importSnippet = `import { SliderComponent } from 'ngx-tw/slider';`;
}
