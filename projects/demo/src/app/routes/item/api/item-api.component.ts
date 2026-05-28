import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-item-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- ItemComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ItemComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-item</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ItemSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Density and typography scale for the row.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">align</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ItemAlign</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'start'</td>
              <td class="px-4 py-2 text-fg-muted">Vertical alignment of the leading and trailing slots relative to the content stack.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">interactive</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, makes the row a keyboard-activatable button with a hover background and focus ring.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables an interactive row, muting it visually and removing it from the tab order.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">current</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Marks the row as the visually highlighted "current" entry with a primary tint, inset ring, and <code class="font-mono text-xs">aria-current="true"</code>.</td>
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
              <td class="px-4 py-2 font-mono text-xs">selected</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;Event&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when an interactive, non-disabled row is activated via click, Enter, or Space.</td>
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
              <td class="px-4 py-2 font-mono text-xs">[twItemLeading]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">no</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0–1</td>
              <td class="px-4 py-2 text-fg-muted">Leading slot for an icon, avatar, bullet, or checkbox.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twItemTitle]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">yes</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0–1</td>
              <td class="px-4 py-2 text-fg-muted">Primary label; accepts inline children like badges and chips.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twItemDescription]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">no</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0–1</td>
              <td class="px-4 py-2 text-fg-muted">Secondary text rendered below the title.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twItemTrailing]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">no</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0–1</td>
              <td class="px-4 py-2 text-fg-muted">Trailing slot for action buttons, metadata, chevrons, or timestamps.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ItemLeadingDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ItemLeadingDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twItemLeading]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">Applies the leading-slot layout classes to the projected element.</p>
    </section>

    <!-- ItemTitleDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ItemTitleDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twItemTitle]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">Applies the title typography and truncation rules for the active size.</p>
    </section>

    <!-- ItemDescriptionDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ItemDescriptionDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twItemDescription]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">Applies the muted secondary-text typography for the description line.</p>
    </section>

    <!-- ItemTrailingDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ItemTrailingDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twItemTrailing]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">Applies the trailing-slot layout classes (gap and alignment) to the projected element.</p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class ItemApi {
  protected readonly typesSnippet = `type ItemSize = 'sm' | 'md' | 'lg';

type ItemAlign = 'start' | 'center';`;
}
