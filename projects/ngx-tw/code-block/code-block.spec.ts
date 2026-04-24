import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeBlockComponent } from './code-block';
import { Clipboard } from '@angular/cdk/clipboard';
import { LiveAnnouncer } from '@angular/cdk/a11y';

describe('CodeBlockComponent', () => {
  let fixture: ComponentFixture<CodeBlockComponent>;
  let clipboardSpy: { copy: ReturnType<typeof vi.fn> };
  let liveAnnouncerSpy: { announce: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    clipboardSpy = { copy: vi.fn().mockReturnValue(true) };
    liveAnnouncerSpy = { announce: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CodeBlockComponent],
      providers: [
        { provide: Clipboard, useValue: clipboardSpy },
        { provide: LiveAnnouncer, useValue: liveAnnouncerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeBlockComponent);
    fixture.componentRef.setInput('code', 'const x = 1;');
    fixture.detectChanges();
  });

  // ===== Rendering =====

  it('should render with required code input', () => {
    expect(fixture.nativeElement.querySelector('pre code')).toBeTruthy();
  });

  it('should display the code text', () => {
    const code = fixture.nativeElement.querySelector('code');
    expect(code.textContent).toBe('const x = 1;');
  });

  it('should render a header with copy button', () => {
    const header = fixture.nativeElement.querySelector('div');
    const button = header.querySelector('button');
    expect(header).toBeTruthy();
    expect(button).toBeTruthy();
  });

  it('should render filled variant by default', () => {
    const host = fixture.nativeElement;
    expect(host.className).toContain('bg-surface-sunken');
    expect(host.className).toContain('border-border-strong');
  });

  it('should render outlined variant', () => {
    fixture.componentRef.setInput('variant', 'outlined');
    fixture.detectChanges();
    const host = fixture.nativeElement;
    expect(host.className).toContain('bg-transparent');
    expect(host.className).not.toContain('bg-surface-sunken');
  });

  // ===== Inputs =====

  it('should update displayed code when input changes', () => {
    fixture.componentRef.setInput('code', 'let y = 2;');
    fixture.detectChanges();
    const code = fixture.nativeElement.querySelector('code');
    expect(code.textContent).toBe('let y = 2;');
  });

  it('should apply whitespace-pre by default (no wrap)', () => {
    const pre = fixture.nativeElement.querySelector('pre');
    expect(pre.className).toContain('whitespace-pre');
    expect(pre.className).not.toContain('whitespace-pre-wrap');
  });

  it('should apply whitespace-pre-wrap when wrap is true', () => {
    fixture.componentRef.setInput('wrap', true);
    fixture.detectChanges();
    const pre = fixture.nativeElement.querySelector('pre');
    expect(pre.className).toContain('whitespace-pre-wrap');
  });

  it('should not show language label when not set', () => {
    const header = fixture.nativeElement.querySelector('div');
    const spans = header.querySelectorAll('span');
    expect(spans.length).toBe(1);
    expect(spans[0].textContent.trim()).toBe('');
  });

  it('should show language label when set', () => {
    fixture.componentRef.setInput('language', 'TypeScript');
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('div');
    const span = header.querySelector('span');
    expect(span.textContent.trim()).toBe('TypeScript');
  });

  it('should update language label when input changes', () => {
    fixture.componentRef.setInput('language', 'TypeScript');
    fixture.detectChanges();
    fixture.componentRef.setInput('language', 'HTML');
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('div');
    const span = header.querySelector('span');
    expect(span.textContent.trim()).toBe('HTML');
  });

  // ===== Interactions =====

  it('should copy code to clipboard on button click', () => {
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();
    expect(clipboardSpy.copy).toHaveBeenCalledWith('const x = 1;');
  });

  it('should emit copied output on successful copy', () => {
    const copiedSpy = vi.fn();
    fixture.componentInstance.copied.subscribe(copiedSpy);

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(copiedSpy).toHaveBeenCalledOnce();
  });

  it('should not emit copied output when clipboard copy fails', () => {
    clipboardSpy.copy.mockReturnValue(false);
    const copiedSpy = vi.fn();
    fixture.componentInstance.copied.subscribe(copiedSpy);

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(copiedSpy).not.toHaveBeenCalled();
  });

  it('should show success state after copy', () => {
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(button.className).toContain('text-success-500');
  });

  it('should reset copied state after 2 seconds', () => {
    vi.useFakeTimers();

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();
    expect(button.className).toContain('text-success-500');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(button.className).not.toContain('text-success-500');

    vi.useRealTimers();
  });

  it('should announce to screen readers on copy', () => {
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Copied to clipboard');
  });

  // ===== Accessibility =====

  it('should have aria-label "Copy code" by default on button', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Copy code');
  });

  it('should update button aria-label to "Copied" after copy', () => {
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-label')).toBe('Copied');
  });

  it('should have role="region" on pre element', () => {
    const pre = fixture.nativeElement.querySelector('pre');
    expect(pre.getAttribute('role')).toBe('region');
  });

  it('should have tabindex="0" on pre element', () => {
    const pre = fixture.nativeElement.querySelector('pre');
    expect(pre.getAttribute('tabindex')).toBe('0');
  });

  it('should have aria-label "Code" on pre when no language set', () => {
    const pre = fixture.nativeElement.querySelector('pre');
    expect(pre.getAttribute('aria-label')).toBe('Code');
  });

  it('should have aria-label "{language} code" on pre when language set', () => {
    fixture.componentRef.setInput('language', 'TypeScript');
    fixture.detectChanges();
    const pre = fixture.nativeElement.querySelector('pre');
    expect(pre.getAttribute('aria-label')).toBe('TypeScript code');
  });

  it('should be keyboard-accessible via Enter key', () => {
    const copiedSpy = vi.fn();
    fixture.componentInstance.copied.subscribe(copiedSpy);

    const button = fixture.nativeElement.querySelector('button');
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    button.click();
    fixture.detectChanges();

    expect(copiedSpy).toHaveBeenCalledOnce();
  });
});
