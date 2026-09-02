import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-collapsible-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- CollapsibleComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CollapsibleComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-collapsible</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Unique identifier matched against the parent group's value; required when used inside a group.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">display</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">CollapsibleDisplay</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">&#123;&#125;</td>
              <td class="px-4 py-2 text-fg-muted">Bundles decorative axes — <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>. Pass a partial; unset keys fall back to <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'default'</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'neutral'</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'md'</code> respectively.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Blocks toggle interactions and dims the panel.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">keepAlive</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders content on first open and keeps it in the DOM across toggles to preserve child state.</td>
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
              <td class="px-4 py-2 font-mono text-xs">open</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Whether the panel is expanded.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Outputs</h3>
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
              <td class="px-4 py-2 font-mono text-xs">toggled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the panel is toggled with the new open state.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CollapsibleGroupComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CollapsibleGroupComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-collapsible-group</p>

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
              <td class="px-4 py-2 font-mono text-xs">accordion</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, only one panel can be open at a time.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Two-way bindings</h3>
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
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Currently open panel value(s); a single string in accordion mode and a string array in independent mode.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CollapsibleTriggerDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CollapsibleTriggerDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCollapsibleTrigger]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Apply to the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;button&gt;</code>
        that toggles the panel. The directive wires up the click and keyboard handlers
        (Enter / Space, plus ArrowUp/Down, Home/End when nested in a group), applies
        the trigger slot classes, and binds
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled</code>.
        When the panel is disabled, the trigger is removed from the tab sequence with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex="-1"</code>.
        It also renders the default chevron when no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twCollapsibleIcon]</code>
        is projected.
      </p>
    </section>

    <!-- CollapsibleIconDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CollapsibleIconDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCollapsibleIcon]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Apply to a custom icon element projected inside the trigger to replace the
        default chevron. The directive applies the standard size, color, and
        rotation classes, and toggles a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rotate-180</code>
        class while the panel is open.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class CollapsibleApi {
  protected readonly typesSnippet = `type CollapsibleVariant =
  | 'default' | 'outline' | 'ghost' | 'solid'
  | CollapsibleVariantLegacy;

/** @deprecated 'bordered' aliases 'outline' and 'filled' aliases 'solid'; removed in the next major. */
type CollapsibleVariantLegacy = 'bordered' | 'filled';

interface CollapsibleDisplay {
  /** Visual style of the panel container. Defaults to 'default'. */
  variant?: CollapsibleVariant;
  /** Semantic color; applies to the outline and solid variants. Defaults to 'neutral'. */
  color?: TwColor;
  /** Padding scale for the trigger and content sections. Defaults to 'md'. */
  size?: TwSize;
}`;
}
