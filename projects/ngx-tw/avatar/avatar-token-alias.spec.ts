import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AvatarComponent, AVATAR_GROUP_SIZE, TW_AVATAR_GROUP_SIZE } from './avatar';

/**
 * `AVATAR_GROUP_SIZE` was renamed to `TW_AVATAR_GROUP_SIZE`. The alias must be a
 * *reference to the same `InjectionToken` instance*, never a second
 * `new InjectionToken(...)` — two instances are two distinct DI keys, so a
 * consumer providing the old name and a library injecting the new one would
 * silently miss each other with no error anywhere.
 *
 * Nothing else in the suite can catch that: every other avatar spec provides
 * and injects through the same name, so it passes identically under either
 * implementation. Hence the cross-name test below.
 */

@Component({
  imports: [AvatarComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  // The avatar declares size="xs" for itself; the ambient group size says "xl".
  // The group size is meant to win.
  template: `<tw-avatar size="xs" alt="Probe" />`,
  providers: [{ provide: AVATAR_GROUP_SIZE, useValue: () => 'xl' }],
})
class DeprecatedNameHost {}

describe('AVATAR_GROUP_SIZE → TW_AVATAR_GROUP_SIZE alias', () => {
  it('is the same token instance, not a second InjectionToken', () => {
    expect(AVATAR_GROUP_SIZE).toBe(TW_AVATAR_GROUP_SIZE);
  });

  it('lets an avatar injecting the new name read a size provided under the deprecated name', () => {
    // DOM-observable on purpose. `AvatarComponent` injects
    // `TW_AVATAR_GROUP_SIZE` optionally and falls back to its own `size` input
    // when nothing is provided, so a split DI graph does not throw — it quietly
    // renders `size-6` (xs) instead of `size-16` (xl). Asserting the rendered
    // class is what distinguishes the two.
    TestBed.configureTestingModule({ imports: [DeprecatedNameHost] });
    const fixture = TestBed.createComponent(DeprecatedNameHost);
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector('tw-avatar') as HTMLElement;
    expect(avatar.classList.contains('size-16')).toBe(true);
    expect(avatar.classList.contains('size-6')).toBe(false);
  });

  it('resolves a value provided under the new name when injected under the deprecated name', () => {
    const sentinel = () => 'lg' as const;
    TestBed.configureTestingModule({
      providers: [{ provide: TW_AVATAR_GROUP_SIZE, useValue: sentinel }],
    });
    expect(TestBed.inject(AVATAR_GROUP_SIZE)).toBe(sentinel);
  });
});
