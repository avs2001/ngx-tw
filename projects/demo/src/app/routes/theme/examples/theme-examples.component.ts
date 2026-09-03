import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ThemeService,
  ThemeDirective,
  TW_THEME_CONFIG,
  TW_THEMES,
  TW_RESOLVED_THEMES,
} from '@cdevhub/ngx-tw/theme';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

interface TokenSwatch {
  name: string;
  variable: string;
}

interface TokenGroup {
  label: string;
  tokens: TokenSwatch[];
}

const TOKEN_GROUPS: TokenGroup[] = [
  {
    label: 'Surface',
    tokens: [
      { name: 'surface', variable: '--color-surface' },
      { name: 'surface-raised', variable: '--color-surface-raised' },
      { name: 'surface-overlay', variable: '--color-surface-overlay' },
      { name: 'surface-sunken', variable: '--color-surface-sunken' },
      { name: 'surface-muted', variable: '--color-surface-muted' },
    ],
  },
  {
    label: 'Foreground',
    tokens: [
      { name: 'fg', variable: '--color-fg' },
      { name: 'fg-muted', variable: '--color-fg-muted' },
      { name: 'fg-subtle', variable: '--color-fg-subtle' },
    ],
  },
  {
    label: 'Border',
    tokens: [
      { name: 'border', variable: '--color-border' },
      { name: 'border-muted', variable: '--color-border-muted' },
      { name: 'border-strong', variable: '--color-border-strong' },
    ],
  },
  {
    label: 'Primary',
    tokens: [
      { name: 'primary-50', variable: '--color-primary-50' },
      { name: 'primary-100', variable: '--color-primary-100' },
      { name: 'primary-300', variable: '--color-primary-300' },
      { name: 'primary-500', variable: '--color-primary-500' },
      { name: 'primary-700', variable: '--color-primary-700' },
      { name: 'primary-900', variable: '--color-primary-900' },
    ],
  },
  {
    label: 'Secondary',
    tokens: [
      { name: 'secondary-50', variable: '--color-secondary-50' },
      { name: 'secondary-100', variable: '--color-secondary-100' },
      { name: 'secondary-300', variable: '--color-secondary-300' },
      { name: 'secondary-500', variable: '--color-secondary-500' },
      { name: 'secondary-700', variable: '--color-secondary-700' },
      { name: 'secondary-900', variable: '--color-secondary-900' },
    ],
  },
  {
    label: 'Accent',
    tokens: [
      { name: 'accent-50', variable: '--color-accent-50' },
      { name: 'accent-100', variable: '--color-accent-100' },
      { name: 'accent-300', variable: '--color-accent-300' },
      { name: 'accent-500', variable: '--color-accent-500' },
      { name: 'accent-700', variable: '--color-accent-700' },
      { name: 'accent-900', variable: '--color-accent-900' },
    ],
  },
  {
    label: 'Info',
    tokens: [
      { name: 'info-50', variable: '--color-info-50' },
      { name: 'info-100', variable: '--color-info-100' },
      { name: 'info-300', variable: '--color-info-300' },
      { name: 'info-500', variable: '--color-info-500' },
      { name: 'info-700', variable: '--color-info-700' },
      { name: 'info-900', variable: '--color-info-900' },
    ],
  },
  {
    label: 'Success',
    tokens: [
      { name: 'success-50', variable: '--color-success-50' },
      { name: 'success-100', variable: '--color-success-100' },
      { name: 'success-300', variable: '--color-success-300' },
      { name: 'success-500', variable: '--color-success-500' },
      { name: 'success-700', variable: '--color-success-700' },
      { name: 'success-900', variable: '--color-success-900' },
    ],
  },
  {
    label: 'Warning',
    tokens: [
      { name: 'warning-50', variable: '--color-warning-50' },
      { name: 'warning-100', variable: '--color-warning-100' },
      { name: 'warning-300', variable: '--color-warning-300' },
      { name: 'warning-500', variable: '--color-warning-500' },
      { name: 'warning-700', variable: '--color-warning-700' },
      { name: 'warning-900', variable: '--color-warning-900' },
    ],
  },
  {
    label: 'Error',
    tokens: [
      { name: 'error-50', variable: '--color-error-50' },
      { name: 'error-100', variable: '--color-error-100' },
      { name: 'error-300', variable: '--color-error-300' },
      { name: 'error-500', variable: '--color-error-500' },
      { name: 'error-700', variable: '--color-error-700' },
      { name: 'error-900', variable: '--color-error-900' },
    ],
  },
  {
    label: 'Neutral',
    tokens: [
      { name: 'neutral-50', variable: '--color-neutral-50' },
      { name: 'neutral-100', variable: '--color-neutral-100' },
      { name: 'neutral-300', variable: '--color-neutral-300' },
      { name: 'neutral-500', variable: '--color-neutral-500' },
      { name: 'neutral-700', variable: '--color-neutral-700' },
      { name: 'neutral-900', variable: '--color-neutral-900' },
    ],
  },
];

