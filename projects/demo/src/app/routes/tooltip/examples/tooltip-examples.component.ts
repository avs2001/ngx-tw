import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TooltipDirective } from 'ngx-tw/tooltip';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor } from 'ngx-tw/core';
import type { TooltipPosition, TooltipSize } from 'ngx-tw/tooltip';

const COLORS: TwColor[] = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'info',
  'success',
  'warning',
  'error',
];
const SIZES: TooltipSize[] = ['sm', 'md', 'lg'];
const POSITIONS: TooltipPosition[] = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
  'right',
  'right-start',
  'right-end',
];
const MAIN_POSITIONS: TooltipPosition[] = ['top', 'bottom', 'left', 'right'];

@Component({
  selector: 'app-tooltip-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TooltipDirective, ButtonDirective, CodeBlockComponent],
  template: `
    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twTooltipColor</code>
        input tints the panel background and the arrow. Default to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for supplemental hints — it reads on any background without screaming — and reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>
        only when the tooltip conveys state matching the semantic color's meaning.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (c of colors; track c) {
            <button
              twButton
              variant="soft"
              [color]="c"
              size="sm"
              [twTooltip]="c + ' tooltip'"
              [twTooltipColor]="c"
              [twTooltipShowDelay]="0"
            >{{ c }}</button>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls the panel's padding, font scale, and maximum width. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        for dense toolbars and icon buttons,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        as the general-purpose default, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        when the tooltip carries a sentence or two of explanation.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (s of sizes; track s) {
            <button
              twButton
              variant="outline"
              color="neutral"
              size="sm"
              [twTooltip]="'This is a ' + s + ' tooltip'"
              [twTooltipSize]="s"
              [twTooltipShowDelay]="0"
            >{{ s }}</button>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Positions -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Positions</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Twelve placements cover every side and its start/end alignment. The preferred position is a
        hint — when viewport space runs out, CDK flips to a fallback on the opposite side, and the
        arrow follows the resolved side automatically. Prefer
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">top</code>
        for dense toolbars and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bottom</code>
        near the viewport top where a top tooltip would clip.
      </p>
      <div class="rounded-lg border border-border p-8 bg-surface-raised mb-4">
        <div class="grid grid-cols-3 gap-3 max-w-md mx-auto">
          @for (pos of positions; track pos) {
            <button
              twButton
              variant="outline"
              color="neutral"
              size="sm"
              [twTooltip]="pos"
              [twTooltipPosition]="pos"
              [twTooltipShowDelay]="0"
              class="justify-center"
            >{{ pos }}</button>
          }
        </div>
      </div>
      <tw-code-block [code]="positionsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">-start</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">-end</code>
        suffixes align the tooltip's edge with the trigger's edge rather than its centre — useful
        when the trigger sits near the edge of a container and a centred tooltip would overflow.
      </p>
    </section>

    <!-- With Arrow / Without Arrow -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Arrow</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        An arrow anchors the tooltip visually to its trigger and is on by default. Hide it with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twTooltipArrow]="false"</code>
        in dense UIs — many tightly-packed triggers, narrow toolbars — where the arrows compete
        for attention.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <button
            twButton
            variant="outline"
            color="neutral"
            size="sm"
            twTooltip="With arrow (default)"
            [twTooltipShowDelay]="0"
          >With arrow</button>
          <button
            twButton
            variant="outline"
            color="neutral"
            size="sm"
            twTooltip="No arrow"
            [twTooltipArrow]="false"
            [twTooltipShowDelay]="0"
          >No arrow</button>
        </div>
      </div>
      <tw-code-block [code]="arrowSnippet" language="html" />
    </section>

    <!-- Rich content -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Rich Content</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TemplateRef&lt;void&gt;</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twTooltip</code>
        instead of a string to render rich content — strong emphasis, keyboard hint pills, small
        key/value layouts. The content is announced differently from string content (it is not
        registered with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">AriaDescriber</code>),
        so always ensure the trigger carries its own accessible name.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <button
            twButton
            variant="soft"
            color="primary"
            size="sm"
            [twTooltip]="shortcutTip"
            [twTooltipShowDelay]="0"
            aria-label="Save — keyboard shortcut ctrl S"
          >Save</button>
          <ng-template #shortcutTip>
            <div class="flex items-center gap-2">
              <span>Save</span>
              <span class="rounded bg-white/20 px-1.5 py-0.5 text-2xs font-mono">Ctrl+S</span>
            </div>
          </ng-template>
        </div>
      </div>
      <tw-code-block [code]="richContentSnippet" language="html" />
    </section>

    <!-- Programmatic Control -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Programmatic Control</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Expose the directive with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">#ref="twTooltip"</code>
        and call
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">show()</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hide()</code>, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">toggle()</code>
        to drive the tooltip from outside. Useful for onboarding flows or revealing a tip after a
        validation failure — reach for this sparingly, since tooltips that appear without user
        intent surprise assistive-tech users.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <button
            twButton
            variant="outline"
            color="neutral"
            size="sm"
            twTooltip="Controlled tooltip"
            #tip="twTooltip"
            [twTooltipShowDelay]="0"
            [twTooltipHideDelay]="0"
          >Target</button>
          <button twButton variant="soft" color="primary" size="sm" (click)="tip.show()">Show</button>
          <button twButton variant="soft" color="neutral" size="sm" (click)="tip.hide()">Hide</button>
          <button twButton variant="soft" color="accent" size="sm" (click)="tip.toggle()">Toggle</button>
        </div>
      </div>
      <tw-code-block [code]="programmaticSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Setting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twTooltipDisabled]="true"</code>
        suppresses all triggers and tears down any visible overlay immediately — handy for
        conditionally silencing a tooltip while keeping the directive attached. Toggling the flag
        at runtime detaches the overlay without waiting for the hide delay.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <button
            twButton
            variant="outline"
            color="neutral"
            size="sm"
            twTooltip="You won't see this"
            [twTooltipDisabled]="true"
            [twTooltipShowDelay]="0"
          >Disabled tooltip</button>
          <button
            twButton
            variant="outline"
            color="neutral"
            size="sm"
            twTooltip="This one works"
            [twTooltipShowDelay]="0"
          >Enabled tooltip</button>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Delays -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Delays</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Show and hide delays are independent and measured in milliseconds. Longer show delays
        (300–500ms) keep tooltips out of the way while users move the pointer past triggers
        incidentally; a non-zero hide delay lets users move the pointer from the trigger into
        adjacent UI without the tooltip vanishing mid-gesture. The defaults —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">200ms</code>
        show,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">0ms</code>
        hide — are calibrated for typical toolbar and button usage.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <button
            twButton
            variant="outline"
            color="neutral"
            size="sm"
            twTooltip="500ms show delay"
            [twTooltipShowDelay]="500"
          >Slow show (500ms)</button>
          <button
            twButton
            variant="outline"
            color="neutral"
            size="sm"
            twTooltip="300ms hide delay"
            [twTooltipShowDelay]="0"
            [twTooltipHideDelay]="300"
          >Slow hide (300ms)</button>
          <button
            twButton
            variant="outline"
            color="neutral"
            size="sm"
            twTooltip="Instant"
            [twTooltipShowDelay]="0"
            [twTooltipHideDelay]="0"
          >No delay</button>
        </div>
      </div>
      <tw-code-block [code]="delaysSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Try a coloured tooltip with an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">-start</code>
        alignment and the arrow off to see the tight-toolbar look, or crank the size up to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        with rich neutral content to preview a help-tip layout.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
            <div class="flex flex-wrap gap-1">
              @for (c of colors; track c) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Position</label>
            <div class="flex flex-wrap gap-1">
              @for (p of mainPositions; track p) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playPosition() === p"
                  [class.!text-primary-700]="playPosition() === p"
                  (click)="playPosition.set(p)"
                >{{ p }}</button>
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
                [class.!bg-primary-100]="playArrow()"
                [class.!text-primary-700]="playArrow()"
                (click)="playArrow.update(v => !v)"
              >arrow</button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-center p-8 rounded-lg bg-surface-sunken">
          <button
            twButton
            variant="outline"
            color="neutral"
            twTooltip="Tooltip content"
            [twTooltipColor]="playColor()"
            [twTooltipSize]="playSize()"
            [twTooltipPosition]="playPosition()"
            [twTooltipArrow]="playArrow()"
            [twTooltipShowDelay]="0"
          >Hover me</button>
        </div>
      </div>
    </section>
  `,
})
export class TooltipExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly positions = POSITIONS;
  protected readonly mainPositions = MAIN_POSITIONS;

  protected readonly playColor = signal<TwColor>('neutral');
  protected readonly playSize = signal<TooltipSize>('md');
  protected readonly playPosition = signal<TooltipPosition>('top');
  protected readonly playArrow = signal(true);

  // ── Code snippets ──

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <button
    twButton
    variant="soft"
    [color]="c"
    [twTooltip]="c + ' tooltip'"
    [twTooltipColor]="c"
  >{{ c }}</button>
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <button
    twButton
    [twTooltip]="'This is a ' + s + ' tooltip'"
    [twTooltipSize]="s"
  >{{ s }}</button>
}`.trim();

  protected readonly positionsSnippet = `
