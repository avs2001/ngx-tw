import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import {
  CalendarComponent,
  TwCalendarPresets,
  TwDateRange,
  type TwCalendarSelectionMode,
  type TwCalendarView,
} from 'ngx-tw/calendar';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import { IconComponent } from 'ngx-tw/icon';
import { BadgeComponent } from 'ngx-tw/badge';
import {
  ItemComponent,
  ItemLeadingDirective,
  ItemTitleDirective,
  ItemDescriptionDirective,
} from 'ngx-tw/item';
import type { TwColor, TwSize } from 'ngx-tw/core';

const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const VIEWS: TwCalendarView[] = ['month', 'year', 'multi-year'];
const MODES: TwCalendarSelectionMode[] = ['single', 'range', 'multi', 'week'];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function fmt(d: Date | null | undefined): string {
  return d ? d.toLocaleDateString() : '—';
}

function shortDate(d: Date | null | undefined): string {
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
}

@Component({
  selector: 'app-calendar-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalendarComponent,
    TwCalendarPresets,
    ButtonDirective,
    CodeBlockComponent,
    IconComponent,
    BadgeComponent,
    ItemComponent,
    ItemLeadingDirective,
    ItemTitleDirective,
    ItemDescriptionDirective,
    ReactiveFormsModule,
    FormsModule,
    FormField,
  ],
  template: `
    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the selected cell, the today ring, and the range fill without changing
        any other visual weight. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main picker surface and reach for the semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        colors only when the calendar drives a themed region such as a coloured form field.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          @for (c of colors; track c) {
            <div class="flex flex-col gap-2">
              <span class="text-2xs font-medium text-fg-subtle uppercase tracking-wider">{{ c }}</span>
              <tw-calendar
                [color]="c"
                size="sm"
                [startAt]="fixedDate"
                [selected]="fixedDate"
                [attr.aria-label]="c + ' calendar'"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls the cell density — padding and font scale of every day cell as well as
        the month / year header. Pick
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        for a calendar embedded inside a popover trigger, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        when the calendar is the primary surface on the page (a booking widget, a dashboard
        date filter).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-start gap-6">
          @for (s of sizes; track s) {
            <div class="flex flex-col gap-2">
              <span twBadge color="neutral" variant="soft" [size]="s">{{ s }}</span>
              <tw-calendar
                [size]="s"
                [startAt]="fixedDate"
                [attr.aria-label]="s + ' calendar'"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Range Selection -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Range Selection</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Switch
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selectionMode</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'range'</code>
        and the value model becomes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwDateRange&lt;D&gt;</code>.
        The first click sets the start, the second sets the end (auto-swapped if the second
        click is earlier). Hover during selection previews the range so users can see what
        they're about to commit.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex flex-col items-stretch gap-4">
          <tw-item size="sm" align="center">
            <div twItemLeading class="flex size-8 items-center justify-center rounded-md bg-info-50 text-info-600">
              <tw-icon name="calendar" size="sm" />
            </div>
            <p twItemTitle class="text-sm font-semibold">Trip planner</p>
            <p twItemDescription class="text-xs text-fg-muted">Pick check-in and check-out</p>
          </tw-item>
          <tw-calendar
            aria-label="Range picker"
            selectionMode="range"
            color="info"
            [selected]="rangeValue()"
            (selectedChange)="onRangeSelected($event)"
          />
          <div class="flex items-center justify-between gap-3 pt-3 border-t border-border-muted">
            <div class="flex items-center gap-2 text-xs font-mono text-fg">
              <span>{{ rangeShortLabel().start }}</span>
              <tw-icon name="arrow-right" size="xs" class="text-fg-subtle" />
              <span>{{ rangeShortLabel().end }}</span>
            </div>
            <span twBadge color="info" variant="soft" size="sm">{{ nightsLabel() }}</span>
          </div>
        </div>
      </div>
      <tw-code-block [code]="rangeSnippet" language="html" />
    </section>

    <!-- Min / Max Bounds -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Min / Max Bounds</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Provide
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minDate</code>
        and / or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxDate</code>
        to constrain the selectable window. Cells outside the window are rendered disabled,
        receive no keyboard focus, and are skipped by arrow-key navigation. The bounds apply
        to every view — users cannot drill into a year outside the window either.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex flex-col items-stretch gap-4">
          <tw-item size="sm" align="center">
            <div twItemLeading class="flex size-8 items-center justify-center rounded-md bg-success-50 text-success-600">
              <tw-icon name="info" size="sm" />
            </div>
            <p twItemTitle class="text-sm font-semibold">Delivery window</p>
            <p twItemDescription class="text-xs text-fg-muted">Only dates inside the allowed range can be picked</p>
          </tw-item>
          <tw-calendar
            aria-label="Bounded calendar"
            color="success"
            [startAt]="fixedDate"
            [minDate]="minDate"
            [maxDate]="maxDate"
          />
          <div class="flex items-center justify-center gap-2 pt-3 border-t border-border-muted text-xs font-mono text-fg-muted">
            <span>{{ minLabel() }}</span>
            <tw-icon name="arrow-right" size="xs" class="text-fg-subtle" />
            <span>{{ maxLabel() }}</span>
          </div>
        </div>
      </div>
      <tw-code-block [code]="minMaxSnippet" language="html" />
    </section>

    <!-- Disable Weekends -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disable Weekends</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dateFilter</code>
        for per-date disable rules that don't fit neatly into min/max — blackout dates,
        business-days-only, day-of-week restrictions. The predicate receives each candidate
        date and returns
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">false</code>
        to disable it. The example below disables Saturdays and Sundays.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex flex-col items-stretch gap-4">
          <tw-item size="sm" align="center">
            <div twItemLeading class="flex size-8 items-center justify-center rounded-md bg-accent-50 text-accent-600">
              <tw-icon name="message-square" size="sm" />
            </div>
            <p twItemTitle class="text-sm font-semibold">Support call</p>
            <p twItemDescription class="text-xs text-fg-muted">Scheduled during business hours only</p>
          </tw-item>
          <tw-calendar
            aria-label="Weekdays only"
            color="accent"
            [startAt]="fixedDate"
            [dateFilter]="weekdayOnly"
          />
          <div class="flex justify-center pt-3 border-t border-border-muted">
            <span twBadge color="accent" variant="soft" size="sm" [dot]="true">Weekdays only</span>
          </div>
        </div>
      </div>
      <tw-code-block [code]="filterSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The filter runs on every cell render, so keep it pure and cheap. If your predicate
        depends on remote data, cache the lookup in a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Set</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Map</code>
        captured by the closure.
      </p>
    </section>

    <!-- Custom Cell Classes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Cell Classes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Returning classes from
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dateClass</code>
        lets you highlight holidays, paydays, or event days without forking the component.
        The function is called for every cell in every view; use the second argument
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">view</code>) to
        branch on month vs. year vs. multi-year rendering. The example below adds an
        underline dot on the 1st and 15th of every month to mark paydays.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex flex-col items-stretch gap-4">
          <tw-item size="sm" align="center">
            <div twItemLeading class="flex size-8 items-center justify-center rounded-md bg-warning-50 text-warning-600">
              <tw-icon name="check-circle" size="sm" />
            </div>
            <p twItemTitle class="text-sm font-semibold">Payday tracker</p>
            <p twItemDescription class="text-xs text-fg-muted">Highlight recurring dates without forking the component</p>
          </tw-item>
          <tw-calendar
            aria-label="Custom classes"
            color="warning"
            [startAt]="fixedDate"
            [dateClass]="highlightPaydays"
          />
          <div class="flex items-center justify-center gap-2 pt-3 border-t border-border-muted text-xs text-fg-muted">
            <span class="inline-flex size-1.5 rounded-full bg-warning-500"></span>
            <span>Marks the 1st and 15th</span>
          </div>
        </div>
      </div>
      <tw-code-block [code]="dateClassSnippet" language="html" />
    </section>

    <!-- Start View -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Start View</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Open the calendar on a specific view with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">startView</code>.
        Starting in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'multi-year'</code>
        is useful for pickers like "date of birth" where users need to jump by decade before
        narrowing down. Users can always drill in with Enter or the period button.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (v of views; track v) {
            <div class="flex flex-col gap-2">
              <span class="text-2xs font-medium text-fg-subtle uppercase tracking-wider">{{ v }}</span>
              <tw-calendar
                [startView]="v"
                size="sm"
                [startAt]="fixedDate"
                [attr.aria-label]="'Start view ' + v"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="startViewSnippet" language="html" />
    </section>

    <!-- With Time -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Time</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Setting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">withTime</code>
        renders a time editor below the month grid, and the selected
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Date</code>
        carries both the picked day and the chosen hours, minutes, and seconds. Time-of-day
        is preserved when the user picks a different day, so "meeting on Tuesday at 09:30"
        stays at 09:30 when switched to Wednesday. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">timeFormat="12h"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showSeconds</code>
        to match regional or precision requirements.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col items-stretch gap-4">
            <tw-item size="sm" align="center">
              <div twItemLeading class="flex size-8 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                <tw-icon name="bell" size="sm" />
              </div>
              <p twItemTitle class="text-sm font-semibold">Team standup</p>
              <p twItemDescription class="text-xs text-fg-muted">24-hour format</p>
            </tw-item>
            <tw-calendar
              aria-label="Calendar with 24h time"
              [withTime]="true"
              [selected]="withTimeValue()"
              [startAt]="fixedDate"
              (selectedChange)="onWithTimeSelected($event)"
            />
            <div class="flex justify-center pt-3 border-t border-border-muted">
              <span twBadge color="primary" variant="soft" size="sm">{{ withTimeLabel() }}</span>
            </div>
          </div>
          <div class="flex flex-col items-stretch gap-4">
            <tw-item size="sm" align="center">
              <div twItemLeading class="flex size-8 items-center justify-center rounded-md bg-accent-50 text-accent-600">
                <tw-icon name="file-text" size="sm" />
              </div>
              <p twItemTitle class="text-sm font-semibold">Log entry</p>
              <p twItemDescription class="text-xs text-fg-muted">12h · seconds · 5-min step</p>
            </tw-item>
            <tw-calendar
              aria-label="Calendar with 12h time and seconds"
              color="accent"
              [withTime]="true"
              timeFormat="12h"
              [showSeconds]="true"
              [minuteStep]="5"
              [selected]="withTime12Value()"
              [startAt]="fixedDate"
              (selectedChange)="onWithTime12Selected($event)"
            />
            <div class="flex justify-center pt-3 border-t border-border-muted">
              <span twBadge color="accent" variant="soft" size="sm">{{ withTime12Label() }}</span>
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="withTimeSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        input dims the whole calendar and blocks every interaction — no drill-in, no keyboard
        navigation, no selection. When the calendar is bound to a form control, toggling the
        control's disabled state drives the same appearance without needing the attribute,
        and the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">headerless</code>
        flag removes the month / year header for custom shells that render their own.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col items-stretch gap-3">
            <div class="flex items-center justify-between">
              <span class="text-2xs font-medium text-fg-subtle uppercase tracking-wider">Disabled</span>
              <span twBadge color="neutral" variant="soft" size="sm" [dot]="true">
                <tw-icon name="lock" size="xs" class="mr-1" />Read-only
              </span>
            </div>
            <tw-calendar
              aria-label="Disabled calendar"
              [disabled]="true"
              [startAt]="fixedDate"
              [selected]="fixedDate"
            />
          </div>
          <div class="flex flex-col items-stretch gap-3">
            <div class="flex items-center justify-between">
              <span class="text-2xs font-medium text-fg-subtle uppercase tracking-wider">Headerless</span>
              <span twBadge color="info" variant="soft" size="sm">Custom shell</span>
            </div>
            <div class="rounded-md border border-border-muted bg-surface overflow-hidden">
              <div class="flex items-center justify-between px-3 py-2 bg-surface-muted border-b border-border-muted">
                <span class="text-xs font-semibold text-fg">April 2026</span>
                <span class="text-2xs text-fg-subtle uppercase tracking-wider">Team availability</span>
              </div>
              <div class="p-3">
                <tw-calendar
                  aria-label="Headerless calendar"
                  [headerless]="true"
                  [startAt]="fixedDate"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The calendar implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        binds a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Date | null</code>
        out of the box. Clearing the control writes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">null</code>
        back to the model.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="text-2xs font-medium text-fg-subtle uppercase tracking-wider">ngModel</span>
            <span twBadge color="neutral" variant="soft" size="sm">{{ fmt(tdValue) }}</span>
          </div>
          <tw-calendar
            aria-label="TD date"
            name="tdDate"
            [(ngModel)]="tdValue"
            [startAt]="fixedDate"
          />
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="tdTsSnippet" language="ts" />
        <tw-code-block [code]="tdHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Reactive Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code>
        and every control signal — value, touched, disabled — stays synchronised without an
        extra
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]</code>
        input. Reach for reactive forms when the picker lives inside a validated form group
        or needs cross-field validation.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex flex-col gap-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="text-2xs font-medium text-fg-subtle uppercase tracking-wider">FormControl</span>
            <div class="flex items-center gap-1.5">
              <span twBadge color="neutral" variant="soft" size="sm">{{ reactiveValueLabel() }}</span>
              @if (reactiveControl.touched) {
                <span twBadge color="info" variant="soft" size="sm">touched</span>
              }
              @if (reactiveControl.disabled) {
                <span twBadge color="warning" variant="soft" size="sm">disabled</span>
              }
            </div>
          </div>
          <tw-calendar
            aria-label="Reactive date"
            [formControl]="reactiveControl"
            [startAt]="fixedDate"
          />
          <div class="flex flex-wrap gap-2">
            <button twButton variant="outline" color="neutral" size="xs" (click)="reactiveControl.setValue(today)">Set today</button>
            <button twButton variant="outline" color="neutral" size="xs" (click)="reactiveControl.setValue(null)">Clear</button>
            <button twButton variant="outline" color="neutral" size="xs" (click)="toggleReactiveDisabled()">
              {{ reactiveControl.disabled ? 'Enable' : 'Disable' }}
            </button>
          </div>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="reactiveTsSnippet" language="ts" />
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Signal Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For Angular v21 signal forms, build a model with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">form()</code>
        and bind the calendar with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>.
        The field signal exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code>,
        so you can drive conditional UI without subscribing to anything.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex flex-col gap-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="text-2xs font-medium text-fg-subtle uppercase tracking-wider">form()</span>
            <div class="flex items-center gap-1.5">
              <span twBadge color="neutral" variant="soft" size="sm">{{ fmt(signalForm.meetingDate().value()) }}</span>
              @if (signalForm.meetingDate().touched()) {
                <span twBadge color="info" variant="soft" size="sm">touched</span>
              }
            </div>
          </div>
          <tw-calendar
            aria-label="Signal form date"
            [formField]="signalForm.meetingDate"
            [startAt]="fixedDate"
          />
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="signalTsSnippet" language="ts" />
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Multi Selection -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Multi Selection</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selectionMode="multi"</code>
        to let the user pick any number of discrete dates. The model becomes a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Date[]</code>
        — clicking an already-selected cell toggles it off. The grid announces itself as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-multiselectable</code>,
        and every picked cell carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-selected="true"</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex flex-col items-stretch gap-4">
          <tw-item size="sm" align="center">
            <div twItemLeading class="flex size-8 items-center justify-center rounded-md bg-success-50 text-success-600">
              <tw-icon name="check-circle" size="sm" />
            </div>
            <p twItemTitle class="text-sm font-semibold">Days off</p>
            <p twItemDescription class="text-xs text-fg-muted">Toggle individual dates on and off</p>
          </tw-item>
          <tw-calendar
            aria-label="Multi picker"
            selectionMode="multi"
            color="success"
            [selected]="multiValue()"
            [startAt]="fixedDate"
            (selectedChange)="onMultiSelected($event)"
          />
          <div class="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border-muted min-h-8">
            @if (multiValue().length === 0) {
              <span class="text-xs text-fg-subtle">No dates picked</span>
            } @else {
              @for (d of multiValue(); track d.getTime()) {
                <span twBadge color="success" variant="soft" size="sm">{{ shortFmt(d) }}</span>
              }
            }
          </div>
        </div>
      </div>
      <tw-code-block [code]="multiSnippet" language="html" />
    </section>

    <!-- Week Selection -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Week Selection</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selectionMode="week"</code>
        so that every click picks the entire week containing that date. The model is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwDateRange&lt;Date&gt;</code>
        spanning the first day of the week to the seventh, respecting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">firstDayOfWeek</code>.
        Hovering previews the week under the pointer so users see the commitment before they click.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex flex-col items-stretch gap-4">
          <tw-item size="sm" align="center">
            <div twItemLeading class="flex size-8 items-center justify-center rounded-md bg-accent-50 text-accent-600">
              <tw-icon name="calendar" size="sm" />
            </div>
            <p twItemTitle class="text-sm font-semibold">Weekly report</p>
            <p twItemDescription class="text-xs text-fg-muted">Click any day — the whole week selects</p>
          </tw-item>
          <tw-calendar
            aria-label="Week picker"
            selectionMode="week"
            color="accent"
            [selected]="weekValue()"
            [startAt]="fixedDate"
            (selectedChange)="onWeekSelected($event)"
          />
          <div class="flex items-center justify-center gap-2 pt-3 border-t border-border-muted text-xs font-mono text-fg">
            <span>{{ weekLabel().start }}</span>
            <tw-icon name="arrow-right" size="xs" class="text-fg-subtle" />
            <span>{{ weekLabel().end }}</span>
          </div>
        </div>
      </div>
      <tw-code-block [code]="weekSnippet" language="html" />
    </section>

    <!-- Custom Cell Template -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Cell Template</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TemplateRef</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">cellTemplate</code>
        to override the default day / month / year cell contents. The template receives
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">{{ '{' }} $implicit: TwCalendarCell&lt;D&gt; {{ '}' }}</code>
        so you can project event dots, holiday markers, prices, availability counts — anything
        — into every cell while the calendar continues to own focus, selection, and ARIA.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex flex-col items-stretch gap-4">
          <tw-item size="sm" align="center">
            <div twItemLeading class="flex size-8 items-center justify-center rounded-md bg-info-50 text-info-600">
              <tw-icon name="bell" size="sm" />
            </div>
            <p twItemTitle class="text-sm font-semibold">Events</p>
            <p twItemDescription class="text-xs text-fg-muted">Dots mark days with meetings</p>
          </tw-item>
          <tw-calendar
            aria-label="Events"
            color="info"
            [startAt]="fixedDate"
            [cellTemplate]="eventCell"
          />
          <ng-template #eventCell let-c>
            <span class="relative inline-flex items-center justify-center">
              {{ c.displayValue }}
              @if (hasEvent(c.rawDate)) {
                <span
                  class="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-info-500"
                  aria-hidden="true"
                ></span>
              }
            </span>
          </ng-template>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="cellTemplateTsSnippet" language="ts" />
        <tw-code-block [code]="cellTemplateHtmlSnippet" language="html" />
      </div>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The template fires for every cell — including disabled ones. Keep it cheap; if your
        highlight depends on remote data, cache the lookup in a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Set</code>
        captured by the closure.
      </p>
    </section>

    <!-- Multi-Month -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Multi-Month</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numberOfMonths</code>
        to render consecutive months side-by-side under a single shared header. Keyboard
        navigation crosses grid boundaries — ArrowRight at the end of month 1 focuses the
        first day of month 2. Pair it with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selectionMode="range"</code>
        to build a long-range date picker without paging.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex justify-center overflow-x-auto">
          <tw-calendar
            aria-label="Two-month range picker"
            selectionMode="range"
            color="primary"
            [numberOfMonths]="2"
            size="sm"
            [startAt]="fixedDate"
            [selected]="multiMonthRange()"
            (selectedChange)="onMultiMonthRangeSelected($event)"
          />
        </div>
      </div>
      <tw-code-block [code]="multiMonthSnippet" language="html" />
    </section>

    <!-- Preset Rail -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Preset Rail</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Attach the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCalendarPresets</code>
        directive to a container projected into the calendar and it renders as a compact rail
        below the header. Use it for quick shortcuts — Today, Last 7 days, This month — that
        set the selection programmatically without reinventing the header.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm flex justify-center">
          <tw-calendar
            aria-label="Range with presets"
            selectionMode="range"
            color="info"
            size="sm"
            [selected]="presetRange()"
            [startAt]="presetStartAt()"
            (selectedChange)="onPresetRangeSelected($event)"
          >
            <div twCalendarPresets>
              <button twButton variant="ghost" color="neutral" size="xs" (click)="applyPresetToday()">Today</button>
              <button twButton variant="ghost" color="neutral" size="xs" (click)="applyPresetLast7()">Last 7 days</button>
              <button twButton variant="ghost" color="neutral" size="xs" (click)="applyPresetThisMonth()">This month</button>
            </div>
          </tw-calendar>
        </div>
      </div>
      <tw-code-block [code]="presetRailSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Switch
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">mode</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">range</code>
        to see the range preview on hover, toggle
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">headerless</code>
        to see what the calendar looks like when composed inside a custom shell, and
        experiment with any color / size combination that matches your app.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-5 mb-6">
          <div>
            <p class="text-2xs font-medium text-fg-subtle uppercase tracking-wider mb-3">Appearance</p>
            <div class="flex flex-wrap gap-6">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
                <div class="flex flex-wrap gap-1">
                  @for (c of colors; track c) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playColor() === c"
                      [class.!text-primary-700]="playColor() === c"
                      (click)="playColor.set(c)"
                    >{{ c }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
                <div class="flex gap-1">
                  @for (s of sizes; track s) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playSize() === s"
                      [class.!text-primary-700]="playSize() === s"
                      (click)="playSize.set(s)"
                    >{{ s }}</button>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="pt-5 border-t border-border-muted">
            <p class="text-2xs font-medium text-fg-subtle uppercase tracking-wider mb-3">Behavior</p>
            <div class="flex flex-wrap gap-6">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Mode</label>
                <div class="flex gap-1">
                  @for (m of modes; track m) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playMode() === m"
                      [class.!text-primary-700]="playMode() === m"
                      (click)="setPlayMode(m)"
                    >{{ m }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Options</label>
                <div class="flex gap-1">
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playDisabled()"
                    [class.!text-primary-700]="playDisabled()"
                    (click)="playDisabled.update(v => !v)"
                  >disabled</button>
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playHeaderless()"
                    [class.!text-primary-700]="playHeaderless()"
                    (click)="playHeaderless.update(v => !v)"
                  >headerless</button>
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playWithTime()"
                    [class.!text-primary-700]="playWithTime()"
                    (click)="playWithTime.update(v => !v)"
                  >withTime</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken flex justify-center">
          <tw-calendar
            aria-label="Playground calendar"
            [color]="playColor()"
            [size]="playSize()"
            [selectionMode]="playMode()"
            [disabled]="playDisabled()"
            [headerless]="playHeaderless()"
            [withTime]="playWithTime()"
            [startAt]="fixedDate"
            [selected]="playValue()"
            (selectedChange)="onPlaySelected($event)"
          />
        </div>
        <div class="flex items-center justify-between gap-3 mt-4 flex-wrap">
          <div class="flex items-center gap-2">
            <span twBadge [color]="playColor()" variant="soft" size="sm">{{ playColor() }}</span>
            <span twBadge color="neutral" variant="soft" size="sm">{{ playSize() }}</span>
            <span twBadge color="neutral" variant="outline" size="sm">{{ playMode() }}</span>
          </div>
          <p class="text-xs text-fg-muted font-mono">value = {{ playLabel() }}</p>
        </div>
      </div>
    </section>
  `,
})
export class CalendarExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly views = VIEWS;
  protected readonly modes = MODES;

  protected readonly today = new Date();
  // Use a fixed date so the demo renders identically in any month.
  protected readonly fixedDate = new Date(this.today.getFullYear(), this.today.getMonth(), 15);

  protected readonly minDate = new Date(this.today.getFullYear(), this.today.getMonth(), 5);
  protected readonly maxDate = new Date(this.today.getFullYear(), this.today.getMonth(), 25);

  protected readonly minLabel = computed(() => this.minDate.toLocaleDateString());
  protected readonly maxLabel = computed(() => this.maxDate.toLocaleDateString());
  protected fmt = fmt;

  protected weekdayOnly = (d: Date): boolean => d.getDay() !== 0 && d.getDay() !== 6;

  protected highlightPaydays = (d: Date): string => {
    const day = d.getDate();
    if (day === 1 || day === 15) {
      return 'after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-warning-500';
    }
    return '';
  };

  // Range demo
  protected readonly rangeValue = signal<TwDateRange<Date>>(new TwDateRange<Date>(null, null));
  protected onRangeSelected(v: unknown): void {
    if (v instanceof TwDateRange) {
      this.rangeValue.set(v as TwDateRange<Date>);
    }
  }
  protected readonly rangeLabel = computed(() => {
    const r = this.rangeValue();
    return { start: fmt(r.start), end: fmt(r.end) };
  });
  protected readonly rangeShortLabel = computed(() => {
    const r = this.rangeValue();
    return { start: shortDate(r.start), end: shortDate(r.end) };
  });
  protected readonly nightsLabel = computed(() => {
    const r = this.rangeValue();
    if (!r.start || !r.end) return 'No dates';
    const diff = Math.round((r.end.getTime() - r.start.getTime()) / MS_PER_DAY);
    if (diff <= 0) return 'Same day';
    return `${diff} ${diff === 1 ? 'night' : 'nights'}`;
  });

  // Reactive
  protected readonly reactiveControl = new FormControl<Date | null>(null);
  protected readonly reactiveValueLabel = computed(() => fmt(this.reactiveControl.value));
  protected toggleReactiveDisabled(): void {
    if (this.reactiveControl.disabled) this.reactiveControl.enable();
    else this.reactiveControl.disable();
  }

  // Template-driven
  protected tdValue: Date | null = null;

  // Multi selection
  protected readonly multiValue = signal<readonly Date[]>([]);
  protected onMultiSelected(v: unknown): void {
    if (Array.isArray(v)) {
      this.multiValue.set(v as readonly Date[]);
    }
  }
  protected shortFmt(d: Date): string {
    return shortDate(d);
  }

  // Week selection
  protected readonly weekValue = signal<TwDateRange<Date> | null>(null);
  protected onWeekSelected(v: unknown): void {
    if (v instanceof TwDateRange) this.weekValue.set(v as TwDateRange<Date>);
  }
  protected readonly weekLabel = computed(() => {
    const w = this.weekValue();
    return {
      start: shortDate(w?.start),
      end: shortDate(w?.end),
    };
  });

  // Event-dot cell template — fixed set of "event" days for the fixedDate month.
  private readonly eventDays = new Set<number>([3, 9, 17, 24]);
  protected hasEvent(d: Date): boolean {
    if (!d) return false;
    if (d.getMonth() !== this.fixedDate.getMonth() || d.getFullYear() !== this.fixedDate.getFullYear()) return false;
    return this.eventDays.has(d.getDate());
  }

  // Multi-month range
  protected readonly multiMonthRange = signal<TwDateRange<Date>>(new TwDateRange<Date>(null, null));
  protected onMultiMonthRangeSelected(v: unknown): void {
    if (v instanceof TwDateRange) this.multiMonthRange.set(v as TwDateRange<Date>);
  }

  // Preset rail
  protected readonly presetRange = signal<TwDateRange<Date>>(new TwDateRange<Date>(null, null));
  protected readonly presetStartAt = signal<Date>(this.fixedDate);
  protected onPresetRangeSelected(v: unknown): void {
    if (v instanceof TwDateRange) this.presetRange.set(v as TwDateRange<Date>);
  }
  protected applyPresetToday(): void {
    const t = new Date();
    const day = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    this.presetStartAt.set(day);
    this.presetRange.set(new TwDateRange<Date>(day, day));
  }
  protected applyPresetLast7(): void {
    const end = new Date();
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const start = new Date(endDay.getTime() - 6 * MS_PER_DAY);
    this.presetStartAt.set(start);
    this.presetRange.set(new TwDateRange<Date>(start, endDay));
  }
  protected applyPresetThisMonth(): void {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth(), 1);
    const end = new Date(t.getFullYear(), t.getMonth() + 1, 0);
    this.presetStartAt.set(start);
    this.presetRange.set(new TwDateRange<Date>(start, end));
  }

  // Signal forms
  protected readonly signalModel = signal<{ meetingDate: Date | null }>({ meetingDate: null });
  protected readonly signalForm = form(this.signalModel);

  // Playground
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playMode = signal<TwCalendarSelectionMode>('single');
  protected readonly playDisabled = signal(false);
  protected readonly playHeaderless = signal(false);
  protected readonly playWithTime = signal(false);
  protected readonly playValue = signal<Date | TwDateRange<Date> | readonly Date[] | null>(null);

  protected setPlayMode(mode: TwCalendarSelectionMode): void {
    this.playMode.set(mode);
    // Reset value when switching modes so the bound signal stays well-typed.
    if (mode === 'range' || mode === 'week') {
      this.playValue.set(new TwDateRange<Date>(null, null));
    } else if (mode === 'multi') {
      this.playValue.set([]);
    } else {
      this.playValue.set(null);
    }
  }

  protected onPlaySelected(v: unknown): void {
    if (v instanceof TwDateRange) {
      this.playValue.set(v as TwDateRange<Date>);
    } else if (Array.isArray(v)) {
      this.playValue.set(v as readonly Date[]);
    } else if (v instanceof Date || v === null) {
      this.playValue.set(v);
    }
  }

  protected playLabel(): string {
    const v = this.playValue();
    if (v instanceof TwDateRange) return `[${fmt(v.start)} → ${fmt(v.end)}]`;
    if (Array.isArray(v)) return v.length === 0 ? '[]' : `[${v.map((d) => shortDate(d)).join(', ')}]`;
    if (v instanceof Date) return v.toLocaleDateString();
    return '—';
  }

  // withTime demo
  protected readonly withTimeValue = signal<Date | null>(
    new Date(this.fixedDate.getFullYear(), this.fixedDate.getMonth(), 15, 9, 30, 0),
  );
  protected onWithTimeSelected(v: unknown): void {
    if (v instanceof Date || v === null) this.withTimeValue.set(v);
  }
  protected readonly withTimeLabel = computed(() => {
    const v = this.withTimeValue();
    if (!v) return '—';
    return `${v.toLocaleDateString()} ${String(v.getHours()).padStart(2, '0')}:${String(v.getMinutes()).padStart(2, '0')}`;
  });

  protected readonly withTime12Value = signal<Date | null>(
    new Date(this.fixedDate.getFullYear(), this.fixedDate.getMonth(), 15, 14, 45, 30),
  );
  protected onWithTime12Selected(v: unknown): void {
    if (v instanceof Date || v === null) this.withTime12Value.set(v);
  }
  protected readonly withTime12Label = computed(() => {
    const v = this.withTime12Value();
    if (!v) return '—';
    const hh = String(v.getHours()).padStart(2, '0');
    const mm = String(v.getMinutes()).padStart(2, '0');
    const ss = String(v.getSeconds()).padStart(2, '0');
    return `${v.toLocaleDateString()} ${hh}:${mm}:${ss}`;
  });

  // ── Code snippets ──

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-calendar
    [color]="c"
    size="sm"
    [startAt]="fixedDate"
    [selected]="fixedDate"
    [attr.aria-label]="c + ' calendar'"
  />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-calendar
    [size]="s"
    [startAt]="fixedDate"
    [attr.aria-label]="s + ' calendar'"
  />
}`.trim();

  protected readonly rangeSnippet = `<tw-calendar
  aria-label="Range picker"
  selectionMode="range"
  color="info"
  [(selected)]="range"
