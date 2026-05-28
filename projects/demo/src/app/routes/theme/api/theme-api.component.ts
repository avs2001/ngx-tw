import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-theme-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ThemeService -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ThemeService</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Provided via provideTheme()</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Signals</h3>
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
              <td class="px-4 py-2 font-mono text-xs">theme()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;TwTheme&gt;</td>
              <td class="px-4 py-2 text-fg-muted">User-selected theme. May be 'system'.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">resolvedTheme()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;TwResolvedTheme&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Actual theme applied to the DOM. Never 'system'.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">systemTheme()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;TwResolvedTheme&gt;</td>
              <td class="px-4 py-2 text-fg-muted">OS color scheme preference.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">isDark()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when resolved theme is 'dark'.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">isLight()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when resolved theme is 'light'.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">isHighContrast()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when resolved theme is 'high-contrast'.</td>
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
              <td class="px-4 py-2 font-mono text-xs">setTheme</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(theme: TwTheme) => void</td>
              <td class="px-4 py-2 text-fg-muted">Sets the active theme and persists to localStorage.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">cycleTheme</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() => void</td>
              <td class="px-4 py-2 text-fg-muted">Cycles through all available themes in order.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ThemeDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ThemeDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twTheme]</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
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
              <td class="px-4 py-2 font-mono text-xs">twTheme</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwResolvedTheme</td>
              <td class="px-4 py-2 text-fg-muted">Sets data-theme attribute on the host element.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <div class="bg-surface-sunken border border-border rounded-lg p-4">
        <pre class="text-sm font-mono whitespace-pre text-fg"><code>type TwTheme = 'light' | 'dark' | 'high-contrast' | 'system';
type TwResolvedTheme = 'light' | 'dark' | 'high-contrast';

interface TwThemeConfig {{ '{' }}
  defaultTheme: TwTheme;   // default: 'system'
  storageKey: string;      // default: 'ngx-tw-theme'
  attribute: string;       // default: 'data-theme'
  target: 'documentElement' | 'body';  // default: 'documentElement'
{{ '}' }}</code></pre>
      </div>
    </section>
  `,
})
export class ThemeApi {}
