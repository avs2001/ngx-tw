import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-toast-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- ToastService -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ToastService</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Provided via: provideToast()</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Signature</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">show</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">show(content, config?): ToastRef</td>
              <td class="px-4 py-2 text-fg-muted">Opens a toast with string, <code class="font-mono">TemplateRef</code>, or component-class content.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">info</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">info(message, config?): ToastRef</td>
              <td class="px-4 py-2 text-fg-muted">Shorthand that forces <code class="font-mono">severity: 'info'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">success</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">success(message, config?): ToastRef</td>
              <td class="px-4 py-2 text-fg-muted">Shorthand that forces <code class="font-mono">severity: 'success'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">warning</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">warning(message, config?): ToastRef</td>
              <td class="px-4 py-2 text-fg-muted">Shorthand that forces <code class="font-mono">severity: 'warning'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">error</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">error(message, config?): ToastRef</td>
              <td class="px-4 py-2 text-fg-muted">Shorthand that forces <code class="font-mono">severity: 'error'</code> and <code class="font-mono">politeness: 'assertive'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">promise</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">promise(promise, messages, config?): ToastRef</td>
              <td class="px-4 py-2 text-fg-muted">Opens a pinned loading toast and swaps its severity / content when the promise settles.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dismiss</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">dismiss(id): void</td>
              <td class="px-4 py-2 text-fg-muted">Dismisses a single toast by id; no-op if no matching toast is active.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dismissAll</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">dismissAll(): void</td>
              <td class="px-4 py-2 text-fg-muted">Dismisses every active toast across every position.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">getToastById</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">getToastById(id): ToastRef | undefined</td>
              <td class="px-4 py-2 text-fg-muted">Returns the matching active toast ref, or undefined if no toast with that id is open.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Properties</h3>
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
              <td class="px-4 py-2 font-mono text-xs">activeToasts</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;readonly ToastRef[]&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Reactive list of every toast that has not yet fully dismissed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterOpened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Observable&lt;ToastRef&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits every time a new toast opens.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterAllDismissed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Observable&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits when the active-toasts list transitions back to empty.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- provideToast -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">provideToast</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Signature: provideToast(defaultOptions?: Partial&lt;ToastConfig&gt;): EnvironmentProviders</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Environment-providers helper that registers
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ToastService</code>
        and, when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">defaultOptions</code>
        is provided, installs them as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_TOAST_DEFAULT_OPTIONS</code>
        for every call.
      </p>
    </section>

    <!-- ToastConfig -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ToastConfig</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Per-call configuration — also the payload type of TW_TOAST_DEFAULT_OPTIONS</p>
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
              <td class="px-4 py-2 font-mono text-xs">severity</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ToastSeverity</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'info'</td>
              <td class="px-4 py-2 text-fg-muted">Severity variant. Drives color palette, default icon, and ARIA role / live politeness. Defaults to <code class="font-mono">'info'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">position</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ToastPosition</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'bottom-right'</td>
              <td class="px-4 py-2 text-fg-muted">Screen anchor for the toast stack; one of six top/bottom × left/center/right values.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">duration</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">5000</td>
              <td class="px-4 py-2 text-fg-muted">Auto-dismiss delay in milliseconds; 0 pins the toast indefinitely.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dismissible</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether the × close button renders on the toast panel.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">politeness</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'polite' | 'assertive' | 'off'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(severity-derived)</td>
              <td class="px-4 py-2 text-fg-muted">Live-region politeness used by LiveAnnouncer; errors default to assertive.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">action</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ToastAction</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Action button; handler receives the ref, or omit handler to dismiss with reason <code class="font-mono">'action'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">data</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Payload injected into template / component content via <code class="font-mono">TW_TOAST_DATA</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Extra CSS classes merged onto the toast panel root via <code class="font-mono">twMerge</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">icon</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | TemplateRef&lt;void&gt; | false</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(severity-derived)</td>
              <td class="px-4 py-2 text-fg-muted">Icon override — string text glyph, TemplateRef, or false to hide the icon entirely.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">pauseOnInteraction</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Pauses the auto-dismiss timer while the toast is hovered or focused.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">swipeToDismiss</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Enables horizontal pointer swipe to dismiss; disabled under prefers-reduced-motion.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxVisible</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">5</td>
              <td class="px-4 py-2 text-fg-muted">Cap on visible toasts per position; oldest is evicted with reason <code class="font-mono">'max-exceeded'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(auto)</td>
              <td class="px-4 py-2 text-fg-muted">Explicit id; useful for <code class="font-mono">getToastById</code> lookups.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(text content)</td>
              <td class="px-4 py-2 text-fg-muted">Accessible label for the toast wrapper; defaults to the rendered text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">regionAriaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Notifications'</td>
              <td class="px-4 py-2 text-fg-muted">Label applied to each position's <code class="font-mono">role="region"</code> container; set via <code class="font-mono">provideToast</code> defaults.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ToastRef -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ToastRef</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Returned by every ToastService open method</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Properties</h3>
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
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 text-fg-muted">Stable identifier used by <code class="font-mono">getToastById</code> and <code class="font-mono">dismiss</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">config</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Readonly&lt;ToastConfig&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Static resolved configuration for the toast (defaults merged, severity shorthand applied).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">state</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;ToastState&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Reactive lifecycle state: <code class="font-mono">'entering'</code>, <code class="font-mono">'visible'</code>, <code class="font-mono">'paused'</code>, <code class="font-mono">'dismissing'</code>, or <code class="font-mono">'dismissed'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">severity / content / action / icon / dismissible / ariaLabel / data</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;…&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Reactive mirrors of the live config; updated in place by <code class="font-mono">update()</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">componentInstance</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">C | null</td>
              <td class="px-4 py-2 text-fg-muted">Instance of the projected component (only populated for component-class content).</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Signature</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dismiss</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">dismiss(result?): void</td>
              <td class="px-4 py-2 text-fg-muted">Programmatic dismiss; plays the leave animation and emits <code class="font-mono">afterDismissed</code> with reason <code class="font-mono">'programmatic'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">pause</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">pause(): void</td>
              <td class="px-4 py-2 text-fg-muted">Pauses the auto-dismiss timer; called automatically on hover / focus when <code class="font-mono">pauseOnInteraction</code> is true.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">resume</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">resume(): void</td>
              <td class="px-4 py-2 text-fg-muted">Resumes the auto-dismiss timer with the remaining time.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">triggerAction</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">triggerAction(): void</td>
              <td class="px-4 py-2 text-fg-muted">Invokes the action handler, or dismisses with reason <code class="font-mono">'action'</code> if no handler is configured.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">update</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">update(patch: ToastUpdatePatch): void</td>
              <td class="px-4 py-2 text-fg-muted">Mutates severity / content / duration / action / icon in place; re-announces through LiveAnnouncer.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterOpened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">afterOpened(): Observable&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits once after the enter animation completes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">beforeDismissed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">beforeDismissed(): Observable&lt;R | undefined&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits once when the dismiss sequence starts, carrying the optional result.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterDismissed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">afterDismissed(): Observable&lt;ToastDismissal&lt;R&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits once after the leave animation finishes, carrying the dismiss reason and optional result.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ToastComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ToastComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-toast</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Visual toast / snackbar panel. Used internally by
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ToastService</code>
        for string content; also exported so consumers can compose the same visual inside a custom
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TemplateRef</code>
        or component class.
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
              <td class="px-4 py-2 font-mono text-xs">severity</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ToastSeverity</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'info'</td>
              <td class="px-4 py-2 text-fg-muted">Drives the color palette, default icon, and ARIA role / live politeness.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dismissible</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether the × close button is rendered.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">icon</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | false | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Icon override — string text glyph, or false to hide the severity-default icon.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Explicit aria-label for the wrapper; defaults to the rendered text content.</td>
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
              <td class="px-4 py-2 font-mono text-xs">dismissed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the close button is clicked.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">actionClicked</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when a projected <code class="font-mono">[twToastAction]</code> button is clicked.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Slots</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Required</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Cardinality</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twToastIcon]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Custom icon that overrides the severity-default glyph; automatically marked <code class="font-mono">aria-hidden</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twToastTitle]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Bold heading line rendered above the description.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twToastDescription]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Secondary description line rendered under the title.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twToastAction]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 font-mono text-fg-muted">Single action button with severity-aware styling; wires clicks to the <code class="font-mono">actionClicked</code> output.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Dismiss reasons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Dismiss reasons</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Every
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterDismissed()</code>
        payload includes a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reason</code>
        so you can distinguish user closes from system closes.
      </p>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Reason</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Triggered by</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr><td class="px-4 py-2 font-mono text-xs">'timeout'</td><td class="px-4 py-2 text-fg-muted">Auto-dismiss timer fired.</td></tr>
            <tr><td class="px-4 py-2 font-mono text-xs">'manual'</td><td class="px-4 py-2 text-fg-muted">User pressed × or Escape.</td></tr>
            <tr><td class="px-4 py-2 font-mono text-xs">'action'</td><td class="px-4 py-2 text-fg-muted">Action button clicked with no custom handler.</td></tr>
            <tr><td class="px-4 py-2 font-mono text-xs">'swipe'</td><td class="px-4 py-2 text-fg-muted">Pointer swipe crossed the dismiss threshold.</td></tr>
            <tr><td class="px-4 py-2 font-mono text-xs">'programmatic'</td><td class="px-4 py-2 text-fg-muted">Consumer called <code class="font-mono">ref.dismiss()</code>.</td></tr>
            <tr><td class="px-4 py-2 font-mono text-xs">'max-exceeded'</td><td class="px-4 py-2 text-fg-muted">Oldest toast evicted because <code class="font-mono">maxVisible</code> was reached.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Injection tokens -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Injection Tokens</h2>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Token</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Shape</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TW_TOAST_DATA</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown</td>
              <td class="px-4 py-2 text-fg-muted">Injected in component / template content; carries <code class="font-mono">config.data</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TW_TOAST_REF</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ToastRef</td>
              <td class="px-4 py-2 text-fg-muted">Injected in component content; gives the projected component the owning ref.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TW_TOAST_DEFAULT_OPTIONS</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Partial&lt;ToastConfig&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Application-wide defaults installed by <code class="font-mono">provideToast(options)</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class ToastApi {
  protected readonly typesSnippet = `type ToastSeverity = 'info' | 'success' | 'warning' | 'error' | 'neutral';

type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

type ToastState = 'entering' | 'visible' | 'paused' | 'dismissing' | 'dismissed';

type ToastDismissReason =
  | 'action'
  | 'timeout'
  | 'swipe'
  | 'manual'
  | 'programmatic'
  | 'max-exceeded';

interface ToastDismissal<R = unknown> {
  reason: ToastDismissReason;
  result?: R;
}

interface ToastAction {
  label: string;
  handler?: (ref: ToastRef) => void;
}

interface ToastTemplateContext<T = unknown> {
  $implicit: T;
  ref: ToastRef<unknown, unknown>;
}

interface ToastUpdatePatch {
  severity?: ToastSeverity;
  duration?: number;
  action?: ToastAction | null;
  icon?: string | false | undefined;
  data?: unknown;
  ariaLabel?: string;
  content?: ToastContent;
  dismissible?: boolean;
}

type ToastContent = string | TemplateRef<ToastTemplateContext> | Type<unknown>;`;
}