/>`;

  protected readonly minMaxSnippet = `<tw-calendar
  aria-label="Bounded calendar"
  color="success"
  [minDate]="minDate"
  [maxDate]="maxDate"
/>`;

  protected readonly filterSnippet = `// disable Saturdays and Sundays
protected weekdayOnly = (d: Date): boolean =>
  d.getDay() !== 0 && d.getDay() !== 6;

<tw-calendar
  aria-label="Weekdays only"
  color="accent"
  [dateFilter]="weekdayOnly"
/>`;

  protected readonly dateClassSnippet = `// highlight the 1st and 15th of every month
protected highlightPaydays = (d: Date): string => {
  const day = d.getDate();
  return day === 1 || day === 15
    ? 'after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-warning-500'
    : '';
};

<tw-calendar
  aria-label="Custom classes"
  color="warning"
  [dateClass]="highlightPaydays"
/>`;

  protected readonly startViewSnippet = `
@for (v of views; track v) {
  <tw-calendar
    [startView]="v"
    [startAt]="fixedDate"
    [attr.aria-label]="'Start view ' + v"
  />
}`.trim();

  protected readonly withTimeSnippet = `<!-- 24h -->
<tw-calendar
  aria-label="Calendar with 24h time"
  [withTime]="true"
  [(selected)]="meetingAt"
