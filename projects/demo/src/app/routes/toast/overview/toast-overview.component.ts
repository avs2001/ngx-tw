import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '@cdevhub/ngx-tw/toast';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-toast-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Toast service opens transient, non-modal notifications anchored to a screen corner.
        Built on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#64;angular/cdk/overlay</code>,
        it creates one overlay per
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ToastPosition</code>
        on first use, stacks toasts vertically inside each position, and exposes a rich
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ToastRef</code>
        handle you can use to pause, update, or dismiss from the outside. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">promise()</code>
        helper is a first-class pattern — pass a promise and it renders loading → success / error
        with the same ref.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Every toast position has a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="region"</code>
        container with an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        (default: "Notifications"). Individual toasts carry
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="alert"</code>
        when severity is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="status"</code>
        otherwise, so assistive tech interrupts the user only for genuine errors. Content is also
        announced through CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>
        at open time and on every
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">update()</code>
        — so the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">promise()</code>
        helper re-announces when the state flips.
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
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus into the region; each toast's dismiss and action buttons are reachable.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Dismisses the currently focused toast with reason <code class="font-mono">'manual'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Hover / focus</td>
              <td class="px-4 py-2 text-fg-muted">Pauses the auto-dismiss timer when <code class="font-mono">pauseOnInteraction</code> is true (default).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Pointer swipe</td>
              <td class="px-4 py-2 text-fg-muted">Horizontal drag past the threshold dismisses with reason <code class="font-mono">'swipe'</code>; disabled under <code class="font-mono">prefers-reduced-motion</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">LiveAnnouncer</td>
              <td class="px-4 py-2 text-fg-muted">Announces new toasts and updated content; politeness is severity-derived (error → assertive, else polite).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Reduced motion</td>
              <td class="px-4 py-2 text-fg-muted">Enter / leave animations shorten and swipe gestures are suppressed.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">When to use</h2>
      <div class="grid gap-4 md:grid-cols-2 max-w-2xl">
        <div>
          <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-2">Use a Toast when</p>
          <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
            <li>The feedback is transient and doesn't need to persist</li>
            <li>The message is global (not tied to a page region)</li>
            <li>Multiple messages need to stack over time</li>
            <li>You're announcing the result of an async action</li>
          </ul>
        </div>
        <div>
          <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-2">Prefer an Alert when</p>
          <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
            <li>The message is anchored to a specific region of the page</li>
            <li>Users need to re-read it at any time</li>
            <li>The message stays until the user addresses it</li>
            <li>The feedback is validation tied to a specific form field</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Setup</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Register
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideToast</code>
        in your application's providers — optionally pass an options object to set app-wide
        defaults like position, duration, or the region aria-label. The service is intentionally
        not
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">providedIn: 'root'</code>
        so you opt in explicitly.
      </p>
      <tw-code-block [code]="setupSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-2">
          <button twButton variant="outline" (click)="toast.info('Fetching the latest build.')">info()</button>
          <button twButton variant="outline" color="success" (click)="toast.success('Saved successfully.')">success()</button>
          <button twButton variant="outline" color="warning" (click)="toast.warning('Disk is almost full.')">warning()</button>
          <button twButton variant="outline" color="error" (click)="toast.error('Something went wrong.')">error()</button>
        </div>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>5 severities: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">info / success / warning / error / neutral</code> with semantic color tokens</li>
        <li>6 positions — each gets its own lazy CDK overlay with a dedicated <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="region"</code> container</li>
        <li>Stacks multiple toasts vertically; oldest is evicted with reason <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'max-exceeded'</code> past <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxVisible</code></li>
        <li>Pause auto-dismiss on hover / focus via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pauseOnInteraction</code> (default on)</li>
        <li>Horizontal swipe-to-dismiss with pointer gestures</li>
        <li>Escape key on a focused toast dismisses it</li>
        <li>String, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TemplateRef</code>, or component-class content</li>
        <li>Action button with optional handler, or defaults to dismiss with reason <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'action'</code></li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">promise()</code> helper — loading → success / error with re-announcement</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ToastRef</code> exposes <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dismiss()</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pause()</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">resume()</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">update()</code>, and lifecycle observables</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code> integration with severity-derived politeness</li>
        <li>Respects <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code> on enter / leave animations and swipe</li>
        <li>Safe-area inset padding on the overlay pane for iOS notches and bottom bars</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/alert" class="text-primary-600 hover:underline">Alert</a>
          — use for persistent, page-anchored status messages the user may re-read.
        </li>
        <li>
          <a routerLink="/components/dialog" class="text-primary-600 hover:underline">Dialog</a>
          — use when the feedback must block the rest of the page until the user responds.
        </li>
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — prefer its built-in error region for field-level validation feedback.
        </li>
      </ul>
    </section>
  `,
})
export class ToastOverview {
  protected readonly toast = inject(ToastService);

  protected readonly setupSnippet = `import { provideToast } from '@cdevhub/ngx-tw/toast';

export const appConfig: ApplicationConfig = {
  providers: [
    provideToast({ position: 'bottom-right', duration: 4000 }),
  ],
};`;

  protected readonly basicUsageSnippet = `const toast = inject(ToastService);

toast.info('Fetching the latest build.');
toast.success('Saved successfully.');
toast.warning('Disk is almost full.');
toast.error('Something went wrong.');`;

  protected readonly importSnippet = `import {
  ToastService,
  ToastRef,
  TW_TOAST_DATA,
  TW_TOAST_REF,
  provideToast,
} from '@cdevhub/ngx-tw/toast';`;
}
