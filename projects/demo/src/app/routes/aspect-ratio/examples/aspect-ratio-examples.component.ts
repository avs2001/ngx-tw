import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AspectRatioDirective } from '@cdevhub/ngx-tw/aspect-ratio';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

interface RatioSwatch {
  readonly label: string;
  readonly ratio: string;
}

interface GridTile {
  readonly id: number;
  readonly src: string;
  readonly alt: string;
}

const COMMON_RATIOS: readonly RatioSwatch[] = [
  { label: '1 / 1', ratio: '1/1' },
  { label: '4 / 3', ratio: '4/3' },
  { label: '3 / 2', ratio: '3/2' },
  { label: '16 / 9', ratio: '16/9' },
  { label: '21 / 9', ratio: '21/9' },
];

const PLAYGROUND_RATIOS: readonly string[] = ['1/1', '4/3', '3/2', '16/9', '21/9'];

const GRID_TILES: readonly GridTile[] = [
  { id: 1, src: 'https://picsum.photos/seed/ngxtw-1/400/400', alt: 'Gallery thumbnail 1' },
  { id: 2, src: 'https://picsum.photos/seed/ngxtw-2/400/600', alt: 'Gallery thumbnail 2' },
  { id: 3, src: 'https://picsum.photos/seed/ngxtw-3/600/400', alt: 'Gallery thumbnail 3' },
  { id: 4, src: 'https://picsum.photos/seed/ngxtw-4/400/400', alt: 'Gallery thumbnail 4' },
  { id: 5, src: 'https://picsum.photos/seed/ngxtw-5/500/400', alt: 'Gallery thumbnail 5' },
  { id: 6, src: 'https://picsum.photos/seed/ngxtw-6/400/500', alt: 'Gallery thumbnail 6' },
];

