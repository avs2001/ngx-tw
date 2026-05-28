import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-radio-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- RadioGroupComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">RadioGroupComponent&lt;T&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-radio-group</p>
      <p class="text-sm text-fg-muted mb-4">
        The <code class="font-mono">T</code> type parameter is the type of each
        radio's <code class="font-mono">value</code> input — typically a
        string-literal union such as <code class="font-mono">'a' | 'b' | 'c'</code>,
        but anything that compares with <code class="font-mono">===</code>
        works. <code class="font-mono">T</code> is inferred when consumers
        bind via <code class="font-mono">[(value)]</code>; with reactive
        forms, the bound <code class="font-mono">FormControl&lt;T | null&gt;</code>
        determines the type explicitly.
      </p>

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
              <td class="px-4 py-2 font-mono text-xs">
                value
                <span class="ml-1 inline-block px-1.5 py-0.5 rounded text-2xs font-medium bg-info-50 text-info-700">two-way</span>
              </td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">T | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound selected value — updates when the user picks a radio and fires <code class="font-mono">valueChange</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color applied to the selected radio and propagated to every child unless overridden.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Overall scale propagated to every child radio unless the child sets its own size.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid' | 'outline'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid'</td>
              <td class="px-4 py-2 text-fg-muted">Visual style of the selected indicator propagated to every child unless overridden.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">orientation</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'horizontal' | 'vertical'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'vertical'</td>
              <td class="px-4 py-2 text-fg-muted">Layout axis that drives both the flex direction and the <code class="font-mono">aria-orientation</code> attribute.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables every child radio and blocks keyboard interaction on the group.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Sets <code class="font-mono">aria-required="true"</code> on the group for assistive tech.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">name</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Form-association name propagated to each child radio's host <code class="font-mono">name</code> attribute.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the group when no visible label is provided.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that labels the group.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that describes the group.</td>
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
              <td class="px-4 py-2 font-mono text-xs">valueChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;T | null&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires whenever the two-way <code class="font-mono">value</code> model updates (both user-driven and programmatic changes).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">change</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;T | null&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires only after selection changes from a user interaction; does not fire on <code class="font-mono">writeValue</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Form Integration</h3>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-2">
        The group implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        and works with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ngModel</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formControl</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formControlName</code>,
        and Angular v21
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formField</code>.
        Disabling the control via forms cascades <code class="font-mono">aria-disabled</code> to every child radio.
      </p>
    </section>

    <!-- RadioComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">RadioComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-radio</p>

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
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">The value this radio contributes to the parent group's selection — required when nested, ignored when standalone.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">
                checked
                <span class="ml-1 inline-block px-1.5 py-0.5 rounded text-2xs font-medium bg-info-50 text-info-700">two-way</span>
              </td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound checked state — authoritative standalone; reflects group selection read-only when nested.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Overrides the parent group's color for this radio; inherits when undefined.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Overrides the parent group's size for this radio; inherits when undefined.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid' | 'outline' | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Overrides the parent group's variant for this radio; inherits when undefined.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables this radio regardless of the group's state; the group's disabled always wins as an OR.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Inline label rendered next to the radio — use default content projection for rich content instead.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">description</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Secondary description rendered under the label — use <code class="font-mono">[slot="description"]</code> for rich content.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">labelPosition</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'before' | 'after'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'after'</td>
              <td class="px-4 py-2 text-fg-muted">Position of the label and description relative to the radio control.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">name</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Name attribute for standalone use; ignored when the parent group provides a name.</td>
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
              <td class="px-4 py-2 text-fg-muted">ID of an external element that labels the radio.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that describes the radio.</td>
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
              <td class="px-4 py-2 font-mono text-xs">checkedChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires whenever the two-way <code class="font-mono">checked</code> model updates.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">change</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when this radio becomes selected via a user interaction; not fired for programmatic updates.</td>
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
              <td class="px-4 py-2 font-mono text-xs">(default)</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Rich label content rendered in the label wrap; use alongside or in place of the <code class="font-mono">label</code> input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="description"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Rich description rendered below the label; use alongside or in place of the <code class="font-mono">description</code> input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="dot"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Custom glyph shown inside the circle when selected; falls back to the default filled dot.</td>
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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">focus(): void</td>
              <td class="px-4 py-2 text-fg-muted">Focuses the host element — required for keyboard navigation from the parent group.</td>
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
export class RadioApi {
  protected readonly typesSnippet = `type RadioVariant = 'solid' | 'outline';
type RadioOrientation = 'horizontal' | 'vertical';
type RadioLabelPosition = 'before' | 'after';

// Shared library types (re-exported from 'ngx-tw/core'):
type TwColor = 'primary' | 'secondary' | 'accent' | 'neutral'
             | 'info' | 'success' | 'warning' | 'error';
type TwSize  = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