/>

<!-- 12h + seconds + 5-minute step -->
<tw-calendar
  aria-label="Calendar with 12h time and seconds"
  color="accent"
  [withTime]="true"
  timeFormat="12h"
  [showSeconds]="true"
  [minuteStep]="5"
  [(selected)]="preciseAt"
/>`;

  protected readonly statesSnippet = `<!-- Disabled -->
<tw-calendar aria-label="Disabled calendar" [disabled]="true" [selected]="value" />

<!-- Headerless (compose a custom shell outside) -->
<tw-calendar aria-label="Headerless calendar" [headerless]="true" />`;

  protected readonly tdTsSnippet = `protected tdValue: Date | null = null;`;

  protected readonly tdHtmlSnippet = `<tw-calendar
  aria-label="Meeting date"
  name="meeting"
  [(ngModel)]="tdValue"
/>`;

  protected readonly reactiveTsSnippet = `protected readonly meetingControl = new FormControl<Date | null>(null);`;

  protected readonly reactiveHtmlSnippet = `<tw-calendar
  aria-label="Meeting date"
  [formControl]="meetingControl"
/>`;

  protected readonly signalTsSnippet = `protected readonly model = signal<{ meetingDate: Date | null }>({ meetingDate: null });
protected readonly meetingForm = form(this.model);`;

  protected readonly signalHtmlSnippet = `<tw-calendar
  aria-label="Meeting date"
  [formField]="meetingForm.meetingDate"