@Component({
  selector: 'app-aspect-ratio-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AspectRatioDirective, ButtonDirective, CodeBlockComponent],
  template: `
    <!-- Common Ratios -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Common Ratios</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass a ratio string with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">/</code>
        to lock an element's shape regardless of its width. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1 / 1</code>
        for square tiles and avatars,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">4 / 3</code>
        for classic photography,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">16 / 9</code>
        for video, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">21 / 9</code>
        for cinematic banners.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          @for (r of commonRatios; track r.ratio) {
            <div
              [twAspectRatio]="r.ratio"
              class="w-full grid place-items-center rounded-lg bg-surface-sunken text-xs font-mono text-fg-muted"
            >
              {{ r.label }}
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="commonRatiosSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The element fills its container width; the height is derived from the ratio.
        Constrain the width (here with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">w-full</code>
        inside a grid cell) and the height follows automatically.
      </p>
    </section>

    <!-- Images -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Images</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The directive sets only
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aspect-ratio</code>,
        so pair it with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">w-full</code>
        to fill the column and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">object-cover</code>
        to crop the source to the box without distortion. This is the canonical fix
        for thumbnails whose source images arrive at unpredictable dimensions.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <img
            twAspectRatio="16/9"
            src="https://picsum.photos/seed/ngxtw-wide/640/360"
            alt="Landscape preview, 16 by 9"
            class="w-full object-cover rounded-lg"
          />
          <img
            twAspectRatio="4/3"
            src="https://picsum.photos/seed/ngxtw-classic/640/480"
            alt="Landscape preview, 4 by 3"
            class="w-full object-cover rounded-lg"
          />
        </div>
      </div>
      <tw-code-block [code]="imagesSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Without
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">object-cover</code>
        the image would stretch to fill the ratio'd box. Keep the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">alt</code>
        text meaningful — the directive never touches it.
      </p>
    </section>

    <!-- Video Embeds -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Video Embeds</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Responsive video is the original reason aspect-ratio boxes exist: wrap an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;iframe&gt;</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;video&gt;</code>,
        or player surface so it scales with the layout while holding its shape. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">21 / 9</code>
        for an ultrawide cinematic frame.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div
          twAspectRatio="21/9"
          class="w-full grid place-items-center rounded-lg bg-surface-sunken text-fg-muted"
        >
          <div class="flex flex-col items-center gap-2">
            <span class="grid place-items-center size-12 rounded-full bg-surface-raised text-primary-600 shadow-sm">
              <svg class="size-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm6.39-2.908a.75.75 0 0 1 .766.027l3.5 2.25a.75.75 0 0 1 0 1.262l-3.5 2.25A.75.75 0 0 1 8 12.25v-4.5a.75.75 0 0 1 .39-.658Z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
            <span class="text-xs font-mono">21 / 9 player frame</span>
          </div>
        </div>
      </div>
      <tw-code-block [code]="videoSnippet" language="html" />
    </section>

    <!-- Numeric & Colon Syntax -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Numeric &amp; Colon Syntax</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Three input forms resolve to the same shape. Bind a unitless number when the
        ratio is computed, write a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">/</code>
        string for native CSS syntax, or use a familiar
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">:</code>
        string — all normalize to the CSS
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'w / h'</code>
        form.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div [twAspectRatio]="1.7777" class="w-full grid place-items-center rounded-lg bg-surface-sunken text-xs font-mono text-fg-muted">
            [twAspectRatio]="1.7777"
          </div>
          <div twAspectRatio="16/9" class="w-full grid place-items-center rounded-lg bg-surface-sunken text-xs font-mono text-fg-muted">
            twAspectRatio="16/9"
          </div>
          <div twAspectRatio="16:9" class="w-full grid place-items-center rounded-lg bg-surface-sunken text-xs font-mono text-fg-muted">
            twAspectRatio="16:9"
          </div>
        </div>
      </div>
      <tw-code-block [code]="syntaxSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Invalid input — an empty string, a zero or negative side, or a non-numeric
        value — falls back to a square
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1 / 1</code>),
        so the box never collapses to an undefined height.
      </p>
    </section>

    <!-- Image Grid -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Image Grid</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Applying the same ratio to every tile yields a uniform gallery even when the
        underlying images vary in size and orientation. Each tile holds a square while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">object-cover</code>
        crops the source to fit.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-3 gap-2 sm:gap-3">
          @for (tile of gridTiles; track tile.id) {
            <img
              twAspectRatio="1/1"
              [src]="tile.src"
              [alt]="tile.alt"
              class="w-full object-cover rounded-md"
            />
          }
        </div>
      </div>
      <tw-code-block [code]="gridSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pick a preset ratio or type your own (try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">2.35</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">5:4</code>),
        then switch the object-fit to see how the directive cooperates with the image
        sizing you choose. An invalid value falls back to a square.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Ratio</label>
            <div class="flex flex-wrap gap-1">
              @for (r of playgroundRatios; track r) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playRatio() === r"
                  [class.!text-primary-700]="playRatio() === r"
                  (click)="playRatio.set(r)"
                >{{ r }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1" for="ar-custom">Custom</label>
            <input
              id="ar-custom"
              type="text"
              [value]="playRatio()"
              (input)="onCustomRatio($event)"
              placeholder="e.g. 2.35 or 5:4"
              class="w-36 px-2.5 py-1.5 text-sm rounded-md bg-surface text-fg placeholder:text-fg-subtle
                     border border-border
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Object fit</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playFit() === 'cover'"
                [class.!text-primary-700]="playFit() === 'cover'"
                (click)="playFit.set('cover')"
              >cover</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playFit() === 'contain'"
                [class.!text-primary-700]="playFit() === 'contain'"
                (click)="playFit.set('contain')"
              >contain</button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken">
          <div class="max-w-md mx-auto">
            <img
              [twAspectRatio]="playRatio()"
              src="https://picsum.photos/seed/ngxtw-play/800/800"
              alt="Aspect ratio playground preview"
              class="w-full rounded-lg"
              [class.object-cover]="playFit() === 'cover'"
              [class.object-contain]="playFit() === 'contain'"
            />
            <p class="text-xs text-fg-muted mt-4 font-mono text-center">
              twAspectRatio = "{{ playRatio() }}" · object-{{ playFit() }}
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AspectRatioExamples {
  protected readonly commonRatios = COMMON_RATIOS;
  protected readonly playgroundRatios = PLAYGROUND_RATIOS;
  protected readonly gridTiles = GRID_TILES;

  // Playground
  protected readonly playRatio = signal<string>('16/9');
  protected readonly playFit = signal<'cover' | 'contain'>('cover');

  protected onCustomRatio(event: Event): void {
    this.playRatio.set((event.target as HTMLInputElement).value);
  }

  // ── Code snippets ──

  protected readonly commonRatiosSnippet = `
@for (r of commonRatios; track r.ratio) {
  <div [twAspectRatio]="r.ratio" class="w-full"></div>
}`.trim();

  protected readonly imagesSnippet = `<img
  twAspectRatio="16/9"
  src="/preview-wide.jpg"
  alt="Landscape preview, 16 by 9"
  class="w-full object-cover rounded-lg"
/>

<img
  twAspectRatio="4/3"
  src="/preview-classic.jpg"
  alt="Landscape preview, 4 by 3"
  class="w-full object-cover rounded-lg"
/>`;

  protected readonly videoSnippet = `<div twAspectRatio="21/9" class="w-full">
  <iframe
    src="https://www.youtube.com/embed/VIDEO_ID"
    title="Embedded video"
    class="w-full h-full rounded-lg"
    allowfullscreen
  ></iframe>
</div>`;

  protected readonly syntaxSnippet = `<!-- Unitless number (bound) -->
<div [twAspectRatio]="1.7777" class="w-full"></div>

<!-- Slash string (native CSS syntax) -->
<div twAspectRatio="16/9" class="w-full"></div>

<!-- Colon string (normalized to 16 / 9) -->
<div twAspectRatio="16:9" class="w-full"></div>`;

  protected readonly gridSnippet = `
@for (tile of gridTiles; track tile.id) {
  <img
    twAspectRatio="1/1"
    [src]="tile.src"
    [alt]="tile.alt"
    class="w-full object-cover rounded-md"
  />
}`.trim();
}
