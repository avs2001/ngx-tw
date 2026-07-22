import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { SeparatorComponent } from './separator';

@Component({
  template: `<tw-separator>OR</tw-separator>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [SeparatorComponent],
})
class SeparatorWithLabelHost {}

@Component({
  template: `<tw-separator orientation="vertical">HIDDEN</tw-separator>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [SeparatorComponent],
})
class SeparatorVerticalWithLabelHost {}

describe('SeparatorComponent', () => {
  let component: SeparatorComponent;
  let fixture: ComponentFixture<SeparatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeparatorComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SeparatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Rendering', () => {
    it('should create with default inputs', () => {
      expect(component).toBeTruthy();
    });

    it('should render two line elements', () => {
      const lines = fixture.nativeElement.querySelectorAll('span');
      // 3 spans: line, label (empty/hidden), line
      expect(lines.length).toBe(3);
    });

    it('should apply horizontal orientation classes by default', () => {
      const host: HTMLElement = fixture.nativeElement;
      expect(host.classList.contains('flex')).toBe(true);
      expect(host.classList.contains('items-center')).toBe(true);
      expect(host.classList.contains('w-full')).toBe(true);
    });

    it('should apply border-t to lines in horizontal mode', () => {
      const lines = fixture.nativeElement.querySelectorAll('span');
      expect(lines[0].classList.contains('border-t')).toBe(true);
    });
  });

  describe('Inputs', () => {
    it('should apply vertical orientation classes', () => {
      fixture.componentRef.setInput('orientation', 'vertical');
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      expect(host.classList.contains('flex-col')).toBe(true);
      expect(host.classList.contains('self-stretch')).toBe(true);

      const lines = fixture.nativeElement.querySelectorAll('span');
      expect(lines[0].classList.contains('border-l')).toBe(true);
    });

    it('should apply dashed variant', () => {
      fixture.componentRef.setInput('variant', 'dashed');
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('span');
      expect(line.classList.contains('border-dashed')).toBe(true);
    });

    it('should apply dotted variant', () => {
      fixture.componentRef.setInput('variant', 'dotted');
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('span');
      expect(line.classList.contains('border-dotted')).toBe(true);
    });

    it('should apply medium weight in horizontal mode', () => {
      fixture.componentRef.setInput('weight', 'medium');
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('span');
      expect(line.classList.contains('border-t-2')).toBe(true);
    });

    it('should apply thick weight in horizontal mode', () => {
      fixture.componentRef.setInput('weight', 'thick');
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('span');
      expect(line.classList.contains('border-t-[3px]')).toBe(true);
    });

    it('should apply medium weight in vertical mode', () => {
      fixture.componentRef.setInput('orientation', 'vertical');
      fixture.componentRef.setInput('weight', 'medium');
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('span');
      expect(line.classList.contains('border-l-2')).toBe(true);
    });

    it('should apply thick weight in vertical mode', () => {
      fixture.componentRef.setInput('orientation', 'vertical');
      fixture.componentRef.setInput('weight', 'thick');
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('span');
      expect(line.classList.contains('border-l-[3px]')).toBe(true);
    });

    it('should apply color variant classes', () => {
      fixture.componentRef.setInput('color', 'primary');
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('span');
      expect(line.classList.contains('border-primary-300')).toBe(true);
    });

    it('should use border-border for neutral color', () => {
      const line = fixture.nativeElement.querySelector('span');
      expect(line.classList.contains('border-border')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have role="separator" by default', () => {
      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('role')).toBe('separator');
    });

    it('should have aria-orientation matching orientation input', () => {
      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('aria-orientation')).toBe('horizontal');

      fixture.componentRef.setInput('orientation', 'vertical');
      fixture.detectChanges();
      expect(host.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('should switch to role="none" and aria-hidden when decorative', () => {
      fixture.componentRef.setInput('decorative', true);
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('role')).toBe('none');
      expect(host.getAttribute('aria-hidden')).toBe('true');
      expect(host.getAttribute('aria-orientation')).toBeNull();
    });
  });

  describe('Content projection', () => {
    it('should hide label span when no content is projected', () => {
      const spans = fixture.nativeElement.querySelectorAll('span');
      // The label span (middle one) should be hidden via empty:hidden
      const labelSpan = spans[1];
      expect(labelSpan.classList.contains('empty:hidden')).toBe(true);
      expect(labelSpan.textContent?.trim()).toBe('');
    });

    it('should display projected label content in horizontal mode', async () => {
      const hostFixture = TestBed.createComponent(SeparatorWithLabelHost);
      hostFixture.detectChanges();

      const separator = hostFixture.nativeElement.querySelector('tw-separator');
      const spans = separator.querySelectorAll('span');
      const labelSpan = spans[1];
      expect(labelSpan.textContent?.trim()).toBe('OR');
    });

    it('should not render label slot in vertical mode', async () => {
      const hostFixture = TestBed.createComponent(SeparatorVerticalWithLabelHost);
      hostFixture.detectChanges();

      const separator = hostFixture.nativeElement.querySelector('tw-separator');
      const spans = separator.querySelectorAll('span');
      // Vertical mode: only 2 line spans, no label span
      expect(spans.length).toBe(2);
    });
  });
});
