import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InputDirective } from 'ngx-tw/input';
import {
  FormFieldComponent,
  HintDirective,
  LabelDirective,
} from 'ngx-tw/form-field';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-input-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InputDirective,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    CodeBlockComponent,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">InputDirective</code>
        attaches to any native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input&gt;</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;textarea&gt;</code>
        via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twInput</code>
        attribute selector. It implements the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormFieldControl&lt;string&gt;</code>
        contract, so the same directive renders its own chrome standalone and strips it cleanly
        inside a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-form-field&gt;</code>
        wrapper — one import, two layouts.
      </p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-3">
        The directive deliberately does <em>not</em> implement
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>.
        Angular's built-in native accessors keep owning value I/O, so the same input works with
        template-driven
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ngModel</code>,
        reactive
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>,
        and Angular v21 signal-forms
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formField</code>
        bindings without any additional glue.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Native input semantics carry the accessibility contract — the directive stays out of the
        way and only adds a few attributes on top.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-invalid</code>
        reflects the resolved error state (so a form-field's error copy is announced together
        with the field);
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required</code>
        reflects either the explicit input or a bound
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Validators.required</code>.
        Focus and autofill are tracked via CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FocusMonitor</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">AutofillMonitor</code>.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Behavior</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Native semantics</td>
              <td class="px-4 py-2 text-fg-muted">The underlying <code class="font-mono">&lt;input&gt;</code> / <code class="font-mono">&lt;textarea&gt;</code> retains its native role; no ARIA roles are applied on top.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Labelling</td>
              <td class="px-4 py-2 text-fg-muted">Inside <code class="font-mono">tw-form-field</code> the label's <code class="font-mono">for</code> points at the input's id (auto-generated if not provided).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Described-by merging</td>
              <td class="px-4 py-2 font-mono text-fg-muted">Consumer <code class="font-mono">aria-describedby</code> is preserved; form-field prepends its hint / error ids.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-invalid</td>
              <td class="px-4 py-2 text-fg-muted">Set when the resolved error-state matcher flags the control; drives the form-field's error styling.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-required</td>
              <td class="px-4 py-2 text-fg-muted">Reflects the <code class="font-mono">required</code> input and the presence of <code class="font-mono">Validators.required</code> on a bound control.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Focus / autofill</td>
              <td class="px-4 py-2 text-fg-muted">CDK monitors drive the <code class="font-mono">focused</code> and <code class="font-mono">empty</code> signals that form-field reads to float labels.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Reduced motion</td>
              <td class="px-4 py-2 text-fg-muted">Hover and focus-ring transitions respect <code class="font-mono">prefers-reduced-motion</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Email</label>
          <input twInput type="email" />
          <span twHint>We'll never share your email.</span>
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
        <li>One directive for both <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input&gt;</code> and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;textarea&gt;</code></li>
        <li>Implements <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormFieldControl&lt;string&gt;</code> — plugs into <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code> automatically</li>
        <li>Standalone mode paints its own border / focus ring using semantic tokens</li>
        <li>Works with reactive, template-driven, and signal forms (Angular's native value accessors)</li>
        <li>Infers <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code> from <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Validators.required</code> and reflects <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code> from a bound <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">NgControl</code></li>
        <li>Exposes <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">focused</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">empty</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorState</code> signals the form-field reads for label floating and error styling</li>
        <li>Dev-mode throws on incompatible <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">type</code> values (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">checkbox</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">radio</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">submit</code>, etc.) so you reach for the dedicated component</li>
        <li>Per-instance or global <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ErrorStateMatcher</code> override via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorStateMatcher</code> input / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_ERROR_STATE_MATCHER</code> token</li>
        <li>Material-style value-accessor extension via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_INPUT_VALUE_ACCESSOR</code> for masked / transformed inputs</li>
        <li>CDK <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FocusMonitor</code> + <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">AutofillMonitor</code> integration for accurate label floating across browser autofill</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — the wrapper that pairs with Input to add labels, hints, error regions, and floating chrome.
        </li>
        <li>
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — the form-field-compatible control for picking a value from a list.
        </li>
        <li>
          <a routerLink="/components/date-picker" class="text-primary-600 hover:underline">Date Picker</a>
          — a custom <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_INPUT_VALUE_ACCESSOR</code> provider paired with an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">input twInput</code>.
        </li>
        <li>
          <a routerLink="/components/checkbox" class="text-primary-600 hover:underline">Checkbox</a>
          and
          <a routerLink="/components/radio" class="text-primary-600 hover:underline">Radio</a>
          — dedicated components for input types this directive explicitly refuses.
        </li>
      </ul>
    </section>
  `,
})
export class InputOverview {
  protected readonly basicUsageSnippet = `<tw-form-field>
  <label twLabel>Email</label>
  <input twInput type="email" />
  <span twHint>We'll never share your email.</span>
</tw-form-field>

<!-- Standalone — no form-field wrapper -->
<input twInput placeholder="Search…" />`;

  protected readonly importSnippet = `import {
  InputDirective,
  TW_INPUT_VALUE_ACCESSOR,
} from 'ngx-tw/input';`;
}
