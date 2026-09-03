import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  COMMAND_PALETTE_REF,
  TW_COMMAND_PALETTE_REF,
  type CommandPaletteRef,
} from './command-palette-tokens';

/**
 * `COMMAND_PALETTE_REF` was renamed to `TW_COMMAND_PALETTE_REF`. The alias must
 * be a *reference to the same `InjectionToken` instance*, never a second
 * `new InjectionToken(...)`: two instances are two distinct DI keys, so overlay
 * content injecting one name would not see a value provided under the other,
 * and nothing would throw at build time.
 *
 * The palette itself now provides `TW_COMMAND_PALETTE_REF` into the overlay
 * injector (`command-palette.ts`), so consumer content still written against
 * `COMMAND_PALETTE_REF` depends entirely on the alias holding.
 */

const noopRef: CommandPaletteRef = {
  close: () => undefined,
  setQuery: () => undefined,
};

@Component({ template: '' })
class InjectsNewName {
  readonly ref = inject(TW_COMMAND_PALETTE_REF);
}

@Component({ template: '' })
class InjectsDeprecatedName {
  readonly ref = inject(COMMAND_PALETTE_REF);
}

describe('COMMAND_PALETTE_REF → TW_COMMAND_PALETTE_REF alias', () => {
  it('is the same token instance, not a second InjectionToken', () => {
    expect(COMMAND_PALETTE_REF).toBe(TW_COMMAND_PALETTE_REF);
  });

  it('reaches a component injecting the new name from a value provided under the deprecated name', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: COMMAND_PALETTE_REF, useValue: noopRef }],
    });
    // A split DI graph would throw NullInjectorError here rather than resolve.
    expect(TestBed.createComponent(InjectsNewName).componentInstance.ref).toBe(noopRef);
  });

  it('reaches a component injecting the deprecated name from a value provided under the new name', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: TW_COMMAND_PALETTE_REF, useValue: noopRef }],
    });
    expect(TestBed.createComponent(InjectsDeprecatedName).componentInstance.ref).toBe(noopRef);
  });
});
