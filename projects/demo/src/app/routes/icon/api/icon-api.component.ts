import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-icon-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- IconComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">IconComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-icon</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
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
              <td class="px-4 py-2 font-mono text-xs">name</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Icon name in kebab-case, resolved via the registry.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">img</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwIconData</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Direct icon data that takes precedence over the registry lookup.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwIconColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'current'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color; 'current' inherits from the parent text color.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Icon size on the standard scale from xs (12px) to xl (32px).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Accessible label; when set, removes aria-hidden and announces the icon as role="img".</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">svg</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwIconSvgConfig</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">SVG-author config: strokeWidth (default 2), absoluteStrokeWidth (default false), viewBox (default '0 0 24 24'). Unset fields fall back to defaults.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- IconRegistry -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">IconRegistry</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Provided by: provideTwIcons / provideTwLucideIcons</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
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
              <td class="px-4 py-2 font-mono text-xs">register</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(icons: TwIconMap) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Merges the given icons into the registry.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">get</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(name: string) =&gt; TwIconData | null</td>
              <td class="px-4 py-2 text-fg-muted">Returns the icon data for the given PascalCase name, or null if unregistered.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- provideTwIcons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">provideTwIcons</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Import: ngx-tw/icon</p>

      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Signature</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">provideTwIcons(icons: TwIconMap): Provider[]</td>
              <td class="px-4 py-2 text-fg-muted">Registers raw SVG icon data; works at the app, lazy route, or component injector.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- provideTwLucideIcons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">provideTwLucideIcons</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Import: ngx-tw/icon/lucide</p>

      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Signature</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">provideTwLucideIcons(icons: LucideIcons): Provider[]</td>
              <td class="px-4 py-2 text-fg-muted">Drop-in replacement for provideTwIcons that accepts Lucide icon imports directly.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">fromLucideIcon(icon: LucideIconData): TwIconData</td>
              <td class="px-4 py-2 text-fg-muted">Converts a single Lucide icon to the generic TwIconData format.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class IconApi {
  protected readonly typesSnippet = `type TwIconNode = readonly [string, Readonly<Record<string, string | number>>];
type TwIconData = readonly TwIconNode[];
type TwIconMap = Record<string, TwIconData>;
type TwIconColor = TwColor | 'current';

interface TwIconSvgConfig {
  readonly strokeWidth?: number;          // default 2
  readonly absoluteStrokeWidth?: boolean; // default false
  readonly viewBox?: string;              // default '0 0 24 24'
}`;
}
