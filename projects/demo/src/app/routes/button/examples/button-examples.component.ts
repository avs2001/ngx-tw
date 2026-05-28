import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonDirective, ButtonIconDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import { SpinnerComponent } from 'ngx-tw/spinner';
import type { TwColor, TwSize } from 'ngx-tw/core';
import type { ButtonVariant } from 'ngx-tw/button';

const VARIANTS: ButtonVariant[] = ['solid', 'outline', 'ghost', 'soft', 'link'];
const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-button-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, ButtonIconDirective, CodeBlockComponent, SpinnerComponent],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Variants change the button's visual weight without changing its meaning. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        for primary calls to action,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code>
        for secondary actions,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
        for low-emphasis toolbar buttons, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">link</code>
        when the action reads more like navigation than a command.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (v of variants; track v) {
            <button twButton [variant]="v">{{ v }}</button>
          }
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Variants compose with colors — a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        error button and an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        error button both read as destructive but differ in emphasis.
      </p>
    </section>

    <!-- Colors × Variants matrix -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input picks the semantic palette and composes with every variant. Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main action on a surface,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        for destructive actions, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for supporting controls that should not draw attention. The matrix below shows every
        variant against every color so you can compare emphasis side by side.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (v of variants; track v) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
              <div class="flex flex-wrap items-center gap-2">
                @for (c of colors; track c) {
                  <button twButton [variant]="v" [color]="c">{{ c }}</button>
                }
              </div>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size scales padding, font size, and the icon slot together. Match the size to
        neighbouring controls — a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        button sits inside dense toolbars and table rows, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        suits hero calls to action on marketing pages.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-end gap-3">
          @for (s of sizes; track s) {
            <button twButton [size]="s">{{ s }}</button>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- With Icons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Icons</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Add an icon by projecting an SVG with the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twButtonIcon</code>
        directive. Pass
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twButtonIcon="trailing"</code>
        to move it after the label. The directive handles icon sizing (scaled with the button
        size) and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">shrink-0</code>
        so icons never collapse inside a flex row.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <button twButton>
            <svg twButtonIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
            </svg>
            Add item
          </button>

          <button twButton variant="outline" color="error">
            <svg twButtonIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            Delete
          </button>

          <button twButton variant="ghost" color="neutral">
            Settings
            <svg twButtonIcon="trailing" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
          </button>

          <button twButton variant="soft" color="success" size="sm">
            <svg twButtonIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            Approved
          </button>
        </div>
      </div>
      <tw-code-block [code]="iconsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        For icon-only buttons, always provide an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        so the control has an accessible name.
      </p>
    </section>

    <!-- Anchor Elements -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Anchor Elements</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The directive attaches to any element — apply
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twButton</code>
        to an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#60;a&#62;</code>
        when the action navigates rather than executes. Anchors keep their native semantics
        (right-click, middle-click, open-in-new-tab) while inheriting the same styling.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <a twButton href="#">Default link</a>
          <a twButton variant="outline" color="secondary" href="#">Outline link</a>
          <a twButton variant="link" href="#">Link variant</a>
          <a twButton variant="link" color="error" href="#">Error link</a>
        </div>
      </div>
      <tw-code-block [code]="anchorSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Disabling an anchor sets
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled</code>
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex="-1"</code>,
        but the browser will still follow the href. Guard the click handler or remove the
        href when you need the disabled state to fully block navigation.
      </p>
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Use <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        to block interaction on a stable button and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loading</code>
        to block interaction during an in-flight action. Loading adds
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-busy</code>
        so assistive tech announces the pending work.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled</p>
            <div class="flex flex-wrap items-center gap-3">
              @for (v of variants; track v) {
                <button twButton [variant]="v" [disabled]="true">{{ v }}</button>
              }
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Loading</p>
            <div class="flex flex-wrap items-center gap-3">
              <button twButton [loading]="isLoading()">
                @if (isLoading()) {
                  <tw-spinner twButtonIcon size="sm" />
                  <span class="sr-only">Saving</span>
                  Saving...
                } @else {
                  Save
                }
              </button>
              <button twButton variant="outline" [loading]="isLoading()">
                @if (isLoading()) {
                  <tw-spinner twButtonIcon size="sm" />
                  <span class="sr-only">Processing</span>
                  Processing...
                } @else {
                  Process
                }
              </button>
              <button twButton variant="soft" color="neutral" (click)="toggleLoading()">
                Toggle loading
              </button>
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loading</code>
        wins over <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        visually but both block clicks. Toggle loading with a handler the user can't re-trigger,
        then restore it once the async work resolves. The directive sets
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-busy</code>
        but renders no spinner or status text — compose them in the projected content. Pair the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-spinner&gt;</code>
        with an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sr-only</code>
        status string so assistive tech announces what is in flight.
      </p>
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        for a destructive primary, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for an understated toolbar button.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
            <div class="flex gap-1">
              @for (v of variants; track v) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playVariant() === v"
                  [class.!text-primary-700]="playVariant() === v"
                  (click)="playVariant.set(v)"
                >{{ v }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
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
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
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
            <label class="block text-xs font-medium text-fg-muted mb-1">State</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDisabled()"
                [class.!text-primary-700]="playDisabled()"
                (click)="playDisabled.update(v => !v)"
              >disabled</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playLoading()"
                [class.!text-primary-700]="playLoading()"
                (click)="playLoading.update(v => !v)"
              >loading</button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-center p-8 rounded-lg bg-surface-sunken">
          <button
            twButton
            [variant]="playVariant()"
            [color]="playColor()"
            [size]="playSize()"
            [disabled]="playDisabled()"
            [loading]="playLoading()"
          >
            Button
          </button>
        </div>
      </div>
    </section>
  `,
})
export class ButtonExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;

  protected readonly isLoading = signal(false);
  protected readonly playVariant = signal<ButtonVariant>('solid');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playDisabled = signal(false);
  protected readonly playLoading = signal(false);

  toggleLoading(): void {
    this.isLoading.update(v => !v);
  }

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <button twButton [variant]="v">{{ v }}</button>
}`.trim();

  protected readonly colorsSnippet = `
@for (v of variants; track v) {
  <div>
    <p class="uppercase">{{ v }}</p>
    @for (c of colors; track c) {
      <button twButton [variant]="v" [color]="c">{{ c }}</button>
    }
  </div>
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <button twButton [size]="s">{{ s }}</button>
}`.trim();

  protected readonly iconsSnippet = `<!-- Leading icon (default) -->
<button twButton>
  <svg twButtonIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
  </svg>
  Add item
</button>

<!-- Trailing icon -->
<button twButton variant="ghost" color="neutral">
  Settings
  <svg twButtonIcon="trailing" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M7.3 14.7a1 1 0 010-1.4L10.6 10 7.3 6.7a1 1 0 011.4-1.4l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4 0z"/>
  </svg>
</button>`;

  protected readonly anchorSnippet = `<a twButton href="/settings">Default link</a>
<a twButton variant="outline" color="secondary" href="/docs">Outline link</a>
<a twButton variant="link" href="/pricing">Link variant</a>
<a twButton variant="link" color="error" href="/logout">Error link</a>`;

  protected readonly statesSnippet = `<!-- Disabled -->
@for (v of variants; track v) {
  <button twButton [variant]="v" [disabled]="true">{{ v }}</button>
}

<!-- Loading: spinner + sr-only status pair with aria-busy -->
<button twButton [loading]="isLoading()">
  @if (isLoading()) {
    <tw-spinner twButtonIcon size="sm" />
    <span class="sr-only">Saving</span>
    Saving...
  } @else {
    Save
  }
</button>`;
}
