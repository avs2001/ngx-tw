import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
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
  lastEvent: Event | null = null;
  selectedCount = 0;

  onSelected(event: Event): void {
    this.lastEvent = event;
    this.selectedCount++;
  }
}

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
      expect(item.className).toContain('flex');
      expect(item.className).toContain('gap-3');
      expect(item.className).toContain('text-fg');
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

      expect(item.className).toContain('gap-2');
      expect(item.className).toContain('py-1.5');
      expect(title.className).toContain('text-sm');
      expect(title.className).toContain('truncate');
      expect(description.className).toContain('text-xs');
      expect(description.className).toContain('truncate');
    });

    it('should apply md classes without truncation', () => {
      fixture.componentInstance.size.set('md');
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      const title: HTMLElement = fixture.nativeElement.querySelector('[twItemTitle]');
      const description: HTMLElement = fixture.nativeElement.querySelector('[twItemDescription]');

      expect(item.className).toContain('gap-3');
      expect(item.className).toContain('py-2');
      expect(title.className).toContain('text-sm');
      expect(title.className).not.toContain('truncate');
      expect(description.className).toContain('text-sm');
      expect(description.className).not.toContain('truncate');
    });

    it('should apply lg classes with large semibold title', () => {
      fixture.componentInstance.size.set('lg');
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      const title: HTMLElement = fixture.nativeElement.querySelector('[twItemTitle]');

      expect(item.className).toContain('gap-4');
      expect(item.className).toContain('py-3');
      expect(title.className).toContain('text-lg');
      expect(title.className).toContain('font-semibold');
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
      expect(item.className).toContain('items-start');
      expect(item.className).not.toContain('items-center');
    });

    it('should apply mt-0.5 nudge on leading at md size with align=start', () => {
      const leading: HTMLElement = fixture.nativeElement.querySelector('[twItemLeading]');
      expect(leading.className).toContain('mt-0.5');
    });

    it('should apply items-center on root when align=center', () => {
      fixture.componentInstance.align.set('center');
      fixture.detectChanges();

      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      expect(item.className).toContain('items-center');
    });

    it('should clear the leading mt-0.5 nudge when align=center', () => {
      fixture.componentInstance.align.set('center');
      fixture.detectChanges();

      const leading: HTMLElement = fixture.nativeElement.querySelector('[twItemLeading]');
      expect(leading.className).not.toContain('mt-0.5');
      expect(leading.className).toContain('mt-0');
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
      expect(item.className).toContain('hover:bg-surface-muted');
      expect(item.className).toContain('focus-visible:outline-primary-500');
      expect(item.className).toContain('cursor-pointer');
      expect(item.className).toContain('rounded-md');
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
    });

    it('should emit selected on Space keydown and preventDefault', () => {
      const item: HTMLElement = fixture.nativeElement.querySelector('tw-item');
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      const spy = vi.spyOn(event, 'preventDefault');

      item.dispatchEvent(event);
      fixture.detectChanges();

      expect(fixture.componentInstance.selectedCount).toBe(1);
      expect(spy).toHaveBeenCalled();
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
      expect(item.className).toContain('opacity-50');
      expect(item.className).toContain('pointer-events-none');
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
      expect(title.className).toContain('font-medium');
      expect(title.className).toContain('text-fg');
    });

    it('should apply description classes onto the projected description element', async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullItemHost);
      fixture.detectChanges();

      const description: HTMLElement = fixture.nativeElement.querySelector('[twItemDescription]');
      expect(description.className).toContain('text-fg-muted');
    });

    it('should apply shrink-0 to leading and trailing', async () => {
      await TestBed.configureTestingModule({
        imports: [FullItemHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullItemHost);
      fixture.detectChanges();

      const leading: HTMLElement = fixture.nativeElement.querySelector('[twItemLeading]');
      const trailing: HTMLElement = fixture.nativeElement.querySelector('[twItemTrailing]');
      expect(leading.className).toContain('shrink-0');
      expect(trailing.className).toContain('shrink-0');
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
});
