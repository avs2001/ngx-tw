import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  POPOVER_DATA,
  POPOVER_REF,
  TW_POPOVER_DATA,
  TW_POPOVER_REF,
  type PopoverRef,
} from './popover-tokens';

/**
 * `POPOVER_DATA` / `POPOVER_REF` were renamed to `TW_POPOVER_DATA` /
 * `TW_POPOVER_REF`. Each alias must be a *reference to the same
 * `InjectionToken` instance*, never a second `new InjectionToken(...)`: two
 * instances are two distinct DI keys, so popover content injecting one name
 * would silently fail to see a value provided under the other.
 *
 * `PopoverDirective` now provides the `TW_*` names into the content injector,
 * so every consumer component still written against the bare names depends on
 * these aliases. `popover.spec.ts`'s `TestPopoverContent` deliberately keeps
 * injecting the deprecated names, which makes that suite an end-to-end proof of
 * the same property through the real overlay; the tests here pin it directly
 * and in both directions.
 */

const noopRef: PopoverRef = { close: () => undefined };

@Component({ template: '' })
class InjectsNewNames {
  readonly data = inject(TW_POPOVER_DATA);
  readonly ref = inject(TW_POPOVER_REF);
}

@Component({ template: '' })
class InjectsDeprecatedNames {
  readonly data = inject(POPOVER_DATA);
  readonly ref = inject(POPOVER_REF);
}

describe('popover token aliases', () => {
  it('are the same token instances, not second InjectionTokens', () => {
    expect(POPOVER_DATA).toBe(TW_POPOVER_DATA);
    expect(POPOVER_REF).toBe(TW_POPOVER_REF);
  });

  it('reach a component injecting the new names from values provided under the deprecated names', () => {
    const data = { invitee: 'ada' };
    TestBed.configureTestingModule({
      providers: [
        { provide: POPOVER_DATA, useValue: data },
        { provide: POPOVER_REF, useValue: noopRef },
      ],
    });
    // A split DI graph would throw NullInjectorError here rather than resolve.
    const instance = TestBed.createComponent(InjectsNewNames).componentInstance;
    expect(instance.data).toBe(data);
    expect(instance.ref).toBe(noopRef);
  });

  it('reach a component injecting the deprecated names from values provided under the new names', () => {
    const data = { invitee: 'grace' };
    TestBed.configureTestingModule({
      providers: [
        { provide: TW_POPOVER_DATA, useValue: data },
        { provide: TW_POPOVER_REF, useValue: noopRef },
      ],
    });
    const instance = TestBed.createComponent(InjectsDeprecatedNames).componentInstance;
    expect(instance.data).toBe(data);
    expect(instance.ref).toBe(noopRef);
  });
});
