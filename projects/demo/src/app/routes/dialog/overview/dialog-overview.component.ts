import { ChangeDetectionStrategy, Component, inject, type TemplateRef, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TwDialog,
  DialogActionsDirective,
  DialogCloseDirective,
  DialogContentDirective,
  DialogSubtitleDirective,
  DialogTitleDirective,
} from '@cdevhub/ngx-tw/dialog';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-dialog-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    DialogTitleDirective,
    DialogSubtitleDirective,
    DialogContentDirective,
    DialogActionsDirective,
    DialogCloseDirective,
    CodeBlockComponent,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Dialog service opens a modal surface anchored to the viewport center, implementing the
        WAI-ARIA dialog pattern on top of
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#64;angular/cdk/dialog</code>.
        It inherits focus trapping, restore focus, scroll blocking, and ARIA plumbing from the CDK,
        and layers on a Tailwind-styled container, size presets, coordinated enter/exit animation,
        a reactive state signal, and layout directives for header, content, actions, and dismiss
        buttons.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The container renders with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="dialog"</code>
        (or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">"alertdialog"</code>
        for destructive confirmations) and ships with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-modal="true"</code>
        by default so the rest of the page is treated as inert by assistive tech. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twDialogTitle</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twDialogDescription</code>
        directives auto-register their ids with the container's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>
        queues, so the dialog always has an accessible name and description as long as you render a
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
              <td class="px-4 py-2 text-fg-muted">Cycles focus among tabbable descendants; focus stays inside the dialog.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Closes the dialog unless <code class="font-mono">disableClose</code> or a <code class="font-mono">closePredicate</code> blocks it.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Activates the focused button, including elements bound to <code class="font-mono">[twDialogClose]</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Click backdrop</td>
              <td class="px-4 py-2 text-fg-muted">Closes the dialog unless <code class="font-mono">disableClose</code> or a <code class="font-mono">closePredicate</code> blocks it.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton (click)="openBasic()">Open keyboard shortcuts</button>

        <ng-template #basicTpl>
          <div twDialogContent>
            <h2 twDialogTitle>Keyboard shortcuts</h2>
            <p twDialogSubtitle class="mt-1">Press these anywhere in the app.</p>
            <dl class="mt-5 divide-y divide-border-muted text-sm">
              <div class="flex items-center justify-between py-2.5">
                <dt class="text-fg">Open command palette</dt>
                <dd class="flex items-center gap-1">
                  <kbd class="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md border border-border bg-surface-muted font-mono text-xs text-fg">⌘</kbd>
                  <kbd class="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md border border-border bg-surface-muted font-mono text-xs text-fg">K</kbd>
                </dd>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <dt class="text-fg">Quick find</dt>
                <dd>
                  <kbd class="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md border border-border bg-surface-muted font-mono text-xs text-fg">/</kbd>
                </dd>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <dt class="text-fg">Toggle theme</dt>
                <dd class="flex items-center gap-1">
                  <kbd class="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md border border-border bg-surface-muted font-mono text-xs text-fg">⇧</kbd>
                  <kbd class="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md border border-border bg-surface-muted font-mono text-xs text-fg">T</kbd>
                </dd>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <dt class="text-fg">Close dialog</dt>
                <dd>
                  <kbd class="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md border border-border bg-surface-muted font-mono text-xs text-fg">Esc</kbd>
                </dd>
              </div>
            </dl>
          </div>
          <div twDialogActions>
            <button twButton variant="ghost" twDialogClose>Close</button>
            <button twButton [twDialogClose]="'open-palette'">Open palette</button>
          </div>
        </ng-template>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="basicUsageTsSnippet" language="ts" />
        <tw-code-block [code]="basicUsageHtmlSnippet" language="html" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwDialog</code>
        service is not provided in root — register it once in the app providers with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideTwDialog()</code>,
        passing any application-wide defaults. Layout directives and tokens are imported per
        component as needed.
      </p>
      <div class="space-y-3">
        <tw-code-block [code]="provideSnippet" language="ts" />
        <tw-code-block [code]="importSnippet" language="ts" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>6 size presets: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">fullscreen</code></li>
        <li>Template or component content via CDK Portals</li>
        <li>Reactive <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">state()</code> signal (opening / open / closing / closed)</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterOpened()</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">beforeClosed()</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterClosed()</code> observables</li>
        <li>Typed result payload on <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close(result)</code></li>
        <li>Focus trap + restore focus inherited from CDK</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="dialog"</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">"alertdialog"</code> with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code> wired by the title directive</li>
        <li>Configurable scroll behavior: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">block</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reposition</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">noop</code></li>
        <li>Close guards via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">closePredicate</code></li>
        <li>Layout directives for header, content, actions, and dismiss</li>
        <li>Per-call animation durations (or disable with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">0</code>)</li>
        <li>Multi-dialog stacking, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">openDialogs</code> signal, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">closeAll()</code>, and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterAllClosed</code></li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/popover" class="text-primary-600 hover:underline">Popover</a>
          — a non-modal anchored surface for contextual content that shouldn't interrupt.
        </li>
        <li>
          <a routerLink="/components/menu" class="text-primary-600 hover:underline">Menu</a>
          — transient command lists that attach to a trigger and close on selection.
        </li>
        <li>
          <a routerLink="/components/toast" class="text-primary-600 hover:underline">Toast</a>
          — ephemeral, non-blocking notifications for confirmations and status updates.
        </li>
        <li>
          <a routerLink="/components/alert" class="text-primary-600 hover:underline">Alert</a>
          — inline messaging that lives in the page flow rather than a modal layer.
        </li>
      </ul>
    </section>
  `,
})
export class DialogOverview {
  private readonly dialog = inject(TwDialog);
  protected readonly basicTpl = viewChild.required<TemplateRef<unknown>>('basicTpl');

  protected openBasic(): void {
    this.dialog.open(this.basicTpl());
  }

  protected readonly basicUsageTsSnippet = `private readonly dialog = inject(TwDialog);
protected readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');

protected open(): void {
  this.dialog.open(this.tpl(), { size: 'md' });
}`;

  protected readonly basicUsageHtmlSnippet = `<button twButton (click)="open()">Open keyboard shortcuts</button>

<ng-template #tpl>
  <div twDialogContent>
    <h2 twDialogTitle>Keyboard shortcuts</h2>
    <p twDialogSubtitle>Press these anywhere in the app.</p>
    <dl class="mt-5 divide-y divide-border-muted text-sm">
      <div class="flex items-center justify-between py-2.5">
        <dt class="text-fg">Open command palette</dt>
        <dd><kbd>⌘</kbd> <kbd>K</kbd></dd>
      </div>
      <!-- … -->
    </dl>
  </div>
  <div twDialogActions>
    <button twButton variant="ghost" twDialogClose>Close</button>
    <button twButton [twDialogClose]="'open-palette'">Open palette</button>
  </div>
</ng-template>`;

  protected readonly provideSnippet = `import { provideTwDialog } from '@cdevhub/ngx-tw/dialog';

export const appConfig: ApplicationConfig = {
  providers: [provideTwDialog({ size: 'md' })],
};`;

  protected readonly importSnippet = `import {
  TwDialog,
  TwDialogRef,
  TW_DIALOG_DATA,
  DialogTitleDirective,
  DialogSubtitleDirective,
  DialogDescriptionDirective,
  DialogContentDirective,
  DialogActionsDirective,
  DialogCloseDirective,
  DialogHeaderDirective,
  DialogIconDirective,
} from '@cdevhub/ngx-tw/dialog';`;
}
