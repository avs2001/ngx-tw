import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormFieldComponent,
  HintDirective,
  LabelDirective,
} from 'ngx-tw/form-field';
import { InputDirective } from 'ngx-tw/input';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-form-field-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    InputDirective,
    CodeBlockComponent,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Form Field component is a presentational wrapper that pairs any form control with its
        label, required marker, prefix and suffix adornments, hints, and validation errors. It mirrors
        the state of any child control that implements the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormFieldControl</code>
        contract, so a single wrapper works across inputs, selects, textareas, and custom controls.
      </p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-3">
        Form Field itself does not implement
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        — that belongs on the wrapped control. Form Field observes the control's signals (focused,
        empty, disabled, required, errorState) and handles label positioning,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>
        wiring, and the hint↔error subscript swap.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twLabel</code>
        directive auto-wires its
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">for</code>
        attribute to the wrapped control's id so clicking the label focuses the control. Every
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twHint</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twError</code>
        element is assigned a unique id and merged into the control's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>,
        preserving any consumer-provided ids. When the control enters its error state, the hint
        subscript is replaced by the error subscript; errors render with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="alert"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="polite"</code>
        so assistive tech announces them as they appear.
      </p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The required asterisk is purely presentational — the control remains the source of truth
        for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required</code>,
        so hiding the marker via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hideRequiredMarker</code>
        never affects assistive tech.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field class="w-full max-w-sm">
          <label twLabel>Work email</label>
          <input twInput type="email" placeholder="you@company.com" />
          <span twHint>We'll send a confirmation link to this address.</span>
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
        <li>Two appearances:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code>
        </li>
        <li>Five density sizes
          (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>–
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>)
          that scale padding and floating-label font in lockstep
        </li>
        <li>Floating label with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">auto</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">always</code>,
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">never</code>
          modes, implemented with a CSS transform — no
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#64;angular/animations</code>
        </li>
        <li>Prefix and suffix slots via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twPrefix</code>
          /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twSuffix</code>
          for text, and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twPrefixIcon</code>
          /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twSuffixIcon</code>
          for canonically-sized SVG icons
        </li>
        <li>Hint and error subscript with automatic swap,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="alert"</code>,
          start/end alignment, and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">subscriptSizing</code>
          for dense layouts
        </li>
        <li>Automatic
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>
          wiring that preserves consumer-supplied ids
        </li>
        <li>Signal-based control contract — no RxJS subscriptions inside the form field</li>
        <li>Works with any control implementing
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormFieldControl</code>;
          consumer-authored custom controls plug in via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_FORM_FIELD_CONTROL</code>
        </li>
        <li>8 semantic colors for focused border and floated label tinting</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/input" class="text-primary-600 hover:underline">Input</a>
          — native
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input&gt;</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;textarea&gt;</code>
          adapted as a form-field-compatible control via the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twInput</code>
          directive.
        </li>
        <li>
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — combobox that auto-detects the wrapping form-field and switches to a naked style.
        </li>
        <li>
          <a routerLink="/components/checkbox" class="text-primary-600 hover:underline">Checkbox</a>
          and
          <a routerLink="/components/radio" class="text-primary-600 hover:underline">Radio</a>
          — small enumerations that usually live outside a form-field wrapper.
        </li>
      </ul>
    </section>
  `,
})
export class FormFieldOverview {
  protected readonly basicUsageSnippet = `<tw-form-field>
  <label twLabel>Work email</label>
  <input twInput type="email" placeholder="you@company.com" />
  <span twHint>We'll send a confirmation link to this address.</span>
</tw-form-field>`;

  protected readonly importSnippet = `import {
  FormFieldComponent,
  LabelDirective,
  HintDirective,
  ErrorDirective,
  PrefixDirective,
  SuffixDirective,
  PrefixIconDirective,
  SuffixIconDirective,
  FormFieldControl,
  TW_FORM_FIELD_CONTROL,
} from 'ngx-tw/form-field';
import { InputDirective } from 'ngx-tw/input';`;
}
