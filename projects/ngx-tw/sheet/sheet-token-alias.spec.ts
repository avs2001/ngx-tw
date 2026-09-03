import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  SHEET_DATA,
  SHEET_DEFAULT_OPTIONS,
  TW_SHEET_DATA,
  TW_SHEET_DEFAULT_OPTIONS,
  type SheetConfig,
} from './sheet-config';

/**
 * `SHEET_DATA` / `SHEET_DEFAULT_OPTIONS` were renamed to `TW_SHEET_DATA` /
 * `TW_SHEET_DEFAULT_OPTIONS`, matching `TW_DIALOG_DATA` /
 * `TW_DIALOG_DEFAULT_OPTIONS`. Each alias must be a *reference to the same
 * `InjectionToken` instance*, never a second `new InjectionToken(...)`: two
 * instances are two distinct DI keys, so sheet content injecting one name would
 * silently fail to see a value provided under the other.
 *
 * `SHEET_DEFAULT_OPTIONS` is the sharper of the two, because `Sheet` injects it
 * `{ optional: true }` and falls back to `{}` — a split graph would not throw,
 * it would quietly ignore every application-wide default a consumer registered
 * under the deprecated name.
 *
 * `sheet.spec.ts` deliberately keeps injecting the deprecated `SHEET_DATA` in
 * its content component, which makes that suite an end-to-end proof of the same
 * property through the real renderer; the tests here pin it directly and in
 * both directions.
 */

@Component({ template: '' })
class InjectsNewNames {
  readonly data = inject(TW_SHEET_DATA);
  readonly defaults = inject(TW_SHEET_DEFAULT_OPTIONS);
}

@Component({ template: '' })
class InjectsDeprecatedNames {
  readonly data = inject(SHEET_DATA);
  readonly defaults = inject(SHEET_DEFAULT_OPTIONS);
}

describe('sheet token aliases', () => {
  it('are the same token instances, not second InjectionTokens', () => {
    expect(SHEET_DATA).toBe(TW_SHEET_DATA);
    expect(SHEET_DEFAULT_OPTIONS).toBe(TW_SHEET_DEFAULT_OPTIONS);
  });

  it('reach a component injecting the new names from values provided under the deprecated names', () => {
    const data = { value: 'from-deprecated' };
    const defaults: Partial<SheetConfig> = { side: 'left' };
    TestBed.configureTestingModule({
      providers: [
        { provide: SHEET_DATA, useValue: data },
        { provide: SHEET_DEFAULT_OPTIONS, useValue: defaults },
      ],
    });
    // A split DI graph would throw NullInjectorError here rather than resolve.
    const instance = TestBed.createComponent(InjectsNewNames).componentInstance;
    expect(instance.data).toBe(data);
    expect(instance.defaults).toBe(defaults);
  });

  it('reach a component injecting the deprecated names from values provided under the new names', () => {
    const data = { value: 'from-new' };
    const defaults: Partial<SheetConfig> = { side: 'right' };
    TestBed.configureTestingModule({
      providers: [
        { provide: TW_SHEET_DATA, useValue: data },
        { provide: TW_SHEET_DEFAULT_OPTIONS, useValue: defaults },
      ],
    });
    const instance = TestBed.createComponent(InjectsDeprecatedNames).componentInstance;
    expect(instance.data).toBe(data);
    expect(instance.defaults).toBe(defaults);
  });
});
