import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconComponent } from 'ngx-tw/icon';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwIconColor } from 'ngx-tw/icon';
import type { TwSize } from 'ngx-tw/core';

const COLORS: TwIconColor[] = [
  'current', 'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const STROKE_WIDTHS: readonly number[] = [1, 1.5, 2, 2.5, 3];
const PLAYGROUND_ICONS: readonly string[] = [
  'star', 'heart', 'check-circle', 'alert-triangle', 'settings', 'bell', 'home', 'mail',
];

@Component({
  selector: 'app-icon-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ButtonDirective, CodeBlockComponent],
  template: `
    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input applies a semantic tint to the icon. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for brand moments, the semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        colors to reinforce status, and the default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">current</code>
        when the icon should inherit the surrounding text color.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-start gap-4">
          @for (c of colors; track c) {
            <div class="flex flex-col items-center gap-1.5">
              <tw-icon name="star" [color]="c" size="lg" />
              <span class="text-xs text-fg-muted">{{ c }}</span>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Colors resolve against the app's semantic token layer, so dark mode and branded themes
        work automatically — no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dark:</code>
        overrides required.
      </p>
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Sizes follow the library's standard scale:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        (12px),
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        (16px),
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        (20px — default),
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        (24px), and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        (32px). Match the icon size to its neighbouring text or control density — a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        icon pairs with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text-sm</code>
        prose, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        suits standalone hero glyphs.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-end gap-4">
          @for (s of sizes; track s) {
            <div class="flex flex-col items-center gap-1.5">
              <tw-icon name="heart" color="error" [size]="s" />
              <span class="text-xs text-fg-muted">{{ s }}</span>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Stroke Width -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Stroke Width</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">strokeWidth</code>
        input sets the SVG stroke weight. The default of
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">2</code>
        matches the Lucide baseline; drop to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1.5</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1</code>
        for a lighter editorial feel, or push higher for emphasis.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-4">
          @for (sw of strokeWidths; track sw) {
            <div class="flex flex-col items-center gap-1.5">
              <tw-icon name="star" size="lg" [strokeWidth]="sw" />
              <span class="text-xs text-fg-muted font-mono">{{ sw }}</span>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="strokeWidthSnippet" language="html" />
    </section>

    <!-- Absolute Stroke Width -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Absolute Stroke Width</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        With
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[absoluteStrokeWidth]="true"</code>
        the stroke scales inversely with size so large icons don't look heavier than small ones.
        Reach for it when the same icon shows up across very different sizes (for example,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        inline with text and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        as a hero glyph).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Normal (default)</p>
            <div class="flex items-end gap-3">
              @for (s of sizes; track s) {
                <tw-icon name="star" [size]="s" [strokeWidth]="2" />
              }
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Absolute</p>
            <div class="flex items-end gap-3">
              @for (s of sizes; track s) {
                <tw-icon name="star" [size]="s" [strokeWidth]="2" [absoluteStrokeWidth]="true" />
              }
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="absoluteStrokeWidthSnippet" language="html" />
    </section>

    <!-- Inline with Text -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inline with Text</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Icons sit on the text baseline via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inline-flex</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">align-middle</code>,
        so they drop into prose, list items, and buttons without alignment tweaks. Pair an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        icon with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text-sm</code>
        content for a consistent rhythm.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-3">
          <p class="text-sm text-fg flex items-center gap-1.5">
            <tw-icon name="check-circle" color="success" size="sm" /> Task completed successfully
          </p>
          <p class="text-sm text-fg flex items-center gap-1.5">
            <tw-icon name="alert-triangle" color="warning" size="sm" /> Proceed with caution
          </p>
          <p class="text-sm text-fg flex items-center gap-1.5">
            <tw-icon name="x-circle" color="error" size="sm" /> Something went wrong
          </p>
          <p class="text-sm text-fg flex items-center gap-1.5">
            <tw-icon name="info" color="info" size="sm" /> Here is some useful information
          </p>
        </div>
      </div>
      <tw-code-block [code]="inlineTextSnippet" language="html" />
    </section>

    <!-- Color Inheritance -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Color Inheritance</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        With the default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color="current"</code>,
        the icon inherits the parent element's text color via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">currentColor</code>.
        This is the preferred mode when the icon shares a color story with surrounding text —
        setting the color once on the wrapper keeps everything in sync.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-4">
          <span class="text-primary-500 flex items-center gap-1.5"><tw-icon name="star" /> primary</span>
          <span class="text-success-500 flex items-center gap-1.5"><tw-icon name="check-circle" /> success</span>
          <span class="text-error-500 flex items-center gap-1.5"><tw-icon name="x-circle" /> error</span>
          <span class="text-warning-500 flex items-center gap-1.5"><tw-icon name="alert-triangle" /> warning</span>
        </div>
      </div>
      <tw-code-block [code]="inheritanceSnippet" language="html" />
    </section>

    <!-- Accessibility -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Icons are
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden="true"</code>
        by default — the right choice when the icon is decorative and a sibling label already
        conveys its meaning. When an icon stands alone (for example, a standalone status glyph)
        provide an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaLabel</code>
        so the SVG is announced with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="img"</code>.
        For icon-only buttons, label the button itself and let the icon stay hidden.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-3">
            <tw-icon name="check-circle" color="success" size="lg" ariaLabel="Synchronised" />
            <span class="text-sm text-fg-muted">Standalone icon — uses ariaLabel</span>
          </div>
          <div class="flex items-center gap-3">
            <button twButton variant="outline" color="neutral" size="sm" aria-label="Open settings">
              <tw-icon name="settings" />
            </button>
            <span class="text-sm text-fg-muted">Icon-only button — label the button, hide the icon</span>
          </div>
        </div>
      </div>
      <tw-code-block [code]="accessibilitySnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        When the icon sits beside a visible text label, leave
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaLabel</code>
        unset — duplicating the label in assistive tech output is noisy.
      </p>
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once. Try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color="current"</code>
        on a colored parent to see how inheritance feels, or compare
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">absoluteStrokeWidth</code>
        against normal scaling at
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Icon</label>
            <div class="flex flex-wrap gap-1">
              @for (name of playIcons; track name) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playName() === name"
                  [class.!text-primary-700]="playName() === name"
                  (click)="playName.set(name)"
                >{{ name }}</button>
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Stroke width</label>
            <div class="flex gap-1">
              @for (sw of strokeWidths; track sw) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playStrokeWidth() === sw"
                  [class.!text-primary-700]="playStrokeWidth() === sw"
                  (click)="playStrokeWidth.set(sw)"
                >{{ sw }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Absolute stroke</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="!playAbsoluteStrokeWidth()"
                [class.!text-primary-700]="!playAbsoluteStrokeWidth()"
                (click)="playAbsoluteStrokeWidth.set(false)"
              >off</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playAbsoluteStrokeWidth()"
                [class.!text-primary-700]="playAbsoluteStrokeWidth()"
                (click)="playAbsoluteStrokeWidth.set(true)"
              >on</button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-center p-8 rounded-lg bg-surface-sunken">
          <tw-icon
            [name]="playName()"
            [color]="playColor()"
            [size]="playSize()"
            [strokeWidth]="playStrokeWidth()"
            [absoluteStrokeWidth]="playAbsoluteStrokeWidth()"
          />
        </div>
      </div>
    </section>
  `,
})
export class IconExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly strokeWidths = STROKE_WIDTHS;
  protected readonly playIcons = PLAYGROUND_ICONS;

  protected readonly playName = signal<string>('star');
  protected readonly playColor = signal<TwIconColor>('current');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playStrokeWidth = signal<number>(2);
  protected readonly playAbsoluteStrokeWidth = signal<boolean>(false);

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-icon name="star" [color]="c" size="lg" />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-icon name="heart" color="error" [size]="s" />
}`.trim();

  protected readonly strokeWidthSnippet = `