/>`;

  protected readonly multiSnippet = `<tw-calendar
  aria-label="Days off"
  selectionMode="multi"
  color="success"
  [(selected)]="dates"
/>

<!-- dates: signal<Date[]> — each click toggles the cell in and out of the array -->`;

  protected readonly weekSnippet = `<tw-calendar
  aria-label="Weekly report"
  selectionMode="week"
  color="accent"
  [(selected)]="week"
/>

<!-- week: signal<TwDateRange<Date> | null> — one click spans the full week -->`;

  protected readonly cellTemplateTsSnippet = `protected hasEvent(d: Date): boolean {
  return this.eventDays.has(d.getDate());
}`;

  protected readonly cellTemplateHtmlSnippet = `<tw-calendar aria-label="Events" color="info" [cellTemplate]="eventCell">
  <ng-template #eventCell let-c>
    <span class="relative inline-flex items-center justify-center">
      {{ c.displayValue }}
      @if (hasEvent(c.rawDate)) {
        <span class="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-info-500"></span>
      }
    </span>
  </ng-template>
</tw-calendar>`;

  protected readonly multiMonthSnippet = `<tw-calendar
  aria-label="Two-month range picker"
  selectionMode="range"
  [numberOfMonths]="2"
/>`;

  protected readonly presetRailSnippet = `<tw-calendar aria-label="Range with presets" selectionMode="range" [(selected)]="range">
  <div twCalendarPresets>
    <button twButton variant="ghost" size="xs" (click)="applyToday()">Today</button>
    <button twButton variant="ghost" size="xs" (click)="applyLast7()">Last 7 days</button>
    <button twButton variant="ghost" size="xs" (click)="applyThisMonth()">This month</button>
  </div>
</tw-calendar>`;
}
