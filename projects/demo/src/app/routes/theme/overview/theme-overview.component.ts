import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from 'ngx-tw/theme';

@Component({
  selector: 'app-theme-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Theme service manages light, dark, and high-contrast modes with automatic system
        preference detection. It persists the user's choice in localStorage and applies the
        resolved theme as a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">data-theme</code>
        attribute on the document element.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Current State</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">Selected</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ themeService.theme() }}</code>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">Resolved</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ themeService.resolvedTheme() }}</code>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-1">System</p>
            <code class="font-mono bg-surface-muted px-1.5 py-0.5 rounded text-fg">{{ themeService.systemTheme() }}</code>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Setup</h2>
      <div class="bg-surface-sunken border border-border rounded-lg p-4 mb-4">
        <pre class="text-sm font-mono whitespace-pre text-fg"><code>// app.config.ts
import {{ '{' }} provideTheme {{ '}' }} from 'ngx-tw/theme';

export const appConfig = {{ '{' }}
  providers: [provideTheme()],
{{ '}' }};

// styles.css
&#64;import 'ngx-tw/theme/index.css';</code></pre>
      </div>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>4 theme modes: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">light</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dark</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">high-contrast</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">system</code></li>
        <li>Automatic OS color scheme detection via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-color-scheme</code></li>
        <li>Persisted to localStorage across sessions</li>
        <li>Signal-based reactive API with computed boolean helpers</li>
        <li>SSR-safe (checks <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">isPlatformBrowser</code>)</li>
        <li>Configurable storage key, attribute name, and target element</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ThemeDirective</code> for scoping themes to individual elements</li>
      </ul>
    </section>
  `,
})
export class ThemeOverview {
  protected readonly themeService = inject(ThemeService);
}
