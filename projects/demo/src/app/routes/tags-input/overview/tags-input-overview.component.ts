import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TagsInputComponent } from '@cdevhub/ngx-tw/tags-input';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-tags-input-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TagsInputComponent, CodeBlockComponent, RouterLink, FormsModule],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Tags Input lets users build a list of free-text values — recipients, labels, filters,
        keywords — by typing a token and committing it with Enter, a separator key, or paste. Each
        committed value renders as a dismissible chip (composing
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twBadge</code>) inline
        with the text input. It implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so the value round-trips as a real array through every Angular form strategy, and it pairs
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        for label, hint, and error chrome. For picking from a fixed list of options, reach for
        <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
        instead — Tags Input is for open-ended entry.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The control is a single tab stop with a roving-tabindex chip strip, following Material's
        chip-grid interaction model. The container is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="group"</code>;
        each chip's remove button receives real DOM focus and a visible focus ring, and carries a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Remove {{ '{' }}label{{ '}' }}</code>
        accessible name. Additions and removals are announced through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>.
        Always provide an accessible name via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>,
        or a wrapping
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / separator</td>
              <td class="px-4 py-2 text-fg-muted">Commits the typed text as a tag. An empty Enter lets the surrounding form submit.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Backspace (empty input)</td>
              <td class="px-4 py-2 text-fg-muted">Highlights the last chip; a second Backspace removes it.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft / ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Moves the roving focus between chips and the text input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the first chip, or back to the text input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Delete / Backspace (on a chip)</td>
              <td class="px-4 py-2 text-fg-muted">Removes the focused chip and restores focus to the next chip, the previous chip, or the input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Clears the in-progress text, or cancels a chip highlight and returns to the input.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tags-input
          [(ngModel)]="recipients"
          placeholder="Add a recipient…"
          aria-label="Recipients"
          class="max-w-md"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">value = [{{ recipients().join(', ') }}]</p>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Free-text entry committed on Enter, separator keys, paste, or blur</li>
        <li>Dismissible chips composing
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twBadge</code>
        </li>
        <li>Single-tab-stop roving chip strip with full keyboard navigation</li>
        <li>Generic value type — strings by default, objects via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">createTag</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tagLabel</code>, and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">compareWith</code>
        </li>
        <li>Deduplication and a
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">max</code>
          tag limit
        </li>
        <li>Paste splits on separators while preserving interior whitespace</li>
        <li>Works with reactive, template-driven, and Angular v21 signal forms</li>
        <li>Integrates with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
          for label, hint, and error chrome
        </li>
        <li>Add / remove announcements via CDK
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>
        </li>
        <li>5 sizes and 8 semantic colors</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — choose from a fixed list of options, with single or multi selection.
        </li>
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — wrap the tags input to get a label, hint, and error region.
        </li>
        <li>
          <a routerLink="/components/input" class="text-primary-600 hover:underline">Input</a>
          — a plain text input for a single free-form value.
        </li>
        <li>
          <a routerLink="/components/badge" class="text-primary-600 hover:underline">Badge</a>
          — the chip styling the tags input composes for each value.
        </li>
      </ul>
    </section>
  `,
})
export class TagsInputOverview {
  protected readonly recipients = signal<string[]>(['alice@acme.com', 'ben@acme.com']);

  protected readonly basicUsageSnippet = `<tw-tags-input
  [(ngModel)]="recipients"
  placeholder="Add a recipient…"
  aria-label="Recipients"
/>`;

  protected readonly importSnippet = `import { TagsInputComponent } from '@cdevhub/ngx-tw/tags-input';`;
}
