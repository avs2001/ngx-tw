import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-form-field-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- FormFieldComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">FormFieldComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-form-field</p>

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
              <td class="px-4 py-2 font-mono text-xs">appearance</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">FormFieldAppearance</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'outline'</td>
              <td class="px-4 py-2 text-fg-muted">Visual appearance; <code class="font-mono">'outline'</code> draws a full border, <code class="font-mono">'filled'</code> uses a surface tint with a bottom border.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Density of the field container; maps to the inline-padding scale (<code class="font-mono">px-2 py-1</code> xs … <code class="font-mono">px-5 py-3</code> xl) and the floating-label font scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">floatLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">FloatLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'auto'</td>
              <td class="px-4 py-2 text-fg-muted">Floating label behavior; <code class="font-mono">'auto'</code> floats when focused or non-empty, <code class="font-mono">'always'</code> stays floated, <code class="font-mono">'never'</code> disables floating and keeps the placeholder visible.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">subscriptSizing</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SubscriptSizing</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'fixed'</td>
              <td class="px-4 py-2 text-fg-muted"><code class="font-mono">'fixed'</code> reserves a constant row for hints/errors; <code class="font-mono">'dynamic'</code> collapses it when no hint or error is projected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hideRequiredMarker</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Hides the visual required asterisk while leaving <code class="font-mono">aria-required</code> on the control unchanged.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color for the focused border and floated label.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hintAlign</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'start' | 'end'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'start'</td>
              <td class="px-4 py-2 text-fg-muted">Default alignment for a <code class="font-mono">twHint</code> that does not set its own <code class="font-mono">align</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Slots</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Required</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Cardinality</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">&lt;ng-content&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Yes</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Default slot — the wrapped form control (must implement <code class="font-mono">FormFieldControl</code>).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twLabel]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Floating label; its <code class="font-mono">for</code> attribute is wired to the control's id automatically.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twHint]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..2</td>
              <td class="px-4 py-2 text-fg-muted">Helper text under the control; at most one per alignment (start and end).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twError]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..n</td>
              <td class="px-4 py-2 text-fg-muted">Validation message; replaces hints when the control's <code class="font-mono">errorState</code> is true. Use <code class="font-mono">match</code> to bind to a specific validator key, or omit it for a generic fallback.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twPrefix]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Leading adornment rendered inside the control wrapper. Use for text (currency, units, keyboard hints).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twPrefixIcon]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Glyph-sized (<code class="font-mono">size-5</code>) leading adornment. Use for SVG icons to skip manual sizing.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twSuffix]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Trailing adornment rendered inside the control wrapper. Use for text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twSuffixIcon]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Glyph-sized (<code class="font-mono">size-5</code>) trailing adornment for SVG icons.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- LabelDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">LabelDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twLabel]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marks an element as the form-field's floating label. The host element receives a
        generated
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">id</code>
        and a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">for</code>
        attribute bound to the wrapped control's id, so clicking the label focuses the
        control.
      </p>
    </section>

    <!-- HintDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">HintDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twHint]</p>

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
              <td class="px-4 py-2 font-mono text-xs">align</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'start' | 'end' | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Alignment within the subscript row; falls back to the form-field's <code class="font-mono">hintAlign</code> when unset.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ErrorDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ErrorDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twError]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Marks an element as a validation message. The host element is assigned
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="alert"</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="polite"</code>,
        and a generated id. Only visible errors are merged into the control's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code> —
        a <code class="font-mono">match</code>ed error that doesn't apply to the current validation
        state is hidden via the <code class="font-mono">hidden</code> class and dropped from the
        described-by list.
      </p>

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
              <td class="px-4 py-2 font-mono text-xs">match</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Validation error key this message is bound to (e.g. <code class="font-mono">'required'</code>, <code class="font-mono">'email'</code>, <code class="font-mono">'minlength'</code>). When set, the error displays only while the control reports that key in its active validation errors. Omit for a generic fallback that shows whenever the field is in an error state.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- PrefixDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PrefixDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twPrefix]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Styles a projected leading adornment. The form-field measures the prefix element and
        shifts the resting label horizontally so it sits flush against the adornment.
      </p>
    </section>

    <!-- SuffixDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SuffixDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twSuffix]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Styles a projected trailing adornment rendered at the end of the control wrapper.
      </p>
    </section>

    <!-- PrefixIconDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PrefixIconDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twPrefixIcon]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Opt-in directive for SVG icon prefixes. Applies <code class="font-mono">size-5</code> alongside the
        standard prefix classes so consumers don't pick <code class="font-mono">size-4</code> vs
        <code class="font-mono">size-5</code> ad-hoc. Use this for icons; use
        <code class="font-mono">[twPrefix]</code> for text adornments.
      </p>
    </section>

    <!-- SuffixIconDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SuffixIconDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twSuffixIcon]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Opt-in directive for SVG icon suffixes. Mirrors <code class="font-mono">PrefixIconDirective</code> on
        the trailing side.
      </p>
    </section>

    <!-- FormFieldControl contract -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">FormFieldControl</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Abstract class · implemented by form-field-compatible controls</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Contract every form-field-compatible control must implement. A concrete control
        provides itself under
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_FORM_FIELD_CONTROL</code>
        so the surrounding
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormFieldComponent</code>
        can mirror its state and wire ARIA.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Members</h3>
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
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;string&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Unique id on the control host element, used by the label's <code class="font-mono">for</code> attribute and the <code class="font-mono">aria-describedby</code> wiring.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;T | null&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Current control value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">focused</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Whether the control currently has focus.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">empty</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Whether the control's value is considered empty; drives the floating-label state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Whether the control is disabled.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Whether the control is marked required.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Whether the control should render as invalid; the control decides this (typically invalid + touched).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errors?</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;Record&lt;string, unknown&gt; | null&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Active validation errors map keyed by validator name (e.g. <code class="font-mono">&#123; required: true &#125;</code>). Drives <code class="font-mono">[twError match="…"]</code> filtering. Optional — controls without a backing <code class="font-mono">NgControl</code> may omit it.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">controlType?</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 text-fg-muted">Optional control-type identifier; appends <code class="font-mono">tw-form-field-type-&#123;value&#125;</code> to the form-field host for styling hooks.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">userAriaDescribedBy?</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;string | undefined&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Consumer-supplied <code class="font-mono">aria-describedby</code> ids the form-field preserves when merging in hint and error ids.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">userAriaLabelledby?</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;string | undefined&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Consumer-supplied <code class="font-mono">aria-labelledby</code> ids the form-field preserves when merging in the projected label id.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2 mt-6">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">setDescribedByIds</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(ids: string[]) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Receives the merged <code class="font-mono">aria-describedby</code> ids and applies them to the control host.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">setLabelledByIds</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(ids: string[]) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Receives the merged <code class="font-mono">aria-labelledby</code> ids and applies them to the control host. Default is a no-op; non-native controls override to set the attribute on their trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">onContainerClick</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(event: MouseEvent) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Invoked when the form-field container is clicked; typically focuses the underlying control or opens a panel.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TW_FORM_FIELD_CONTROL token -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TW_FORM_FIELD_CONTROL</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Token: InjectionToken&lt;FormFieldControl&lt;unknown&gt;&gt;</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Injection token matching
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormFieldControl</code>.
        Controls register themselves via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">providers: [{{ '{' }} provide: TW_FORM_FIELD_CONTROL, useExisting: MyControl {{ '}' }}]</code>
        so the wrapping form-field can locate them through content-child injection.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class FormFieldApi {
  protected readonly typesSnippet = `type FormFieldAppearance = 'outline' | 'filled';
type FloatLabel = 'auto' | 'always' | 'never';
type SubscriptSizing = 'fixed' | 'dynamic';

abstract class FormFieldControl<T = unknown> {
  abstract readonly id: Signal<string>;
  abstract readonly value: Signal<T | null>;
  abstract readonly focused: Signal<boolean>;
  abstract readonly empty: Signal<boolean>;
  abstract readonly disabled: Signal<boolean>;
  abstract readonly required: Signal<boolean>;
  abstract readonly errorState: Signal<boolean>;
  abstract readonly controlType?: string;
  abstract readonly userAriaDescribedBy?: Signal<string | undefined>;
  readonly userAriaLabelledby?: Signal<string | undefined>;

  abstract setDescribedByIds(ids: string[]): void;
  abstract onContainerClick(event: MouseEvent): void;
  // Default no-op; override for non-native controls that need explicit label pushdown.
  setLabelledByIds(ids: string[]): void {}
}`;
}
