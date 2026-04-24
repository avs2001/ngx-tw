import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PopoverDirective, PopoverCloseDirective } from 'ngx-tw/popover';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-popover-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PopoverDirective, PopoverCloseDirective, ButtonDirective, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Popover directive attaches to any element and reveals a floating panel with rich
        interactive content — a user profile preview, a settings form, a confirmation prompt, a
        contextual menu. Unlike a tooltip, the panel can receive keyboard focus, contain form
        controls and buttons, and stay open while the user interacts with it. It uses CDK Overlay
        for flexible positioning, CDK FocusTrap for keyboard containment, and renders its content
        through either a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TemplateRef</code>
        or a component class via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">POPOVER_DATA</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">POPOVER_REF</code>
        injection tokens.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The trigger element automatically carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-haspopup="dialog"</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>
        — no ARIA wiring required on your side. The panel is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="dialog"</code>
        region, focus is trapped inside (via CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FocusTrap</code>),
        and focus returns to the trigger on close. Always provide an accessible name for the panel
        via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twPopoverAriaLabel]</code>
        or a heading inside the content.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key / behavior</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Opens the popover when the trigger is focused and <code class="font-mono">triggerOn="click"</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus inside the panel, cycling within the focus trap.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Shift + Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus in reverse, wrapping at the panel's first focusable.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Closes the popover and returns focus to the trigger; disable with <code class="font-mono">[twPopoverCloseOnEscape]="false"</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Outside click</td>
              <td class="px-4 py-2 text-fg-muted">Closes the popover when the backdrop is <code class="font-mono">'transparent'</code> / <code class="font-mono">'dimmed'</code>, or when <code class="font-mono">closeOnOutside</code> is true with backdrop <code class="font-mono">'none'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">role="dialog"</td>
              <td class="px-4 py-2 text-fg-muted">Applied to the panel; announce with <code class="font-mono">twPopoverAriaLabel</code> or a heading inside.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Focus return</td>
              <td class="px-4 py-2 text-fg-muted">Closing the panel returns DOM focus to the trigger element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Reduced motion</td>
              <td class="px-4 py-2 text-fg-muted">Enter / leave animations shorten under <code class="font-mono">prefers-reduced-motion</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">When to use</h2>
      <div class="grid gap-4 md:grid-cols-2 max-w-2xl">
        <div>
          <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-2">Use a Popover when</p>
          <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
            <li>The content is interactive (forms, actions, links)</li>
            <li>It's anchored to a specific trigger</li>
            <li>Keyboard users need to reach the content</li>
            <li>The panel should persist while the user interacts with it</li>
          </ul>
        </div>
        <div>
          <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-2">Prefer something else when</p>
          <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
            <li>
              Short non-interactive hint →
              <a routerLink="/components/tooltip" class="text-primary-600 hover:underline">Tooltip</a>
            </li>
            <li>
              List of actions driven by a trigger →
              <a routerLink="/components/menu" class="text-primary-600 hover:underline">Menu</a>
            </li>
            <li>
              Modal interaction blocking the page →
              <a routerLink="/components/dialog" class="text-primary-600 hover:underline">Dialog</a>
            </li>
            <li>
              Global, transient status notifications →
              <a routerLink="/components/toast" class="text-primary-600 hover:underline">Toast</a>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton [twPopover]="basicContent" twPopoverColor="error">
          Delete project
        </button>
        <ng-template #basicContent>
          <p class="text-sm text-fg mb-1 font-semibold">Delete this project?</p>
          <p class="text-sm text-fg-muted mb-4">This action cannot be undone.</p>
          <div class="flex justify-end gap-2">
            <button twButton variant="ghost" size="sm" twPopoverClose>Cancel</button>
            <button twButton color="error" size="sm" twPopoverClose>Delete</button>
          </div>
        </ng-template>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>12 placement positions with CDK's automatic fallback when space is insufficient</li>
        <li>3 trigger modes: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">click</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">focus</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">manual</code></li>
        <li>5 sizes and 8 optional semantic color accents</li>
        <li>Template or component content via CDK Portals</li>
        <li>Template context with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">$implicit</code> (data) and a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close</code> function</li>
        <li>Component content receives <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">POPOVER_DATA</code> and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">POPOVER_REF</code> via DI</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twPopoverClose]</code> helper directive for dismissing from inside projected content</li>
        <li>Two-way bindable open state via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(twPopoverOpen)]</code></li>
        <li>Programmatic control through the directive instance via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">exportAs="twPopover"</code></li>
        <li>Backdrop modes: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">transparent</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dimmed</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">none</code></li>
        <li>CDK FocusTrap keeps keyboard focus inside the panel and returns it to the trigger on close</li>
        <li>ARIA attributes wired automatically: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-haspopup</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="dialog"</code></li>
        <li>Respects <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code> on enter / leave animations</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/tooltip" class="text-primary-600 hover:underline">Tooltip</a>
          — use for short, non-interactive hints that appear on hover / focus.
        </li>
        <li>
          <a routerLink="/components/menu" class="text-primary-600 hover:underline">Menu</a>
          — use for a list of actions triggered from a button.
        </li>
        <li>
          <a routerLink="/components/dialog" class="text-primary-600 hover:underline">Dialog</a>
          — use when the interaction must block the rest of the page.
        </li>
        <li>
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — use for picking a value from a list rather than composing custom content.
        </li>
      </ul>
    </section>
  `,
})
export class PopoverOverview {
  protected readonly basicUsageSnippet = `<button twButton [twPopover]="confirm" twPopoverColor="error">
  Delete project
</button>

<ng-template #confirm>
  <p class="font-semibold">Delete this project?</p>
  <p class="text-fg-muted">This action cannot be undone.</p>
  <div class="flex justify-end gap-2">
    <button twButton variant="ghost" size="sm" twPopoverClose>Cancel</button>
    <button twButton color="error"  size="sm" twPopoverClose>Delete</button>
  </div>
</ng-template>`;

  protected readonly importSnippet = `import {
  PopoverDirective,
  PopoverCloseDirective,
  POPOVER_DATA,
  POPOVER_REF,
  type PopoverRef,
} from 'ngx-tw/popover';`;
}
