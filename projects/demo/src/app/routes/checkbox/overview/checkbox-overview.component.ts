import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CheckboxComponent } from '@cdevhub/ngx-tw/checkbox';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-checkbox-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CheckboxComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Checkbox component is a three-state selection control — unchecked, checked,
        and indeterminate — implementing the ARIA checkbox pattern. Focus is managed
        through CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FocusMonitor</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        wires the control into template-driven, reactive, and Angular v21 signal forms
        with zero extra setup. Use a checkbox when the answer is independent from the
        other options in view; reach for a
        <a routerLink="/radio" class="text-primary-600 hover:underline">Radio</a>
        group when exactly one of a small set must be chosen, or a
        <a routerLink="/switch" class="text-primary-600 hover:underline">Switch</a>
        when the control takes effect immediately rather than being submitted.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The host carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="checkbox"</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-checked</code>
        flipping between
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">true</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">false</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">mixed</code>
        for the indeterminate state. Always provide an accessible name via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>
        input, default content projection, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>;
        the component logs a dev-mode warning when none of those sources resolve to text.
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
              <td class="px-4 py-2 font-mono text-xs">Space</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the checked state and clears indeterminate; prevents page scroll.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter</td>
              <td class="px-4 py-2 text-fg-muted">No action — matches native checkbox semantics so Enter keeps submitting the surrounding form.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab / Shift + Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus between checkboxes using the natural document tab order.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-checkbox label="I agree to the terms and conditions" [(checked)]="accepted" />
        <p class="text-xs text-fg-muted mt-4 font-mono">accepted = {{ accepted() }}</p>
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
        <li>Three states: unchecked, checked, and indeterminate with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-checked="mixed"</code>
        </li>
        <li>Two variants (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>),
          5 sizes, and 8 semantic colors
        </li>
        <li>Two-way bindings via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(checked)]</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(indeterminate)]</code>
        </li>
        <li>ControlValueAccessor — works with template-driven forms, reactive forms, and Angular v21 signal forms</li>
        <li>Label and description via inputs or content projection for rich content</li>
        <li>Label position before or after the box via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labelPosition</code>
        </li>
        <li>Custom check and indeterminate glyphs through
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="check-icon"]</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="indeterminate-icon"]</code>
        </li>
        <li>Check-in animation that respects
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>
        </li>
        <li>Keyboard: Space toggles, matching native checkbox semantics</li>
        <li>Implements
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormFieldControl&lt;boolean&gt;</code>
          — pairs with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-form-field&gt;</code>
          for hint, error, and labelled rows
        </li>
        <li>
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-invalid</code>
          driven by
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ErrorStateMatcher</code>
          — works with reactive
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Validators.requiredTrue</code>
        </li>
        <li>Hidden native
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input type="checkbox"&gt;</code>
          so the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">name</code>
          input participates in native form submission alongside Angular bindings
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/radio" class="text-primary-600 hover:underline">Radio</a>
          — when exactly one of a small, fully visible set must be chosen.
        </li>
        <li>
          <a routerLink="/switch" class="text-primary-600 hover:underline">Switch</a>
          — for binary on/off choices that take effect immediately.
        </li>
        <li>
          <a routerLink="/select" class="text-primary-600 hover:underline">Select</a>
          — when the enumeration is long enough that inline options would overwhelm the layout.
        </li>
        <li>
          <a routerLink="/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — pair a checkbox with hint and error regions inside a labelled form row.
        </li>
      </ul>
    </section>
  `,
})
export class CheckboxOverview {
  protected readonly accepted = signal(false);

  protected readonly basicUsageSnippet = `<tw-checkbox label="I agree to the terms and conditions" [(checked)]="accepted" />`;

  protected readonly importSnippet = `import { CheckboxComponent } from '@cdevhub/ngx-tw/checkbox';`;
}
