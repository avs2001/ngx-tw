import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertComponent,
  AlertIconDirective,
  AlertTitleDirective,
  AlertContentDirective,
} from 'ngx-tw/alert';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-alert-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AlertComponent,
    AlertIconDirective,
    AlertTitleDirective,
    AlertContentDirective,
    CodeBlockComponent,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Alert component displays an inline feedback message attached to the page — a status
        banner at the top of a form, a success confirmation after a save, a warning about an
        expiring trial, or an error with a link to remediation. It ships with three visual
        variants, eight semantic colors, and four projection slots
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twAlertIcon</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twAlertTitle</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twAlertContent</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twAlertActions</code>)
        so each message composes from the same primitives.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The host element carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="alert"</code>
        by default so assistive tech picks the message up as it enters the DOM. The component also
        announces its text content through CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>
        at render time using the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">politeness</code>
        input — use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'polite'</code>
        (the default) for most cases,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'assertive'</code>
        for errors that interrupt, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'off'</code>
        when the alert sits inside a larger notification system that owns the announcement.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Behavior</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">role</td>
              <td class="px-4 py-2 text-fg-muted">Host is <code class="font-mono">role="alert"</code> — an ARIA live region that announces its contents when it appears.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">LiveAnnouncer</td>
              <td class="px-4 py-2 text-fg-muted">Text content is announced through CDK's LiveAnnouncer on first render, respecting the configured politeness.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Icons</td>
              <td class="px-4 py-2 text-fg-muted">Decorative — always mark projected icons with <code class="font-mono">aria-hidden="true"</code> so they are skipped by screen readers.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Dismiss button</td>
              <td class="px-4 py-2 text-fg-muted">Carries <code class="font-mono">aria-label="Dismiss"</code> and receives a visible focus ring via <code class="font-mono">focus-visible</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Contrast</td>
              <td class="px-4 py-2 text-fg-muted">Every variant × color combination is authored to meet WCAG AA contrast ratios.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">When to use</h2>
      <div class="grid gap-4 md:grid-cols-2 max-w-2xl">
        <div>
          <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-2">Use an Alert when</p>
          <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
            <li>The message is anchored to a specific region of the page</li>
            <li>Users should be able to re-read the message at any time</li>
            <li>The message has an action tied to it (upgrade, retry, update)</li>
          </ul>
        </div>
        <div>
          <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-2">Prefer a Toast when</p>
          <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
            <li>The message is transient and doesn't need to persist</li>
            <li>The feedback is global (not tied to a region of the page)</li>
            <li>Multiple messages stack over time</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-alert color="success">
          <svg twAlertIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          <span twAlertTitle>Changes saved</span>
          <span twAlertContent>Your profile details have been updated.</span>
        </tw-alert>
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
        <li>3 variants: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code></li>
        <li>8 semantic colors with WCAG AA contrast across all variants</li>
        <li>4 projection slots: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twAlertIcon</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twAlertTitle</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twAlertContent</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twAlertActions</code></li>
        <li>Optional dismiss button with a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dismissed</code> output event</li>
        <li>Leave animation — dismissed alerts fade out via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">animate.leave</code></li>
        <li>Screen-reader announcements via CDK <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code> with configurable politeness</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="alert"</code> by default — no ARIA wiring required on your side</li>
        <li>Composable with <a routerLink="/components/button" class="text-primary-600 hover:underline">Button</a> for action CTAs inside the alert body</li>
        <li>Respects <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code> on transitions</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/toast" class="text-primary-600 hover:underline">Toast</a>
          — use for transient, system-level notifications that stack and auto-dismiss.
        </li>
        <li>
          <a routerLink="/components/dialog" class="text-primary-600 hover:underline">Dialog</a>
          — use when the feedback requires blocking the rest of the page until the user responds.
        </li>
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — prefer its built-in error region for field-level validation feedback.
        </li>
        <li>
          <a routerLink="/components/badge" class="text-primary-600 hover:underline">Badge</a>
          — use for tiny inline status chips that don't carry a full message.
        </li>
      </ul>
    </section>
  `,
})
export class AlertOverview {
  protected readonly basicUsageSnippet = `<tw-alert color="success">
  <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="…" />
  </svg>
  <span twAlertTitle>Changes saved</span>
  <span twAlertContent>Your profile details have been updated.</span>
</tw-alert>`;

  protected readonly importSnippet = `import {
  AlertComponent,
  AlertIconDirective,
  AlertTitleDirective,
  AlertContentDirective,
  AlertActionsDirective,
} from 'ngx-tw/alert';`;
}