@for (sw of strokeWidths; track sw) {
  <tw-icon name="star" size="lg" [strokeWidth]="sw" />
}`.trim();

  protected readonly absoluteStrokeWidthSnippet = `
<!-- Normal: heavier at small sizes -->
@for (s of sizes; track s) {
  <tw-icon name="star" [size]="s" [strokeWidth]="2" />
}

<!-- Absolute: compensates so perceived weight stays constant -->
@for (s of sizes; track s) {
  <tw-icon name="star" [size]="s" [strokeWidth]="2" [absoluteStrokeWidth]="true" />
}`.trim();

  protected readonly inlineTextSnippet = `<p class="text-sm flex items-center gap-1.5">
  <tw-icon name="check-circle" color="success" size="sm" /> Task completed successfully
</p>
<p class="text-sm flex items-center gap-1.5">
  <tw-icon name="alert-triangle" color="warning" size="sm" /> Proceed with caution
</p>
<p class="text-sm flex items-center gap-1.5">
  <tw-icon name="x-circle" color="error" size="sm" /> Something went wrong
</p>`;

  protected readonly inheritanceSnippet = `<span class="text-primary-500 flex items-center gap-1.5">
  <tw-icon name="star" /> primary
</span>
<span class="text-success-500 flex items-center gap-1.5">
  <tw-icon name="check-circle" /> success
</span>
<span class="text-error-500 flex items-center gap-1.5">
  <tw-icon name="x-circle" /> error
</span>`;

  protected readonly accessibilitySnippet = `<!-- Standalone icon: ariaLabel makes it announce as role="img" -->
<tw-icon name="check-circle" color="success" size="lg" ariaLabel="Synchronised" />

<!-- Icon-only button: label the button, keep the icon aria-hidden -->
<button twButton variant="outline" size="sm" aria-label="Open settings">
  <tw-icon name="settings" />
</button>

<!-- Icon beside visible text: icon stays decorative -->
<button twButton variant="outline" size="sm">
  <tw-icon name="search" /> Search
</button>`;
}
