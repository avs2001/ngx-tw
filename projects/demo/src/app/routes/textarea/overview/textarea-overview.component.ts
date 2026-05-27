import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TextareaDirective } from 'ngx-tw/textarea';
import {
  FormFieldComponent,
  HintDirective,
  LabelDirective,
} from 'ngx-tw/form-field';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-textarea-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TextareaDirective,
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
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TextareaDirective</code>
        attaches to a native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;textarea&gt;</code>
        via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twTextarea</code>
        attribute selector. It extends
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">InputDirective</code>
        and adds the textarea-specific surface: composed CDK autosize, a user-resize axis,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rows</code>
        / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minRows</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxRows</code>
        configuration, and a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valueLength</code>
        signal for character counters.
      </p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-3">
        Like the input directive, this one deliberately does <em>not</em> implement
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>.
        Angular's native value accessor owns value I/O, so the same textarea works with
        template-driven
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ngModel</code>,
        reactive
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>,
        and Angular v21 signal-forms
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formField</code>
        bindings without additional glue. The
        <a routerLink="/components/input" class="text-primary-600 hover:underline">Input</a>
        page documents the rest of the inherited surface (form-field integration, error state,
        autofill tracking, size axis).
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Native textarea semantics carry the accessibility contract — Enter inserts a newline by
        default and Tab moves focus (the field never traps it).
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-invalid</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>,
        and the form-field label association are all inherited from the input directive. The
        canonical focus ring (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">focus-visible:outline-2 outline-offset-2 outline-primary-500</code>)
        is rendered on keyboard focus only.
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
              <td class="px-4 py-2 text-fg-muted">The underlying <code class="font-mono">&lt;textarea&gt;</code> retains its native role and multi-line semantics; <code class="font-mono">aria-multiline</code> is implicit.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Keyboard</td>
              <td class="px-4 py-2 text-fg-muted">Enter inserts a newline (never submits a parent form), Tab moves focus, Shift+Tab moves back. No keyboard handlers are added on top.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Resize handle</td>
              <td class="px-4 py-2 text-fg-muted">Vertical by default; consumers can pick <code class="font-mono">'none'</code> or <code class="font-mono">'both'</code>. With <code class="font-mono">autosize</code> on, resize is forced off (CDK owns the height).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Character count</td>
              <td class="px-4 py-2 text-fg-muted">Expose <code class="font-mono">valueLength()</code> and wire <code class="font-mono">&lt;span twHint align="end"&gt;{{ '{{' }} ta.valueLength() {{ '}}' }} / {{ '{{' }} ta.maxLength() {{ '}}' }}&lt;/span&gt;</code> via a template ref.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Reduced motion</td>
              <td class="px-4 py-2 text-fg-muted">Hover, focus, and autosize-grow transitions respect <code class="font-mono">prefers-reduced-motion</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Bio</label>
          <textarea twTextarea rows="3" placeholder="Tell us about yourself…"></textarea>
          <span twHint>A short blurb for your profile page.</span>
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
        <li>Extends <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">InputDirective</code> — inherits form-field integration, error-state, autofill / focus monitor, size axis, ARIA wiring</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">autosize</code> grows the textarea with its content, composed from CDK's <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkTextareaAutosize</code> — never reinvented</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minRows</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxRows</code> cap the autosize growth so the field doesn't run off the page</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">resize</code> axis (<code class="font-mono">'none' | 'vertical' | 'both'</code>) controls the user-resize handle</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxLength</code> + <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valueLength()</code> signal — one-line character counters via projected hint</li>
        <li>Works with reactive, template-driven, and signal forms (Angular's native value accessor handles I/O)</li>
        <li>Standalone mode paints its own border / focus ring; inside <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code> the wrapper owns chrome</li>
        <li>Form-field appends <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field-type-textarea</code> for styling hooks</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/input" class="text-primary-600 hover:underline">Input</a>
          — the single-line sibling. Documents the inherited surface (size axis, error-state matcher, value-accessor extension).
        </li>
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — pairs with Textarea to add labels, hints, error regions, and floating chrome.
        </li>
      </ul>
    </section>
  `,
})
export class TextareaOverview {
  protected readonly basicUsageSnippet = `<tw-form-field>
  <label twLabel>Bio</label>
  <textarea twTextarea rows="3" placeholder="Tell us about yourself…"></textarea>
  <span twHint>A short blurb for your profile page.</span>
</tw-form-field>

<!-- Standalone — no form-field wrapper -->
<textarea twTextarea rows="4" placeholder="Standalone textarea — default chrome."></textarea>`;

  protected readonly importSnippet = `import { TextareaDirective } from 'ngx-tw/textarea';`;
}
