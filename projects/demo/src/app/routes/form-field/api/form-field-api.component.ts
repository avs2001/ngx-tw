import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

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
              <td class="px-4 py-2 font-mono text-xs">floatLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">FloatLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'auto'</td>
              <td class="px-4 py-2 text-fg-muted">Floating label behavior; <code class="font-mono">'auto'</code> floats when focused or non-empty, <code class="font-mono">'always'</code> stays floated.</td>
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
              <td class="px-4 py-2 text-fg-muted">Validation message; replaces hints when the control's <code class="font-mono">errorState</code> is true.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="prefix"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Leading adornment rendered inside the control wrapper.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="suffix"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Trailing adornment rendered inside the control wrapper.</td>
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
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marks an element as a validation message. The host element is assigned
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="alert"</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="polite"</code>,
        and a generated id that is merged into the control's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>
        whenever the control is in its error state.
      </p>
    </section>

    <!-- PrefixDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PrefixDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [slot="prefix"]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Styles a projected leading adornment. The form-field measures the prefix element and
        shifts the resting label horizontally so it sits flush against the adornment.
      </p>
    </section>

    <!-- SuffixDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SuffixDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [slot="suffix"]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Styles a projected trailing adornment rendered at the end of the control wrapper.
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
              <td class="px-4 py-2 font-mono text-xs">controlType?</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 text-fg-muted">Optional control-type identifier; appends <code class="font-mono">tw-form-field-type-&#123;value&#125;</code> to the form-field host for styling hooks.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">userAriaDescribedBy?</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;string | undefined&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Consumer-supplied <code class="font-mono">aria-describedby</code> ids the form-field preserves when merging in hint and error ids.</td>
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
type FloatLabel = 'auto' | 'always';

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

  abstract setDescribedByIds(ids: string[]): void;
  abstract onContainerClick(event: MouseEvent): void;
}`;
}
