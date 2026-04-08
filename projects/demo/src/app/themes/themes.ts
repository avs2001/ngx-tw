import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ThemeService,
  ThemeDirective,
  THEMES,
  RESOLVED_THEMES,
  type Theme,
  type ResolvedTheme,
} from 'ngx-tw/theme';

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
    label: 'Background',
    tokens: [
      { name: 'bg-subtle', variable: '--color-bg-subtle' },
      { name: 'bg-muted', variable: '--color-bg-muted' },
      { name: 'bg-default', variable: '--color-bg-default' },
      { name: 'bg-emphasis', variable: '--color-bg-emphasis' },
    ],
  },
  {
    label: 'Surface',
    tokens: [
      { name: 'surface-base', variable: '--color-surface-base' },
      { name: 'surface-raised', variable: '--color-surface-raised' },
      { name: 'surface-overlay', variable: '--color-surface-overlay' },
      { name: 'surface-sunken', variable: '--color-surface-sunken' },
      { name: 'surface-muted', variable: '--color-surface-muted' },
    ],
  },
  {
    label: 'Text',
    tokens: [
      { name: 'text-primary', variable: '--color-text-primary' },
      { name: 'text-secondary', variable: '--color-text-secondary' },
      { name: 'text-tertiary', variable: '--color-text-tertiary' },
      { name: 'text-disabled', variable: '--color-text-disabled' },
      { name: 'text-inverse', variable: '--color-text-inverse' },
      { name: 'text-link', variable: '--color-text-link' },
      { name: 'text-link-hover', variable: '--color-text-link-hover' },
    ],
  },
  {
    label: 'Border',
    tokens: [
      { name: 'border-subtle', variable: '--color-border-subtle' },
      { name: 'border-muted', variable: '--color-border-muted' },
      { name: 'border-default', variable: '--color-border-default' },
      { name: 'border-emphasis', variable: '--color-border-emphasis' },
    ],
  },
  {
    label: 'Brand',
    tokens: [
      { name: 'brand-subtle', variable: '--color-brand-subtle' },
      { name: 'brand-muted', variable: '--color-brand-muted' },
      { name: 'brand-default', variable: '--color-brand-default' },
      { name: 'brand-emphasis', variable: '--color-brand-emphasis' },
      { name: 'brand-fg', variable: '--color-brand-fg' },
    ],
  },
  {
    label: 'Success',
    tokens: [
      { name: 'success-subtle', variable: '--color-success-subtle' },
      { name: 'success-muted', variable: '--color-success-muted' },
      { name: 'success-default', variable: '--color-success-default' },
      { name: 'success-emphasis', variable: '--color-success-emphasis' },
      { name: 'success-fg', variable: '--color-success-fg' },
    ],
  },
  {
    label: 'Warning',
    tokens: [
      { name: 'warning-subtle', variable: '--color-warning-subtle' },
      { name: 'warning-muted', variable: '--color-warning-muted' },
      { name: 'warning-default', variable: '--color-warning-default' },
      { name: 'warning-emphasis', variable: '--color-warning-emphasis' },
      { name: 'warning-fg', variable: '--color-warning-fg' },
    ],
  },
  {
    label: 'Danger',
    tokens: [
      { name: 'danger-subtle', variable: '--color-danger-subtle' },
      { name: 'danger-muted', variable: '--color-danger-muted' },
      { name: 'danger-default', variable: '--color-danger-default' },
      { name: 'danger-emphasis', variable: '--color-danger-emphasis' },
      { name: 'danger-fg', variable: '--color-danger-fg' },
    ],
  },
];

@Component({
  selector: 'app-themes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ThemeDirective],
  template: `
    <div class="min-h-screen bg-bg-default text-text-primary p-8">
      <h1 class="text-2xl font-bold mb-6">Theme System</h1>

      <!-- Theme switcher -->
      <section class="mb-10">
        <h2 class="text-sm font-semibold mb-3">Active Theme</h2>
        <div class="flex gap-2 mb-4">
          @for (t of themes; track t) {
            <button
              class="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                     border border-border-default
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-default"
              [class.bg-brand-default]="themeService.theme() === t"
              [class.text-brand-fg]="themeService.theme() === t"
              [class.bg-surface-raised]="themeService.theme() !== t"
              [class.text-text-primary]="themeService.theme() !== t"
              [class.hover:bg-surface-muted]="themeService.theme() !== t"
              (click)="themeService.setTheme(t)"
            >
              {{ t }}
            </button>
          }
        </div>
        <button
          class="px-4 py-2 rounded-md text-sm font-medium bg-brand-default text-brand-fg
                 hover:bg-brand-emphasis transition-colors duration-200
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-default"
          (click)="themeService.cycleTheme()"
        >
          Cycle Theme
        </button>
        <div class="mt-3 text-sm text-text-secondary">
          <p>Selected: <code class="font-mono bg-bg-muted px-1.5 py-0.5 rounded">{{ themeService.theme() }}</code></p>
          <p>Resolved: <code class="font-mono bg-bg-muted px-1.5 py-0.5 rounded">{{ themeService.resolvedTheme() }}</code></p>
          <p>System:   <code class="font-mono bg-bg-muted px-1.5 py-0.5 rounded">{{ themeService.systemTheme() }}</code></p>
        </div>
      </section>

      <!-- Token swatches -->
      <section class="mb-10">
        <h2 class="text-sm font-semibold mb-3">Semantic Tokens</h2>
        @for (group of tokenGroups; track group.label) {
          <div class="mb-6">
            <h3 class="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">{{ group.label }}</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              @for (token of group.tokens; track token.name) {
                <div class="flex flex-col">
                  <div
                    class="h-12 rounded-lg border border-border-default"
                    [style.background-color]="'var(' + token.variable + ')'"
                  ></div>
                  <span class="text-xs font-mono text-text-tertiary mt-1">{{ token.name }}</span>
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
              class="rounded-lg border border-border-default bg-bg-default p-4"
            >
              <h3 class="text-sm font-semibold text-text-primary mb-2">{{ rt }}</h3>
              <p class="text-sm text-text-secondary mb-3">Sample text content for the {{ rt }} theme.</p>
              <div class="flex gap-2">
                <span class="px-3 py-1.5 rounded-md text-sm bg-brand-default text-brand-fg">Brand</span>
                <span class="px-3 py-1.5 rounded-md text-sm bg-success-default text-success-fg">Success</span>
                <span class="px-3 py-1.5 rounded-md text-sm bg-danger-default text-danger-fg">Danger</span>
              </div>
              <div class="mt-3 border-t border-border-muted pt-3">
                <p class="text-xs text-text-tertiary">Tertiary text</p>
                <p class="text-xs text-text-disabled">Disabled text</p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Integration code -->
      <section>
        <h2 class="text-sm font-semibold mb-3">Consumer Integration</h2>
        <div class="bg-surface-sunken border border-border-default rounded-lg p-4">
          <pre class="text-sm font-mono whitespace-pre text-text-primary"><code>// app.config.ts
import {{ '{' }} provideTheme {{ '}' }} from 'ngx-tw/theme';

export const appConfig = {{ '{' }}
  providers: [provideTheme()],
{{ '}' }};

// styles.css
&#64;import 'ngx-tw/theme/index.css';</code></pre>
        </div>
      </section>
    </div>
  `,
})
export class ThemesPage {
  protected readonly themeService = inject(ThemeService);
  protected readonly themes = THEMES;
  protected readonly resolvedThemes = RESOLVED_THEMES;
  protected readonly tokenGroups = TOKEN_GROUPS;
}
