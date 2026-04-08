import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeDirective } from './theme.directive';
import type { ResolvedTheme } from './theme.types';
import { describe, it, expect } from 'vitest';

@Component({
  imports: [ThemeDirective],
  template: `<div [twTheme]="theme()" id="target"></div>`,
})
class TestHost {
  theme = signal<ResolvedTheme>('light');
}

describe('ThemeDirective', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [TestHost],
    });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('#target') as HTMLElement;
    return { fixture, el, host: fixture.componentInstance };
  }

  it('should set data-theme attribute to the input value', () => {
    const { el } = setup();
    expect(el.getAttribute('data-theme')).toBe('light');
  });

  it('should update the attribute when the input changes', () => {
    const { fixture, el, host } = setup();
    host.theme.set('dark');
    fixture.detectChanges();
    expect(el.getAttribute('data-theme')).toBe('dark');
  });

  it('should work for all resolved themes', () => {
    const { fixture, el, host } = setup();

    for (const theme of ['light', 'dark', 'high-contrast'] as const) {
      host.theme.set(theme);
      fixture.detectChanges();
      expect(el.getAttribute('data-theme')).toBe(theme);
    }
  });
});
