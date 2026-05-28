import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SplitComponent, SplitPaneComponent } from 'ngx-tw/split';
import type { SplitCollapseEvent } from 'ngx-tw/split';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import { ButtonDirective } from 'ngx-tw/button';

@Component({
  selector: 'app-split-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitComponent, SplitPaneComponent, CodeBlockComponent, ButtonDirective],
  template: `
    <!-- Horizontal -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Horizontal</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The default direction. Two panes share the horizontal axis; drag the vertical gutter or
        focus it and use the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">←</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">→</code> keys to
        resize.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised mb-4 h-56 overflow-hidden">
        <tw-split>
          <tw-split-pane [defaultSize]="40" [minSize]="15">
            <div class="p-4 text-sm text-fg-muted">Left</div>
          </tw-split-pane>
          <tw-split-pane [defaultSize]="60">
            <div class="p-4 text-sm text-fg-muted">Right</div>
          </tw-split-pane>
        </tw-split>
      </div>
      <tw-code-block [code]="horizontalSnippet" language="html" />
    </section>

    <!-- Vertical -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Vertical</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">direction="vertical"</code>
        to stack panes top-to-bottom. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">↑</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">↓</code> on the
        focused gutter.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised mb-4 h-72 overflow-hidden">
        <tw-split direction="vertical">
          <tw-split-pane [defaultSize]="35">
            <div class="p-4 text-sm text-fg-muted">Top</div>
          </tw-split-pane>
          <tw-split-pane [defaultSize]="65">
            <div class="p-4 text-sm text-fg-muted">Bottom</div>
          </tw-split-pane>
        </tw-split>
      </div>
      <tw-code-block [code]="verticalSnippet" language="html" />
    </section>

    <!-- Three panes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Three panes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Any number of panes is supported. Each gutter only affects the two panes immediately
        adjacent to it.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised mb-4 h-56 overflow-hidden">
        <tw-split>
          <tw-split-pane [defaultSize]="25" [minSize]="10">
            <div class="p-4 text-sm text-fg-muted">Files</div>
          </tw-split-pane>
          <tw-split-pane [defaultSize]="50" [minSize]="20">
            <div class="p-4 text-sm text-fg-muted">Editor</div>
          </tw-split-pane>
          <tw-split-pane [defaultSize]="25" [minSize]="10">
            <div class="p-4 text-sm text-fg-muted">Preview</div>
          </tw-split-pane>
        </tw-split>
      </div>
      <tw-code-block [code]="threePaneSnippet" language="html" />
    </section>

    <!-- Min / Max -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Min / Max constraints</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minSize</code> and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxSize</code> are
        applied at every commit — drag, keyboard, programmatic — so the gutter physically cannot
        cross those bounds.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised mb-4 h-56 overflow-hidden">
        <tw-split>
          <tw-split-pane [defaultSize]="30" [minSize]="20" [maxSize]="50">
            <div class="p-4 text-sm text-fg-muted">
              <p class="font-medium text-fg mb-1">Constrained</p>
              <p>Locked between 20% and 50%.</p>
            </div>
          </tw-split-pane>
          <tw-split-pane>
            <div class="p-4 text-sm text-fg-muted">Free</div>
          </tw-split-pane>
        </tw-split>
      </div>
      <tw-code-block [code]="minMaxSnippet" language="html" />
    </section>

    <!-- Collapsible -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Collapsible pane</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Mark a pane with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">collapsible</code> and
        optionally a rail-style
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">collapsedSize</code>.
        Programmatic API:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">collapse(0)</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">expand(0)</code>.
        From the keyboard, focus the gutter and press
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Enter</code> to toggle
        the left pane.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised mb-4 overflow-hidden">
        <div class="h-56">
          <tw-split #collapsibleSplit (collapseChange)="onCollapseChange($event)">
            <tw-split-pane
              [defaultSize]="30"
              [minSize]="20"
              [collapsible]="true"
              [collapsedSize]="6"
              [snapSize]="6"
            >
              <div class="p-4 text-sm text-fg-muted">
                <p class="font-medium text-fg mb-1">Sidebar</p>
                <p>Drag the gutter near 0 to snap-collapse.</p>
              </div>
            </tw-split-pane>
            <tw-split-pane>
              <div class="p-4 text-sm text-fg-muted">Main</div>
            </tw-split-pane>
          </tw-split>
        </div>
        <div class="flex items-center gap-2 border-t border-border bg-surface-muted px-4 py-2">
          <button twButton variant="outline" size="sm" (click)="collapsibleSplit.collapse(0)">
            Collapse
          </button>
          <button twButton variant="outline" size="sm" (click)="collapsibleSplit.expand(0)">
            Expand
          </button>
          <span class="ml-auto text-xs text-fg-muted">
            Last event: {{ collapseStatus() }}
          </span>
        </div>
      </div>
      <tw-code-block [code]="collapsibleSnippet" language="html" />
    </section>

    <!-- Persistence -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Persisted sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">storageKey</code> and
        the container will read the saved sizes on init and write back on every committed resize.
        Try dragging the gutter, then reload the page.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised mb-4 overflow-hidden">
        <div class="h-56">
          <tw-split storageKey="demo-split-example">
            <tw-split-pane [defaultSize]="50" [minSize]="15">
              <div class="p-4 text-sm text-fg-muted">Left</div>
            </tw-split-pane>
            <tw-split-pane [defaultSize]="50" [minSize]="15">
              <div class="p-4 text-sm text-fg-muted">Right</div>
            </tw-split-pane>
          </tw-split>
        </div>
        <div class="flex items-center gap-2 border-t border-border bg-surface-muted px-4 py-2">
          <button twButton variant="outline" size="sm" (click)="clearPersistence()">
            Clear storage
          </button>
          <span class="ml-auto text-xs text-fg-muted font-mono">
            localStorage["demo-split-example"]
          </span>
        </div>
      </div>
      <tw-code-block [code]="persistenceSnippet" language="html" />
    </section>

    <!-- Pixel mode -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Pixel mode</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">unit="pixel"</code>
        when pane sizes should be expressed in pixels. On container resize the panes scale
        proportionally; per-pane min/max still apply.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised mb-4 h-56 overflow-hidden">
        <tw-split unit="pixel">
          <tw-split-pane [defaultSize]="240" [minSize]="120">
            <div class="p-4 text-sm text-fg-muted">240 px</div>
          </tw-split-pane>
          <tw-split-pane [defaultSize]="320">
            <div class="p-4 text-sm text-fg-muted">Remainder</div>
          </tw-split-pane>
        </tw-split>
      </div>
      <tw-code-block [code]="pixelSnippet" language="html" />
    </section>

    <!-- RTL -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">RTL</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The container reads the ambient
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dir</code> attribute
        via CDK and flips horizontal arrow-key direction so it tracks the visual edge being moved.
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rtl</code> directly to
        force RTL behaviour independent of the ancestor.
      </p>
      <div
        dir="rtl"
        class="rounded-lg border border-border bg-surface-raised mb-4 h-56 overflow-hidden"
      >
        <tw-split>
          <tw-split-pane [defaultSize]="35" [minSize]="15">
            <div class="p-4 text-sm text-fg-muted" dir="ltr">First in source order</div>
          </tw-split-pane>
          <tw-split-pane>
            <div class="p-4 text-sm text-fg-muted" dir="ltr">Second in source order</div>
          </tw-split-pane>
        </tw-split>
      </div>
      <tw-code-block [code]="rtlSnippet" language="html" />
    </section>

    <!-- Programmatic -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Programmatic control</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Grab the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">SplitComponent</code>
        via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">viewChild</code> and
        call
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setSizes()</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reset()</code> to
        drive the container from code.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised mb-4 overflow-hidden">
        <div class="h-56">
          <tw-split #api>
            <tw-split-pane [defaultSize]="50">
              <div class="p-4 text-sm text-fg-muted">A</div>
            </tw-split-pane>
            <tw-split-pane [defaultSize]="50">
              <div class="p-4 text-sm text-fg-muted">B</div>
            </tw-split-pane>
          </tw-split>
        </div>
        <div class="flex items-center gap-2 border-t border-border bg-surface-muted px-4 py-2">
          <button twButton variant="outline" size="sm" (click)="api.setSizes([20, 80])">20 / 80</button>
          <button twButton variant="outline" size="sm" (click)="api.setSizes([50, 50])">50 / 50</button>
          <button twButton variant="outline" size="sm" (click)="api.setSizes([80, 20])">80 / 20</button>
          <button twButton variant="ghost" size="sm" (click)="api.reset()">Reset</button>
        </div>
      </div>
      <tw-code-block [code]="programmaticSnippet" language="ts" />
    </section>
  `,
})
export class SplitExamples {
  protected readonly collapseStatus = signal('—');

