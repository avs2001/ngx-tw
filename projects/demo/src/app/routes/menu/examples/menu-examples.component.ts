import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonDirective } from 'ngx-tw/button';
import type { TwColor, TwSize } from 'ngx-tw/core';
import {
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
} from 'ngx-tw/menu';
import { SeparatorComponent } from 'ngx-tw/separator';
import { CodeBlockComponent } from 'ngx-tw/code-block';

const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-menu-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
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
    SeparatorComponent,
    CodeBlockComponent,
  ],
  template: `
    <!-- Basic menu -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Menu</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A trigger, a template with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-menu&gt;</code>,
        and a list of
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItem]</code>
        buttons. Mark destructive actions with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color="error"</code>
        and group related items behind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-separator /&gt;</code>
        — that visual grouping is the thing users scan for when they're looking for a specific
        action.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton [twMenuTrigger]="basicMenu">Project actions</button>
        <ng-template #basicMenu>
          <tw-menu>
            <button twMenuItem>Rename</button>
            <button twMenuItem>Duplicate</button>
            <button twMenuItem>Move to folder…</button>
            <tw-separator />
            <button twMenuItem [disabled]="true">Archive</button>
            <button twMenuItem color="error">Delete project</button>
          </tw-menu>
        </ng-template>
      </div>
      <tw-code-block [code]="basicSnippet" language="html" />
    </section>

    <!-- Icons & shortcuts -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Icons &amp; Shortcuts</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project an icon into
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemIcon]</code>
        for visual scanning, and a shortcut hint into
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemShortcut]</code>
        (right-aligned with a muted tone). Icons should be decorative — the label next to them
        carries the meaning for assistive tech. Shortcuts should match what the app actually
        binds; don't display accelerators that aren't wired up.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" [twMenuTrigger]="fileMenu">File</button>
        <ng-template #fileMenu>
          <tw-menu>
            <button twMenuItem>
              <svg twMenuItemIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6h8v1H6v-1zm0 3h8v1H6v-1z" clip-rule="evenodd" />
              </svg>
              New file
              <span twMenuItemShortcut>⌘N</span>
            </button>
            <button twMenuItem>
              <svg twMenuItemIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3.75 3A1.75 1.75 0 002 4.75v10.5C2 16.216 2.784 17 3.75 17h12.5A1.75 1.75 0 0018 15.25v-8.5A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75z" />
              </svg>
              Open project…
              <span twMenuItemShortcut>⌘O</span>
            </button>
            <tw-separator />
            <button twMenuItem>
              <svg twMenuItemIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3 17v-2a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2zM5 3a2 2 0 00-2 2v6h14V5a2 2 0 00-2-2H5z" />
              </svg>
              Save
              <span twMenuItemShortcut>⌘S</span>
            </button>
            <button twMenuItem>
              Save as…
              <span twMenuItemShortcut>⌘⇧S</span>
            </button>
            <tw-separator />
            <button twMenuItem color="error">
              <svg twMenuItemIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M8.75 1a.75.75 0 00-.75.75V3h-3A1.75 1.75 0 003.25 4.75v.5c0 .414.336.75.75.75h12a.75.75 0 00.75-.75v-.5A1.75 1.75 0 0015 3h-3V1.75a.75.75 0 00-.75-.75h-2.5zM4.5 7.5a.75.75 0 00-.75.838l.81 7.29A2.5 2.5 0 007.045 18h5.91a2.5 2.5 0 002.484-2.372l.81-7.29a.75.75 0 00-.745-.838h-11z" clip-rule="evenodd" />
              </svg>
              Close project
              <span twMenuItemShortcut>⌘W</span>
            </button>
          </tw-menu>
        </ng-template>
      </div>
      <tw-code-block [code]="iconsShortcutsSnippet" language="html" />
    </section>

    <!-- Descriptions -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Descriptions</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        When the item label alone doesn't make the consequence obvious, project a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemDescription]</code>
        span for a one-line explainer under the label. Reserve descriptions for irreversible or
        side-effect-heavy actions — a regular "Rename" doesn't need one.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="soft" [twMenuTrigger]="descMenu">Collaboration</button>
        <ng-template #descMenu>
          <tw-menu>
            <button twMenuItem>
              Share
              <span twMenuItemDescription>Send a link to teammates inside your organization</span>
            </button>
            <button twMenuItem>
              Invite via email
              <span twMenuItemDescription>Email an invitation with reviewer access</span>
            </button>
            <tw-separator />
            <button twMenuItem color="warning">
              Make public
              <span twMenuItemDescription>Anyone with the link can view the project</span>
            </button>
            <button twMenuItem color="error">
              Revoke all access
              <span twMenuItemDescription>Removes every collaborator — this cannot be undone</span>
            </button>
          </tw-menu>
        </ng-template>
      </div>
      <tw-code-block [code]="descriptionsSnippet" language="html" />
    </section>

    <!-- Nested submenus -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Nested Submenus</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Apply
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuTrigger]</code>
        to an item the same way you apply it to the top-level trigger — CDK handles the nested
        overlay, ArrowRight to open, ArrowLeft / Escape to close. Drop a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemSubmenuIcon]</code>
        chevron inside the item to signal the submenu visually.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton [twMenuTrigger]="editMenu">Edit</button>
        <ng-template #editMenu>
          <tw-menu>
            <button twMenuItem>Undo<span twMenuItemShortcut>⌘Z</span></button>
            <button twMenuItem>Redo<span twMenuItemShortcut>⌘⇧Z</span></button>
            <tw-separator />
            <button twMenuItem>Cut<span twMenuItemShortcut>⌘X</span></button>
            <button twMenuItem>Copy<span twMenuItemShortcut>⌘C</span></button>
            <button twMenuItem>Paste<span twMenuItemShortcut>⌘V</span></button>
            <tw-separator />
            <button twMenuItem [twMenuTrigger]="shareMenu">
              Share
              <svg twMenuItemSubmenuIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
              </svg>
            </button>
          </tw-menu>
        </ng-template>
        <ng-template #shareMenu>
          <tw-menu>
            <button twMenuItem>Email link</button>
            <button twMenuItem>Slack</button>
            <button twMenuItem>Copy URL<span twMenuItemShortcut>⌘⇧C</span></button>
          </tw-menu>
        </ng-template>
      </div>
      <tw-code-block [code]="submenuSnippet" language="html" />
    </section>

    <!-- Checkbox and radio -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Checkbox &amp; Radio Items</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For toggles that live inside the menu (view options, preferences) use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemCheckbox]</code>
        for independent booleans and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuItemRadio]</code>
        for mutually exclusive choices. Wrap radios in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuGroup]</code>
        so CDK enforces the single-select semantics. The check / dot indicator is rendered
        automatically from the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[checked]</code>
        input.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3 flex-wrap">
          <button twButton variant="outline" [twMenuTrigger]="viewMenu">View options</button>
          <ng-template #viewMenu>
            <tw-menu>
              <div twMenuGroup>
                <button twMenuItemCheckbox [checked]="showToolbar()" (triggered)="toggleToolbar()">Toolbar</button>
                <button twMenuItemCheckbox [checked]="showSidebar()" (triggered)="toggleSidebar()">Sidebar</button>
                <button twMenuItemCheckbox [checked]="showStatusBar()" (triggered)="toggleStatusBar()">Status bar</button>
              </div>
              <tw-separator />
              <div twMenuGroup>
                <button twMenuItemRadio [checked]="viewMode() === 'grid'" (triggered)="viewMode.set('grid')">Grid view</button>
                <button twMenuItemRadio [checked]="viewMode() === 'list'" (triggered)="viewMode.set('list')">List view</button>
                <button twMenuItemRadio [checked]="viewMode() === 'board'" (triggered)="viewMode.set('board')">Board view</button>
              </div>
            </tw-menu>
          </ng-template>
          <span class="text-xs text-fg-muted font-mono">
            view = {{ viewMode() }} · toolbar = {{ showToolbar() }} · sidebar = {{ showSidebar() }}
          </span>
        </div>
      </div>
      <tw-code-block [code]="toggleTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="toggleHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Context menu -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Context Menu</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twContextMenuTrigger]</code>
        opens the menu at the pointer position on right-click — the same directive shape as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twMenuTrigger]</code>,
        but wired to the contextmenu event. Keep context menus short (five items or fewer) since
        they're meant for quick, in-place actions, not deep navigation.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div
          [twContextMenuTrigger]="ctxMenu"
          class="rounded-lg border border-dashed border-border p-10 text-center text-sm text-fg-muted bg-surface cursor-default select-none"
        >
          Right-click anywhere inside this area to open the context menu.
        </div>
        <ng-template #ctxMenu>
          <tw-menu size="sm">
            <button twMenuItem>
              <svg twMenuItemIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M8 5H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2a1 1 0 01-1-1V2.5A1.5 1.5 0 0011.5 1h-3A1.5 1.5 0 007 2.5V4a1 1 0 01-1 1H8z" />
              </svg>
              Copy
              <span twMenuItemShortcut>⌘C</span>
            </button>
            <button twMenuItem>
              <svg twMenuItemIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
              Duplicate
              <span twMenuItemShortcut>⌘D</span>
            </button>
            <tw-separator />
            <button twMenuItem>Inspect element</button>
            <button twMenuItem color="error">Delete<span twMenuItemShortcut>⌫</span></button>
          </tw-menu>
        </ng-template>
      </div>
      <tw-code-block [code]="contextSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size drives both the menu's own padding and the item density — match the menu's size to
        the trigger's so the two don't feel visually mismatched.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (s of sizes; track s) {
            <button twButton variant="outline" color="neutral" size="sm" [twMenuTrigger]="sizeMenu">{{ s }}</button>
            <ng-template #sizeMenu>
              <tw-menu [size]="s">
                <button twMenuItem>Edit</button>
                <button twMenuItem>Duplicate</button>
                <button twMenuItem>Archive</button>
              </tw-menu>
            </ng-template>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Item Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Apply the semantic color on the <em>item</em>, not the menu — most items stay neutral, and
        only one or two per menu should be colored for meaning (e.g., an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>-colored
        Delete at the bottom, a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>-colored
        Accept). A menu full of colored items is a menu with no visual hierarchy.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" [twMenuTrigger]="colorMenu">Colors</button>
        <ng-template #colorMenu>
          <tw-menu>
            @for (c of colors; track c) {
              <button twMenuItem [color]="c">{{ c }}</button>
            }
          </tw-menu>
        </ng-template>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine menu size and per-item color at once. The menu renders as an overlay, so the
        preview surface is sunken below to give the panel room to open in any direction — try
        resizing the page to watch CDK flip placement if the menu would otherwise clip off-screen.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Menu size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playSize() === s"
                  [class.!text-primary-700]="playSize() === s"
                  (click)="playSize.set(s)"
                >{{ s }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Item color</label>
            <div class="flex flex-wrap gap-1">
              @for (c of colors; track c) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playColor() === c"
                  [class.!text-primary-700]="playColor() === c"
                  (click)="playColor.set(c)"
                >{{ c }}</button>
              }
            </div>
          </div>
        </div>
        <div class="flex items-center justify-center p-12 rounded-lg bg-surface-sunken">
          <button twButton variant="outline" color="neutral" [twMenuTrigger]="playMenu">Open menu</button>
          <ng-template #playMenu>
            <tw-menu [size]="playSize()">
              <button twMenuItem [color]="playColor()">Rename</button>
              <button twMenuItem [color]="playColor()">Duplicate</button>
              <button twMenuItem [color]="playColor()">Move to folder…</button>
              <tw-separator />
              <button twMenuItem [color]="playColor()" [disabled]="true">Archive (disabled)</button>
            </tw-menu>
          </ng-template>
        </div>
      </div>
    </section>
  `,
})
export class MenuExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;

  protected readonly showToolbar = signal(true);
  protected readonly showSidebar = signal(true);
  protected readonly showStatusBar = signal(false);
  protected readonly viewMode = signal<'grid' | 'list' | 'board'>('grid');

  protected toggleToolbar(): void { this.showToolbar.update((v) => !v); }
  protected toggleSidebar(): void { this.showSidebar.update((v) => !v); }
  protected toggleStatusBar(): void { this.showStatusBar.update((v) => !v); }

  protected readonly playSize = signal<TwSize>('md');
  protected readonly playColor = signal<TwColor>('primary');

  // ── Snippets ───────────────────────────────────────────────────

  protected readonly basicSnippet = `<button twButton [twMenuTrigger]="menu">Project actions</button>

<ng-template #menu>
  <tw-menu>
    <button twMenuItem>Rename</button>
    <button twMenuItem>Duplicate</button>
    <button twMenuItem>Move to folder…</button>
    <tw-separator />
    <button twMenuItem [disabled]="true">Archive</button>
    <button twMenuItem color="error">Delete project</button>
  </tw-menu>
</ng-template>`;

  protected readonly iconsShortcutsSnippet = `<button twButton variant="outline" [twMenuTrigger]="fileMenu">File</button>

<ng-template #fileMenu>
  <tw-menu>
    <button twMenuItem>
      <svg twMenuItemIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
      New file
      <span twMenuItemShortcut>⌘N</span>
    </button>
    <button twMenuItem>
      <svg twMenuItemIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
      Open project…
      <span twMenuItemShortcut>⌘O</span>
    </button>
    <tw-separator />
    <button twMenuItem color="error">
      <svg twMenuItemIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
      Close project
      <span twMenuItemShortcut>⌘W</span>
    </button>
  </tw-menu>
</ng-template>`;

  protected readonly descriptionsSnippet = `<ng-template #menu>
  <tw-menu>
    <button twMenuItem>
      Share
      <span twMenuItemDescription>Send a link to teammates inside your organization</span>
    </button>
    <!-- … -->
    <button twMenuItem color="error">
      Revoke all access
      <span twMenuItemDescription>Removes every collaborator — this cannot be undone</span>
    </button>
  </tw-menu>
</ng-template>`;

  protected readonly submenuSnippet = `<ng-template #editMenu>
  <tw-menu>
    <button twMenuItem>Undo<span twMenuItemShortcut>⌘Z</span></button>
    <!-- … more items -->
    <button twMenuItem [twMenuTrigger]="shareMenu">
      Share
      <svg twMenuItemSubmenuIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
    </button>
  </tw-menu>
</ng-template>

<ng-template #shareMenu>
  <tw-menu>
    <button twMenuItem>Email link</button>
    <button twMenuItem>Slack</button>
    <button twMenuItem>Copy URL<span twMenuItemShortcut>⌘⇧C</span></button>
  </tw-menu>
</ng-template>`;

  protected readonly toggleTsSnippet = `protected readonly showToolbar = signal(true);
protected readonly showSidebar = signal(true);
protected readonly showStatusBar = signal(false);
protected readonly viewMode = signal<'grid' | 'list' | 'board'>('grid');

protected toggleToolbar(): void { this.showToolbar.update((v) => !v); }
// …same for sidebar / status bar`;

  protected readonly toggleHtmlSnippet = `<tw-menu>
  <div twMenuGroup>
    <button twMenuItemCheckbox [checked]="showToolbar()"  (triggered)="toggleToolbar()">Toolbar</button>
    <button twMenuItemCheckbox [checked]="showSidebar()"  (triggered)="toggleSidebar()">Sidebar</button>
    <button twMenuItemCheckbox [checked]="showStatusBar()" (triggered)="toggleStatusBar()">Status bar</button>
  </div>
  <tw-separator />
  <div twMenuGroup>
    <button twMenuItemRadio [checked]="viewMode() === 'grid'"  (triggered)="viewMode.set('grid')">Grid view</button>
    <button twMenuItemRadio [checked]="viewMode() === 'list'"  (triggered)="viewMode.set('list')">List view</button>
    <button twMenuItemRadio [checked]="viewMode() === 'board'" (triggered)="viewMode.set('board')">Board view</button>
  </div>
</tw-menu>`;

  protected readonly contextSnippet = `<div
  [twContextMenuTrigger]="ctxMenu"
  class="rounded-lg border border-dashed border-border p-10 text-center"
>
  Right-click anywhere inside this area.
</div>

<ng-template #ctxMenu>
  <tw-menu size="sm">
    <button twMenuItem>Copy<span twMenuItemShortcut>⌘C</span></button>
    <button twMenuItem>Duplicate<span twMenuItemShortcut>⌘D</span></button>
    <tw-separator />
    <button twMenuItem color="error">Delete<span twMenuItemShortcut>⌫</span></button>
  </tw-menu>
</ng-template>`;

  protected readonly sizesSnippet = `@for (s of sizes; track s) {
  <button twButton variant="outline" size="sm" [twMenuTrigger]="sizeMenu">{{ s }}</button>

  <ng-template #sizeMenu>
    <tw-menu [size]="s">
      <button twMenuItem>Edit</button>
      <button twMenuItem>Duplicate</button>
      <button twMenuItem>Archive</button>
    </tw-menu>
  </ng-template>
}`;

  protected readonly colorsSnippet = `<ng-template #colorMenu>
  <tw-menu>
    @for (c of colors; track c) {
      <button twMenuItem [color]="c">{{ c }}</button>
    }
  </tw-menu>
</ng-template>`;
}
