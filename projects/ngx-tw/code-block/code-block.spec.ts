import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeBlockComponent, CodeBlockHeaderDirective } from './code-block';
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
    const labelSpan = header.querySelector('span');
    expect(labelSpan).toBeNull();
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

  it('should emit copyFailed output with an Error when clipboard copy fails', () => {
    clipboardSpy.copy.mockReturnValue(false);
    const copyFailedSpy = vi.fn<(err: Error) => void>();
    fixture.componentInstance.copyFailed.subscribe(copyFailedSpy);

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(copyFailedSpy).toHaveBeenCalledOnce();
    const err = copyFailedSpy.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Clipboard copy failed');
  });

  it('should not emit copyFailed output on successful copy', () => {
    const copyFailedSpy = vi.fn();
    fixture.componentInstance.copyFailed.subscribe(copyFailedSpy);

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(copyFailedSpy).not.toHaveBeenCalled();
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

  it('should clear the reset timeout when destroyed mid-success', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    fixture.destroy();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    // Advance past the reset window — nothing should throw.
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow();

    clearTimeoutSpy.mockRestore();
    vi.useRealTimers();
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

  // ===== i18n / labels override =====

  it('should override the copy button aria-label via labels input', () => {
    fixture.componentRef.setInput('labels', { copy: 'Copier' });
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Copier');
  });

  it('should override the copied aria-label via labels input', () => {
    fixture.componentRef.setInput('labels', { copied: 'Copié' });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-label')).toBe('Copié');
  });

  it('should override the screen-reader announcement via labels input', () => {
    fixture.componentRef.setInput('labels', { announcement: 'Copié dans le presse-papier' });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Copié dans le presse-papier');
  });

  it('should fall back to English defaults for missing label fields', () => {
    fixture.componentRef.setInput('labels', { copy: 'Copier' });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-label')).toBe('Copied');
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Copied to clipboard');
  });

  // ===== Consumer class merging =====

  it('should preserve consumer classes alongside internal host classes', async () => {
    @Component({
      imports: [CodeBlockComponent],
      template: `<tw-code-block code="x" class="rounded-2xl shadow-md custom-block" />`,
    })
    class Host {}

    const hostFixture = TestBed.createComponent(Host);
    hostFixture.detectChanges();

    const host = hostFixture.nativeElement.querySelector('tw-code-block');
    expect(host.className).toContain('rounded-2xl');
    expect(host.className).toContain('shadow-md');
    expect(host.className).toContain('custom-block');
    expect(host.className).toContain('bg-surface-sunken');
  });

  // ===== Two-way bindable isCopied =====

  it('should support two-way binding via [(isCopied)]', async () => {
    @Component({
      imports: [CodeBlockComponent],
      template: `<tw-code-block code="x" [(isCopied)]="copied" />`,
    })
    class Host {
      copied = false;
    }

    const hostFixture = TestBed.createComponent(Host);
    hostFixture.detectChanges();

    const button = hostFixture.nativeElement.querySelector('button');
    button.click();
    hostFixture.detectChanges();
    expect(hostFixture.componentInstance.copied).toBe(true);
  });

  it('should reflect external writes to isCopied in the UI', () => {
    fixture.componentInstance.isCopied.set(true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('text-success-500');
    expect(button.getAttribute('aria-label')).toBe('Copied');
  });

  // ===== Header slot =====

  it('should project content matching [twCodeBlockHeader] into the header', async () => {
    @Component({
      imports: [CodeBlockComponent, CodeBlockHeaderDirective],
      template: `
        <tw-code-block code="x" language="TypeScript">
          <span twCodeBlockHeader data-testid="filename">app.ts</span>
        </tw-code-block>
      `,
    })
    class Host {}

    const hostFixture = TestBed.createComponent(Host);
    hostFixture.detectChanges();

    const projected: HTMLElement | null =
      hostFixture.nativeElement.querySelector('[data-testid="filename"]');
    expect(projected).toBeTruthy();
    expect(projected!.textContent).toBe('app.ts');

    // The directive applies its host classes for typography alignment.
    expect(projected!.className).toContain('inline-flex');
  });
});
