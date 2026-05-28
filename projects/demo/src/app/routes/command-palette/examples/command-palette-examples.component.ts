import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CommandPaletteComponent,
  CommandPaletteEmptyDirective,
  CommandPaletteFooterDirective,
  CommandPaletteGroupDirective,
  CommandPaletteItemDirective,
  type CommandPaletteFilterFn,
  type CommandPaletteItem,
} from 'ngx-tw/command-palette';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwSize } from 'ngx-tw/core';

const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

const DATA_COMMANDS: readonly CommandPaletteItem[] = [
  { id: 'cut', label: 'Cut', group: 'Edit', shortcut: ['⌘', 'X'], keywords: ['clipboard'] },
  { id: 'copy', label: 'Copy', group: 'Edit', shortcut: ['⌘', 'C'], keywords: ['clipboard'] },
  { id: 'paste', label: 'Paste', group: 'Edit', shortcut: ['⌘', 'V'], keywords: ['clipboard'] },
  { id: 'undo', label: 'Undo', group: 'History', shortcut: ['⌘', 'Z'] },
  { id: 'redo', label: 'Redo', group: 'History', shortcut: ['⌘', '⇧', 'Z'] },
  { id: 'find', label: 'Find', group: 'Search', shortcut: ['⌘', 'F'], description: 'Find in current file' },
  { id: 'replace', label: 'Replace', group: 'Search', shortcut: ['⌘', 'H'] },
  { id: 'goto-line', label: 'Go to line', group: 'Navigation', shortcut: ['⌘', 'G'] },
  { id: 'goto-file', label: 'Go to file', group: 'Navigation', shortcut: ['⌘', 'P'] },
];

const PLAYGROUND_COMMANDS: readonly CommandPaletteItem[] = [
  { id: 'p-new', label: 'New project', shortcut: ['⌘', 'N'], description: 'Create a new project' },
  { id: 'p-open', label: 'Open project', shortcut: ['⌘', 'O'] },
  { id: 'p-clone', label: 'Clone repository', shortcut: ['⌘', '⇧', 'G'] },
  { id: 'p-settings', label: 'Settings', shortcut: ['⌘', ','] },
  { id: 'p-quit', label: 'Quit', shortcut: ['⌘', 'Q'], disabled: true },
];

const HOTKEY_COMMANDS: readonly CommandPaletteItem[] = [
  { id: 'h-dash', label: 'Go to dashboard', keywords: ['home'] },
  { id: 'h-inbox', label: 'Open inbox', keywords: ['mail'] },
  { id: 'h-profile', label: 'Edit profile' },
  { id: 'h-logout', label: 'Sign out' },
];

/** Simple fuzzy filter — all query characters appear in order inside the target, case-insensitive. */
const fuzzyFilter: CommandPaletteFilterFn = (items, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const target = `${item.label} ${item.keywords?.join(' ') ?? ''}`.toLowerCase();
    let cursor = 0;
    for (const ch of q) {
      const idx = target.indexOf(ch, cursor);
      if (idx === -1) return false;
      cursor = idx + 1;
    }
    return true;
  });
};