@Component({
  selector: 'app-theme-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ThemeDirective, CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Switching Themes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setTheme()</code>
        assigns one of the four selectable values and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">cycleTheme()</code>
        advances to the next one, wrapping around — use the first for a segmented picker or a
        settings menu, the second for a single icon button in a toolbar. Both persist the choice,
        so pick whichever fits the surface rather than worrying about storage.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          @for (t of themes; track t) {
            <button
              type="button"
              class="px-4 py-2 rounded-md text-sm font-medium border border-border cursor-pointer
                     transition-colors duration-normal motion-reduce:transition-none
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              [class.bg-primary-600]="themeService.theme() === t"
              [class.text-on-primary]="themeService.theme() === t"
              [class.bg-surface-raised]="themeService.theme() !== t"
              [class.text-fg]="themeService.theme() !== t"
              [class.hover:bg-surface-muted]="themeService.theme() !== t"
              [attr.aria-pressed]="themeService.theme() === t"
              (click)="themeService.setTheme(t)"
            >
              {{ t }}
            </button>
          }
          <button
            type="button"
            class="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 text-on-primary cursor-pointer
                   hover:bg-primary-700 transition-colors duration-normal motion-reduce:transition-none
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            (click)="themeService.cycleTheme()"
          >
            Cycle Theme
          </button>
        </div>
        <p class="text-xs text-fg-muted mt-4 font-mono">selected = {{ themeService.theme() }}</p>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="switchingThemesTsSnippet" language="ts" />
        <tw-code-block [code]="switchingThemesHtmlSnippet" language="html" />
      </div>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The buttons above are plain elements so the example stays about the service. In a real
        toolbar reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-segmented-control</code>
        or a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-menu</code>
        and call the same two methods from it.
      </p>
    </section>

    <!-- Token swatches -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Semantic Tokens</h2>
      @for (group of tokenGroups; track group.label) {
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wide">{{ group.label }}</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            @for (token of group.tokens; track token.name) {
              <div class="flex flex-col">
                <div
                  class="h-12 rounded-lg border border-border"
                  [style.background-color]="'var(' + token.variable + ')'"
                ></div>
                <span class="text-xs font-mono text-fg-subtle mt-1">{{ token.name }}</span>
              </div>
            }
          </div>
        </div>
      }
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Scoped Subtrees</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twTheme]</code>
        writes the theme attribute onto its own host, so everything inside that element resolves
        its tokens from the named scheme regardless of what the document is set to. Use it for a
        fixed-appearance region — a print or email preview, a marketing hero that must stay dark,
        or a side-by-side comparison like this one. The four panes below are every resolved
        scheme, rendered simultaneously inside whatever theme the page is currently set to — the
        fastest way to eyeball how a change lands in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">high-contrast-dark</code>
        without switching your OS settings. It takes a resolved theme only:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'system'</code>
        is not a valid value, because a scoped region has no OS preference of its own to follow.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          @for (rt of resolvedThemes; track rt) {
            <div [twTheme]="rt" class="rounded-lg border border-border bg-surface p-4">
              <h3 class="text-sm font-semibold text-fg mb-2">{{ rt }}</h3>
              <p class="text-sm text-fg-muted mb-3">Sample text content for the {{ rt }} theme.</p>
              <div class="flex gap-2">
                <span class="px-3 py-1.5 rounded-md text-sm bg-primary-600 text-on-primary">Primary</span>
                <span class="px-3 py-1.5 rounded-md text-sm bg-success-600 text-on-success">Success</span>
                <span class="px-3 py-1.5 rounded-md text-sm bg-error-600 text-on-error">Error</span>
              </div>
              <div class="mt-3 border-t border-border-muted pt-3">
                <p class="text-xs text-fg-subtle">Subtle text</p>
                <p class="text-xs text-fg-subtle opacity-50">Disabled text</p>
              </div>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="scopedSubtreesSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The directive only sets the attribute — it does not create an injector scope, so a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ThemeService</code>
        injected inside the subtree still reports the document theme. Read the pane's scheme from
        the value you bound, not from the service. It also writes the literal
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">data-theme</code>
        rather than a renamed
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">attribute</code>,
        because that is the name the shipped stylesheet's blocks key off.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reading Theme State</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Prefer
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">resolvedTheme()</code>
        whenever you need to branch on what the user actually sees — it never returns
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'system'</code>.
        Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">theme()</code>
        only when you are rendering the selection itself, such as marking the active entry in a
        picker. Everything is a signal, so a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">computed()</code>
        that reads one recomputes when the OS preference changes.
      </p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The three boolean helpers answer two questions, not one, so they are not mutually
        exclusive:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">isDark()</code>
        is the appearance axis and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">isHighContrast()</code>
        the contrast axis, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'high-contrast-dark'</code>
        sets both. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">isDark()</code>
        for anything that has to sit on the page background, such as a chart grid colour, and
        branch on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">resolvedTheme()</code>
        when you genuinely need one scheme.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">theme()</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ themeService.theme() }}</code>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">resolvedTheme()</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ themeService.resolvedTheme() }}</code>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">systemTheme()</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ themeService.systemTheme() }}</code>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">isDark()</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ themeService.isDark() }}</code>
          </div>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="readingThemeStateTsSnippet" language="ts" />
        <tw-code-block [code]="readingThemeStateHtmlSnippet" language="html" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Provider Configuration</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideTheme()</code>
        accepts a partial config and fills every unset key from the built-in defaults, so pass
        only what you are changing. Override
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">storageKey</code>
        when several apps share an origin, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">target</code>
        when the attribute must land on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">body</code>
        instead of the document element. Renaming
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">attribute</code>
        is for consumers driving their own token CSS: the shipped stylesheet keys off the literal
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">data-theme</code>
        and will not react to any other name. The resolved value is readable anywhere via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_THEME_CONFIG</code>
        token — this page's own is below.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">defaultTheme</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ config.defaultTheme }}</code>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">storageKey</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ config.storageKey }}</code>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">attribute</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ config.attribute }}</code>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">target</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ config.target }}</code>
          </div>
        </div>
      </div>
      <tw-code-block [code]="providerConfigurationSnippet" language="ts" />
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Preventing the Initial Flash</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A user who never picks a theme is already covered: the stylesheet's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-color-scheme</code>
        branch resolves before the first paint with no JavaScript involved. The flash is what an
        <em>explicit</em> choice that disagrees with the OS looks like — light chosen on a dark
        machine — because the stored value can only be read once the bundle runs, which is after
        the browser has painted. An inline script in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">index.html</code>
        closes that window; the entry point exports its body as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_THEME_BOOTSTRAP_SCRIPT</code>
        so the storage key and attribute cannot drift from what the service uses.
      </p>
      <div class="space-y-3">
        <tw-code-block [code]="initialFlashHtmlSnippet" language="html" />
        <tw-code-block [code]="initialFlashTsSnippet" language="ts" />
      </div>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        A stored
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'system'</code>
        deliberately writes nothing, leaving the CSS branch in charge. The script assumes the
        default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">target: 'documentElement'</code>
        — a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;head&gt;</code>
        script runs before
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;body&gt;</code>
        exists — and encodes the default key and attribute, so adapt the literal if you overrode
        either.
      </p>
    </section>
  `,
})
export class ThemeExamples {
  protected readonly themeService = inject(ThemeService);
  protected readonly config = inject(TW_THEME_CONFIG);
  protected readonly themes = TW_THEMES;
  protected readonly resolvedThemes = TW_RESOLVED_THEMES;
  protected readonly tokenGroups = TOKEN_GROUPS;

  protected readonly switchingThemesTsSnippet = `import { Component, inject } from '@angular/core';
