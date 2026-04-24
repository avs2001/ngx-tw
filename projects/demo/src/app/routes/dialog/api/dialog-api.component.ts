import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-dialog-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- TwDialog -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwDialog</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Service · registered via provideTwDialog()</p>

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
              <td class="px-4 py-2 font-mono text-xs">open</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(content: ComponentType&lt;C&gt; | TemplateRef&lt;C&gt;, config?: TwDialogConfig&lt;D, R&gt;) =&gt; TwDialogRef&lt;R, C&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Opens a dialog using a standalone component class or a template reference.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closeAll</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Closes every dialog currently managed by the service and its descendants.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">getDialogById</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(id: string) =&gt; TwDialogRef | undefined</td>
              <td class="px-4 py-2 text-fg-muted">Looks up an open dialog by its unique id.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Properties</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">openDialogs</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;readonly TwDialogRef[]&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Reactive list of every currently-open dialog across the service tree.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterOpened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Observable&lt;TwDialogRef&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits every time a dialog finishes its enter animation.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterAllClosed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Observable&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits once the last open dialog has closed; fires immediately on subscribe when none are open.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- provideTwDialog -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">provideTwDialog</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Function · returns EnvironmentProviders</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Registers the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwDialog</code> service.
        Call once in the application providers and optionally pass a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Partial&lt;TwDialogConfig&gt;</code>
        to set application-wide defaults merged into every
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">open()</code> call.
      </p>
    </section>

    <!-- TwDialogConfig -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwDialogConfig</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Config object passed to TwDialog.open()</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Options</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwDialogSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Preset panel width; ignored when <code class="font-mono">width</code> or <code class="font-mono">maxWidth</code> is set.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">data</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Value injected into the dialog content via <code class="font-mono">TW_DIALOG_DATA</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">role</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'dialog' | 'alertdialog'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'dialog'</td>
              <td class="px-4 py-2 text-fg-muted">ARIA role applied to the dialog container.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hasBackdrop</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether to render a modal backdrop behind the dialog.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disableClose</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Prevents Escape and backdrop clicks from closing the dialog.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closePredicate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(result, config, instance) =&gt; boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Guard invoked before every close; return <code class="font-mono">false</code> to veto.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">autoFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwDialogAutoFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'first-tabbable'</td>
              <td class="px-4 py-2 text-fg-muted">Where focus lands when the dialog opens.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">restoreFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwDialogRestoreFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Controls how focus is restored after the dialog closes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">scrollBehavior</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwDialogScrollStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'block'</td>
              <td class="px-4 py-2 text-fg-muted">Preset scroll strategy; <code class="font-mono">scrollStrategy</code> overrides it when set.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name used when no <code class="font-mono">twDialogTitle</code> is rendered.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaModal</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Sets <code class="font-mono">aria-modal</code> on the container when true.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">enterAnimationDuration</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">150</td>
              <td class="px-4 py-2 text-fg-muted">Duration of the open transition in ms; <code class="font-mono">0</code> disables the animation.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">exitAnimationDuration</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">120</td>
              <td class="px-4 py-2 text-fg-muted">Duration of the close transition in ms; <code class="font-mono">0</code> disables the animation.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxWidth</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'calc(100vw - 32px)'</td>
              <td class="px-4 py-2 text-fg-muted">Panel maximum width; number values are treated as pixels.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Extra classes applied to the dialog container element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">backdropClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'tw-dialog-backdrop'</td>
              <td class="px-4 py-2 text-fg-muted">Extra classes applied to the overlay backdrop element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">auto</td>
              <td class="px-4 py-2 text-fg-muted">Unique identifier; must be unique across currently-open dialogs.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TwDialogRef -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwDialogRef</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Returned from TwDialog.open()</p>

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
              <td class="px-4 py-2 text-fg-muted">Unique identifier for this dialog instance.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">state</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;TwDialogState&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Reactive animation state cycling through opening → open → closing → closed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">componentInstance</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">C | null</td>
              <td class="px-4 py-2 text-fg-muted">Instance of the rendered content component, or <code class="font-mono">null</code> for template dialogs.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">componentRef</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ComponentRef&lt;C&gt; | null</td>
              <td class="px-4 py-2 text-fg-muted">Angular <code class="font-mono">ComponentRef</code> of the rendered content, or <code class="font-mono">null</code> for template dialogs.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">config</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwDialogConfig</td>
              <td class="px-4 py-2 text-fg-muted">Resolved configuration used to open the dialog.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disableClose</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean | undefined</td>
              <td class="px-4 py-2 text-fg-muted">When true, Escape and backdrop close are disabled; writable at runtime.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">close</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(result?: R) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Closes the dialog and forwards an optional result to <code class="font-mono">afterClosed()</code> subscribers.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterOpened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; Observable&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits once after the enter animation finishes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">beforeClosed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; Observable&lt;R | undefined&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits at the start of the close transition, before the dialog is detached.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterClosed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; Observable&lt;R | undefined&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits once after the dialog has fully closed and the overlay has been disposed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">backdropClick</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; Observable&lt;MouseEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Stream of backdrop click events, emitted even when <code class="font-mono">disableClose</code> is set.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">keydownEvents</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; Observable&lt;KeyboardEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Stream of keydown events dispatched on the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">updateSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(width?: string | number, height?: string | number) =&gt; this</td>
              <td class="px-4 py-2 text-fg-muted">Updates the dialog's width and/or height after it has opened.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">addPanelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(classes: string | string[]) =&gt; this</td>
              <td class="px-4 py-2 text-fg-muted">Adds CSS classes to the overlay panel.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">removePanelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(classes: string | string[]) =&gt; this</td>
              <td class="px-4 py-2 text-fg-muted">Removes CSS classes from the overlay panel.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TwDialogHeaderDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwDialogHeaderDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twDialogHeader], tw-dialog-header</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Flex wrapper that hosts the leading icon, title, and subtitle with consistent padding and spacing.
      </p>
    </section>

    <!-- TwDialogIconDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwDialogIconDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twDialogIcon]</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color applied to the icon's rounded surface.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TwDialogTitleDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwDialogTitleDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twDialogTitle], tw-dialog-title</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Marks an element as the dialog title and auto-registers its id with the container's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>
        queue.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">auto</td>
              <td class="px-4 py-2 text-fg-muted">Custom id for the title element; defaults to a generated unique id.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TwDialogSubtitleDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwDialogSubtitleDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twDialogSubtitle], tw-dialog-subtitle</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Secondary text rendered beneath the dialog title; intended for a short one-line description.
      </p>
    </section>

    <!-- TwDialogContentDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwDialogContentDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twDialogContent], tw-dialog-content</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Scrollable body region placed between the header and the actions bar; inherits CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkScrollable</code>
        to cooperate with overlay scroll strategies and nested scrollables.
      </p>
    </section>

    <!-- TwDialogActionsDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwDialogActionsDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twDialogActions], tw-dialog-actions</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bottom action bar that stays pinned below the scrollable content, separated by a top border.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">align</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'start' | 'center' | 'end'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'end'</td>
              <td class="px-4 py-2 text-fg-muted">Horizontal alignment of the action buttons.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TwDialogCloseDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwDialogCloseDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twDialogClose]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Closes the enclosing dialog when the host element is clicked; attach it to any
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;button&gt;</code>
        inside the dialog.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">twDialogClose</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Value forwarded to <code class="font-mono">afterClosed()</code> when the button is activated.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">type</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'button' | 'submit' | 'reset'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'button'</td>
              <td class="px-4 py-2 text-fg-muted">Native button type applied to the host; defaults to <code class="font-mono">'button'</code> to avoid accidental form submission.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Injection Tokens -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Injection Tokens</h2>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Token</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TW_DIALOG_DATA</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">InjectionToken&lt;unknown&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Injects the <code class="font-mono">config.data</code> value inside component content.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TW_DIALOG_DEFAULT_OPTIONS</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">InjectionToken&lt;Partial&lt;TwDialogConfig&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Holds the application-wide defaults supplied to <code class="font-mono">provideTwDialog()</code>.</td>
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
export class DialogApi {
  protected readonly typesSnippet = `type TwDialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
type TwDialogState = 'opening' | 'open' | 'closing' | 'closed';
type TwDialogRole = 'dialog' | 'alertdialog';
type TwDialogScrollStrategy = 'block' | 'reposition' | 'close' | 'noop';
type TwDialogAutoFocus = AutoFocusTarget | string | boolean;
type TwDialogRestoreFocus = boolean | string | HTMLElement;
type TwDialogActionsAlign = 'start' | 'center' | 'end';

interface TwDialogAnimationEvent {
  state: TwDialogState;
  totalTime: number;
}`;
}
