import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SplitComponent, SplitPaneComponent } from '@cdevhub/ngx-tw/split';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-split-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitComponent, SplitPaneComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Split container lays panes out along a horizontal or vertical axis and lets the user
        drag the gutter between any two panes to resize them. Sizes can be declared in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">percent</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pixel</code>
        units, persisted to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">localStorage</code>,
        and driven entirely from the keyboard. Each gutter is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="separator"</code>
        element with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-orientation</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuenow</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>
        referencing the two adjacent panes — matching the WAI-ARIA "Window Splitter" pattern.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border bg-surface-raised mb-4 h-64 overflow-hidden">
        <tw-split direction="horizontal">
          <tw-split-pane [defaultSize]="30" [minSize]="15">
            <div class="p-4 text-sm text-fg-muted">Sidebar</div>
          </tw-split-pane>
          <tw-split-pane [defaultSize]="70">
            <div class="p-4 text-sm">
              <p class="text-fg mb-2 font-medium">Main content</p>
              <p class="text-fg-muted">Drag the gutter or focus it and use the arrow keys.</p>
            </div>
          </tw-split-pane>
        </tw-split>
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
        <li>Horizontal and vertical orientations</li>
        <li>
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">percent</code> or
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pixel</code>
          sizing units
        </li>
        <li>
          Per-pane
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minSize</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxSize</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">defaultSize</code>
        </li>
        <li>
          Collapsible panes with optional rail-style
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">collapsedSize</code>
          and drag-snap threshold
        </li>
        <li>
          Persistence via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">storageKey</code>
          — sizes survive reload
        </li>
        <li>
          Full keyboard support: Arrow keys, PageUp/PageDown, Home, End,
          Enter / Space to toggle collapse
        </li>
        <li>RTL aware via the ambient <code class="font-mono text-xs">dir</code> attribute</li>
        <li>
          Container resize handled automatically (proportional in percent mode, scaling in pixel
          mode) with clamping against per-pane constraints
        </li>
        <li>
          Accessible: each gutter is a
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="separator"</code>
          with proper
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-*</code>
          wiring
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/tabs" class="text-primary-600 hover:underline">Tabs</a>
          — when panes hold whole screens of distinct content, tabs usually communicate that
          better than a draggable split.
        </li>
        <li>
          <a routerLink="/components/collapsible" class="text-primary-600 hover:underline"
            >Collapsible</a
          >
          — for a single show/hide region. Split is the right primitive when both regions stay
          visible and the user controls the ratio.
        </li>
        <li>
          <a routerLink="/components/separator" class="text-primary-600 hover:underline"
            >Separator</a
          >
          — a non-interactive visual divider. Use it when there is nothing to resize.
        </li>
      </ul>
    </section>
  `,
})
export class SplitOverview {
  protected readonly basicUsageSnippet = `<tw-split direction="horizontal">
  <tw-split-pane [defaultSize]="30" [minSize]="15">
    <div class="p-4">Sidebar</div>
  </tw-split-pane>
  <tw-split-pane [defaultSize]="70">
    <div class="p-4">Main content</div>
  </tw-split-pane>
</tw-split>`;

  protected readonly importSnippet = `import { SplitComponent, SplitPaneComponent } from '@cdevhub/ngx-tw/split';`;
}
