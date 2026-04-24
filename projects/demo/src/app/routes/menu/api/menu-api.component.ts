import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-menu-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- MenuComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">MenuComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-menu</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The menu panel itself — renders via CDK's <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkMenu</code> host directive, so <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="menu"</code>, keyboard navigation, and focus trapping come for free.
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
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the menu's padding and the density of its items.</td>
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
              <td class="px-4 py-2 font-mono text-xs">closed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Re-exposed from CDK; fires when the menu panel closes.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MenuTriggerDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">MenuTriggerDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twMenuTrigger]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Attaches to a trigger element (typically a button) and connects it to an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ng-template</code>
        that wraps <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-menu&gt;</code>. Composes CDK's <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkMenuTrigger</code> via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hostDirectives</code>, so aria-haspopup / aria-expanded / aria-controls are wired automatically.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
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
              <td class="px-4 py-2 font-mono text-xs">twMenuTrigger</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TemplateRef&lt;unknown&gt;</td>
              <td class="px-4 py-2 text-fg-muted">The template that contains the <code class="font-mono">&lt;tw-menu&gt;</code> panel.</td>
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
              <td class="px-4 py-2 font-mono text-xs">opened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the menu opens.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the menu closes.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ContextMenuTriggerDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ContextMenuTriggerDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twContextMenuTrigger]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Opens the attached menu at the pointer position on right-click. Shape matches <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuTrigger]</code>, backed by CDK's <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkContextMenuTrigger</code>.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
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
              <td class="px-4 py-2 font-mono text-xs">twContextMenuTrigger</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TemplateRef&lt;unknown&gt;</td>
              <td class="px-4 py-2 text-fg-muted">The template that contains the <code class="font-mono">&lt;tw-menu&gt;</code> panel.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 text-fg-muted">Suppresses the contextmenu handler so the native browser menu shows instead.</td>
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
              <td class="px-4 py-2 font-mono text-xs">opened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the context menu opens.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the context menu closes.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MenuItemDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">MenuItemDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twMenuItem]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Styles a trigger element as a menu item. Composes CDK's <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkMenuItem</code> for <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="menuitem"</code> semantics and keyboard activation.
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
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'default' | TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'default'</td>
              <td class="px-4 py-2 text-fg-muted">Tints the item text and hover / focus backgrounds — use <code class="font-mono">'error'</code> for destructive actions.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables activation and blocks keyboard focus on the item.</td>
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
              <td class="px-4 py-2 font-mono text-xs">triggered</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the item is activated via click, Enter, or Space.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MenuItemCheckboxComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">MenuItemCheckboxComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twMenuItemCheckbox]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Checkbox-style menu item with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="menuitemcheckbox"</code>
        and an auto-rendered check indicator keyed to the <code class="font-mono">[checked]</code> input.
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
              <td class="px-4 py-2 font-mono text-xs">checked</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Whether the check indicator is rendered.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables activation and dims the item.</td>
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
              <td class="px-4 py-2 font-mono text-xs">triggered</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the item is activated — handler typically toggles the source signal.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MenuItemRadioComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">MenuItemRadioComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twMenuItemRadio]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Radio-style menu item with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="menuitemradio"</code>
        and an auto-rendered dot indicator. Wrap siblings in <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuGroup]</code> so CDK enforces single-select semantics.
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
              <td class="px-4 py-2 font-mono text-xs">checked</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Whether the dot indicator is rendered for this item.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables activation and dims the item.</td>
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
              <td class="px-4 py-2 font-mono text-xs">triggered</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the item is activated — handler typically sets the shared source signal.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Structural & Content directives -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Structural &amp; Content Directives</h2>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Purpose</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twMenuGroup]</td>
              <td class="px-4 py-2 text-fg-muted">Groups radio items so CDK enforces mutually exclusive selection within the group.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twMenuItemIcon]</td>
              <td class="px-4 py-2 text-fg-muted">Styles a leading decorative icon inside an item; size follows the parent menu's size.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twMenuItemDescription]</td>
              <td class="px-4 py-2 text-fg-muted">Styles a secondary description line under the item's label.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twMenuItemShortcut]</td>
              <td class="px-4 py-2 text-fg-muted">Right-aligns and mutes a keyboard-shortcut hint at the trailing edge of the item.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twMenuItemSubmenuIcon]</td>
              <td class="px-4 py-2 text-fg-muted">Styles the trailing chevron that signals an item opens a submenu.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class MenuApi {}
