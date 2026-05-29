import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-tags-input-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TagsInputComponent&lt;T&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-tags-input</p>

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
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color for the container focus ring and the chip accent.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls density: container padding, chip size, and text scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, blocks typing, committing, and chip removal, and applies muted styling.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Marks the control as required and mirrors to the inner input's <code class="font-mono">aria-required</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">placeholder</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Placeholder shown only while there are no chips and the input is blank.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">separatorKeys</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">['Enter', ',']</td>
              <td class="px-4 py-2 text-fg-muted">Keys or single characters that commit the typed text; single characters also split pasted text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">addOnBlur</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, blurring the control commits any non-empty input text as a tag.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">max</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Maximum number of tags; further commits are blocked and announced.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">allowDuplicates</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When false, a tag equal to an existing one (per <code class="font-mono">compareWith</code>) is dropped silently.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">createTag</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTagFactory&lt;T&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">identity</td>
              <td class="px-4 py-2 text-fg-muted">Maps committed text to a tag value; defaults to the trimmed string.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">tagLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTagLabelFn&lt;T&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">String(tag)</td>
              <td class="px-4 py-2 text-fg-muted">Maps a tag value to its visible chip label and the remove-button accessible name.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">compareWith</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTagCompareFn&lt;T&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Object.is</td>
              <td class="px-4 py-2 text-fg-muted">Equality comparator used for deduplication when <code class="font-mono">allowDuplicates</code> is false.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">name</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Name attribute applied to the inner text input for native form association.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">auto</td>
              <td class="px-4 py-2 text-fg-muted">Id on the host element; auto-generated as <code class="font-mono">tw-tags-input-N</code> when unset.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name applied when no visible label is wired.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that labels the control.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that describes the control; merged with form-field hint/error ids.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ErrorStateMatcher | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance override of the error-state policy; falls back to the <code class="font-mono">TW_ERROR_STATE_MATCHER</code> token.</td>
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
              <td class="px-4 py-2 font-mono text-xs">valueChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;T[]&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the tag array changes through user interaction; does not fire on <code class="font-mono">writeValue</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">tagAdded</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwTagAddedEvent&lt;T&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when a tag is committed via Enter, a separator, paste, or <code class="font-mono">addTag()</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">tagRemoved</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwTagRemovedEvent&lt;T&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when a tag is removed via the remove button, Backspace/Delete, or <code class="font-mono">removeTag()</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

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
              <td class="px-4 py-2 font-mono text-xs">addTag</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(text: string) =&gt; boolean</td>
              <td class="px-4 py-2 text-fg-muted">Commits text as a tag; returns true if added, false if dropped (empty, duplicate, or max).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">removeTag</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(tag: T | number) =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Removes a tag by value (first <code class="font-mono">compareWith</code> match) or by index when a number is passed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Removes all tags and clears the in-progress input text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">focus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; void</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the text input.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Properties</h3>
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
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;T[]&gt;</td>
              <td class="px-4 py-2 text-fg-muted">The current tag array; read from a template ref for non-form usage.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">inputText</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;string&gt;</td>
              <td class="px-4 py-2 text-fg-muted">The current uncommitted text in the input.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class TagsInputApi {
  protected readonly typesSnippet = `type TwTagFactory<T> = (text: string) => T;

type TwTagLabelFn<T> = (tag: T) => string;

type TwTagCompareFn<T> = (a: T, b: T) => boolean;

interface TwTagAddedEvent<T> {
  tag: T;
  value: T[];
}

interface TwTagRemovedEvent<T> {
  tag: T;
  value: T[];
  index: number;
}`;
}
