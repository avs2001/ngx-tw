import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import {
  MenuComponent,
  MenuTriggerDirective,
  MenuItemDirective,
} from '@cdevhub/ngx-tw/menu';
import { SeparatorComponent } from '@cdevhub/ngx-tw/separator';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-menu-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    MenuComponent,
    MenuTriggerDirective,
    MenuItemDirective,
    SeparatorComponent,
    CodeBlockComponent,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Menu component surfaces a list of actions tied to a trigger — a primary button, an
        icon button, or any element marked with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuTrigger]</code>.
        It wraps Angular CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkMenu</code>
        primitives, so every keyboard interaction, focus transition, and ARIA attribute required
        by the WAI-ARIA menu pattern is handled for free. The library composes thin directives
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItem]</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemCheckbox]</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemRadio]</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twContextMenuTrigger]</code>)
        on top of the CDK behavior so you keep the native semantics while getting Tailwind-native
        styling.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        CDK Menu wires the trigger's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-haspopup="menu"</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>
        pointers automatically. The panel itself renders as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="menu"</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="menuitem"</code>
        children;
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemCheckbox]</code>
        becomes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="menuitemcheckbox"</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemRadio]</code>
        becomes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="menuitemradio"</code>
        — grouped with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuGroup]</code>
        so a single group enforces single-select radio semantics.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Opens the menu from a focused trigger, or activates the focused item when the menu is open.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowDown / ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus between items and wraps at the ends.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the first or last enabled item.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Opens a submenu when the focused item triggers one.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft / Escape</td>
              <td class="px-4 py-2 text-fg-muted">Closes the current submenu; Escape on the root closes the menu and returns focus to the trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">A–Z, 0–9</td>
              <td class="px-4 py-2 text-fg-muted">Type-ahead — focuses the next item whose label starts with the typed characters.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Closes the menu and moves focus out following document order.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Right-click</td>
              <td class="px-4 py-2 text-fg-muted">Opens a <code class="font-mono">[twContextMenuTrigger]</code> at the pointer position; Escape dismisses it.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton [twMenuTrigger]="basicMenu">Options</button>
        <ng-template #basicMenu>
          <tw-menu>
            <button twMenuItem>Edit</button>
            <button twMenuItem>Duplicate</button>
            <tw-separator />
            <button twMenuItem [disabled]="true">Archive</button>
            <button twMenuItem color="error">Delete</button>
          </tw-menu>
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
        <li>Built on Angular CDK Menu for full keyboard navigation and ARIA</li>
        <li>5 sizes: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code> through <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code> for matching the trigger's density</li>
        <li>8 semantic color variants for menu items (use <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code> for destructive actions)</li>
        <li>Nested submenus via the same <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuTrigger]</code> applied to items</li>
        <li>Checkbox (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemCheckbox]</code>) and radio (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemRadio]</code>) items with proper ARIA roles</li>
        <li>Radio groups via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuGroup]</code> for mutually exclusive view-mode toggles</li>
        <li>Context menu trigger (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twContextMenuTrigger]</code>) — right-click on any element</li>
        <li>Content slot directives: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemIcon]</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemDescription]</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemShortcut]</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemSubmenuIcon]</code></li>
        <li>Scale-and-fade enter / leave animations via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">animate.enter</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">animate.leave</code></li>
        <li>Type-ahead search, wrap-around arrow navigation, Home / End jumps</li>
        <li>Respects <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code> on enter / leave transitions</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/popover" class="text-primary-600 hover:underline">Popover</a>
          — use for rich, free-form content (forms, profile cards) rather than a list of actions.
        </li>
        <li>
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — use for picking a value from a list as part of form input; Menu is for verbs, Select is for nouns.
        </li>
        <li>
          <a routerLink="/components/dialog" class="text-primary-600 hover:underline">Dialog</a>
          — use when the interaction must block the rest of the page.
        </li>
        <li>
          <a routerLink="/components/command-palette" class="text-primary-600 hover:underline">Command Palette</a>
          — use for a searchable, keyboard-first catalog of every action in the app.
        </li>
      </ul>
    </section>
  `,
})
export class MenuOverview {
  protected readonly basicUsageSnippet = `<button twButton [twMenuTrigger]="menu">Options</button>

<ng-template #menu>
  <tw-menu>
    <button twMenuItem>Edit</button>
    <button twMenuItem>Duplicate</button>
    <tw-separator />
    <button twMenuItem [disabled]="true">Archive</button>
    <button twMenuItem color="error">Delete</button>
  </tw-menu>
</ng-template>`;

  protected readonly importSnippet = `import {
  MenuComponent,
  MenuTriggerDirective,
  ContextMenuTriggerDirective,
  MenuItemDirective,
  MenuItemCheckboxComponent,
  MenuItemRadioComponent,
  MenuGroupDirective,
  MenuItemIconDirective,
  MenuItemDescriptionDirective,
  MenuItemShortcutDirective,
  MenuItemSubmenuIndicatorDirective,
} from '@cdevhub/ngx-tw/menu';`;
}