import { ThemeService, TW_THEMES } from '@cdevhub/ngx-tw/theme';

@Component({ /* … */ })
export class ThemeToggle {
  protected readonly themeService = inject(ThemeService);
  protected readonly themes = TW_THEMES;
}`;

  protected readonly switchingThemesHtmlSnippet = `@for (t of themes; track t) {
  <button
    type="button"
    [class.bg-primary-600]="themeService.theme() === t"
    [class.text-on-primary]="themeService.theme() === t"
    [attr.aria-pressed]="themeService.theme() === t"
    (click)="themeService.setTheme(t)"
  >
    {{ t }}
  </button>
}

<button type="button" (click)="themeService.cycleTheme()">Cycle Theme</button>`;

  protected readonly scopedSubtreesSnippet = `// resolvedThemes = TW_RESOLVED_THEMES
@for (rt of resolvedThemes; track rt) {
  <div [twTheme]="rt" class="rounded-lg border border-border bg-surface p-4">
    <h3 class="text-sm font-semibold text-fg mb-2">{{ rt }}</h3>
    <p class="text-sm text-fg-muted">Sample text content for the {{ rt }} theme.</p>
  </div>
}`;

  protected readonly readingThemeStateTsSnippet = `import { Component, computed, inject } from '@angular/core';
