import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { DATE_ADAPTER } from '../date-adapter';
import { LuxonDateAdapter } from './luxon-date-adapter';

/**
 * Provides {@link LuxonDateAdapter} as the calendar's `DateAdapter`.
 *
 * Wire at app or route level so the adapter stays constant for the
 * component's lifetime (§11.7 of the calendar spec):
 *
 * ```ts
 * import { provideLuxonDateAdapter } from 'ngx-tw/calendar/luxon';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideLuxonDateAdapter()],
 * });
 * ```
 */
export function provideLuxonDateAdapter(): EnvironmentProviders {
  return makeEnvironmentProviders([
    LuxonDateAdapter,
    { provide: DATE_ADAPTER, useExisting: LuxonDateAdapter },
  ]);
}
