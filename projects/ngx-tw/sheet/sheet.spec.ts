import { ApplicationRef, Component, inject, type TemplateRef, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OverlayModule } from '@angular/cdk/overlay';
import { provideSheet, Sheet } from './sheet';
import { SheetRef } from './sheet-ref';
import { SHEET_DATA } from './sheet-config';
import {
  SheetActionsDirective,
  SheetCloseDirective,
  SheetContentDirective,
  SheetDescriptionDirective,
  SheetIconDirective,
  SheetSubtitleDirective,
  SheetTitleDirective,
} from './sheet-content';

// ── Test components ──

@Component({
  template: `
    <h2 twSheetTitle>Component sheet</h2>
    <p twSheetContent>body {{ data.value }}</p>
    <div twSheetActions>
      <button twSheetClose>Cancel</button>
      <button [twSheetClose]="'ok'" class="ok-btn">OK</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    SheetTitleDirective,
    SheetContentDirective,
    SheetActionsDirective,
    SheetCloseDirective,
  ],
})
class SheetComponentContent {
  readonly data = inject<{ value: string }>(SHEET_DATA);
  readonly ref = inject<SheetRef<string, SheetComponentContent>>(SheetRef);
}

@Component({
  template: `
    <ng-template #tpl>
      <h2 twSheetTitle>Template sheet</h2>
      <section twSheetContent>template body</section>
      <div twSheetActions>
        <button twSheetClose class="cancel-btn">Cancel</button>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    SheetTitleDirective,
    SheetContentDirective,
    SheetActionsDirective,
    SheetCloseDirective,
  ],
})
class SheetTemplateHost {
  readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
}

@Component({
  template: `<div twSheetIcon [color]="color">!</div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [SheetIconDirective],
})
class SheetIconHost {
  color: 'error' | 'success' | undefined = undefined;
}

@Component({
  template: `<span twSheetSubtitle>Description text</span>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [SheetSubtitleDirective],
})
class SheetSubtitleHost {}

