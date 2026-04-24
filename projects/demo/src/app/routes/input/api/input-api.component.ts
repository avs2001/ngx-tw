import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-input-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- InputDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">InputDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: input[twInput], textarea[twInput] — exportAs: twInput</p>

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
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'tw-input-N'</td>
              <td class="px-4 py-2 text-fg-muted">Id on the underlying element; form-field's label <code class="font-mono">for</code> points at it. Auto-generated if omitted.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">type</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'text'</td>
              <td class="px-4 py-2 text-fg-muted">Native HTML input type; dev mode throws on unsupported values (<code class="font-mono">checkbox</code>, <code class="font-mono">radio</code>, <code class="font-mono">submit</code>, etc.) and the attribute is ignored on textarea.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables the control; also reflects <code class="font-mono">ngControl.disabled</code> when bound to a reactive form.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Marks the control required; also inferred from <code class="font-mono">Validators.required</code> on a bound <code class="font-mono">NgControl</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">readonly</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Applies the native <code class="font-mono">readonly</code> attribute — the field stays focusable but blocks edits.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ErrorStateMatcher | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance override for when the error state becomes active; falls back to <code class="font-mono">TW_ERROR_STATE_MATCHER</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Consumer-supplied ids preserved alongside form-field's hint / error ids.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">FormFieldControl signals</h3>
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
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;string&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Resolved id — user-provided or the generated uid.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;string | null&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Current value; <code class="font-mono">null</code> when the underlying element is empty.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">focused</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Driven by CDK FocusMonitor — form-field reads it to animate the floating label.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">empty</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when the value is empty and the field is not autofilled; always false for "never-empty" types (date, time, color, month, week).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Logical disabled state — the <code class="font-mono">disabled</code> input OR a bound <code class="font-mono">NgControl.disabled</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Logical required state — the <code class="font-mono">required</code> input OR the presence of <code class="font-mono">Validators.required</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Resolved via the active <code class="font-mono">ErrorStateMatcher</code>, driven by the bound <code class="font-mono">NgControl</code> and the parent form's submitted flag.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">controlType</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 text-fg-muted"><code class="font-mono">'input'</code> or <code class="font-mono">'textarea'</code>; form-field appends it as <code class="font-mono">tw-form-field-type-*</code> for styling hooks.</td>
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
              <td class="px-4 py-2 font-mono text-xs">focus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">focus(options?: FocusOptions): void</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the underlying native element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">setDescribedByIds</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">setDescribedByIds(ids: string[]): void</td>
              <td class="px-4 py-2 text-fg-muted">Called by tw-form-field to merge hint / error ids into <code class="font-mono">aria-describedby</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">onContainerClick</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">onContainerClick(event: MouseEvent): void</td>
              <td class="px-4 py-2 text-fg-muted">Called by tw-form-field when the wrapper is clicked; focuses the input if it isn't already focused.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Extension tokens -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Extension Tokens</h2>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Token</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Shape</th>
              <th class="px-4 py-2 font-medium text-fg-muted">When to provide</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TW_INPUT_VALUE_ACCESSOR</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{' }} value: T | WritableSignal&lt;T&gt; {{ '}' }}</td>
              <td class="px-4 py-2 text-fg-muted">A sibling directive on an <code class="font-mono">&lt;input twInput&gt;</code> that owns value storage — masked inputs, datepicker triggers, currency formatters. Exported from <code class="font-mono">ngx-tw/input</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TW_ERROR_STATE_MATCHER</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ErrorStateMatcher</td>
              <td class="px-4 py-2 text-fg-muted">Override globally (<code class="font-mono">providedIn: 'root'</code>) or scoped to a branch of the injector tree to change when controls enter the error state. Exported from <code class="font-mono">ngx-tw/core</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TW_FORM_FIELD_CONTROL</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">FormFieldControl&lt;T&gt;</td>
              <td class="px-4 py-2 text-fg-muted">A completely custom control (own DOM, own focus handling) provides itself here and extends <code class="font-mono">FormFieldControl</code>. Exported from <code class="font-mono">ngx-tw/form-field</code>.</td>
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
export class InputApi {
  protected readonly typesSnippet = `// Exported from ngx-tw/input:
const TW_INPUT_VALUE_ACCESSOR: InjectionToken<{
  value: unknown | WritableSignal<unknown>;
}>;

// Exported from ngx-tw/core (relevant to Input):
interface ErrorStateMatcher {
  isErrorState(
    control: AbstractControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean;
}

const TW_ERROR_STATE_MATCHER: InjectionToken<ErrorStateMatcher>;

// Exported from ngx-tw/form-field (relevant to Input):
abstract class FormFieldControl<T> {
  readonly id: Signal<string>;
  readonly value: Signal<T | null>;
  readonly focused: Signal<boolean>;
  readonly empty: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly errorState: Signal<boolean>;
  readonly controlType: string;
  focus(options?: FocusOptions): void;
  setDescribedByIds(ids: string[]): void;
  onContainerClick(event: MouseEvent): void;
}

const TW_FORM_FIELD_CONTROL: InjectionToken<FormFieldControl<unknown>>;`;
}
