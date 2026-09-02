import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-theme-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- provideTheme -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">provideTheme</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Signature: provideTheme(config?: Partial&lt;TwThemeConfig&gt;) =&gt; EnvironmentProviders</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Config</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">defaultTheme</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTheme</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'system'</td>
              <td class="px-4 py-2 text-fg-muted">Theme used when nothing is stored for this browser.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">storageKey</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'ngx-tw-theme'</td>
              <td class="px-4 py-2 text-fg-muted">localStorage key the selected theme is persisted under.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">attribute</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'data-theme'</td>
              <td class="px-4 py-2 text-fg-muted">HTML attribute written onto the target element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">target</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'documentElement' | 'body'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'documentElement'</td>
              <td class="px-4 py-2 text-fg-muted">Element that receives the theme attribute.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ThemeService -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ThemeService</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Provided by provideTheme()</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">WritableSignal&lt;TwTheme&gt;</td>
              <td class="px-4 py-2 text-fg-muted">The user-selected theme, which may be 'system'.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">resolvedTheme()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;TwResolvedTheme&gt;</td>
              <td class="px-4 py-2 text-fg-muted">The theme actually applied to the DOM, never 'system'.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">systemTheme()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">WritableSignal&lt;TwResolvedTheme&gt;</td>
              <td class="px-4 py-2 text-fg-muted">The OS appearance preference, resolved from prefers-color-scheme and prefers-contrast and kept live by media-query listeners.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">isDark()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when the resolved theme is 'dark'.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">isLight()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when the resolved theme is 'light'.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">isHighContrast()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True when the resolved theme is 'high-contrast'.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">state()</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;TwThemeState&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Composite snapshot of every signal above in one object.</td>
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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(theme: TwTheme) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Sets the selected theme and persists it.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">cycleTheme</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Advances to the next entry in TW_THEMES, wrapping around.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">applyToElement</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(element: HTMLElement, theme: TwResolvedTheme) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Writes the configured theme attribute onto an arbitrary element.</td>
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
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">twTheme</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwResolvedTheme</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">required</td>
              <td class="px-4 py-2 text-fg-muted">Scopes the host subtree to a fixed resolved theme.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- THEME_CONFIG -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">THEME_CONFIG</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Token: InjectionToken&lt;Required&lt;TwThemeConfig&gt;&gt;</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Carries the configuration provideTheme() resolved at bootstrap, with every key filled in
        from the defaults. Inject it to read the storage key or attribute name the service is
        actually using.
      </p>
    </section>

    <!-- TW_THEME_BOOTSTRAP_SCRIPT -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TW_THEME_BOOTSTRAP_SCRIPT</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Const: string</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Body of an inline head script that applies a previously persisted theme before the app
        bundle runs, eliminating the flash of the wrong theme on reload. It is built from the
        default config, so it encodes the default storage key and attribute and assumes the
        document element as its target.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class ThemeApi {
  protected readonly typesSnippet = `type TwTheme = 'light' | 'dark' | 'high-contrast' | 'system';
type TwResolvedTheme = 'light' | 'dark' | 'high-contrast';

// Every key is optional. provideTheme() fills the unset ones from
// DEFAULT_TW_THEME_CONFIG, so the injected THEME_CONFIG value always
// carries all four settings.
interface TwThemeConfig {
  defaultTheme?: TwTheme;               // default: 'system'
  storageKey?: string;                  // default: 'ngx-tw-theme'
  attribute?: string;                   // default: 'data-theme'
  target?: 'documentElement' | 'body';  // default: 'documentElement'
}

// Composite snapshot returned by ThemeService.state().
interface TwThemeState {
  readonly theme: TwTheme;
  readonly resolvedTheme: TwResolvedTheme;
  readonly systemTheme: TwResolvedTheme;
  readonly isDark: boolean;
  readonly isLight: boolean;
  readonly isHighContrast: boolean;
}

const TW_THEMES: readonly TwTheme[];                  // every selectable value
const TW_RESOLVED_THEMES: readonly TwResolvedTheme[]; // TW_THEMES minus 'system'
const DEFAULT_TW_THEME_CONFIG: Required<TwThemeConfig>;
const TW_THEME_BOOTSTRAP_SCRIPT: string;              // inline <head> script body`;
}
