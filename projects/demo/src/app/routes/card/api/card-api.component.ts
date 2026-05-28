import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-card-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- CardComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CardComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-card</p>

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
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">CardVariant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'elevated'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the card's visual elevation style.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'neutral'</td>
              <td class="px-4 py-2 text-fg-muted">Tints the outline of the <code class="font-mono">outlined</code> variant; no effect on other variants.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the padding applied to every structural section.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Slots</h3>
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
              <td class="px-4 py-2 font-mono text-xs">[twCardHeader]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Top section with a bottom divider and semibold text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twCardBody]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Main content region with default padding.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twCardFooter]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Bottom section with a top divider and smaller muted text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twCardMedia]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..n</td>
              <td class="px-4 py-2 text-fg-muted">Full-bleed media region with no padding; placement order is controlled by the consumer.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CardHeaderDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CardHeaderDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCardHeader]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marks the projected element as the card's header region. Inherits the parent
        card's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        to compute padding and renders a bottom divider when followed by a body or
        footer.
      </p>
    </section>

    <!-- CardBodyDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CardBodyDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCardBody]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marks the projected element as the card's main content region. Inherits the
        parent card's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        for padding and carries no intrinsic typography — consumers style the body's
        inner content directly.
      </p>
    </section>

    <!-- CardFooterDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CardFooterDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCardFooter]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marks the projected element as the card's footer region. Renders a top divider
        when preceded by a header or body and applies a smaller, muted text style so
        metadata and action rows sit quietly beneath the body.
      </p>
    </section>

    <!-- CardMediaDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CardMediaDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCardMedia]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marks the projected element as a full-bleed media region. Removes padding and
        hides overflow so images, gradients, canvases, or charts sit flush with the
        card's rounded edges. Place it before the header for a top cover, between
        sections for an inline split, or after the body as a trailing accent.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class CardApi {
  protected readonly typesSnippet = `type CardVariant = 'elevated' | 'outlined' | 'ghost';

// Shared library types used above
type TwColor =
  | 'primary' | 'secondary' | 'accent' | 'neutral'
  | 'info'    | 'success'   | 'warning' | 'error';

type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
