import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

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
              <td class="px-4 py-2 text-fg-muted">Required — content to render; a TemplateRef receives context <code class="font-mono">{{ '{' }} $implicit, close {{ '}' }}</code>, a component class receives <code class="font-mono">POPOVER_DATA</code> / <code class="font-mono">POPOVER_REF</code> via injection.</td>
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
              <td class="px-4 py-2 text-fg-muted">Preferred placement relative to the trigger; CDK falls back to other positions when space is insufficient.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverTriggerOn</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'click' | 'focus' | 'manual'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'click'</td>
              <td class="px-4 py-2 text-fg-muted">User interaction that opens the popover; <code class="font-mono">'manual'</code> disables all trigger interactions.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverDisabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Suppresses every trigger interaction and force-closes an open popover.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the panel's padding using the shared size scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Adds a colored top border accent to the panel; omit for neutral information popovers.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverOffset</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">8</td>
              <td class="px-4 py-2 text-fg-muted">Pixel distance between the trigger and the panel edge.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverArrow</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Renders a directional arrow pointing at the trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverBackdrop</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'transparent' | 'dimmed' | 'none'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'transparent'</td>
              <td class="px-4 py-2 text-fg-muted">Backdrop rendered behind the panel; transparent catches outside clicks invisibly, dimmed adds a semi-transparent overlay, none disables the backdrop.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverCloseOnOutside</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Closes the popover on outside click when <code class="font-mono">backdrop="none"</code>; ignored for other backdrop modes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverCloseOnEscape</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Closes the popover when the user presses Escape inside the panel or on the trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverScrollStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition' | 'close' | 'block'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition'</td>
              <td class="px-4 py-2 text-fg-muted">CDK scroll strategy used by the underlying overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverTrapFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Traps keyboard focus inside the panel using CDK's FocusTrap.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverData</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Arbitrary data passed to template context as <code class="font-mono">$implicit</code> or to component content via <code class="font-mono">POPOVER_DATA</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverPanelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Extra CSS classes applied to the overlay panel for consumer customization.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twPopoverAriaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Explicit <code class="font-mono">aria-label</code> for the <code class="font-mono">role="dialog"</code> panel.</td>
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

    <!-- PopoverCloseDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">PopoverCloseDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twPopoverClose]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Convenience directive that dismisses the enclosing popover when the host element is
        clicked. Drop it on any button or link inside projected popover content — it injects
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">POPOVER_REF</code>
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
              <td class="px-4 py-2 font-mono text-xs">POPOVER_DATA</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown</td>
              <td class="px-4 py-2 text-fg-muted">Injected in component content; carries the <code class="font-mono">twPopoverData</code> value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">POPOVER_REF</td>
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

type PopoverScrollStrategy = 'reposition' | 'close' | 'block';
type PopoverBackdrop = 'transparent' | 'dimmed' | 'none';
type PopoverTrigger = 'click' | 'focus' | 'manual';

interface PopoverTemplateContext<T = unknown> {
  $implicit: T;
  close: () => void;
}

interface PopoverRef {
  close(): void;
}

// Shared library types (re-exported from 'ngx-tw/core'):
type TwColor = 'primary' | 'secondary' | 'accent' | 'neutral'
             | 'info' | 'success' | 'warning' | 'error';
type TwSize  = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
