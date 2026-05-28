import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-select-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- SelectComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SelectComponent&lt;T&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-select</p>

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
              <td class="px-4 py-2 text-fg-muted">Array of options to render in the panel. Accepts either <code class="font-mono">TwSelectOption&lt;T&gt;</code> objects or arbitrary records read via the accessor inputs. Defaults to an empty array.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optionLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(o: unknown) =&gt; string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">reads <code class="font-mono">.label</code></td>
              <td class="px-4 py-2 text-fg-muted">Accessor returning the visible label for an option. Override when passing arbitrary objects.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optionValue</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(o: unknown) =&gt; T</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">reads <code class="font-mono">.value</code></td>
              <td class="px-4 py-2 text-fg-muted">Accessor returning the value for an option. The result is what <code class="font-mono">value</code> / <code class="font-mono">valueChange</code> emit.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optionDisabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(o: unknown) =&gt; boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">reads <code class="font-mono">.disabled</code></td>
              <td class="px-4 py-2 text-fg-muted">Accessor returning the disabled state for an option. Defaults to reading <code class="font-mono">.disabled</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optionGroup</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(o: unknown) =&gt; string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">reads <code class="font-mono">.group</code></td>
              <td class="px-4 py-2 text-fg-muted">Accessor returning the group name for an option. Options sharing a group render under a labelled <code class="font-mono">role="group"</code> region.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">multiple</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, enables multi-selection. The <code class="font-mono">value</code> model becomes a <code class="font-mono">T[]</code> and the panel renders checkable options. Defaults to <code class="font-mono">false</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">searchable</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, renders a search input at the top of the panel that filters options using <code class="font-mono">filterPredicate</code>. Defaults to <code class="font-mono">false</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">filterPredicate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(o: unknown, s: string) =&gt; boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">label includes</td>
              <td class="px-4 py-2 text-fg-muted">Custom filter function for the search input. Defaults to a case-insensitive substring match on the option label.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">placeholder</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Placeholder text shown when no value is selected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, the trigger cannot be activated and the panel cannot open. Defaults to <code class="font-mono">false</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, exposes <code class="font-mono">aria-required="true"</code> on the trigger. Defaults to <code class="font-mono">false</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls trigger padding, font size, and panel option density. Defaults to <code class="font-mono">'md'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color for focused trigger border, active-option background, and checkmarks. Defaults to <code class="font-mono">'primary'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SelectVariant | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Visual style of the trigger. When inside a <code class="font-mono">tw-form-field</code> and left unset, auto-resolves to <code class="font-mono">'naked'</code>. Otherwise defaults to <code class="font-mono">'default'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelWidth</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'trigger' | 'auto' | number | string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'trigger'</td>
              <td class="px-4 py-2 text-fg-muted">Overlay panel width. <code class="font-mono">'trigger'</code> matches the trigger's measured width; <code class="font-mono">'auto'</code> lets content decide; a number is applied as pixels; a string is passed through as a CSS length. Defaults to <code class="font-mono">'trigger'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | readonly string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Extra class(es) applied to the overlay panel.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelMaxHeight</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">256</td>
              <td class="px-4 py-2 text-fg-muted">Maximum height of the listbox scroll region in pixels. Defaults to <code class="font-mono">256</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closeOnSelect</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Whether the panel closes after a selection is made. When unset, resolves to <code class="font-mono">true</code> for single-select and <code class="font-mono">false</code> for multi-select.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">scrollStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition' | 'close' | 'block'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition'</td>
              <td class="px-4 py-2 text-fg-muted">CDK scroll strategy for the overlay. Defaults to <code class="font-mono">'reposition'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">offset</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">4</td>
              <td class="px-4 py-2 text-fg-muted">Pixel distance between trigger and panel. Defaults to <code class="font-mono">4</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">emptyMessage</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'No results'</td>
              <td class="px-4 py-2 text-fg-muted">Fallback text rendered when the filter yields no results and no <code class="font-mono">*twSelectEmpty</code> template is projected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">compareWith</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(a: T, b: T) =&gt; boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Object.is</td>
              <td class="px-4 py-2 text-fg-muted">Equality comparator used to match object-valued options.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the combobox trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external labelling element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external description element.</td>
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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">T | readonly T[] | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound selected value(s). Single-select: <code class="font-mono">T | null</code>. Multi-select: <code class="font-mono">T[]</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">open</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound open state of the panel.</td>
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
              <td class="px-4 py-2 font-mono text-xs">openedChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwSelectOpenedEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the panel visibility changes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectionChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwSelectSelectionChangeEvent&lt;T&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires on every selection change with the previous value, the added and removed items, and the source (<code class="font-mono">'user'</code>, <code class="font-mono">'reset'</code>, or <code class="font-mono">'programmatic'</code>).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">searchChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwSelectSearchEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires on every search keystroke with the current query and the resulting visible-option count.</td>
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
              <td class="px-4 py-2 font-mono text-xs">*twSelectOption</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Replaces the default option rendering; context is <code class="font-mono">TwSelectOptionContext&lt;T&gt;</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twSelectTrigger</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Replaces the trigger content; context is <code class="font-mono">TwSelectTriggerContext&lt;T&gt;</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twSelectEmpty</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Replaces the empty-state message; <code class="font-mono">$implicit</code> is the current search string.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twSelectHeader</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Sticky content rendered at the top of the panel.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twSelectFooter</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Sticky content rendered at the bottom of the panel.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- SelectOptionTemplateDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SelectOptionTemplateDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twSelectOption], ng-template[twSelectOption]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        as the per-option template. Context type is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwSelectOptionContext&lt;T&gt;</code>.
      </p>
    </section>

    <!-- SelectTriggerTemplateDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SelectTriggerTemplateDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twSelectTrigger], ng-template[twSelectTrigger]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        as the trigger-content template. Context type is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwSelectTriggerContext&lt;T&gt;</code>.
      </p>
    </section>

    <!-- SelectEmptyTemplateDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SelectEmptyTemplateDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twSelectEmpty], ng-template[twSelectEmpty]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        as the empty-state template. Context is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">{{ '{' }} $implicit: string {{ '}' }}</code>
        where the implicit value is the current search string.
      </p>
    </section>

    <!-- SelectHeaderTemplateDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SelectHeaderTemplateDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twSelectHeader], ng-template[twSelectHeader]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        as the panel header template.
      </p>
    </section>

    <!-- SelectFooterTemplateDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SelectFooterTemplateDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twSelectFooter], ng-template[twSelectFooter]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        as the panel footer template.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class SelectApi {
  protected readonly typesSnippet = `interface TwSelectOption<T> {
  label: string;
  value: T;
  disabled?: boolean;
  group?: string;
}

type SelectVariant = 'default' | 'naked';
type TwSelectSelectionSource = 'user' | 'reset' | 'programmatic';

interface TwSelectSelectionChangeEvent<T> {
  value: T | readonly T[] | null;
  previousValue: T | readonly T[] | null;
  added: readonly T[];
  removed: readonly T[];
  source: TwSelectSelectionSource;
}

interface TwSelectOpenedEvent {
  open: boolean;
  trigger: HTMLElement;
}

interface TwSelectSearchEvent {
  search: string;
  visibleCount: number;
}

interface TwSelectOptionContext<T, O = TwSelectOption<T>> {
  $implicit: O;
  label: string;
  value: T;
  selected: boolean;
  active: boolean;
  disabled: boolean;
  index: number;
}

interface TwSelectTriggerContext<T, O = TwSelectOption<T>> {
  $implicit: T | readonly T[] | null;
  open: boolean;
  empty: boolean;
  selectedOptions: readonly O[];
}`;
}
