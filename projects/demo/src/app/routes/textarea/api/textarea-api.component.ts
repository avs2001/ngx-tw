import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-textarea-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TextareaDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: textarea[twTextarea] — exportAs: twTextarea — extends InputDirective</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-6">
        Inherits the entire <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">InputDirective</code> contract — form-field integration,
        error-state machinery, autofill / focus monitor, ARIA wiring, the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code> axis,
        and the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">readonly</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorStateMatcher</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">id</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code> inputs. See the Input API page for the inherited surface. The
        textarea-specific additions are documented below.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs (textarea-specific)</h3>
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
              <td class="px-4 py-2 font-mono text-xs">autosize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Grows the textarea with its content (composed from CDK's <code class="font-mono">CdkTextareaAutosize</code>). When <code class="font-mono">true</code> the user-resize handle is forced off — autosize owns the height.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minRows</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Minimum number of rows the textarea collapses to when <code class="font-mono">autosize</code> is on. Ignored otherwise.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxRows</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Maximum number of rows before scrolling, when <code class="font-mono">autosize</code> is on. <code class="font-mono">undefined</code> removes the cap.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">rows</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">3</td>
              <td class="px-4 py-2 text-fg-muted">Initial render height (native <code class="font-mono">rows</code> attribute). Browsers honor this even when <code class="font-mono">autosize</code> is on, so first paint uses this value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">resize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'none' | 'vertical' | 'both'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'vertical'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the user-resize handle. Forced to <code class="font-mono">'none'</code> when <code class="font-mono">autosize</code> is on. Horizontal-only is intentionally not supported — it breaks form-field layout.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxLength</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Mirrors to the native <code class="font-mono">maxlength</code> attribute and pairs with the <code class="font-mono">valueLength()</code> signal for character counters.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Signals (textarea-specific)</h3>
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
              <td class="px-4 py-2 font-mono text-xs">valueLength</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;number&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Current value length, updates on every <code class="font-mono">input</code> event. Wire <code class="font-mono">&lt;span twHint align="end"&gt;{{ '{{' }} ta.valueLength() {{ '}}' }} / {{ '{{' }} ta.maxLength() {{ '}}' }}&lt;/span&gt;</code> for a counter.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods (textarea-specific)</h3>
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
              <td class="px-4 py-2 font-mono text-xs">resizeToFitContent</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">resizeToFitContent(force?: boolean): void</td>
              <td class="px-4 py-2 text-fg-muted">Triggers a CDK autosize recalculation. Useful after programmatic value changes that bypass the native <code class="font-mono">(input)</code> event. No-op when <code class="font-mono">autosize</code> is <code class="font-mono">false</code>.</td>
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
export class TextareaApi {
  protected readonly typesSnippet = `// Exported from ngx-tw/textarea:
type TwTextareaResize = 'none' | 'vertical' | 'both';

class TextareaDirective extends InputDirective {
  readonly autosize: Signal<boolean>;
  readonly minRows: Signal<number>;
  readonly maxRows: Signal<number | undefined>;
  readonly rows: Signal<number>;
  readonly resize: Signal<TwTextareaResize>;
  readonly maxLength: Signal<number | undefined>;
  readonly valueLength: Signal<number>;
  resizeToFitContent(force?: boolean): void;
}`;
}
