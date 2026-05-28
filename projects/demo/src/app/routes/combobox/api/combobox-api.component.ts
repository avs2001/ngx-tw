import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-combobox-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- ComboboxComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ComboboxComponent&lt;T&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-combobox</p>

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
              <td class="px-4 py-2 font-mono text-xs">options</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly unknown[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">Array of options to render in the popover; accepts plain records or <code class="font-mono">TwComboboxOption&lt;T&gt;</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optionLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(o: unknown) =&gt; string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">reads <code class="font-mono">.label</code></td>
              <td class="px-4 py-2 text-fg-muted">Accessor returning the visible label for an option.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optionValue</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(o: unknown) =&gt; T</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">reads <code class="font-mono">.value</code></td>
              <td class="px-4 py-2 text-fg-muted">Accessor returning the value emitted via <code class="font-mono">valueCommit</code> when this option is picked.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optionDisabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(o: unknown) =&gt; boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">reads <code class="font-mono">.disabled</code></td>
              <td class="px-4 py-2 text-fg-muted">Accessor returning whether an option is non-interactive.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optionGroup</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(o: unknown) =&gt; string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">reads <code class="font-mono">.group</code></td>
              <td class="px-4 py-2 text-fg-muted">Accessor returning a group label; options sharing a group render under a labelled <code class="font-mono">role="group"</code> region.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optionDescription</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(o: unknown) =&gt; string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">reads <code class="font-mono">.description</code></td>
              <td class="px-4 py-2 text-fg-muted">Accessor returning an optional secondary description rendered under the label in the default option row.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">filterFn</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwComboboxFilterFn | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">case-insensitive startsWith</td>
              <td class="px-4 py-2 text-fg-muted">Client-side filter applied whenever <code class="font-mono">inputValue</code> changes; pass <code class="font-mono">null</code> to disable filtering and drive results from <code class="font-mono">queryChange</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">strict</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When <code class="font-mono">true</code>, free-text commits are rejected and the input reverts to the last committed label on blur.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">placeholder</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Placeholder text shown when the input is empty.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables the input and prevents the popover from opening.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Sets <code class="font-mono">aria-required="true"</code> on the input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls trigger padding and font size per the inline padding scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color for the focus ring and active-option highlight.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showChevron</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether the trailing chevron affordance is rendered.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clearable</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether the inline clear (×) button appears while <code class="font-mono">inputValue</code> is non-empty.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">loading</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Shows an inline spinner and reveals the <code class="font-mono">*twComboboxLoading</code> template while the popover is open.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">queryDebounce</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">150</td>
              <td class="px-4 py-2 text-fg-muted">Debounce window (ms) before <code class="font-mono">queryChange</code> emits; local filtering is not debounced.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minQueryLength</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Minimum query length before the popover opens automatically.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">openOnFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether the popover opens automatically when the input receives focus.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelMaxHeight</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">256</td>
              <td class="px-4 py-2 text-fg-muted">Maximum height of the popover scroll region, in pixels.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelWidth</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'trigger' | 'auto' | number | string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'trigger'</td>
              <td class="px-4 py-2 text-fg-muted">Overlay width strategy; numbers are applied as pixels and strings as CSS lengths.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | readonly string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Extra class(es) appended to the overlay panel for consumer customization.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">scrollStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition' | 'close' | 'block'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition'</td>
              <td class="px-4 py-2 text-fg-muted">CDK overlay scroll strategy applied while the popover is open.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">offset</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">4</td>
              <td class="px-4 py-2 text-fg-muted">Pixel offset between the input and the popover.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">emptyMessage</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'No results'</td>
              <td class="px-4 py-2 text-fg-muted">Fallback empty-state message used when no <code class="font-mono">*twComboboxEmpty</code> template is projected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">compareWith</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(a: T, b: T) =&gt; boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Object.is</td>
              <td class="px-4 py-2 text-fg-muted">Equality comparator used to reconcile <code class="font-mono">value</code> with options during <code class="font-mono">writeValue</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the combobox input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external label element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external descriptor element.</td>
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
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">T | string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Committed value; an option's value, a typed string in free-text mode, or <code class="font-mono">null</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">inputValue</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Visible text in the input, bound separately from <code class="font-mono">value</code> so async consumers can drive the query.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">open</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Open state of the popover.</td>
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
              <td class="px-4 py-2 font-mono text-xs">queryChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;string&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the query text changes, debounced by <code class="font-mono">queryDebounce</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optionSelected</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwComboboxOptionSelectedEvent&lt;T&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the user picks an option from the list; not raised on free-text commit.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">valueCommit</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwComboboxValueCommitEvent&lt;T&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires whenever <code class="font-mono">value</code> changes with a <code class="font-mono">source</code> discriminator distinguishing option, free-text, reset, or programmatic origin.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">openedChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwComboboxOpenedEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the popover opens or closes.</td>
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
              <td class="px-4 py-2 font-mono text-xs">openPanel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Opens the popover; no-op when disabled or already open.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closePanel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Closes the popover; no-op when already closed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">focus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Programmatically focuses the input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Clears both <code class="font-mono">inputValue</code> and <code class="font-mono">value</code>, then closes the popover.</td>
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
              <td class="px-4 py-2 font-mono text-xs">*twComboboxOption</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Replaces the default option row; context is <code class="font-mono">TwComboboxOptionContext&lt;T&gt;</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twComboboxEmpty</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Replaces the empty-state message; the implicit context value is the current query string.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twComboboxLoading</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Renders above the list while <code class="font-mono">loading="true"</code> and the popover is open.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twComboboxPrefix]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Leading adornment projected before the input (icons, prefixes).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twComboboxSuffix]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Trailing adornment projected after the input, before the clear button and chevron.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ComboboxOptionTemplateDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ComboboxOptionTemplateDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twComboboxOption]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        as the per-option template. Context type is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwComboboxOptionContext&lt;T&gt;</code>.
      </p>
    </section>

    <!-- ComboboxEmptyTemplateDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ComboboxEmptyTemplateDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twComboboxEmpty]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        as the empty-state template; the implicit context value is the current query string.
      </p>
    </section>

    <!-- ComboboxLoadingTemplateDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ComboboxLoadingTemplateDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twComboboxLoading]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        as the loading-state template rendered while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loading="true"</code>.
      </p>
    </section>

    <!-- ComboboxPrefixDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ComboboxPrefixDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twComboboxPrefix]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Attribute directive marking a leading adornment projected inside the input row.
      </p>
    </section>

    <!-- ComboboxSuffixDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ComboboxSuffixDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twComboboxSuffix]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Attribute directive marking a trailing adornment projected inside the input row, before the
        clear button.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class ComboboxApi {
  protected readonly typesSnippet = `interface TwComboboxOption<T> {
  label: string;
  value: T;
  disabled?: boolean;
  group?: string;
  description?: string;
}

type TwComboboxValueSource = 'option' | 'free-text' | 'reset' | 'programmatic';

type TwComboboxFilterFn = (option: unknown, query: string) => boolean;

interface TwComboboxOptionSelectedEvent<T> {
  option: unknown;
  value: T;
  label: string;
}

interface TwComboboxValueCommitEvent<T> {
  value: T | string | null;
  source: TwComboboxValueSource;
}

interface TwComboboxOpenedEvent {
  open: boolean;
  trigger: HTMLElement;
}

interface TwComboboxOptionContext<T, O = TwComboboxOption<T>> {
  $implicit: O;
  option: O;
  label: string;
  value: T;
  selected: boolean;
  active: boolean;
  disabled: boolean;
  index: number;
}`;
}
