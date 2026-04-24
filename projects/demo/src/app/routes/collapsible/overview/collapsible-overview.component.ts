import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollapsibleComponent, CollapsibleTriggerDirective } from 'ngx-tw/collapsible';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-collapsible-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CollapsibleComponent, CollapsibleTriggerDirective, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Collapsible component is a disclosure widget that toggles a section of
        content open and closed. It can stand alone, or compose with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-collapsible-group</code>
        to coordinate siblings — either as an accordion (one open at a time) or as
        an independent group (any number open). Content can be destroyed when
        closed or kept alive across toggles to preserve component state.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The trigger element exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="button"</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>;
        the projected content region is wrapped in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="region"</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>
        pointing back at the trigger. State changes are announced through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>.
        Always project an element with an accessible name as the trigger — a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;button&gt;</code>
        with text content is the simplest choice.
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
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the panel open or closed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowDown / ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Inside a group, moves focus to the next or previous enabled trigger. Wraps at the ends.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Inside a group, focuses the first or last enabled trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus into the open content region or to the next focusable element after the panel.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-collapsible variant="bordered">
          <button twCollapsibleTrigger>What is ngx-tw?</button>
          <p>An Angular component library built with Tailwind CSS v4, designed for flexibility and accessibility.</p>
        </tw-collapsible>
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
        <li>4 variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">default</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bordered</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code>
        </li>
        <li>5 sizes and 8 semantic colors that tint the filled and bordered variants</li>
        <li>Accordion mode (single open) and independent group mode (multiple open) via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-collapsible-group</code>
        </li>
        <li>Two-way bindable
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(open)]</code>
          on each panel and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(value)]</code>
          on the group
        </li>
        <li>
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">keepAlive</code>
          mode preserves projected content and component state across toggles
        </li>
        <li>Custom icon support via the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twCollapsibleIcon]</code>
          directive — replaces the default chevron
        </li>
        <li>Full WAI-ARIA disclosure pattern with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>,
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="region"</code>
        </li>
        <li>Group keyboard navigation: ArrowUp/Down, Home/End</li>
        <li>State changes announced via CDK
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/accordion" class="text-primary-600 hover:underline">Accordion</a>
          — a higher-level wrapper around a group of collapsibles with built-in heading and icon conventions.
        </li>
        <li>
          <a routerLink="/tabs" class="text-primary-600 hover:underline">Tabs</a>
          — pick this when sections are mutually exclusive and the user expects horizontal navigation rather than vertical disclosure.
        </li>
        <li>
          <a routerLink="/dialog" class="text-primary-600 hover:underline">Dialog</a>
          — pick this when the content needs to interrupt the page rather than expand inline.
        </li>
      </ul>
    </section>
  `,
})
export class CollapsibleOverview {
  protected readonly basicUsageSnippet = `<tw-collapsible variant="bordered">
  <button twCollapsibleTrigger>What is ngx-tw?</button>
  <p>An Angular component library built with Tailwind CSS v4...</p>
</tw-collapsible>`;

  protected readonly importSnippet = `import {
  CollapsibleComponent,
  CollapsibleGroupComponent,
  CollapsibleTriggerDirective,
  CollapsibleIconDirective,
} from 'ngx-tw/collapsible';`;
}