import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-sheet-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- Sheet -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sheet</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Service · registered via provideSheet()</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(content: ComponentType&lt;C&gt; | TemplateRef&lt;C&gt;, config?: SheetConfig&lt;D, R&gt;) =&gt; SheetRef&lt;R, C&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Opens a sheet using a standalone component class or a template reference.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closeAll</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Closes every sheet currently managed by the service and its descendants.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">getSheetById</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(id: string) =&gt; SheetRef | undefined</td>
              <td class="px-4 py-2 text-fg-muted">Looks up an open sheet by its unique id.</td>
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
              <td class="px-4 py-2 font-mono text-xs">openSheets</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;readonly SheetRef[]&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Reactive list of every currently-open sheet across the service tree.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterOpened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Observable&lt;SheetRef&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits every time a sheet finishes its enter animation.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterAllClosed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Observable&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits once the last open sheet has closed; fires immediately on subscribe when none are open.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- provideSheet -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">provideSheet</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Function · returns EnvironmentProviders</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Registers the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Sheet</code> service.
        Call once in the application providers and optionally pass a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Partial&lt;SheetConfig&gt;</code>
        to set application-wide defaults merged into every
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">open()</code> call.
      </p>
    </section>

    <!-- SheetConfig -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SheetConfig</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Config object passed to Sheet.open()</p>

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
              <td class="px-4 py-2 font-mono text-xs">side</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SheetSide</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'right'</td>
              <td class="px-4 py-2 text-fg-muted">Viewport edge the sheet anchors against.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SheetSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Axis-aware size preset: width for left/right sheets, height for top/bottom.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">data</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Value injected into the sheet content via <code class="font-mono">SHEET_DATA</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">role</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'dialog' | 'alertdialog'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'dialog'</td>
              <td class="px-4 py-2 text-fg-muted">ARIA role applied to the sheet container.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hasBackdrop</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether to render a modal backdrop behind the sheet.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closeOnEscape</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether pressing Escape closes the sheet.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closeOnBackdropClick</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether clicking the backdrop closes the sheet.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disableClose</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Master switch — when true, overrides both Escape and backdrop close.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closePredicate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(result, config, instance) =&gt; boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Guard invoked before every close; return <code class="font-mono">false</code> to veto.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">autoFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SheetAutoFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'first-tabbable'</td>
              <td class="px-4 py-2 text-fg-muted">Where focus lands when the sheet opens.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">restoreFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SheetRestoreFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Controls how focus is restored after the sheet closes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">scrollBehavior</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SheetScrollStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'block'</td>
              <td class="px-4 py-2 text-fg-muted">Preset scroll strategy; <code class="font-mono">scrollStrategy</code> overrides it when set.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name used when no <code class="font-mono">twSheetTitle</code> is rendered.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaModal</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Sets <code class="font-mono">aria-modal</code> on the container; set to <code class="font-mono">false</code> for non-modal surfaces.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaDescribedBy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Explicit IDREF for <code class="font-mono">aria-describedby</code>. When omitted, the first <code class="font-mono">twSheetDescription</code> id is used.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">enterAnimationDuration</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">200</td>
              <td class="px-4 py-2 text-fg-muted">Duration of the slide-in transition in ms; <code class="font-mono">0</code> disables the animation.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">exitAnimationDuration</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">160</td>
              <td class="px-4 py-2 text-fg-muted">Duration of the slide-out transition in ms; <code class="font-mono">0</code> disables the animation.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Extra classes applied to the sheet container element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">backdropClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'tw-sheet-backdrop'</td>
              <td class="px-4 py-2 text-fg-muted">Extra classes applied to the overlay backdrop element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">auto</td>
              <td class="px-4 py-2 text-fg-muted">Unique identifier; must be unique across currently-open sheets.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- SheetRef -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">SheetRef</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Returned from Sheet.open()</p>

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
              <td class="px-4 py-2 text-fg-muted">Unique identifier for this sheet instance.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">state</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;SheetState&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Reactive animation state cycling through opening → open → closing → closed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">componentInstance</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">C | null</td>
              <td class="px-4 py-2 text-fg-muted">Instance of the rendered content component, or <code class="font-mono">null</code> for template sheets.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">config</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">SheetConfig</td>
              <td class="px-4 py-2 text-fg-muted">Resolved configuration used to open the sheet.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closeOnEscape</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean | undefined</td>
              <td class="px-4 py-2 text-fg-muted">Mutable at runtime — flip to <code class="font-mono">false</code> to suppress Escape after opening.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closeOnBackdropClick</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean | undefined</td>
              <td class="px-4 py-2 text-fg-muted">Mutable at runtime — flip to <code class="font-mono">false</code> to suppress backdrop close after opening.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disableClose</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean | undefined</td>
              <td class="px-4 py-2 text-fg-muted">When true, Escape and backdrop close are both disabled.</td>
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
              <td class="px-4 py-2 text-fg-muted">Closes the sheet and forwards an optional result to <code class="font-mono">afterClosed()</code> subscribers.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterOpened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; Observable&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits once after the slide-in animation finishes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">beforeClosed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; Observable&lt;R | undefined&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits at the start of the close transition, before the sheet is detached.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">afterClosed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; Observable&lt;R | undefined&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Emits once after the sheet has fully closed and the overlay has been disposed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">backdropClick</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; Observable&lt;MouseEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Stream of backdrop click events, emitted even when close-on-backdrop is suppressed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">keydownEvents</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; Observable&lt;KeyboardEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Stream of keydown events dispatched on the overlay.</td>
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

    <!-- Directives summary -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Slot Directives</h2>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Directive</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Purpose</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">SheetHeaderDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twSheetHeader], tw-sheet-header</td>
              <td class="px-4 py-2 text-fg-muted">Flex wrapper for the leading icon + title + subtitle row.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">SheetIconDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twSheetIcon]</td>
              <td class="px-4 py-2 text-fg-muted">Decorative rounded icon container with optional semantic <code class="font-mono">color</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">SheetTitleDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twSheetTitle], tw-sheet-title</td>
              <td class="px-4 py-2 text-fg-muted">Registers the host id with the container's <code class="font-mono">aria-labelledby</code> queue.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">SheetSubtitleDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twSheetSubtitle], tw-sheet-subtitle</td>
              <td class="px-4 py-2 text-fg-muted">Muted one-line description rendered beneath the title (visual only).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">SheetDescriptionDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twSheetDescription], tw-sheet-description</td>
              <td class="px-4 py-2 text-fg-muted">Registers the host id with the container's <code class="font-mono">aria-describedby</code> queue.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">SheetContentDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twSheetContent], tw-sheet-content</td>
              <td class="px-4 py-2 text-fg-muted">Scrollable body region (inherits CdkScrollable).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">SheetActionsDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twSheetActions], tw-sheet-actions</td>
              <td class="px-4 py-2 text-fg-muted">Bottom action bar pinned below the scrollable content; accepts an <code class="font-mono">align</code> input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">SheetCloseDirective</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[twSheetClose]</td>
              <td class="px-4 py-2 text-fg-muted">Closes the enclosing sheet on click; <code class="font-mono">[twSheetClose]</code>="value" forwards the close payload.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Injection tokens -->
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
              <td class="px-4 py-2 font-mono text-xs">SHEET_DATA</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">InjectionToken&lt;unknown&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Injects the <code class="font-mono">config.data</code> value inside component content.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">SHEET_DEFAULT_OPTIONS</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">InjectionToken&lt;Partial&lt;SheetConfig&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Holds the application-wide defaults supplied to <code class="font-mono">provideSheet()</code>.</td>
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
export class SheetApi {
  protected readonly typesSnippet = `type SheetSide = 'top' | 'right' | 'bottom' | 'left';
type SheetSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
type SheetState = 'opening' | 'open' | 'closing' | 'closed';
type SheetRole = 'dialog' | 'alertdialog';
type SheetScrollStrategy = 'block' | 'reposition' | 'close' | 'noop';
type SheetAutoFocus = AutoFocusTarget | string | boolean;
type SheetRestoreFocus = boolean | string | HTMLElement;
type SheetActionsAlign = 'start' | 'center' | 'end';

interface SheetAnimationEvent {
  state: SheetState;
  totalTime: number;
}`;
}
