import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DateRangePickerComponent } from '@cdevhub/ngx-tw/date-range-picker';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import { type TwDateRange } from '@cdevhub/ngx-tw/calendar';

@Component({
  selector: 'app-date-range-picker-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DateRangePickerComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Date Range Picker is a two-endpoint range selector that composes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-calendar</code>
        in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selectionMode="range"</code>
        inside a CDK overlay dialog. Its value is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwDateRange</code>,
        it supports optional per-endpoint time selection and preset shortcuts, and it works
        with reactive forms, template-driven forms, and Angular v21 signal forms. All date
        math flows through the injected
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The trigger button exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="combobox"</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-haspopup="dialog"</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>;
        the overlay renders with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="dialog"</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-modal="true"</code>,
        traps focus via CDK, and restores focus to the trigger on close. Committed ranges are
        announced through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>.
        Out-of-range programmatic writes surface through the standard
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorState</code>
        contract.
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
              <td class="px-4 py-2 text-fg-muted">Opens the overlay from the trigger; selects the focused calendar cell when the dialog is open.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Alt + ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Opens the overlay from the trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Alt + ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Closes the overlay without committing.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft / ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus one day inside the calendar grid.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowUp / ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus one week inside the calendar grid.</td>
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
              <td class="px-4 py-2 text-fg-muted">Closes the overlay, restores the prior range, and returns focus to the trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Cycles focus inside the dialog (presets, calendars, time row, action bar) and never leaves while open.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-date-range-picker
          [(value)]="range"
          aria-label="Basic range"
          class="w-80"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">selected = {{ rangeLabel() }}</p>
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
        <li>Two-click range selection with hover preview, driven by the calendar's native range mode</li>
        <li>Side-by-side month layout (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numberOfMonths="2"</code>) with lockstep pagination, or a compact single-month layout</li>
        <li>Optional per-endpoint
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-time-picker</code>
          — enable
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showTime</code>
          to capture start and end times-of-day
        </li>
        <li>Quick-select presets (Today, Last 7 days, This month…) rendered as a dedicated sidebar</li>
        <li>Works with reactive forms, template-driven forms, and Angular v21 signal forms via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code></li>
        <li>Integrates with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
          — the trigger auto-flips to its naked variant and the form-field owns the chrome
        </li>
        <li>Pluggable
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter</code>
          — swap the native adapter for Luxon, date-fns, or a custom one without touching the component
        </li>
        <li>ARIA "Date Picker Dialog" pattern with focus trap,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-modal="true"</code>,
          and live-region range announcements
        </li>
        <li>Optional
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Today / Clear / Cancel / Apply</code>
          action bar for touch contexts</li>
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
          <a routerLink="/components/date-picker" class="text-primary-600 hover:underline">Date Picker</a>
          — single-endpoint date selection with a typable input and the same overlay pattern.
        </li>
        <li>
          <a routerLink="/components/calendar" class="text-primary-600 hover:underline">Calendar</a>
          — the inline calendar primitive that powers the range selection logic.
        </li>
        <li>
          <a routerLink="/components/time-picker" class="text-primary-600 hover:underline">Time Picker</a>
          — the standalone time control embedded when <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showTime</code> is enabled.
        </li>
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — wrap the range picker to get a floating label, hint, and error region; the trigger auto-flips to its naked variant.
        </li>
      </ul>
    </section>
  `,
})
export class DateRangePickerOverview {
  protected readonly range = signal<TwDateRange<Date> | null>(null);
  protected readonly rangeLabel = computed(() => {
    const v = this.range();
    if (!v) return 'null';
    const fmt = (d: Date | null): string => (d ? d.toDateString() : 'null');
    return `{ start: ${fmt(v.start)}, end: ${fmt(v.end)} }`;
  });

  protected readonly basicUsageSnippet = `<tw-date-range-picker
  [(value)]="range"
  aria-label="Booking window"
/>`;

  protected readonly importSnippet = `// 1. Provide the adapter once in your app config:
import { provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';

export const appConfig: ApplicationConfig = {
  providers: [provideNativeDateAdapter()],
};

// 2. Import the component where you use it:
import { DateRangePickerComponent } from '@cdevhub/ngx-tw/date-range-picker';
import { TwDateRange } from '@cdevhub/ngx-tw/calendar';`;
}
