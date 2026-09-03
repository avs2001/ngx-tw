import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Sheet,
  TW_SHEET_DATA,
  SheetActionsDirective,
  SheetCloseDirective,
  SheetContentDirective,
  SheetHeaderDirective,
  SheetSubtitleDirective,
  SheetTitleDirective,
} from '@cdevhub/ngx-tw/sheet';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

/** Inline content used by the overview's quick-demo buttons. */
@Component({
  selector: 'app-sheet-overview-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    SheetHeaderDirective,
    SheetTitleDirective,
    SheetSubtitleDirective,
    SheetContentDirective,
    SheetActionsDirective,
    SheetCloseDirective,
  ],
  template: `
    <div twSheetHeader>
      <div class="flex-1 min-w-0">
        <h2 twSheetTitle>{{ data.side }} sheet</h2>
        <p twSheetSubtitle>This panel is anchored to the {{ data.side }} edge of the viewport.</p>
      </div>
    </div>
    <div twSheetContent>
      <p>
        Press <kbd class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Esc</kbd> or click outside to close.
      </p>
    </div>
    <div twSheetActions>
      <button twButton variant="ghost" twSheetClose>Cancel</button>
      <button twButton [twSheetClose]="'ok'">Done</button>
    </div>
  `,
})
class QuickStartSheetContent {
  protected readonly data = inject<{ side: string }>(TW_SHEET_DATA);
}

@Component({
  selector: 'app-sheet-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Sheet service opens a modal panel anchored to one of the four viewport edges. It
        implements the same WAI-ARIA dialog pattern as
        <a routerLink="/components/dialog/overview" class="text-primary-600 hover:underline">Dialog</a>
        but uses a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">GlobalPositionStrategy</code>
        pinned to the edge instead of centering the panel. It slides in along the docking axis
        and supports axis-aware sizing presets.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The container renders with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="dialog"</code>,
        ships with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-modal="true"</code>
        by default, traps focus via CDK FocusTrap, and restores focus to the previously focused
        element on close. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twSheetTitle</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twSheetDescription</code>
        directives auto-register their ids with the container's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>
        queues, so the sheet always has an accessible name and description as long as you render a
        titled header — otherwise pass
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaLabel</code>
        in the config.
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
              <td class="px-4 py-2 font-mono text-xs">Tab / Shift + Tab</td>
              <td class="px-4 py-2 text-fg-muted">Cycles focus among tabbable descendants; focus stays inside the sheet.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Closes the sheet unless <code class="font-mono">closeOnEscape: false</code> or <code class="font-mono">disableClose</code> blocks it.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Click a button to open a sheet anchored to that edge. The same
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Sheet.open()</code>
        call services every side — only the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">side</code>
        config changes.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap gap-2">
          <button twButton variant="outline" (click)="openSide('top')">Open top</button>
          <button twButton variant="outline" (click)="openSide('right')">Open right</button>
          <button twButton variant="outline" (click)="openSide('bottom')">Open bottom</button>
          <button twButton variant="outline" (click)="openSide('left')">Open left</button>
        </div>
      </div>
      <tw-code-block language="ts" [code]="quickStartCode" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Sheet</code>
        service is not provided in root — register it once in the app providers with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideSheet()</code>,
        passing any application-wide defaults. Slot directives and tokens are imported per
        component as needed.
      </p>
      <div class="space-y-3">
        <tw-code-block [code]="provideSnippet" language="ts" />
        <tw-code-block [code]="importSnippet" language="ts" />
      </div>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>4 anchor sides: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">top</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">right</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bottom</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">left</code></li>
        <li>Axis-aware size presets — <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code> → <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">full</code> control width on horizontal sheets and height on vertical sheets</li>
        <li>Template or component content via CDK Portals</li>
        <li>Slide enter/exit transitions with per-call durations (or disable with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">0</code>)</li>
        <li>Reactive <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">state()</code> signal (opening / open / closing / closed)</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterOpened()</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">beforeClosed()</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterClosed()</code> observables</li>
        <li>Typed result payload on <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close(result)</code> and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSheetClose]</code></li>
        <li>Focus trap + restore focus inherited from CDK</li>
        <li>Split close-behavior flags: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">closeOnEscape</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">closeOnBackdropClick</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disableClose</code></li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="dialog"</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">"alertdialog"</code> with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code> auto-wired by the title and description directives</li>
        <li>Configurable scroll behavior: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">block</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reposition</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">noop</code></li>
        <li>Close guards via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">closePredicate</code></li>
        <li>Layout directives for header, icon, title, subtitle/description, content, actions, and dismiss</li>
        <li>Multi-sheet stacking with an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">openSheets</code> signal, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">closeAll()</code>, and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterAllClosed</code></li>
      </ul>
    </section>
  `,
})
export class SheetOverview {
  private readonly sheet = inject(Sheet);

  protected readonly quickStartCode = `import { inject } from '@angular/core';
import { Sheet } from '@cdevhub/ngx-tw/sheet';

const sheet = inject(Sheet);
const ref = sheet.open(MyComponent, { side: 'right', size: 'md' });
ref.afterClosed().subscribe((result) => {
  // result is whatever you passed to close() or [twSheetClose]
});`;

  protected readonly provideSnippet = `import { provideSheet } from '@cdevhub/ngx-tw/sheet';

bootstrapApplication(AppComponent, {
  providers: [
    provideSheet({ side: 'right', size: 'md' }), // optional defaults
  ],
});`;

  protected readonly importSnippet = `import {
  Sheet,
  TW_SHEET_DATA,
  SheetHeaderDirective,
  SheetIconDirective,
  SheetTitleDirective,
  SheetSubtitleDirective,
  SheetDescriptionDirective,
  SheetContentDirective,
  SheetActionsDirective,
  SheetCloseDirective,
} from '@cdevhub/ngx-tw/sheet';`;

  protected openSide(side: 'top' | 'right' | 'bottom' | 'left'): void {
    this.sheet.open(QuickStartSheetContent, { side, size: 'md', data: { side } });
  }
}