  protected clearPersistence(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('demo-split-example');
  }

  protected onCollapseChange(event: SplitCollapseEvent): void {
    this.collapseStatus.set(`${event.collapsed ? 'collapsed' : 'expanded'} (${event.cause})`);
  }

  protected readonly horizontalSnippet = `<tw-split>
  <tw-split-pane [defaultSize]="40" [minSize]="15">Left</tw-split-pane>
  <tw-split-pane [defaultSize]="60">Right</tw-split-pane>
</tw-split>`;

  protected readonly verticalSnippet = `<tw-split direction="vertical">
  <tw-split-pane [defaultSize]="35">Top</tw-split-pane>
  <tw-split-pane [defaultSize]="65">Bottom</tw-split-pane>
</tw-split>`;

  protected readonly threePaneSnippet = `<tw-split>
  <tw-split-pane [defaultSize]="25" [minSize]="10">Files</tw-split-pane>
  <tw-split-pane [defaultSize]="50" [minSize]="20">Editor</tw-split-pane>
  <tw-split-pane [defaultSize]="25" [minSize]="10">Preview</tw-split-pane>
</tw-split>`;

  protected readonly minMaxSnippet = `<tw-split>
  <tw-split-pane [defaultSize]="30" [minSize]="20" [maxSize]="50">Constrained</tw-split-pane>
  <tw-split-pane>Free</tw-split-pane>
</tw-split>`;

