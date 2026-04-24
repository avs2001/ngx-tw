import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TimePickerComponent } from 'ngx-tw/time-picker';
import { CodeBlockComponent } from 'ngx-tw/code-block';

function fmt(d: Date | null): string {
  if (!d) return 'null';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

@Component({
  selector: 'app-time-picker-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimePickerComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Time Picker is a segmented numeric editor for a time-of-day value: each unit
        (hours, minutes, optional seconds, optional AM/PM toggle) is an individual
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="spinbutton"</code>
        input with its own keyboard behaviour. It stores the value as whatever type the
        injected
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter</code>
        produces — <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Date</code>
        by default — so it composes losslessly with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-calendar</code>
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-date-picker</code>.
        Auto-switches to a naked variant when nested in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Each field exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="spinbutton"</code>
        with live
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuenow</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuemin</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuemax</code>,
        and a human-readable
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuetext</code>.
        The AM/PM toggle is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="radiogroup"</code>.
        Committed values are announced through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>.
        Always provide an accessible name via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>,
        or a wrapping
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        with a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;label twLabel&gt;</code>.
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
              <td class="px-4 py-2 font-mono text-xs">ArrowUp / ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Steps the focused field by its configured step, wrapping inside <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[min, max]</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Shift + ArrowUp / Shift + ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Steps the focused field by twice its configured step for power-user jumping.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft / ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the adjacent field when the caret sits at the edge.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Clamps the focused field to its minimum or maximum value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">0 – 9</td>
              <td class="px-4 py-2 text-fg-muted">Buffers up to two digits and auto-advances to the next field when full or on a terminal digit.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Backspace / Delete</td>
              <td class="px-4 py-2 text-fg-muted">Clears the focused field back to the placeholder.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab / Shift + Tab</td>
              <td class="px-4 py-2 text-fg-muted">Native tab traversal between fields and the AM/PM toggle.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Space / Enter (on AM/PM)</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the AM/PM selection when the meridiem is focused.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-time-picker [(value)]="value" aria-label="Basic time" />
        <p class="text-xs text-fg-muted mt-4 font-mono">selected = {{ valueLabel() }}</p>
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
        <li>
          Segmented fields with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="spinbutton"</code>
          and live
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuenow</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuetext</code>
        </li>
        <li>
          Two formats:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'24h'</code> (00–23) and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'12h'</code> (1–12 + AM/PM toggle)
        </li>
        <li>
          Optional seconds field and per-unit
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hourStep</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minuteStep</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">secondStep</code>
        </li>
        <li>
          Keyboard-first editing: ArrowUp/Down steps, ArrowLeft/Right between fields, Home/End clamp, digits auto-advance
        </li>
        <li>
          Works with reactive forms, template-driven forms, and signal forms via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        </li>
        <li>
          Auto-naked variant when wrapped in
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        </li>
        <li>
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minTime</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxTime</code>
          surface through the standard
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorState</code>
          contract
        </li>
        <li>CDK LiveAnnouncer announces committed values politely</li>
        <li>
          Pluggable
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter&lt;D&gt;</code>
          so the value type is whatever the consumer's date library returns
        </li>
        <li>5 sizes and 8 semantic colors</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/date-picker" class="text-primary-600 hover:underline">Date Picker</a>
          — pair with a time-picker to edit a full timestamp.
        </li>
        <li>
          <a routerLink="/components/calendar" class="text-primary-600 hover:underline">Calendar</a>
          — shares the same
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">withTime</code>
          contract.
        </li>
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — wrap the time-picker to get a label, hint, error region, and naked styling.
        </li>
      </ul>
    </section>
  `,
})
export class TimePickerOverview {
  protected readonly value = signal<Date | null>(null);
  protected readonly valueLabel = computed(() => fmt(this.value()));

  protected readonly basicUsageSnippet = `<tw-time-picker
  [(value)]="time"
  aria-label="Basic time"
/>`;

  protected readonly importSnippet = `import { TimePickerComponent } from 'ngx-tw/time-picker';

// Required once in your app config — shared with tw-calendar and tw-date-picker.
import { provideNativeDateAdapter } from 'ngx-tw/calendar';

export const appConfig: ApplicationConfig = {
  providers: [provideNativeDateAdapter()],
};`;
}
