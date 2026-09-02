import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '@cdevhub/ngx-tw/theme';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-theme-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The theme entry point ships the library's default semantic-token stylesheet plus the
        runtime API that switches between its three schemes.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ThemeService</code>
        owns the selected theme, resolves
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'system'</code>
        against the OS
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-color-scheme</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-contrast</code>
        preferences, persists an explicit choice to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">localStorage</code>,
        and writes the resolved value onto the document as a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">data-theme</code>
        attribute. Every component in the library reads its colours from tokens that
        attribute re-declares, so nothing needs a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dark:</code>
        variant of its own.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Registering the provider is the whole setup: it supplies the resolved configuration,
        registers the service, and instantiates it during bootstrap so the stored preference is
        applied on first paint without anything having to inject it. The readout below is this
        page reading the live service.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
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
      <tw-code-block [code]="basicUsageSnippet" language="ts" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        With no arguments the default theme is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'system'</code>,
        so an app that never renders a theme toggle still follows the operating system. The
        stylesheet's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-color-scheme</code>
        media branch covers that case with no JavaScript at all — the service is only needed
        once a user makes an explicit choice. Because an explicit choice can only be read back
        after the bundle executes, a reload where the stored theme disagrees with the OS paints
        the OS theme first; the exported
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_THEME_BOOTSTRAP_SCRIPT</code>
        is an inline
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">index.html</code>
        script body that removes that flash — see Preventing the Initial Flash on the Examples
        tab.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="stylesheetSnippet" language="css" />
      </div>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>4 selectable themes:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">light</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dark</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">high-contrast</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">system</code>
        </li>
        <li>Automatic OS appearance detection via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-color-scheme</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-contrast</code>,
          re-resolved live when either setting changes
        </li>
        <li>An explicit selection is persisted to
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">localStorage</code>
          under a configurable key — merely providing the service writes nothing
        </li>
        <li>Flash-free first paint via the exported
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_THEME_BOOTSTRAP_SCRIPT</code>
          inline script body
        </li>
        <li>Signal-based reactive API with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">isDark</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">isLight</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">isHighContrast</code>
          helpers and a composite
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">state()</code>
          snapshot
        </li>
        <li>SSR-safe — every DOM, matchMedia, and storage touch is guarded by
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">isPlatformBrowser</code>
        </li>
        <li>Configurable storage key, attribute name, target element, and default theme</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twTheme]</code>
          scopes a fixed theme to one subtree, independent of the document theme
        </li>
        <li>All three schemes define the same 195 colour tokens, so no component has a hole in
          dark or high contrast
        </li>
      </ul>
    </section>
  `,
})
export class ThemeOverview {
  protected readonly themeService = inject(ThemeService);

  protected readonly basicUsageSnippet = `// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideTheme } from '@cdevhub/ngx-tw/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTheme(),
  ],
};`;

  protected readonly importSnippet = `import {
  provideTheme,
  ThemeService,
  ThemeDirective,
  THEME_CONFIG,
  TW_THEMES,
  TW_RESOLVED_THEMES,
} from '@cdevhub/ngx-tw/theme';`;

  protected readonly stylesheetSnippet = `/* styles.css — pulls in the semantic tokens for all three schemes */
@import '@cdevhub/ngx-tw/theme/index.css';`;
}
