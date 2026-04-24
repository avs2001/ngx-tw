import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePickerComponent } from 'ngx-tw/date-picker';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-date-picker-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePickerComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Date Picker combines a typable text input with a popover calendar, implementing
        the WAI-ARIA "Date Picker Dialog" pattern. All date math flows through the injected
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter</code>
        so consumers can swap the underlying date library, and the component auto-switches
        to a naked trigger when wrapped in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The trigger button exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-haspopup="dialog"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>;
        the overlay renders with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="dialog"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-modal="true"</code>,
        traps focus via CDK, and restores focus to the trigger on close. Typed values parse
        through the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter</code>;
        unparseable or out-of-range entries surface through the standard
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorState</code>
        contract. Committed values are announced through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>
        so screen-reader users hear each change.
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
              <td class="px-4 py-2 font-mono text-xs">Enter</td>
              <td class="px-4 py-2 text-fg-muted">Commits the typed value in the input; selects the focused cell inside the calendar.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Space</td>
              <td class="px-4 py-2 text-fg-muted">Selects the focused cell inside the calendar.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Alt + ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Opens the calendar from the input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Alt + ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Closes the calendar without committing.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft / ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus one day in the calendar grid.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowUp / ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus one week in the calendar grid.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the first or last day of the current week.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">PageUp / PageDown</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus one month; hold Shift to move by a year.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Closes the overlay and returns focus to the trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Cycles focus inside the dialog (header, grid, action bar); never leaves while open.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-date-picker
          [(value)]="value"
          placeholder="Pick a date"
          aria-label="Basic date"
          class="w-64"
        />
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
        <li>Typable input and click-to-pick calendar — both commit through a single code path</li>
        <li>Pluggable
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter</code>
          — swap the native adapter for Luxon, date-fns, or a custom one without touching the component
        </li>
        <li>ARIA "Date Picker Dialog" pattern with focus trap,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="dialog"</code>,
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-modal="true"</code>
        </li>
        <li>Works with reactive forms, template-driven forms, and Angular v21 signal forms</li>
        <li>Auto-naked trigger when wrapped in
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        </li>
        <li>Out-of-range and unparseable input surface via the standard
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorState</code>
          contract
        </li>
        <li>Optional
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Today / Clear / Cancel / Apply</code>
          action bar for touch contexts</li>
        <li>Built-in time picker — toggle
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">withTime</code>
          to capture hour, minute, and (optionally) second alongside the date
        </li>
        <li>Clear-button affordance in the trigger plus a programmatic
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">clear()</code>
          method
        </li>
        <li>Strictly typed generic over the adapter's native date type (defaults to
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Date</code>)
        </li>
        <li>5 sizes and 8 semantic colors</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — wrap the date picker to get a floating label, hint, and error region; the trigger auto-flips to its naked variant.
        </li>
        <li>
          <a routerLink="/calendar" class="text-primary-600 hover:underline">Calendar</a>
          — the inline calendar primitive, for composing your own date UIs.
        </li>
        <li>
          <a routerLink="/time-picker" class="text-primary-600 hover:underline">Time Picker</a>
          — a standalone time control when you need time without a date.
        </li>
        <li>
          <a routerLink="/input" class="text-primary-600 hover:underline">Input</a>
          — the base text input when a free-form string is enough.
        </li>
      </ul>
    </section>
  `,
})
export class DatePickerOverview {
  protected readonly value = signal<Date | null>(null);
  protected readonly valueLabel = computed(() => {
    const v = this.value();
    return v ? v.toDateString() : 'null';
  });

  protected readonly basicUsageSnippet = `<tw-date-picker
  [(value)]="date"
  placeholder="Pick a date"
  aria-label="Basic date"
/>`;

  protected readonly importSnippet = `// 1. Provide the adapter once in your app config:
import { provideNativeDateAdapter } from 'ngx-tw/calendar';

export const appConfig: ApplicationConfig = {
  providers: [provideNativeDateAdapter()],
};

// 2. Import the component where you use it:
import { DatePickerComponent } from 'ngx-tw/date-picker';`;
}
