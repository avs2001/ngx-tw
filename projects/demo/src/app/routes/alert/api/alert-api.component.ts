import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-alert-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- AlertComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">AlertComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-alert</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid' | 'outline' | 'soft'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'soft'</td>
              <td class="px-4 py-2 text-fg-muted">Controls how much visual weight the alert container carries.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'info'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color palette applied to the container, icon, title, content, and dismiss button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dismissible</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, renders an aria-labelled dismiss button in the top-right corner.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">politeness</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'polite' | 'assertive' | 'off'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'polite'</td>
              <td class="px-4 py-2 text-fg-muted">Live-region politeness used when announcing the alert's text through CDK's LiveAnnouncer.</td>
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
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dismissed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the dismiss button is clicked; remove the alert from your state in the handler.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Slots</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
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
              <td class="px-4 py-2 font-mono text-xs">[twAlertIcon]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Leading icon (typically an inline SVG); decorative and should carry <code class="font-mono">aria-hidden="true"</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twAlertTitle]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Short heading rendered above the content with a bold weight.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twAlertContent]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Main message body — rendered at the same text size as the title but at normal weight.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twAlertActions]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Row of action buttons pinned below the content with consistent gap spacing.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- AlertIconDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">AlertIconDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twAlertIcon]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marks a projected element as the alert's leading icon and applies the variant-aware
        sizing and color classes. Use it on an inline
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;svg&gt;</code>
        or any element that should receive icon styling.
      </p>
    </section>

    <!-- AlertTitleDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">AlertTitleDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twAlertTitle]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Applies the bold heading classes for the alert's title region — typically placed on a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;span&gt;</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;strong&gt;</code>
        so assistive tech still picks up the heading nesting cleanly.
      </p>
    </section>

    <!-- AlertContentDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">AlertContentDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twAlertContent]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Applies the body-text classes to the alert's message. Use it on a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;span&gt;</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;p&gt;</code>
        for inline rich content; the color-specific muted tone comes from the parent alert's
        variant × color combination.
      </p>
    </section>

    <!-- AlertActionsDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">AlertActionsDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twAlertActions]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Lays out a row of action buttons below the content with flex + gap spacing; attach it to a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;div&gt;</code>
        that wraps the buttons. Two actions is the sweet spot — more than three starts to read
        like a form.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class AlertApi {
  protected readonly typesSnippet = `type AlertVariant = 'solid' | 'outline' | 'soft';

// Shared library types (re-exported from 'ngx-tw/core'):
type TwColor = 'primary' | 'secondary' | 'accent' | 'neutral'
             | 'info' | 'success' | 'warning' | 'error';`;
}