@Component({
  selector: 'app-command-palette-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommandPaletteComponent,
    CommandPaletteItemDirective,
    CommandPaletteGroupDirective,
    CommandPaletteEmptyDirective,
    CommandPaletteFooterDirective,
    ButtonDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input controls the search input's height, the item row padding, and the font scale
        across the palette. Match the size to the surrounding surface — a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        palette fits a dense developer tool, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        reads better on a spacious, screen-wide launcher. Click a size to open the palette at
        that scale.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (s of sizes; track s) {
            <button
              twButton
              variant="outline"
              size="sm"
              (click)="sizeSelected.set(s); sizeOpen.set(true)"
            >
              Open {{ s }}
            </button>
          }
        </div>

        <tw-command-palette
          [(open)]="sizeOpen"
          [size]="sizeSelected()"
          [commands]="dataCommands"
        />
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Groups + shortcuts -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Groups &amp; Shortcuts</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Wrap items in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCommandPaletteGroup</code>
        (or set each item's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">group</code>
        input) and they render under a labelled section inside the listbox. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">shortcut</code>
        input accepts a single string or an array of tokens — each token renders as its own
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;kbd&gt;</code>
        chip on the right edge of the row. Disabled items still render and remain keyboard-skipped.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" (click)="groupOpen.set(true)">Open grouped palette</button>

        <tw-command-palette [(open)]="groupOpen">
          <div twCommandPaletteGroup label="File">
            <tw-command-palette-item id="g-new" label="New file" [shortcut]="['⌘','N']">
              New file
            </tw-command-palette-item>
            <tw-command-palette-item id="g-open" label="Open file" [shortcut]="['⌘','O']">
              Open file
            </tw-command-palette-item>
            <tw-command-palette-item id="g-save" label="Save" [shortcut]="['⌘','S']">
              Save
            </tw-command-palette-item>
          </div>
          <div twCommandPaletteGroup label="Edit">
            <tw-command-palette-item id="g-cut" label="Cut" [shortcut]="['⌘','X']">
              Cut
            </tw-command-palette-item>
            <tw-command-palette-item id="g-copy" label="Copy" [shortcut]="['⌘','C']">
              Copy
            </tw-command-palette-item>
            <tw-command-palette-item id="g-paste" label="Paste" [shortcut]="['⌘','V']" [disabled]="true">
              Paste
            </tw-command-palette-item>
          </div>
        </tw-command-palette>
      </div>
      <tw-code-block [code]="groupsSnippet" language="html" />
    </section>

    <!-- Data-driven + custom filter -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Data-driven with a custom filter</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">readonly CommandPaletteItem[]</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[commands]</code>
        when your command list lives in a store, service, or API response. Swap the default
        substring match with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[filterFn]</code>
        — below is a small fuzzy matcher that requires every query character to appear in order.
        Try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">gf</code>
        (matches "go to file"),
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">clp</code>
        (matches anything with "clipboard"), or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">copy</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" (click)="fuzzyOpen.set(true)">Open fuzzy palette</button>

        <tw-command-palette
          [(open)]="fuzzyOpen"
          [commands]="dataCommands"
          [filterFn]="fuzzyFilter"
        />
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="fuzzyTsSnippet" language="ts" />
        <tw-code-block [code]="fuzzyHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Global hotkey (⌘K / Ctrl+K) -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Global hotkey (⌘K / Ctrl+K)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The palette doesn't bind any global keys — consumers wire their own. The canonical pattern
        is to listen on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">window</code>
        for ⌘K / Ctrl+K and call
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">open.set(true)</code>
        or the component's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">show()</code>
        method. Remember to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">preventDefault</code>
        so the browser's native menu doesn't fight you, and guard for SSR by checking the platform
        before registering the listener.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <p class="text-sm text-fg-muted">
          Press
          <kbd class="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-md border border-border bg-surface-muted text-fg-muted text-2xs font-mono">⌘</kbd>
          +
          <kbd class="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-md border border-border bg-surface-muted text-fg-muted text-2xs font-mono">K</kbd>
          (or Ctrl+K on non-Mac) anywhere on this page to open the palette.
        </p>
        <p class="text-sm text-fg-muted mt-3">
          Last activated: <strong class="text-fg">{{ hotkeyLast() ?? 'none' }}</strong>
        </p>

        <tw-command-palette
          [(open)]="hotkeyOpen"
          [commands]="hotkeyCommands"
          placeholder="What do you want to do?"
          (itemSelected)="hotkeyLast.set($event.label)"
        />
      </div>
      <tw-code-block [code]="hotkeyTsSnippet" language="ts" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Per-item
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]</code>
        renders the item with reduced opacity, blocks keyboard focus, and ignores clicks.
        Setting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[closeOnSelect]="false"</code>
        on the palette keeps it open after each selection — useful for "run many" launchers
        where users chain several commands without reopening the surface.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled item</p>
            <button twButton variant="outline" (click)="disabledOpen.set(true)">Open palette</button>
            <tw-command-palette [(open)]="disabledOpen">
              <tw-command-palette-item id="d-build" label="Build project" [shortcut]="['⌘','B']">
                Build project
              </tw-command-palette-item>
              <tw-command-palette-item id="d-test" label="Run tests" [shortcut]="['⌘','T']">
                Run tests
              </tw-command-palette-item>
              <tw-command-palette-item id="d-deploy" label="Deploy" [shortcut]="['⌘','D']" [disabled]="true">
                Deploy
              </tw-command-palette-item>
            </tw-command-palette>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Stay open after select</p>
            <button twButton variant="outline" (click)="stayOpen.set(true)">Open palette</button>
            <p class="text-xs text-fg-muted mt-2">
              Last selected: <strong class="text-fg">{{ stayLast() ?? 'none' }}</strong>
            </p>
            <tw-command-palette
              [(open)]="stayOpen"
              [closeOnSelect]="false"
              [commands]="dataCommands"
              (itemSelected)="stayLast.set($event.label)"
            />
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Descriptions -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Descriptions</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Each item accepts a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">description</code>
        — a secondary line that renders under the label in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text-xs</code>
        muted type. Use it for short clarifications of what an item does, especially when several
        commands share a short, ambiguous label. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">searchAriaLabel</code>
        input is used here to disambiguate the search input for screen readers (default is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'Search commands'</code>).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" (click)="descOpen.set(true)">Open palette</button>

        <tw-command-palette
          [(open)]="descOpen"
          searchAriaLabel="Search file actions"
        >
          <tw-command-palette-item
            id="d-new"
            label="New file"
            description="Create an empty file in the current folder"
            [shortcut]="['⌘','N']"
          >
            New file
          </tw-command-palette-item>
          <tw-command-palette-item
            id="d-duplicate"
            label="Duplicate"
            description="Copy the active file alongside the original"
            [shortcut]="['⌘','D']"
          >
            Duplicate
          </tw-command-palette-item>
          <tw-command-palette-item
            id="d-rename"
            label="Rename"
            description="Inline-rename the active file in the explorer"
            [shortcut]="['F2']"
          >
            Rename
          </tw-command-palette-item>
        </tw-command-palette>
      </div>
      <tw-code-block [code]="descSnippet" language="html" />
    </section>

    <!-- Empty state + footer templates -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom empty state &amp; footer</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twCommandPaletteEmpty</code>
        to replace the default "No results" message — the template context receives the current
        search string so you can render a "Create X" action or suggest nearby commands. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twCommandPaletteFooter</code>
        for sticky content at the bottom of the panel, commonly a keyboard legend or a command
        count. Type something that doesn't match (e.g. "xyz") to see the empty state below.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" (click)="templatesOpen.set(true)">Open palette</button>

        <tw-command-palette [(open)]="templatesOpen" [commands]="dataCommands">
          <ng-template twCommandPaletteEmpty let-q>
            <div class="flex flex-col items-center gap-2">
              <svg class="size-8 text-fg-subtle" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M3.5 2A1.5 1.5 0 002 3.5v13A1.5 1.5 0 003.5 18h13a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-13zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm text-fg-muted">No commands match "<strong class="text-fg">{{ q }}</strong>"</p>
              <p class="text-2xs text-fg-subtle">Try a different search term</p>
            </div>
          </ng-template>
          <ng-template twCommandPaletteFooter>
            <div class="flex items-center justify-between text-xs text-fg-subtle">
              <span>
                <kbd class="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded border border-border bg-surface text-2xs font-mono">↑↓</kbd>
                navigate
                <kbd class="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded border border-border bg-surface text-2xs font-mono ml-2">↵</kbd>
                select
                <kbd class="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded border border-border bg-surface text-2xs font-mono ml-2">esc</kbd>
                close
              </span>
              <span>{{ dataCommands.length }} commands</span>
            </div>
          </ng-template>
        </tw-command-palette>
      </div>
      <tw-code-block [code]="templatesSnippet" language="html" />
    </section>

    <!-- Programmatic -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Programmatic control</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Grab a reference with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">viewChild</code>
        and call
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">show()</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hide()</code>, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">toggle()</code>
        when you don't want to wire a two-way
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(open)]</code>
        binding. These are also the right hooks to invoke from a global shortcut service or a
        toolbar action.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-2">
          <button twButton size="sm" (click)="progRef().show()">show()</button>
          <button twButton size="sm" variant="ghost" (click)="progRef().hide()">hide()</button>
          <button twButton size="sm" variant="outline" (click)="progRef().toggle()">toggle()</button>
        </div>

        <tw-command-palette #prog [commands]="dataCommands" />
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="progTsSnippet" language="ts" />
        <tw-code-block [code]="progHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Try an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        palette for a compact quick-switcher feel, or turn off
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">closeOnSelect</code>
        alongside a non-default placeholder to explore the "stay open" launcher pattern.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playSize() === s"
                  [class.!text-primary-700]="playSize() === s"
                  (click)="playSize.set(s)"
                >{{ s }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Options</label>
            <div class="flex gap-1">
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playCloseOnSelect()"
                [class.!text-primary-700]="playCloseOnSelect()"
                (click)="playCloseOnSelect.update(v => !v)"
              >closeOnSelect</button>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playCloseOnEscape()"
                [class.!text-primary-700]="playCloseOnEscape()"
                (click)="playCloseOnEscape.update(v => !v)"
              >closeOnEscape</button>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playCloseOnBackdrop()"
                [class.!text-primary-700]="playCloseOnBackdrop()"
                (click)="playCloseOnBackdrop.update(v => !v)"
              >closeOnBackdropClick</button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken flex items-center gap-3">
          <button twButton (click)="playOpen.set(true)">Open palette</button>
          <span class="text-sm text-fg-muted">
            Last: <strong class="text-fg">{{ playLast() ?? 'none' }}</strong>
          </span>

          <tw-command-palette
            [(open)]="playOpen"
            [size]="playSize()"
            [closeOnSelect]="playCloseOnSelect()"
            [closeOnEscape]="playCloseOnEscape()"
            [closeOnBackdropClick]="playCloseOnBackdrop()"
            [commands]="playgroundCommands"
            (itemSelected)="playLast.set($event.label)"
          />
        </div>
      </div>
    </section>
  `,
})
export class CommandPaletteExamples {
  protected readonly sizes = SIZES;
  protected readonly dataCommands = DATA_COMMANDS;
  protected readonly hotkeyCommands = HOTKEY_COMMANDS;
  protected readonly playgroundCommands = PLAYGROUND_COMMANDS;
  protected readonly fuzzyFilter = fuzzyFilter;

  // Sizes
  protected readonly sizeOpen = signal(false);
  protected readonly sizeSelected = signal<TwSize>('md');

  // Groups
  protected readonly groupOpen = signal(false);

  // Fuzzy
  protected readonly fuzzyOpen = signal(false);

  // Hotkey
  protected readonly hotkeyOpen = signal(false);
  protected readonly hotkeyLast = signal<string | null>(null);

  // States
  protected readonly disabledOpen = signal(false);
  protected readonly stayOpen = signal(false);
  protected readonly stayLast = signal<string | null>(null);

  // Descriptions
  protected readonly descOpen = signal(false);

  // Templates
  protected readonly templatesOpen = signal(false);

  // Programmatic
  protected readonly progRef = viewChild.required<CommandPaletteComponent>('prog');

  // Playground
  protected readonly playOpen = signal(false);
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playCloseOnSelect = signal(true);
  protected readonly playCloseOnEscape = signal(true);
  protected readonly playCloseOnBackdrop = signal(true);
  protected readonly playLast = signal<string | null>(null);

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (!this.isBrowser) return;
    const handler = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        this.hotkeyOpen.set(true);
      }
    };
    window.addEventListener('keydown', handler);
    this.destroyRef.onDestroy(() => window.removeEventListener('keydown', handler));
  }

  // ── Code snippets ──

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <button
    twButton
    variant="outline"
    size="sm"
    (click)="sizeSelected.set(s); sizeOpen.set(true)"
  >Open {{ s }}</button>
}

<tw-command-palette
  [(open)]="sizeOpen"
  [size]="sizeSelected()"
  [commands]="dataCommands"
/>`.trim();

  protected readonly groupsSnippet = `<tw-command-palette [(open)]="groupOpen">
  <div twCommandPaletteGroup label="File">
    <tw-command-palette-item id="g-new" label="New file" [shortcut]="['⌘','N']">
      New file
    </tw-command-palette-item>
    <tw-command-palette-item id="g-open" label="Open file" [shortcut]="['⌘','O']">
      Open file
    </tw-command-palette-item>
  </div>
  <div twCommandPaletteGroup label="Edit">
    <tw-command-palette-item id="g-cut" label="Cut" [shortcut]="['⌘','X']">
      Cut
    </tw-command-palette-item>
    <tw-command-palette-item
      id="g-paste"
      label="Paste"
      [shortcut]="['⌘','V']"
      [disabled]="true"
    >
      Paste
    </tw-command-palette-item>
  </div>
</tw-command-palette>`;

  protected readonly fuzzyTsSnippet = `const commands: readonly CommandPaletteItem[] = [
  { id: 'find',      label: 'Find',       group: 'Search',     shortcut: ['⌘','F'] },
  { id: 'goto-file', label: 'Go to file', group: 'Navigation', shortcut: ['⌘','P'] },
  // …
];

const fuzzyFilter: CommandPaletteFilterFn = (items, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const target = \`\${item.label} \${item.keywords?.join(' ') ?? ''}\`.toLowerCase();
    let cursor = 0;
    for (const ch of q) {
      const idx = target.indexOf(ch, cursor);
      if (idx === -1) return false;
      cursor = idx + 1;
    }
    return true;
  });
};`;

  protected readonly fuzzyHtmlSnippet = `<tw-command-palette
  [(open)]="open"
  [commands]="commands"
  [filterFn]="fuzzyFilter"
/>`;

  protected readonly hotkeyTsSnippet = `private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
private readonly destroyRef = inject(DestroyRef);
protected readonly open = signal(false);

constructor() {
  if (!this.isBrowser) return;
  const handler = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.open.set(true);
    }
  };
  window.addEventListener('keydown', handler);
  this.destroyRef.onDestroy(() => window.removeEventListener('keydown', handler));
}`;

  protected readonly statesSnippet = `<!-- Disabled item -->
<tw-command-palette [(open)]="open">
  <tw-command-palette-item id="build"  label="Build project" [shortcut]="['⌘','B']">Build project</tw-command-palette-item>
  <tw-command-palette-item id="deploy" label="Deploy"        [shortcut]="['⌘','D']" [disabled]="true">Deploy</tw-command-palette-item>
</tw-command-palette>

<!-- Stay open after select -->
<tw-command-palette
  [(open)]="open"
  [closeOnSelect]="false"
  [commands]="commands"
  (itemSelected)="last.set($event.label)"
/>`;

  protected readonly descSnippet = `<tw-command-palette
  [(open)]="open"
  searchAriaLabel="Search file actions"
>
  <tw-command-palette-item
    id="new"
    label="New file"
    description="Create an empty file in the current folder"
    [shortcut]="['⌘','N']"
  >
    New file
  </tw-command-palette-item>
  <tw-command-palette-item
    id="duplicate"
    label="Duplicate"
    description="Copy the active file alongside the original"
    [shortcut]="['⌘','D']"
  >
    Duplicate
  </tw-command-palette-item>
</tw-command-palette>`;

  protected readonly templatesSnippet = `<tw-command-palette [(open)]="open" [commands]="commands">
  <ng-template twCommandPaletteEmpty let-q>
    <div class="flex flex-col items-center gap-2">
      <svg class="size-8 text-fg-subtle" viewBox="0 0 20 20" fill="currentColor">…</svg>
      <p class="text-sm text-fg-muted">No commands match "<strong>{{ q }}</strong>"</p>
      <p class="text-2xs text-fg-subtle">Try a different search term</p>
    </div>
  </ng-template>
  <ng-template twCommandPaletteFooter>
    <div class="flex items-center justify-between text-xs text-fg-subtle">
      <span>↑↓ navigate · ↵ select · esc close</span>
      <span>{{ commands.length }} commands</span>
    </div>
  </ng-template>
</tw-command-palette>`;

  protected readonly progTsSnippet = `protected readonly palette = viewChild.required<CommandPaletteComponent>('palette');`;

  protected readonly progHtmlSnippet = `<button twButton (click)="palette().show()">show()</button>
<button twButton variant="ghost" (click)="palette().hide()">hide()</button>
<button twButton variant="outline" (click)="palette().toggle()">toggle()</button>

<tw-command-palette #palette [commands]="commands" />`;
}
