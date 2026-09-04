import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FocusMonitor } from '@angular/cdk/a11y';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ItemComponent,
  ItemLeadingDirective,
  ItemTitleDirective,
  ItemDescriptionDirective,
  ItemTrailingDirective,
} from './item';
import type { ItemAlign, ItemSize } from './item';

// ── Test host components ──

@Component({
  imports: [ItemComponent, ItemTitleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-item>
      <span twItemTitle>Hello</span>
    </tw-item>
  `,
})
class TitleOnlyHost {}

@Component({
  imports: [
    ItemComponent,
    ItemLeadingDirective,
    ItemTitleDirective,
    ItemDescriptionDirective,
    ItemTrailingDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-item
      [size]="size()"
      [align]="align()"
      [interactive]="interactive()"
      [disabled]="disabled()"
      [current]="current()"
      (selected)="onSelected($event)"
    >
      <i data-testid="leading" twItemLeading></i>
      <span data-testid="title" twItemTitle>Sort</span>
      <p data-testid="description" twItemDescription>Composable sorting primitive</p>
      <i data-testid="trailing" twItemTrailing></i>
    </tw-item>
  `,
})
class FullItemHost {
  size = signal<ItemSize>('md');
  align = signal<ItemAlign>('start');
  interactive = signal(false);
  disabled = signal(false);
  current = signal(false);
  lastEvent: Event | null = null;
  selectedCount = 0;

  onSelected(event: Event): void {
    this.lastEvent = event;
    this.selectedCount++;
  }
}

@Component({
  imports: [ItemComponent, ItemTitleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-item class="py-4" [interactive]="true" [disabled]="true">
      <span twItemTitle>Override</span>
    </tw-item>
  `,
})
class ConsumerOverrideHost {}

@Component({
  imports: [ItemComponent, ItemTitleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-item interactive disabled current>
      <span twItemTitle>Bare attrs</span>
    </tw-item>
  `,
})
class BareAttributeHost {}

// ── Tests ──

describe('ItemComponent', () => {
  describe('default render', () => {
    let fixture: ComponentFixture<TitleOnlyHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TitleOnlyHost],
      }).compileComponents();
      fixture = TestBed.createComponent(TitleOnlyHost);
      fixture.detectChanges();
    });

    it('should create without errors', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render the item host element', () => {
      const item = fixture.nativeElement.querySelector('tw-item');
      expect(item).toBeTruthy();
    });

    it('should project the title content', () => {
      const title = fixture.nativeElement.querySelector('[twItemTitle]');
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Hello');
    });

    it('should apply flex and gap-3 by default (md size)', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.classList.contains('flex')).toBe(true);
      expect(item.classList.contains('gap-3')).toBe(true);
      expect(item.classList.contains('text-fg')).toBe(true);
    });

    it('should not apply role, tabindex, or aria-disabled by default', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.getAttribute('role')).toBeNull();
      expect(item.getAttribute('tabindex')).toBeNull();
      expect(item.getAttribute('aria-disabled')).toBeNull();
    });
  });

  describe('size variants', () => {
    let fixture: ComponentFixture<FullItemHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullItemHost);
      fixture.detectChanges();
    });

    it('should apply sm classes with truncation', () => {
      fixture.componentInstance.size.set('sm');
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      const title: HTMLElement = fixture.nativeElement.querySelector('[twItemTitle]');
      const description: HTMLElement = fixture.nativeElement.querySelector('[twItemDescription]');

      expect(item.classList.contains('gap-2')).toBe(true);
      expect(item.classList.contains('py-1.5')).toBe(true);
      expect(title.classList.contains('text-sm')).toBe(true);
      expect(title.classList.contains('truncate')).toBe(true);
      expect(description.classList.contains('text-xs')).toBe(true);
      expect(description.classList.contains('truncate')).toBe(true);
    });

    it('should apply md classes without truncation', () => {
      fixture.componentInstance.size.set('md');
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      const title: HTMLElement = fixture.nativeElement.querySelector('[twItemTitle]');
      const description: HTMLElement = fixture.nativeElement.querySelector('[twItemDescription]');

      expect(item.classList.contains('gap-3')).toBe(true);
      expect(item.classList.contains('py-2')).toBe(true);
      expect(title.classList.contains('text-sm')).toBe(true);
      expect(title.classList.contains('truncate')).toBe(false);
      expect(description.classList.contains('text-sm')).toBe(true);
      expect(description.classList.contains('truncate')).toBe(false);
    });

    it('should apply lg classes with large semibold title', () => {
      fixture.componentInstance.size.set('lg');
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      const title: HTMLElement = fixture.nativeElement.querySelector('[twItemTitle]');

      expect(item.classList.contains('gap-3')).toBe(true);
      expect(item.classList.contains('py-3')).toBe(true);
      expect(title.classList.contains('text-base')).toBe(true);
      expect(title.classList.contains('font-semibold')).toBe(true);
    });
  });

  describe('align variants', () => {
    let fixture: ComponentFixture<FullItemHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullItemHost);
      fixture.detectChanges();
    });

    it('should apply items-start on root by default (align=start)', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.classList.contains('items-start')).toBe(true);
      expect(item.classList.contains('items-center')).toBe(false);
    });

    it('should apply mt-0.5 nudge on leading at md size with align=start', () => {
      const leading: HTMLElement = fixture.nativeElement.querySelector('[twItemLeading]');
      expect(leading.classList.contains('mt-0.5')).toBe(true);
    });

    it('should apply items-center on root when align=center', () => {
      fixture.componentInstance.align.set('center');
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.classList.contains('items-center')).toBe(true);
    });

    it('should clear the leading mt-0.5 nudge when align=center', () => {
      fixture.componentInstance.align.set('center');
      fixture.detectChanges();

      const leading: HTMLElement = fixture.nativeElement.querySelector('[twItemLeading]');
      expect(leading.classList.contains('mt-0.5')).toBe(false);
      expect(leading.classList.contains('mt-0')).toBe(true);
    });
  });

  describe('interactive mode', () => {
    let fixture: ComponentFixture<FullItemHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullItemHost);
      fixture.componentInstance.interactive.set(true);
      fixture.detectChanges();
    });

    it('should set role="button" and tabindex="0"', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.getAttribute('role')).toBe('button');
      expect(item.getAttribute('tabindex')).toBe('0');
    });

    it('should apply hover and focus-visible classes', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.classList.contains('hover:bg-surface-muted')).toBe(true);
      expect(item.classList.contains('focus-visible:outline-primary-500')).toBe(true);
      expect(item.classList.contains('cursor-pointer')).toBe(true);
      expect(item.classList.contains('rounded-md')).toBe(true);
    });

    it('should emit selected on click', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      item.click();

      expect(fixture.componentInstance.selectedCount).toBe(1);
      expect(fixture.componentInstance.lastEvent).toBeInstanceOf(Event);
    });

    it('should emit selected on Enter keydown and preventDefault', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const spy = vi.spyOn(event, 'preventDefault');

      item.dispatchEvent(event);
      fixture.detectChanges();

      expect(fixture.componentInstance.selectedCount).toBe(1);
      expect(spy).toHaveBeenCalled();
      expect(fixture.componentInstance.lastEvent).toBeInstanceOf(KeyboardEvent);
    });

    it('should emit selected on Space keydown and preventDefault', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      const spy = vi.spyOn(event, 'preventDefault');

      item.dispatchEvent(event);
      fixture.detectChanges();

      expect(fixture.componentInstance.selectedCount).toBe(1);
      expect(spy).toHaveBeenCalled();
      expect(fixture.componentInstance.lastEvent).toBeInstanceOf(KeyboardEvent);
    });

    it('should not emit selected for other keys', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });

      item.dispatchEvent(event);
      fixture.detectChanges();

      expect(fixture.componentInstance.selectedCount).toBe(0);
    });
  });

  describe('disabled mode', () => {
    let fixture: ComponentFixture<FullItemHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullItemHost);
      fixture.componentInstance.interactive.set(true);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
    });

    it('should set aria-disabled="true"', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.getAttribute('aria-disabled')).toBe('true');
    });

    it('should remove tabindex', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.getAttribute('tabindex')).toBeNull();
    });

    it('should apply opacity-50 and pointer-events-none', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.classList.contains('opacity-50')).toBe(true);
      expect(item.classList.contains('pointer-events-none')).toBe(true);
    });

    it('should not emit selected on click', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      item.click();

      expect(fixture.componentInstance.selectedCount).toBe(0);
    });

    it('should not emit selected on Enter keydown', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.componentInstance.selectedCount).toBe(0);
    });
  });

  describe('content projection', () => {
    it('should project leading, title, description, and trailing slots', async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullItemHost);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="leading"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[data-testid="title"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[data-testid="description"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[data-testid="trailing"]')).toBeTruthy();
    });

    it('should not render a leading element when none is projected', async () => {
      await TestBed.configureTestingModule({
        imports: [TitleOnlyHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(TitleOnlyHost);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[twItemLeading]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[twItemDescription]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[twItemTrailing]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[twItemTitle]')).toBeTruthy();
    });

    it('should apply title classes onto the projected title element', async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullItemHost);
      fixture.detectChanges();

      const title: HTMLElement = fixture.nativeElement.querySelector('[twItemTitle]');
      expect(title.classList.contains('font-medium')).toBe(true);
      expect(title.classList.contains('text-fg')).toBe(true);
    });

    it('should apply description classes onto the projected description element', async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullItemHost);
      fixture.detectChanges();

      const description: HTMLElement = fixture.nativeElement.querySelector('[twItemDescription]');
      expect(description.classList.contains('text-fg-muted')).toBe(true);
    });

    it('should apply shrink-0 to leading and trailing', async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullItemHost);
      fixture.detectChanges();

      const leading: HTMLElement = fixture.nativeElement.querySelector('[twItemLeading]');
      const trailing: HTMLElement = fixture.nativeElement.querySelector('[twItemTrailing]');
      expect(leading.classList.contains('shrink-0')).toBe(true);
      expect(trailing.classList.contains('shrink-0')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should have no role or tabindex in non-interactive mode', async () => {
      await TestBed.configureTestingModule({
        imports: [TitleOnlyHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(TitleOnlyHost);
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.getAttribute('role')).toBeNull();
      expect(item.getAttribute('tabindex')).toBeNull();
    });

    it('should have role="button" in interactive mode', async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullItemHost);
      fixture.componentInstance.interactive.set(true);
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.getAttribute('role')).toBe('button');
    });

    it('should have aria-disabled="true" and no tabindex when disabled', async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullItemHost);
      fixture.componentInstance.interactive.set(true);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.getAttribute('aria-disabled')).toBe('true');
      expect(item.getAttribute('tabindex')).toBeNull();
    });
  });

  describe('current state', () => {
    let fixture: ComponentFixture<FullItemHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullItemHost);
      fixture.detectChanges();
    });

    it('should not set aria-current or current classes by default', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.getAttribute('aria-current')).toBeNull();
      expect(item.classList.contains('bg-primary-soft')).toBe(false);
      expect(item.classList.contains('ring-primary-border')).toBe(false);
    });

    it('should apply current ring and aria-current when current=true', () => {
      fixture.componentInstance.current.set(true);
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.getAttribute('aria-current')).toBe('true');
      expect(item.classList.contains('bg-primary-soft')).toBe(true);
      expect(item.classList.contains('ring-2')).toBe(true);
      expect(item.classList.contains('ring-inset')).toBe(true);
      expect(item.classList.contains('ring-primary-border-strong')).toBe(true);
    });

    it('should stack current and interactive focus styling together', () => {
      fixture.componentInstance.current.set(true);
      fixture.componentInstance.interactive.set(true);
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.classList.contains('ring-primary-border-strong')).toBe(true);
      expect(item.classList.contains('focus-visible:outline-primary-500')).toBe(true);
    });
  });

  describe('FocusMonitor integration', () => {
    it('should monitor on init and stop monitoring on destroy', async () => {
      const stopSpy = vi.fn();
      const monitorSpy = vi.fn();

      await TestBed.configureTestingModule({
        imports: [TitleOnlyHost],
        providers: [
          {
            provide: FocusMonitor,
            useValue: { monitor: monitorSpy, stopMonitoring: stopSpy },
          },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(TitleOnlyHost);
      fixture.detectChanges();

      expect(monitorSpy).toHaveBeenCalledTimes(1);

      fixture.destroy();
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('booleanAttribute coercion', () => {
    it('should coerce bare interactive, disabled, current attributes to true', async () => {
      await TestBed.configureTestingModule({
        imports: [BareAttributeHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(BareAttributeHost);
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.getAttribute('role')).toBe('button');
      expect(item.getAttribute('aria-disabled')).toBe('true');
      expect(item.getAttribute('aria-current')).toBe('true');
    });
  });

  describe('consumer class composition', () => {
    it('should preserve a consumer class alongside the internal computed classes', async () => {
      await TestBed.configureTestingModule({
        imports: [ConsumerOverrideHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(ConsumerOverrideHost);
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      // Consumer's static class attribute coexists with the host [class] binding.
      // Tailwind's CSS source order resolves the final winner — the host binding
      // never overwrites the consumer's class.
      expect(item.classList.contains('py-4')).toBe(true);
      expect(item.classList.contains('cursor-pointer')).toBe(true);
      expect(item.classList.contains('opacity-50')).toBe(true);
    });
  });
});
