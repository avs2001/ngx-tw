import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-checkbox-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- CheckboxComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CheckboxComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-checkbox</p>

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
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Sets the semantic color for the checked and indeterminate box fill or border.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the overall scale of the box, check icon, and label typography.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid' | 'outline'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid'</td>
              <td class="px-4 py-2 text-fg-muted">Visual style when checked or indeterminate — solid fills the box while outline keeps a transparent fill with colored border and check.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Blocks click and keyboard activation and applies muted styling.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Sets <code class="font-mono">aria-required="true"</code> on the host so assistive tech announces the control as required.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Optional inline label rendered next to the box; use default content projection for rich content instead.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">description</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Optional secondary line rendered under the label; use <code class="font-mono">[slot="description"]</code> for rich content.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">labelPosition</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'before' | 'after'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'after'</td>
              <td class="px-4 py-2 text-fg-muted">Position of the label and description relative to the checkbox.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">name</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Applied to the hidden native <code class="font-mono">&lt;input type="checkbox"&gt;</code> so the value participates in native form submission alongside Angular form bindings.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Id on the host element. Auto-generated as <code class="font-mono">tw-checkbox-N</code> when not provided; used by <code class="font-mono">tw-form-field</code>'s <code class="font-mono">&lt;label for&gt;</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ErrorStateMatcher | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance override of when the checkbox should render in the error state. Falls back to the <code class="font-mono">TW_ERROR_STATE_MATCHER</code> token.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name when no visible label is provided.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that labels the checkbox.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that describes the checkbox.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Two-way bindings</h3>
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
              <td class="px-4 py-2 font-mono text-xs">checked</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound checked state that updates on user interaction via <code class="font-mono">[(checked)]</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">indeterminate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound indeterminate state that renders a dash and exposes <code class="font-mono">aria-checked="mixed"</code>; any user toggle clears it and sets <code class="font-mono">checked</code> to <code class="font-mono">true</code>.</td>
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
              <td class="px-4 py-2 font-mono text-xs">change</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after a user interaction changes the state; does not fire for programmatic updates via <code class="font-mono">writeValue</code>.</td>
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
              <td class="px-4 py-2 font-mono text-xs">toggle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">toggle(): void</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the checked state and clears indeterminate; no-op when disabled.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">setDescribedByIds</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(ids: string[]): void</td>
              <td class="px-4 py-2 text-fg-muted">Called by <code class="font-mono">tw-form-field</code> to merge hint / error ids into <code class="font-mono">aria-describedby</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">onContainerClick</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(event: MouseEvent): void</td>
              <td class="px-4 py-2 text-fg-muted">Called by <code class="font-mono">tw-form-field</code> when the wrapper is clicked; focuses the host without toggling.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">FormFieldControl signals</h3>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-3">
        The checkbox implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormFieldControl&lt;boolean&gt;</code>
        and registers itself with the surrounding
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        automatically. The signals below back the form-field's labelling and error wiring.
      </p>
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
              <td class="px-4 py-2 text-fg-muted">Resolved id of the host element; the form-field's <code class="font-mono">&lt;label for&gt;</code> points here.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean | null&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Current checked state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">focused</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Whether the checkbox currently has focus (driven by CDK <code class="font-mono">FocusMonitor</code>).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">empty</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Always <code class="font-mono">false</code> — a checkbox is never empty in the form-field sense; the floating label always sits in the floated position.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when the <code class="font-mono">required</code> input is set OR the bound <code class="font-mono">NgControl</code> carries <code class="font-mono">Validators.required</code> / <code class="font-mono">Validators.requiredTrue</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Drives <code class="font-mono">aria-invalid</code> and the error border swap. Computed from the active <code class="font-mono">ErrorStateMatcher</code> against the bound <code class="font-mono">NgControl</code> + form submit state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">controlType</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'checkbox'</td>
              <td class="px-4 py-2 text-fg-muted">Form-field appends <code class="font-mono">tw-form-field-type-checkbox</code> to its host for styling hooks.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Slots</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
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
              <td class="px-4 py-2 font-mono text-xs">default</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Rich label content rendered next to the checkbox in the label column.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="description"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Rich description content rendered below the label and wired to <code class="font-mono">aria-describedby</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="check-icon"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Custom glyph shown when checked; falls back to the default SVG checkmark.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="indeterminate-icon"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Custom glyph shown when indeterminate; falls back to the default SVG dash.</td>
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
export class CheckboxApi {
  protected readonly typesSnippet = `type CheckboxVariant = 'solid' | 'outline';
type CheckboxLabelPosition = 'before' | 'after';`;
}
