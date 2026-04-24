import { inject, InjectionToken } from '@angular/core';
import type { Provider } from '@angular/core';
import type { TwIconMap } from './icon.types';
import { IconRegistry } from './icon.registry';

/**
 * Multi-provider token whose factories register icons into the `IconRegistry`.
 * Injected by `IconComponent` to trigger factory execution. The token value is never read.
 */
export const TW_ICON_REGISTRAR = new InjectionToken<void[]>('TwIconRegistrar');

/**
 * Registers icons for use with `tw-icon`.
 *
 * Returns an array of providers that includes the `IconRegistry` service
 * and a multi-provider factory that merges the given icons into it.
 * Angular deduplicates the class provider, so multiple calls are safe.
 *
 * Works at all injector levels: app root, lazy route, and component.
 *
 * @example
 * ```ts
 * import { provideTwIcons } from 'ngx-tw/icon';
 *
 * const myIcons = {
 *   Star: [['polygon', { points: '12 2 15.09 8.26 ...' }]],
 * };
 *
 * export const appConfig = {
 *   providers: [provideTwIcons(myIcons)]
 * };
 * ```
 */
export function provideTwIcons(icons: TwIconMap): Provider[] {
  return [
    IconRegistry,
    {
      provide: TW_ICON_REGISTRAR,
      multi: true,
      useFactory: () => inject(IconRegistry).register(icons),
    },
  ];
}
