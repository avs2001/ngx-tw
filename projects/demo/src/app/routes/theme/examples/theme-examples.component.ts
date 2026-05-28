import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ThemeService,
  ThemeDirective,
  TW_THEMES,
  TW_RESOLVED_THEMES,
} from '@cdevhub/ngx-tw/theme';

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
  imports: [ThemeDirective],
  template: `
      <!-- Theme switcher -->
      <section class="mb-10">
        <h2 class="text-sm font-semibold mb-3">Active Theme</h2>
        <div class="flex gap-2 mb-4">
          @for (t of themes; track t) {
            <button
              class="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-normal
                     border border-border
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              [class.bg-primary-600]="themeService.theme() === t"
              [class.text-white]="themeService.theme() === t"
              [class.bg-surface-raised]="themeService.theme() !== t"
              [class.text-fg]="themeService.theme() !== t"
              [class.hover:bg-surface-muted]="themeService.theme() !== t"
              (click)="themeService.setTheme(t)"
            >
              {{ t }}
            </button>
          }
        </div>
        <button
          class="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 text-white
                 hover:bg-primary-700 transition-colors duration-normal
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          (click)="themeService.cycleTheme()"
        >
          Cycle Theme
        </button>
        <div class="mt-3 text-sm text-fg-muted">
          <p>Selected: <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded">{{ themeService.theme() }}</code></p>
          <p>Resolved: <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded">{{ themeService.resolvedTheme() }}</code></p>
          <p>System:   <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded">{{ themeService.systemTheme() }}</code></p>
        </div>
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

      <!-- Side-by-side theme previews -->
      <section class="mb-10">
        <h2 class="text-sm font-semibold mb-3">Side-by-Side Preview</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          @for (rt of resolvedThemes; track rt) {
            <div
              [twTheme]="rt"
              class="rounded-lg border border-border bg-surface p-4"
            >
              <h3 class="text-sm font-semibold text-fg mb-2">{{ rt }}</h3>
              <p class="text-sm text-fg-muted mb-3">Sample text content for the {{ rt }} theme.</p>
              <div class="flex gap-2">
                <span class="px-3 py-1.5 rounded-md text-sm bg-primary-600 text-white">Primary</span>
                <span class="px-3 py-1.5 rounded-md text-sm bg-success-600 text-white">Success</span>
                <span class="px-3 py-1.5 rounded-md text-sm bg-error-600 text-white">Error</span>
              </div>
              <div class="mt-3 border-t border-border-muted pt-3">
                <p class="text-xs text-fg-subtle">Subtle text</p>
                <p class="text-xs text-fg-subtle opacity-50">Disabled text</p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Integration code -->
      <section>
        <h2 class="text-sm font-semibold mb-3">Consumer Integration</h2>
        <div class="bg-surface-sunken border border-border rounded-lg p-4">
          <pre class="text-sm font-mono whitespace-pre text-fg"><code>// app.config.ts
import {{ '{' }} provideTheme {{ '}' }} from '@cdevhub/ngx-tw/theme';

export const appConfig = {{ '{' }}
  providers: [provideTheme()],
{{ '}' }};

// styles.css
&#64;import '@cdevhub/ngx-tw/theme/index.css';</code></pre>
        </div>
      </section>
  `,
})
export class ThemeExamples {
  protected readonly themeService = inject(ThemeService);
  protected readonly themes = TW_THEMES;
  protected readonly resolvedThemes = TW_RESOLVED_THEMES;
  protected readonly tokenGroups = TOKEN_GROUPS;
}