import { ThemeService } from '@cdevhub/ngx-tw/theme';

@Component({ /* … */ })
export class ChartPanel {
  private readonly themeService = inject(ThemeService);

  // resolvedTheme() is never 'system', so this never has to handle that case.
  protected readonly gridColor = computed(() =>
    this.themeService.isDark() ? '#334155' : '#e2e8f0',
  );
}`;

  protected readonly readingThemeStateHtmlSnippet = `<!-- Both can be true at once: 'high-contrast-dark' is dark AND high contrast. -->
@if (themeService.isHighContrast()) {
  <p>High-contrast mode is active.</p>
}
@if (themeService.isDark()) {
  <p>The surface underneath is dark.</p>
}
<p>Resolved theme: {{ themeService.resolvedTheme() }}</p>`;

  protected readonly providerConfigurationSnippet = `// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideTheme } from '@cdevhub/ngx-tw/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    // Unset keys keep their defaults: attribute 'data-theme',
    // target 'documentElement'.
    provideTheme({
      defaultTheme: 'dark',
      storageKey: 'acme-theme',
    }),
  ],
};`;

  protected readonly initialFlashHtmlSnippet = `<!-- index.html -->
<head>
  <script>try{var t=localStorage.getItem('ngx-tw-theme');if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
</head>`;

  protected readonly initialFlashTsSnippet = `// Or interpolate the exported constant during an SSR / index transform, so the
// storage key and attribute can never drift from what ThemeService uses.
import { TW_THEME_BOOTSTRAP_SCRIPT } from '@cdevhub/ngx-tw/theme';

const inlineScript = '<script>' + TW_THEME_BOOTSTRAP_SCRIPT + '</script>';`;
}
