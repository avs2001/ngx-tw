import { ApplicationRef, Component, inject, type TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OverlayModule } from '@angular/cdk/overlay';
import { provideSheet, Sheet } from './sheet';
import { SheetRef } from './sheet-ref';
import { SHEET_DATA } from './sheet-config';
import { SheetContainer } from './sheet-container';
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
  imports: [SheetIconDirective],
})
class SheetIconHost {
  color: 'error' | 'success' | undefined = undefined;
}

@Component({
  template: `<span twSheetSubtitle>Description text</span>`,
  imports: [SheetSubtitleDirective],
})
class SheetSubtitleHost {}

@Component({
  template: `
    <h2 twSheetTitle>Description sheet</h2>
    <p twSheetDescription>Long-form description of what this sheet is doing.</p>
    <div twSheetContent>body</div>
  `,
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

function flushEnter(): void {
  // Advance past rAF + enter duration + fallback padding.
  vi.advanceTimersByTime(ENTER_MS + 150);
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

    it('should render the container on open() with component content', () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'hi' } });
      flushEnter();

      const el = getContainerEl();
      expect(el).toBeTruthy();
      expect(el!.textContent).toContain('Component sheet');
      expect(el!.textContent).toContain('body hi');
      expect(ref.componentInstance).toBeTruthy();
    });

    it('should render with a TemplateRef', () => {
      const hostFixture = TestBed.createComponent(SheetTemplateHost);
      hostFixture.detectChanges();
      sheet.open(hostFixture.componentInstance.tpl());
      flushEnter();

      expect(getContainerEl()!.textContent).toContain('Template sheet');
      expect(getContainerEl()!.textContent).toContain('template body');
    });

    it('should render every side value with the correct data-side attribute', () => {
      const sides = ['top', 'right', 'bottom', 'left'] as const;
      for (const side of sides) {
        const ref = sheet.open(SheetComponentContent, { data: { value: 'x' }, side });
        flushEnter();
        TestBed.inject(ApplicationRef).tick();
        const el = getContainerEl();
        expect(el).toBeTruthy();
        expect(el!.getAttribute('data-side')).toBe(side);
        ref.close();
        flushExit();
      }
    });

    it('should render every size variant without errors', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;
      for (const size of sizes) {
        const ref = sheet.open(SheetComponentContent, { data: { value: 'x' }, size });
        flushEnter();
        expect(getContainerEl()).toBeTruthy();
        ref.close();
        flushExit();
      }
    });

    it('should apply width-based class for horizontal sides', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, side: 'right', size: 'md' });
      flushEnter();
      const el = getContainerEl()!;
      expect(el.className).toContain('max-w-md');
      expect(el.className).toContain('h-screen');
      expect(el.className).toContain('right-0');
    });

    it('should apply height-based class for vertical sides', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, side: 'top', size: 'md' });
      flushEnter();
      const el = getContainerEl()!;
      expect(el.className).toContain('h-[50vh]');
      expect(el.className).toContain('w-screen');
    });

    it('should set bottom-0 for bottom-anchored sheets', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, side: 'bottom', size: 'lg' });
      flushEnter();
      const el = getContainerEl()!;
      expect(el.className).toContain('bottom-0');
      expect(el.className).toContain('h-[66vh]');
    });
  });

  describe('backdrop', () => {
    it('should render a backdrop by default', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' } });
      flushEnter();
      expect(getBackdropEl()).toBeTruthy();
    });

    it('should omit the backdrop when hasBackdrop is false', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, hasBackdrop: false });
      flushEnter();
      expect(getBackdropEl()).toBeNull();
    });

    it('should close on backdrop click by default', () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      flushEnter();
      expect(ref.state()).toBe('open');

      (getBackdropEl() as HTMLElement).click();
      flushExit();

      expect(ref.state()).toBe('closed');
      expect(getContainerEl()).toBeNull();
    });

    it('should not close on backdrop click when closeOnBackdropClick=false', () => {
      const ref = sheet.open(SheetComponentContent, {
        data: { value: 'x' },
        closeOnBackdropClick: false,
      });
      flushEnter();
      (getBackdropEl() as HTMLElement).click();
      flushExit();

      expect(ref.state()).toBe('open');
      expect(getContainerEl()).toBeTruthy();
    });

    it('should not close on backdrop click when disableClose is true (overrides closeOnBackdropClick)', () => {
      const ref = sheet.open(SheetComponentContent, {
        data: { value: 'x' },
        disableClose: true,
      });
      flushEnter();
      (getBackdropEl() as HTMLElement).click();
      flushExit();

      expect(ref.state()).toBe('open');
      expect(getContainerEl()).toBeTruthy();
    });
  });

  describe('keyboard', () => {
    it('should close on Escape by default', () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      flushEnter();

      pressEscape(getContainerEl()!);
      flushExit();

      expect(ref.state()).toBe('closed');
      expect(getContainerEl()).toBeNull();
    });

    it('should not close on Escape when closeOnEscape=false', () => {
      const ref = sheet.open(SheetComponentContent, {
        data: { value: 'x' },
        closeOnEscape: false,
      });
      flushEnter();
      pressEscape(getContainerEl()!);
      flushExit();

      expect(ref.state()).toBe('open');
    });

    it('should not close on Escape when disableClose is true (overrides closeOnEscape)', () => {
      const ref = sheet.open(SheetComponentContent, {
        data: { value: 'x' },
        disableClose: true,
      });
      flushEnter();
      pressEscape(getContainerEl()!);
      flushExit();

      expect(ref.state()).toBe('open');
    });

    it('should ignore Escape with modifier keys', () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      flushEnter();
      pressEscape(getContainerEl()!, { ctrlKey: true });
      flushExit();

      expect(ref.state()).toBe('open');
    });
  });

  describe('close()', () => {
    it('should close the sheet with the given result', () => {
      const ref = sheet.open<string, { value: string }>(SheetComponentContent, {
        data: { value: 'x' },
      });
      flushEnter();

      let result: string | undefined;
      ref.afterClosed().subscribe((r) => (result = r));

      ref.close('accepted');
      flushExit();

      expect(result).toBe('accepted');
      expect(ref.state()).toBe('closed');
    });

    it('should not close when closePredicate returns false', () => {
      const ref = sheet.open(SheetComponentContent, {
        data: { value: 'x' },
        closePredicate: () => false,
      });
      flushEnter();

      ref.close();
      flushExit();

      expect(ref.state()).toBe('open');
      expect(getContainerEl()).toBeTruthy();
    });
  });

  describe('lifecycle observables', () => {
    it('should emit afterOpened once the enter animation finishes', () => {
      const opened = vi.fn();
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      ref.afterOpened().subscribe(opened);

      expect(opened).not.toHaveBeenCalled();
      flushEnter();
      expect(opened).toHaveBeenCalledOnce();
    });

    it('should emit beforeClosed before afterClosed on close()', () => {
      const events: string[] = [];
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      ref.beforeClosed().subscribe(() => events.push('before'));
      ref.afterClosed().subscribe(() => events.push('after'));
      flushEnter();

      ref.close();
      flushExit();

      expect(events).toEqual(['before', 'after']);
    });
  });

  describe('state signal', () => {
    it('should transition opening -> open -> closing -> closed', () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      expect(ref.state()).toBe('opening');

      flushEnter();
      expect(ref.state()).toBe('open');

      ref.close();
      expect(ref.state()).toBe('closing');

      flushExit();
      expect(ref.state()).toBe('closed');
    });
  });

  describe('service registry', () => {
    it('should track open sheets', () => {
      expect(sheet.openSheets().length).toBe(0);

      const a = sheet.open(SheetComponentContent, { data: { value: 'a' } });
      flushEnter();
      const b = sheet.open(SheetComponentContent, { data: { value: 'b' }, id: 'b', side: 'left' });
      flushEnter();

      expect(sheet.openSheets().length).toBe(2);
      expect(sheet.getSheetById('b')).toBe(b);
      // Stacking: both containers should exist in the DOM.
      expect(getAllContainers().length).toBe(2);

      a.close();
      b.close();
      flushExit();
      expect(sheet.openSheets().length).toBe(0);
    });

    it('should throw when opening two sheets with the same id', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, id: 'dup' });
      flushEnter();
      expect(() =>
        sheet.open(SheetComponentContent, { data: { value: 'y' }, id: 'dup' }),
      ).toThrow();
    });

    it('closeAll should close every open sheet', () => {
      sheet.open(SheetComponentContent, { data: { value: 'a' } });
      flushEnter();
      sheet.open(SheetComponentContent, { data: { value: 'b' }, side: 'left' });
      flushEnter();

      sheet.closeAll();
      flushExit();

      expect(sheet.openSheets().length).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('should default to role="dialog"', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' } });
      flushEnter();
      expect(getContainerEl()!.getAttribute('role')).toBe('dialog');
    });

    it('should use role="alertdialog" when configured', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, role: 'alertdialog' });
      flushEnter();
      expect(getContainerEl()!.getAttribute('role')).toBe('alertdialog');
    });

    it('should register title id with aria-labelledby queue', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' } });
      flushEnter();
      TestBed.inject(ApplicationRef).tick();
      const container = getContainerEl()!;
      const labelledBy = container.getAttribute('aria-labelledby');
      const titleEl = container.querySelector('h2');
      expect(labelledBy).toBeTruthy();
      expect(labelledBy).toBe(titleEl!.getAttribute('id'));
    });

    it('should forward ariaLabel when provided', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, ariaLabel: 'Custom label' });
      flushEnter();
      expect(getContainerEl()!.getAttribute('aria-label')).toBe('Custom label');
      expect(getContainerEl()!.getAttribute('aria-labelledby')).toBeNull();
    });

    it('should default aria-modal to true', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' } });
      flushEnter();
      expect(getContainerEl()!.getAttribute('aria-modal')).toBe('true');
    });

    it('should allow opting out of aria-modal', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, ariaModal: false });
      flushEnter();
      expect(getContainerEl()!.getAttribute('aria-modal')).toBe('false');
    });

    it('should register description id with aria-describedby queue', () => {
      sheet.open(SheetWithDescription);
      flushEnter();
      TestBed.inject(ApplicationRef).tick();
      const container = getContainerEl()!;
      const describedBy = container.getAttribute('aria-describedby');
      const descriptionEl = container.querySelector('p[twSheetDescription]');
      expect(describedBy).toBeTruthy();
      expect(describedBy).toBe(descriptionEl!.getAttribute('id'));
    });

    it('should prefer explicit ariaDescribedBy over description directive', () => {
      sheet.open(SheetWithDescription, { ariaDescribedBy: 'custom-desc' });
      flushEnter();
      TestBed.inject(ApplicationRef).tick();
      expect(getContainerEl()!.getAttribute('aria-describedby')).toBe('custom-desc');
    });

    it('should reflect the configured side in data-side', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' }, side: 'bottom' });
      flushEnter();
      TestBed.inject(ApplicationRef).tick();
      expect(getContainerEl()!.getAttribute('data-side')).toBe('bottom');
    });
  });

  describe('SheetCloseDirective', () => {
    it('should close with the forwarded value', () => {
      const ref = sheet.open<string, { value: string }>(SheetComponentContent, {
        data: { value: 'x' },
      });
      flushEnter();

      let closedWith: string | undefined;
      ref.afterClosed().subscribe((r) => (closedWith = r));

      const okBtn = document.querySelector('.ok-btn') as HTMLButtonElement;
      okBtn.click();
      flushExit();

      expect(closedWith).toBe('ok');
    });

    it('should default button type to "button"', () => {
      sheet.open(SheetComponentContent, { data: { value: 'x' } });
      flushEnter();
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
    it('should emit afterClosed exactly once on close()', () => {
      const afterClosed = vi.fn();
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      ref.afterClosed().subscribe(afterClosed);
      flushEnter();

      ref.close();
      flushExit();
      flushExit();

      expect(afterClosed).toHaveBeenCalledTimes(1);
    });

    it('should settle into closed when close() is called', () => {
      const ref = sheet.open(SheetComponentContent, { data: { value: 'x' } });
      flushEnter();
      expect(ref.state()).toBe('open');

      ref.close();
      flushExit();

      expect(ref.state()).toBe('closed');
    });
  });

  describe('default options', () => {
    it('should merge provided defaults into open()', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [OverlayModule],
        providers: [provideSheet({ side: 'left', size: 'lg', ariaModal: false })],
      });
      const localSheet = TestBed.inject(Sheet);

      localSheet.open(SheetComponentContent, { data: { value: 'x' } });
      flushEnter();

      const container = getContainerEl()!;
      expect(container.getAttribute('data-side')).toBe('left');
      expect(container.className).toContain('max-w-xl');
      expect(container.getAttribute('aria-modal')).toBe('false');

      localSheet.closeAll();
      flushExit();
    });
  });

  describe('ancestor-DI fallback', () => {
    // Exercises the `inject(SheetContainer, { optional: true, skipSelf: true })`
    // path that replaced the legacy `findEnclosingSheet` DOM walk. The host
    // provides a stub SheetContainer WITHOUT supplying SheetRef — so the
    // primary `inject(SheetRef)` returns null and the directive must fall
    // back to ancestor DI for the container reference.
    it('SheetTitleDirective registers its id when only the container is in scope', () => {
      const labelledBy: string[] = [];
      const containerStub = {
        _addAriaLabelledBy: (id: string) => labelledBy.push(id),
        _removeAriaLabelledBy: (id: string) => {
          const i = labelledBy.indexOf(id);
          if (i >= 0) labelledBy.splice(i, 1);
        },
      };

      @Component({
        template: `<h2 twSheetTitle id="title-fallback">Title</h2>`,
        imports: [SheetTitleDirective],
        providers: [{ provide: SheetContainer, useValue: containerStub }],
      })
      class AncestorHost {}

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [OverlayModule] });
      const fixture = TestBed.createComponent(AncestorHost);
      fixture.detectChanges();
      expect(labelledBy).toEqual(['title-fallback']);

      fixture.destroy();
      expect(labelledBy).toEqual([]);
    });

    it('SheetDescriptionDirective registers its id when only the container is in scope', () => {
      const describedBy: string[] = [];
      const containerStub = {
        _addAriaDescribedBy: (id: string) => describedBy.push(id),
        _removeAriaDescribedBy: (id: string) => {
          const i = describedBy.indexOf(id);
          if (i >= 0) describedBy.splice(i, 1);
        },
      };

      @Component({
        template: `<p twSheetDescription id="desc-fallback">Body</p>`,
        imports: [SheetDescriptionDirective],
        providers: [{ provide: SheetContainer, useValue: containerStub }],
      })
      class AncestorHost {}

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [OverlayModule] });
      const fixture = TestBed.createComponent(AncestorHost);
      fixture.detectChanges();
      expect(describedBy).toEqual(['desc-fallback']);

      fixture.destroy();
      expect(describedBy).toEqual([]);
    });
  });
});
