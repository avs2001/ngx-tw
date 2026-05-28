import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-avatar-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- AvatarComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">AvatarComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-avatar</p>

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
              <td class="px-4 py-2 font-mono text-xs">src</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">URL of the avatar image; falls back to initials or projected content on load error.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">alt</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Alt text for the image and the accessible name for non-image avatars.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">initials</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">One- or two-character initials rendered when no image is available.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'neutral'</td>
              <td class="px-4 py-2 text-fg-muted">Tints the background and text of the initials or fallback surface.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the avatar's square dimensions and the initials font scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">appearance</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">AvatarAppearance</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">&#123; rounded: 'full', status: null &#125;</td>
              <td class="px-4 py-2 text-fg-muted">Bundles decorative axes — <code class="font-mono">rounded</code> (border-radius shape) and <code class="font-mono">status</code> (indicator dot). Both keys are optional and fall back to the defaults shown.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Outputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Payload</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">imageError</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Event</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the underlying <code class="font-mono">&lt;img&gt;</code> dispatches an <code class="font-mono">error</code> event (broken URL, network failure). The avatar automatically falls back to initials or projected content.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Content projection</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Required</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Cardinality</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">(default)</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Replaces the default user silhouette when the avatar is in fallback mode; ignored while an image loads or initials are shown.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- AvatarGroupComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">AvatarGroupComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-avatar-group</p>

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
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Propagates to every child avatar, overriding their individual <code class="font-mono">size</code> inputs.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">max</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Hides children past this index and renders a <code class="font-mono">+N</code> overflow indicator.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Avatar group'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name applied via <code class="font-mono">aria-label</code> on the group's <code class="font-mono">role="group"</code> host.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- AVATAR_GROUP_SIZE -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">AVATAR_GROUP_SIZE</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Token: InjectionToken&lt;() =&gt; TwSize&gt;</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Internal injection token provided by
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">AvatarGroupComponent</code>
        that exposes the group's current size as a zero-argument getter. Child avatars inject it to
        resolve their effective size; consumers rarely interact with it directly.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class AvatarApi {
  protected readonly typesSnippet = `type AvatarStatus = 'online' | 'busy' | 'away' | 'offline';

type AvatarRounded = 'full' | 'lg' | 'none';

interface AvatarAppearance {
  rounded?: AvatarRounded;        // default: 'full'
  status?: AvatarStatus | null;   // default: null
}

// Shared library types, re-exported from '@cdevhub/ngx-tw/core':
type TwColor = 'primary' | 'secondary' | 'accent' | 'neutral'
             | 'info'    | 'success'   | 'warning' | 'error';

type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
