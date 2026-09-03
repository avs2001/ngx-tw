import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-popover-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- PopoverDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PopoverDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twPopover] — exportAs: twPopover</p>

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
              <td class="px-4 py-2 font-mono text-xs">twPopover</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TemplateRef&lt;PopoverTemplateContext&gt; | Type&lt;unknown&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">The content to render. An <code class="font-mono">ng-template</code> receives context with <code class="font-mono">$implicit</code> (data) and <code class="font-mono">close</code> (function). A component class receives data and a ref via injection tokens.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">
                twPopoverOpen
                <span class="ml-1 inline-block px-1.5 py-0.5 rounded text-2xs font-medium bg-info-50 text-info-700">two-way</span>
              </td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound open state; setting true opens the popover and the directive sets it back to false on close.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverPosition</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">PopoverPosition</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'bottom'</td>
              <td class="px-4 py-2 text-fg-muted">Preferred placement relative to the trigger. CDK handles fallback when space is insufficient. Defaults to <code class="font-mono">'bottom'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverTriggerOn</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'click' | 'focus' | 'manual'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'click'</td>
              <td class="px-4 py-2 text-fg-muted">What user interaction opens the popover. <code class="font-mono">'manual'</code> means consumers call <code class="font-mono">open()</code>/<code class="font-mono">close()</code> programmatically. Defaults to <code class="font-mono">'click'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverDisabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, all trigger interactions are suppressed. Defaults to <code class="font-mono">false</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls panel padding using the standard spacing scale. Defaults to <code class="font-mono">'md'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Optional semantic color. When set, adds a colored top border accent to the panel.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverOffset</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">8</td>
              <td class="px-4 py-2 text-fg-muted">Pixel distance between trigger and panel edge. Defaults to <code class="font-mono">8</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverArrow</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether to render a directional arrow pointing at the trigger. Defaults to <code class="font-mono">true</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverBackdrop</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'transparent' | 'dimmed' | 'none'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'transparent'</td>
              <td class="px-4 py-2 text-fg-muted">Backdrop behavior. <code class="font-mono">'transparent'</code> catches outside clicks invisibly. <code class="font-mono">'dimmed'</code> adds a semi-transparent overlay. <code class="font-mono">'none'</code> disables the backdrop. Defaults to <code class="font-mono">'transparent'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverCloseOnOutside</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether clicking outside the panel closes the popover. Only relevant when backdrop is <code class="font-mono">'none'</code>. Defaults to <code class="font-mono">true</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverCloseOnEscape</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether pressing Escape closes the popover. Defaults to <code class="font-mono">true</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverScrollStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition' | 'close' | 'block' | 'noop'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition'</td>
              <td class="px-4 py-2 text-fg-muted">CDK scroll strategy for the overlay. Defaults to <code class="font-mono">'reposition'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverTrapFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether to trap focus inside the popover panel using CDK FocusTrapFactory. Defaults to <code class="font-mono">true</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverData</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Arbitrary data passed to template context or component via <code class="font-mono">TW_POPOVER_DATA</code> token.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverPanelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Additional CSS classes applied to the overlay panel for consumer customization.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverAriaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Explicit <code class="font-mono">aria-label</code> for the dialog panel.</td>
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
              <td class="px-4 py-2 font-mono text-xs">twPopoverOpened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the panel becomes visible (post-animation).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverClosed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the panel is fully removed from the DOM.</td>
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
              <td class="px-4 py-2 font-mono text-xs">open</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">open(): void</td>
              <td class="px-4 py-2 text-fg-muted">Programmatically opens the popover; no-op when disabled or already open.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">close</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">close(): void</td>
              <td class="px-4 py-2 text-fg-muted">Programmatically closes the popover; no-op when already closed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">toggle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">toggle(): void</td>
              <td class="px-4 py-2 text-fg-muted">Opens the popover if closed, otherwise closes it.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">reposition</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">reposition(): void</td>
              <td class="px-4 py-2 text-fg-muted">Forces the overlay to recalculate position — call after the trigger moves without scrolling.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- PopoverTitleDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PopoverTitleDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twPopoverTitle], tw-popover-title</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marks the heading inside a popover; registers its id with the host overlay's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>
        queue so the dialog is announced by its title. Mirrors the dialog title pattern.
        When you set <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twPopoverAriaLabel</code>
        the explicit label wins and labelledby is suppressed.
      </p>
    </section>

    <!-- PopoverCloseDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PopoverCloseDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twPopoverClose]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Convenience directive that dismisses the enclosing popover when the host element is
        clicked. Drop it on any button or link inside projected popover content — it injects
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_POPOVER_REF</code>
        and calls
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close()</code>
        for you, so cancel and confirm buttons stay declarative.
      </p>
    </section>

    <!-- Injection tokens -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Injection Tokens</h2>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Token</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Shape</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TW_POPOVER_DATA</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown</td>
              <td class="px-4 py-2 text-fg-muted">Injected in component content; carries the <code class="font-mono">twPopoverData</code> value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TW_POPOVER_REF</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">PopoverRef</td>
              <td class="px-4 py-2 text-fg-muted">Injected in component content; provides a <code class="font-mono">close()</code> method for dismissing from inside.</td>
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
export class PopoverApi {
  protected readonly typesSnippet = `type PopoverPosition =
  | 'top'    | 'top-start'    | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left'   | 'left-start'   | 'left-end'
  | 'right'  | 'right-start'  | 'right-end';

type PopoverScrollStrategy = 'reposition' | 'close' | 'block' | 'noop';
type PopoverBackdrop = 'transparent' | 'dimmed' | 'none';
type PopoverTrigger = 'click' | 'focus' | 'manual';

interface PopoverTemplateContext<T = unknown> {
  $implicit: T;
  close: () => void;
}

interface PopoverRef {
  close(): void;
}

// Shared library types (re-exported from '@cdevhub/ngx-tw/core'):
type TwColor = 'primary' | 'secondary' | 'accent' | 'neutral'
             | 'info' | 'success' | 'warning' | 'error';
type TwSize  = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