@for (pos of positions; track pos) {
  <button
    twButton
    [twTooltip]="pos"
    [twTooltipPosition]="pos"
  >{{ pos }}</button>
}`.trim();

  protected readonly arrowSnippet = `<button twButton twTooltip="With arrow (default)">With arrow</button>
<button twButton twTooltip="No arrow" [twTooltipArrow]="false">No arrow</button>`;

  protected readonly richContentSnippet = `<button
  twButton
  [twTooltip]="shortcutTip"
  aria-label="Save — keyboard shortcut ctrl S"
>Save</button>

<ng-template #shortcutTip>
  <div class="flex items-center gap-2">
    <span>Save</span>
    <span class="rounded bg-white/20 px-1.5 py-0.5 text-2xs font-mono">Ctrl+S</span>
  </div>
</ng-template>`;

  protected readonly programmaticSnippet = `<button
  twButton
  twTooltip="Controlled tooltip"
  #tip="twTooltip"
>Target</button>

<button twButton (click)="tip.show()">Show</button>
<button twButton (click)="tip.hide()">Hide</button>
<button twButton (click)="tip.toggle()">Toggle</button>`;

  protected readonly statesSnippet = `<!-- Disabled: no triggers fire, overlay tears down on toggle -->
<button twButton twTooltip="You won't see this" [twTooltipDisabled]="true">
  Disabled tooltip
</button>

<button twButton twTooltip="This one works">Enabled tooltip</button>`;

  protected readonly delaysSnippet = `<button twButton twTooltip="500ms show delay" [twTooltipShowDelay]="500">
  Slow show
</button>

<button
  twButton
  twTooltip="300ms hide delay"
  [twTooltipShowDelay]="0"
  [twTooltipHideDelay]="300"
>Slow hide</button>

<button
  twButton
  twTooltip="Instant"
  [twTooltipShowDelay]="0"
  [twTooltipHideDelay]="0"
>No delay</button>`;
}