  protected readonly collapsibleSnippet = `<tw-split>
  <tw-split-pane
    [defaultSize]="30"
    [minSize]="20"
    [collapsible]="true"
    [collapsedSize]="6"
    [snapSize]="6"
  >Sidebar</tw-split-pane>
  <tw-split-pane>Main</tw-split-pane>
</tw-split>

// In the component:
split.collapse(0);
split.expand(0);`;

  protected readonly persistenceSnippet = `<tw-split storageKey="my-app-split">
  <tw-split-pane [defaultSize]="50">Left</tw-split-pane>
  <tw-split-pane [defaultSize]="50">Right</tw-split-pane>
</tw-split>`;

  protected readonly pixelSnippet = `<tw-split unit="pixel">
  <tw-split-pane [defaultSize]="240" [minSize]="120">240 px</tw-split-pane>
  <tw-split-pane [defaultSize]="320">Remainder</tw-split-pane>
</tw-split>`;

  protected readonly rtlSnippet = `<div dir="rtl">
  <tw-split>
    <tw-split-pane [defaultSize]="35">First in source order</tw-split-pane>
    <tw-split-pane>Second in source order</tw-split-pane>
  </tw-split>
</div>`;

  protected readonly programmaticSnippet = `@Component({ /* ... */ })
class MyComponent {
  private readonly split = viewChild.required(SplitComponent);

  resize80_20(): void {
    this.split().setSizes([80, 20]);
  }

  resetSplit(): void {
    this.split().reset();
  }
}`;
}
