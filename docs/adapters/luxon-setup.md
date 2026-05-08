# Luxon Date Adapter — Setup Recipe

The `LuxonDateAdapter` ships in the `ngx-tw/calendar/luxon` secondary entry point and provides
full IANA timezone support via [Luxon](https://moment.github.io/luxon/) ≥ 3.

## Prerequisites

- `ngx-tw` with the calendar package installed
- `luxon ^3` installed as a regular dependency

```bash
npm install luxon
```

`luxon` is declared as an **optional** peer dependency in `ngx-tw`. The calendar works
without it (using the default `NativeDateAdapter`); only install `luxon` when you need
timezone-aware calendars.

## Basic setup — local time

Replace the default `provideNativeDateAdapter()` with `provideLuxonDateAdapter()` in your
app config (or a standalone component's `providers`):

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideLuxonDateAdapter } from 'ngx-tw/calendar/luxon';

export const appConfig: ApplicationConfig = {
  providers: [
    provideLuxonDateAdapter(),
  ],
};
```

The calendar's `DateTime` type is now `luxon.DateTime` everywhere — inputs, outputs, and
value accessors all expect `DateTime` objects.

## Timezone-aware setup

Inject a specific IANA timezone via the `TZ_OVERRIDE` token:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideLuxonDateAdapter } from 'ngx-tw/calendar/luxon';
import { TZ_OVERRIDE } from 'ngx-tw/calendar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideLuxonDateAdapter([
      { provide: TZ_OVERRIDE, useValue: 'America/New_York' },
    ]),
  ],
};
```

With `TZ_OVERRIDE` set:

- `today()` returns midnight in the specified timezone.
- `create(year, month, day)` constructs dates anchored to that timezone.
- `fromIso` / `parse` interpret ISO strings in that timezone.
- `getTimezone()` returns the IANA timezone string.

### Per-component timezone override

You can also provide the token at the component level to scope a single calendar to a
specific timezone without affecting the rest of the app:

```typescript
@Component({
  selector: 'app-booking',
  providers: [
    LuxonDateAdapter,
    { provide: DATE_ADAPTER, useExisting: LuxonDateAdapter },
    { provide: TZ_OVERRIDE, useValue: 'Europe/Paris' },
  ],
  template: `<tw-calendar />`,
})
export class BookingComponent {}
```

## Custom display formats

`LuxonDateAdapter.format()` accepts a `TwLuxonDateFormat` object:

```typescript
import type { TwLuxonDateFormat } from 'ngx-tw/calendar/luxon';

// Luxon token string
const formatWithTokens: TwLuxonDateFormat = { luxonFormat: 'yyyy LLL dd' };

// Or Intl.DateTimeFormatOptions
const formatWithIntl: TwLuxonDateFormat = {
  dateTimeFormat: { year: 'numeric', month: 'long', day: 'numeric' },
};
```

Pass the format object to `dateFormats` on the calendar or via `DATE_FORMATS`:

```typescript
import { DATE_FORMATS } from 'ngx-tw/calendar';
import type { DateFormats } from 'ngx-tw/calendar';

const LUXON_DATE_FORMATS: DateFormats = {
  input:        { luxonFormat: 'MM/dd/yyyy' },
  display:      { luxonFormat: 'DD' },
  monthLabel:   { luxonFormat: 'LLLL yyyy' },
  yearLabel:    { luxonFormat: 'yyyy' },
};

// In providers:
{ provide: DATE_FORMATS, useValue: LUXON_DATE_FORMATS }
```

## DST handling

The Luxon adapter handles DST transparently:

| Scenario | Behaviour |
|---|---|
| Spring-forward skipped hour | `startOfDay` returns midnight; Luxon advances past any skipped instant automatically |
| Fall-back ambiguous hour | `resolveAmbiguous(date, 'earlier')` returns the DST (UTC-4) occurrence; `'later'` returns the standard-time (UTC-5) occurrence |
| `isDST(date)` | Returns `true` while DST is active for the date's zone |

Example:

```typescript
import { DateTime } from 'luxon';
import { LuxonDateAdapter } from 'ngx-tw/calendar/luxon';

// adapter injected from the DI tree
const dt = DateTime.fromObject(
  { year: 2024, month: 11, day: 3, hour: 1, minute: 30 },
  { zone: 'America/New_York' },
);

const earlier = adapter.resolveAmbiguous(dt, 'earlier'); // EDT (UTC-4)
const later   = adapter.resolveAmbiguous(dt, 'later');   // EST (UTC-5)
```

## Switching locale at runtime

```typescript
// Inject the adapter and call setLocale
adapter.setLocale('fr-FR');
```

This updates the locale for month names, day-of-week names, and formatted output.
`getFirstDayOfWeek()` also re-derives from the new locale.

## `provideTwCalendar` alternative

If you need to compose multiple providers alongside the adapter:

```typescript
import { provideTwCalendar } from 'ngx-tw/calendar';
import { LuxonDateAdapter } from 'ngx-tw/calendar/luxon';
import { TZ_OVERRIDE } from 'ngx-tw/calendar';

provideTwCalendar({
  adapter: LuxonDateAdapter,
  extraProviders: [
    { provide: TZ_OVERRIDE, useValue: 'Asia/Tokyo' },
  ],
})
```

## TypeScript types

The adapter exposes `DateTime` from Luxon as its generic type parameter `D`. All calendar
inputs and outputs typed against `DateAdapter<D>` resolve to `DateTime` when the Luxon
adapter is active.

```typescript
import type { DateTime } from 'luxon';

// CalendarComponent's valueChange output emits CalendarValue<DateTime>
calendarValueChange(value: CalendarValue<DateTime>) { ... }
```