@Component({
  template: `
    <h2 twSheetTitle>Description sheet</h2>
    <p twSheetDescription>Long-form description of what this sheet is doing.</p>
    <div twSheetContent>body</div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [SheetTitleDirective, SheetDescriptionDirective, SheetContentDirective],
})
class SheetWithDescription {}

// ── Helpers ──

const ENTER_MS = 200;
const EXIT_MS = 160;

function getContainerEl(): HTMLElement | null {
  return document.querySelector('tw-sheet-container');
}

function getAllContainers(): NodeListOf<HTMLElement> {
  return document.querySelectorAll('tw-sheet-container');
}

function getBackdropEl(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-backdrop');
}

function flushExit(): void {
  vi.advanceTimersByTime(EXIT_MS + 200);
}

function pressEscape(el: HTMLElement, modifiers: Partial<KeyboardEventInit> = {}): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, ...modifiers }),
  );
}

// ── Tests ──

describe('Sheet', () => {
  let sheet: Sheet;

  /**
   * Await the lazily-imported sheet renderer, then run the enter animation.
   *
   * The renderer arrives via a real dynamic `import()` that settles on the
   * microtask queue — unaffected by `vi.useFakeTimers()`, so plain `await`
   * works. CD is ticked explicitly (not `whenStable()`, which can hang under
   * fake timers) both before and after advancing the enter timer.
   */
  async function flushEnter(): Promise<void> {
    await sheet._whenRendered();
    TestBed.inject(ApplicationRef).tick();
    // Advance past rAF + enter duration + fallback padding.
    vi.advanceTimersByTime(ENTER_MS + 150);
    TestBed.inject(ApplicationRef).tick();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [provideSheet()],
    });
    sheet = TestBed.inject(Sheet);
  });

  afterEach(() => {
    sheet.closeAll();
    flushExit();
    vi.useRealTimers();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  describe('rendering', () => {
    it('should not render anything before open()', () => {
      expect(getContainerEl()).toBeNull();
    });

    it('should render the container on open() with component content', async () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'hi' } });
      await flushEnter();

      const el = getContainerEl();
      expect(el).toBeTruthy();
      expect(el!.textContent).toContain('Component sheet');
      expect(el!.textContent).toContain('body hi');
      expect(ref.componentInstance).toBeTruthy();
    });

    it('should render with a TemplateRef', async () => {
      const hostFixture = TestBed.createComponent(SheetTemplateHost);
      hostFixture.detectChanges();
      sheet.open(hostFixture.componentInstance.tpl());
      await flushEnter();

      expect(getContainerEl()!.textContent).toContain('Template sheet');
      expect(getContainerEl()!.textContent).toContain('template body');
    });

    it('should render every side value with the correct data-side attribute', async () => {
      const sides = ['top', 'right', 'bottom', 'left'] as const;
      for (const side of sides) {
        const ref = sheet.open(SheetComponentContent, { data: { value: 'x' }, side });
        await flushEnter();
        TestBed.inject(ApplicationRef).tick();
        const el = getContainerEl();
        expect(el).toBeTruthy();
        expect(el!.getAttribute('data-side')).toBe(side);
        ref.close();
        flushExit();
      }
    });

    it('should render every size variant without errors', async () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;
      for (const size of sizes) {
        const ref = sheet.open(SheetComponentContent, { data: { value: 'x' }, size });
        await flushEnter();
        expect(getContainerEl()).toBeTruthy();
        ref.close();
        flushExit();
      }
    });

    it('should apply width-based class for horizontal sides', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, side: 'right', size: 'md' });
      await flushEnter();
      const el = getContainerEl()!;
      expect(el.className).toContain('max-w-md');
      expect(el.className).toContain('h-screen');
      expect(el.className).toContain('right-0');
    });

    it('should apply height-based class for vertical sides', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, side: 'top', size: 'md' });
      await flushEnter();
      const el = getContainerEl()!;
      expect(el.className).toContain('h-[50vh]');
      expect(el.className).toContain('w-screen');
    });

    it('should set bottom-0 for bottom-anchored sheets', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, side: 'bottom', size: 'lg' });
      await flushEnter();
      const el = getContainerEl()!;
      expect(el.className).toContain('bottom-0');
      expect(el.className).toContain('h-[66vh]');
    });
  });

  describe('backdrop', () => {
    it('should render a backdrop by default', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' } });
      await flushEnter();
      expect(getBackdropEl()).toBeTruthy();
    });

    it('should omit the backdrop when hasBackdrop is false', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, hasBackdrop: false });
      await flushEnter();
      expect(getBackdropEl()).toBeNull();
    });

    it('should close on backdrop click by default', async () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      await flushEnter();
      expect(ref.state()).toBe('open');

      (getBackdropEl() as HTMLElement).click();
      flushExit();

      expect(ref.state()).toBe('closed');
      expect(getContainerEl()).toBeNull();
    });

    it('should not close on backdrop click when closeOnBackdropClick=false', async () => {
      const ref = sheet.open(SheetComponentContent, {
        data: { value: 'x' },
        closeOnBackdropClick: false,
      });
      await flushEnter();
      (getBackdropEl() as HTMLElement).click();
      flushExit();

      expect(ref.state()).toBe('open');
      expect(getContainerEl()).toBeTruthy();
    });

    it('should not close on backdrop click when disableClose is true (overrides closeOnBackdropClick)', async () => {
      const ref = sheet.open(SheetComponentContent, {
        data: { value: 'x' },
        disableClose: true,
      });
      await flushEnter();
      (getBackdropEl() as HTMLElement).click();
      flushExit();

      expect(ref.state()).toBe('open');
      expect(getContainerEl()).toBeTruthy();
    });
  });

  describe('keyboard', () => {
    it('should close on Escape by default', async () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      await flushEnter();

      pressEscape(getContainerEl()!);
      flushExit();

      expect(ref.state()).toBe('closed');
      expect(getContainerEl()).toBeNull();
    });

    it('should not close on Escape when closeOnEscape=false', async () => {
      const ref = sheet.open(SheetComponentContent, {
        data: { value: 'x' },
        closeOnEscape: false,
      });
      await flushEnter();
      pressEscape(getContainerEl()!);
      flushExit();

      expect(ref.state()).toBe('open');
    });

    it('should not close on Escape when disableClose is true (overrides closeOnEscape)', async () => {
      const ref = sheet.open(SheetComponentContent, {
        data: { value: 'x' },
        disableClose: true,
      });
      await flushEnter();
      pressEscape(getContainerEl()!);
      flushExit();

      expect(ref.state()).toBe('open');
    });

    it('should ignore Escape with modifier keys', async () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      await flushEnter();
      pressEscape(getContainerEl()!, { ctrlKey: true });
      flushExit();

      expect(ref.state()).toBe('open');
    });
  });

  describe('close()', () => {
    it('should close the sheet with the given result', async () => {
      const ref = sheet.open<string, { value: string }>(SheetComponentContent, {
        data: { value: 'x' },
      });
      await flushEnter();

      let result: string | undefined;
      ref.afterClosed().subscribe((r) => (result = r));

      ref.close('accepted');
      flushExit();

      expect(result).toBe('accepted');
      expect(ref.state()).toBe('closed');
    });

    it('should not close when closePredicate returns false', async () => {
      const ref = sheet.open(SheetComponentContent, {
        data: { value: 'x' },
        closePredicate: () => false,
      });
      await flushEnter();

      ref.close();
      flushExit();

      expect(ref.state()).toBe('open');
      expect(getContainerEl()).toBeTruthy();
    });
  });

  describe('lifecycle observables', () => {
    it('should emit afterOpened once the enter animation finishes', async () => {
      const opened = vi.fn();
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      ref.afterOpened().subscribe(opened);

      expect(opened).not.toHaveBeenCalled();
      await flushEnter();
      expect(opened).toHaveBeenCalledOnce();
    });

    it('should emit beforeClosed before afterClosed on close()', async () => {
      const events: string[] = [];
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      ref.beforeClosed().subscribe(() => events.push('before'));
      ref.afterClosed().subscribe(() => events.push('after'));
      await flushEnter();

      ref.close();
      flushExit();

      expect(events).toEqual(['before', 'after']);
    });
  });

  describe('state signal', () => {
    it('should transition opening -> open -> closing -> closed', async () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      expect(ref.state()).toBe('opening');

      await flushEnter();
      expect(ref.state()).toBe('open');

      ref.close();
      expect(ref.state()).toBe('closing');

      flushExit();
      expect(ref.state()).toBe('closed');
    });
  });

  describe('service registry', () => {
    it('should track open sheets', async () => {
      expect(sheet.openSheets().length).toBe(0);

      const a = sheet.open(SheetComponentContent, { data: { value: 'a' } });
      await flushEnter();
      const b = sheet.open(SheetComponentContent, { data: { value: 'b' }, id: 'b', side: 'left' });
      await flushEnter();

      expect(sheet.openSheets().length).toBe(2);
      expect(sheet.getSheetById('b')).toBe(b);
      // Stacking: both containers should exist in the DOM.
      expect(getAllContainers().length).toBe(2);

      a.close();
      b.close();
      flushExit();
      expect(sheet.openSheets().length).toBe(0);
    });

    it('should throw when opening two sheets with the same id', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, id: 'dup' });
      await flushEnter();
      expect(() =>
        sheet.open(SheetComponentContent, { data: { value: 'y' }, id: 'dup' }),
      ).toThrow();
    });

    it('closeAll should close every open sheet', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'a' } });
      await flushEnter();
      sheet.open(SheetComponentContent, { data: { value: 'b' }, side: 'left' });
      await flushEnter();

      sheet.closeAll();
      flushExit();

      expect(sheet.openSheets().length).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('should default to role="dialog"', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' } });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('role')).toBe('dialog');
    });

    it('should use role="alertdialog" when configured', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, role: 'alertdialog' });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('role')).toBe('alertdialog');
    });

    it('should register title id with aria-labelledby queue', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' } });
      await flushEnter();
      TestBed.inject(ApplicationRef).tick();
      const container = getContainerEl()!;
      const labelledBy = container.getAttribute('aria-labelledby');
      const titleEl = container.querySelector('h2');
      expect(labelledBy).toBeTruthy();
      expect(labelledBy).toBe(titleEl!.getAttribute('id'));
    });

    it('should forward ariaLabel when provided', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, ariaLabel: 'Custom label' });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('aria-label')).toBe('Custom label');
      expect(getContainerEl()!.getAttribute('aria-labelledby')).toBeNull();
    });

    it('should default aria-modal to true', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' } });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('aria-modal')).toBe('true');
    });

    it('should allow opting out of aria-modal', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, ariaModal: false });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('aria-modal')).toBe('false');
    });

    it('should register description id with aria-describedby queue', async () => {
      sheet.open(SheetWithDescription);
      await flushEnter();
      TestBed.inject(ApplicationRef).tick();
      const container = getContainerEl()!;
      const describedBy = container.getAttribute('aria-describedby');
      const descriptionEl = container.querySelector('p[twSheetDescription]');
      expect(describedBy).toBeTruthy();
      expect(describedBy).toBe(descriptionEl!.getAttribute('id'));
    });

    it('should prefer explicit ariaDescribedBy over description directive', async () => {
      sheet.open(SheetWithDescription, { ariaDescribedBy: 'custom-desc' });
      await flushEnter();
      TestBed.inject(ApplicationRef).tick();
      expect(getContainerEl()!.getAttribute('aria-describedby')).toBe('custom-desc');
    });

    it('should reflect the configured side in data-side', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, side: 'bottom' });
      await flushEnter();
      TestBed.inject(ApplicationRef).tick();
      expect(getContainerEl()!.getAttribute('data-side')).toBe('bottom');
    });
  });

  describe('SheetCloseDirective', () => {
    it('should close with the forwarded value', async () => {
      const ref = sheet.open<string, { value: string }>(SheetComponentContent, {
        data: { value: 'x' },
      });
      await flushEnter();

      let closedWith: string | undefined;
      ref.afterClosed().subscribe((r) => (closedWith = r));

      const okBtn = document.querySelector('.ok-btn') as HTMLButtonElement;
      okBtn.click();
      flushExit();

      expect(closedWith).toBe('ok');
    });

    it('should default button type to "button"', async () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' } });
      await flushEnter();
      const btn = document.querySelector('.ok-btn') as HTMLButtonElement;
      expect(btn.getAttribute('type')).toBe('button');
    });
  });

  describe('content directives (offline)', () => {
    it('SheetIconDirective renders with neutral classes by default', () => {
      const fixture = TestBed.createComponent(SheetIconHost);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('[twSheetIcon]') as HTMLElement;
      expect(el.className).toContain('rounded-full');
      expect(el.className).toContain('bg-surface-muted');
    });

    it('SheetIconDirective applies semantic color classes', () => {
      const fixture = TestBed.createComponent(SheetIconHost);
      fixture.componentInstance.color = 'error';
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('[twSheetIcon]') as HTMLElement;
      expect(el.className).toContain('bg-error-soft');
      expect(el.className).toContain('text-error-icon');
    });

    it('SheetSubtitleDirective applies muted text styling', () => {
      const fixture = TestBed.createComponent(SheetSubtitleHost);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('[twSheetSubtitle]') as HTMLElement;
      expect(el.className).toContain('text-fg-muted');
    });

    it('SheetDescriptionDirective generates a unique id on the host element', () => {
      const fixture = TestBed.createComponent(SheetWithDescription);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('p[twSheetDescription]') as HTMLElement;
      expect(el.id).toMatch(/^tw-sheet-description-/);
    });
  });

  describe('lifecycle robustness', () => {
    it('should emit afterClosed exactly once on close()', async () => {
      const afterClosed = vi.fn();
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      ref.afterClosed().subscribe(afterClosed);
      await flushEnter();

      ref.close();
      flushExit();
      flushExit();

      expect(afterClosed).toHaveBeenCalledTimes(1);
    });

    it('should settle into closed when close() is called', async () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      await flushEnter();
      expect(ref.state()).toBe('open');

      ref.close();
      flushExit();

      expect(ref.state()).toBe('closed');
    });
  });

  describe('default options', () => {
    it('should merge provided defaults into open()', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [OverlayModule],
        providers: [provideSheet({ side: 'left', size: 'lg', ariaModal: false })],
      });
      const localSheet = TestBed.inject(Sheet);

      localSheet.open(SheetComponentContent, { data: { value: 'x' } });
      await flushEnter();

      const container = getContainerEl()!;
      expect(container.getAttribute('data-side')).toBe('left');
      expect(container.className).toContain('max-w-xl');
      expect(container.getAttribute('aria-modal')).toBe('false');

      localSheet.closeAll();
      flushExit();
    });
  });

  // The render layer arrives through a dynamic import(), so the ref exists —
  // and is usable — before the overlay is on screen. These cover that gap.
  describe('deferred renderer', () => {
    it('returns a usable ref with a valid id synchronously, before the chunk loads', () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      expect(ref.id).toMatch(/^tw-sheet-/);
      expect(sheet.getSheetById(ref.id)).toBe(ref);
      expect(ref.state()).toBe('opening');
      expect(getContainerEl()).toBeNull();
    });

    it('resolves whenComponentReady() with the instance once attached', async () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'hi' } });
      const instance = await ref.whenComponentReady();
      expect(instance).toBeInstanceOf(SheetComponentContent);
      expect(ref.componentInstance).toBe(instance);
    });

    it('resolves whenComponentReady() with null for a template sheet', async () => {
      const host = TestBed.createComponent(SheetTemplateHost);
      host.detectChanges();
      const ref = sheet.open(host.componentInstance.tpl());
      const instance = await ref.whenComponentReady();
      expect(instance).toBeNull();
    });

    it('a sheet closed before the renderer lands never reaches the DOM', async () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      let closedResult: unknown = 'unset';
      ref.afterClosed().subscribe((r) => (closedResult = r));

      ref.close('cancelled' as never);
      expect(ref.state()).toBe('closed');

      await flushEnter();

      expect(getContainerEl()).toBeNull();
      expect(sheet.getSheetById(ref.id)).toBeUndefined();
      expect(closedResult).toBe('cancelled');
      await expect(ref.whenComponentReady()).resolves.toBeNull();
    });

    it('buffers panel-class mutations issued before attach', async () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      ref.addPanelClass('pre-attach-class');
      await flushEnter();
      const panel = document.querySelector('.tw-sheet-panel') as HTMLElement;
      expect(panel.classList.contains('pre-attach-class')).toBe(true);
    });

    it('delivers backdropClick to a subscriber that subscribed before attach', async () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      // Subscribe synchronously, before the render chunk has attached.
      const spy = vi.fn();
      ref.backdropClick().subscribe(spy);

      await flushEnter();
      (getBackdropEl() as HTMLElement).click();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
