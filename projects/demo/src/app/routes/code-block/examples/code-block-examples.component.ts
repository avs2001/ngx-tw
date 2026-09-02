import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  CodeBlockComponent,
  CodeBlockHeaderDirective,
  type CodeBlockLabels,
  type CodeBlockVariant,
} from '@cdevhub/ngx-tw/code-block';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';

const VARIANTS: CodeBlockVariant[] = ['solid', 'outline'];

const FRENCH_LABELS: CodeBlockLabels = {
  copy: 'Copier le code',
  copied: 'Copié',
  announcement: 'Copié dans le presse-papier',
};

@Component({
  selector: 'app-code-block-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent, CodeBlockHeaderDirective, ButtonDirective],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised space-y-4">
        @for (v of variants; track v) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
            <tw-code-block [code]="shortSnippet" language="Shell" [variant]="v" />
          </div>
        }
      </div>
    </section>

    <!-- With Language Labels -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Language Labels</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised space-y-4">
        <tw-code-block [code]="tsSnippet" language="TypeScript" />
        <tw-code-block [code]="cssSnippet" language="CSS" />
        <tw-code-block [code]="jsonSnippet" language="JSON" />
        <tw-code-block [code]="htmlSnippet" language="HTML" variant="outline" />
      </div>
    </section>

    <!-- Header Slot -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Header Slot</h2>
      <p class="text-xs text-fg-muted mb-3">
        Project custom content into the header using the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twCodeBlockHeader]</code>
        directive. The slot sits alongside the language label, leaving the copy button on the right.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised space-y-4">
        <tw-code-block [code]="tsSnippet" language="TypeScript">
          <span twCodeBlockHeader>
            <span class="font-mono text-xs text-fg">button.ts</span>
          </span>
        </tw-code-block>

        <tw-code-block [code]="cssSnippet" language="CSS" variant="outline">
          <span twCodeBlockHeader>
            <span class="font-mono text-xs text-fg">styles.css</span>
            <span class="px-1.5 py-0.5 rounded text-2xs font-medium uppercase tracking-wide bg-warning-soft text-warning-soft-fg-muted">
              modified
            </span>
          </span>
        </tw-code-block>

        <tw-code-block [code]="shortSnippet" language="Shell">
          <span twCodeBlockHeader>
            <span class="font-mono text-xs text-fg">terminal · 1.2.0</span>
          </span>
        </tw-code-block>
      </div>
    </section>

    <!-- Word Wrap -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Word Wrap</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <tw-code-block [code]="longLine" language="TypeScript" wrap />
      </div>
    </section>

    <!-- Localized Labels -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Localized Labels</h2>
      <p class="text-xs text-fg-muted mb-3">
        Override the copy button aria-labels and the screen-reader announcement via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labels</code> input.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <tw-code-block [code]="shortSnippet" language="Shell" [labels]="frenchLabels" />
      </div>
    </section>

    <!-- Copy Feedback -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Copy Event</h2>
      <p class="text-xs text-fg-muted mb-3">Click the copy button to see the event counter increase.</p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <tw-code-block [code]="shortSnippet" language="Shell" (copied)="copyCount.update(c => c + 1)" />
        <p class="text-xs text-fg-muted mt-3">
          Copied {{ copyCount() }} time{{ copyCount() === 1 ? '' : 's' }}
        </p>
      </div>
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-3 mb-6">
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Wrap</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="!playWrap()"
                [class.!text-primary-700]="!playWrap()"
                (click)="playWrap.set(false)"
              >off</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playWrap()"
                [class.!text-primary-700]="playWrap()"
                (click)="playWrap.set(true)"
              >on</button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Language</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="!playLanguage()"
                [class.!text-primary-700]="!playLanguage()"
                (click)="playLanguage.set('')"
              >none</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playLanguage() === 'TypeScript'"
                [class.!text-primary-700]="playLanguage() === 'TypeScript'"
                (click)="playLanguage.set('TypeScript')"
              >TypeScript</button>
            </div>
          </div>
        </div>
        <tw-code-block
          [code]="playgroundSnippet"
          [variant]="playVariant()"
          [wrap]="playWrap()"
          [language]="playLanguage() || undefined"
        />
      </div>
    </section>
  `,
})
export class CodeBlockExamples {
  protected readonly variants = VARIANTS;
  protected readonly copyCount = signal(0);
  protected readonly playVariant = signal<CodeBlockVariant>('solid');
  protected readonly playWrap = signal(false);
  protected readonly playLanguage = signal('TypeScript');
  protected readonly frenchLabels = FRENCH_LABELS;

  protected readonly tsSnippet = `import { Component, input, output, computed } from '@angular/core';
import { tv } from 'tailwind-variants';

const buttonVariants = tv({
  base: 'inline-flex items-center justify-center rounded-md font-medium',
  variants: {
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    },
  },
  defaultVariants: { size: 'md' },
}, { twMerge: true });`;

  protected readonly longLine = `const result = await fetch('https://api.example.com/v1/users?page=1&limit=50&sort=created_at&order=desc&include=profile,settings,preferences&filter[status]=active&filter[role]=admin');`;

  protected readonly htmlSnippet = `<tw-code-block [code]="snippet" wrap (copied)="onCopied()" />`;

  protected readonly cssSnippet = `@theme {
  --color-primary-500: oklch(0.55 0.2 260);
  --color-surface-sunken: oklch(0.95 0 0);
}`;

  protected readonly jsonSnippet = `{
  "name": "ngx-tw",
  "version": "0.0.1",
  "peerDependencies": {
    "@angular/core": "^21.0.0",
    "tailwindcss": "^4.0.0"
  }
}`;

  protected readonly shortSnippet = `npm install ngx-tw`;

  protected readonly playgroundSnippet = `export class AppComponent {
  readonly snippet = 'const greeting = "Hello, world!"; console.log(greeting); // This is a long line that demonstrates horizontal scrolling vs word wrapping behavior in the code block component';
}`;
}
