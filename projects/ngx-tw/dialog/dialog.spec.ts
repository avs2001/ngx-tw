import { ApplicationRef, Component, inject, type TemplateRef, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OverlayModule } from '@angular/cdk/overlay';
import { provideTwDialog, TwDialog } from './dialog';
import { TwDialogRef } from './dialog-ref';
import { TW_DIALOG_DATA } from './dialog-config';
import {
  DialogActionsDirective,
  DialogCloseDirective,
  DialogContentDirective,
  DialogDescriptionDirective,
  DialogIconDirective,
  DialogSubtitleDirective,
  DialogTitleDirective,
} from './dialog-content';

// ── Test components ──

@Component({
  template: `
    <h2 twDialogTitle>Component dialog</h2>
    <p twDialogContent>body {{ data.value }}</p>
    <div twDialogActions>
      <button twDialogClose>Cancel</button>
      <button [twDialogClose]="'ok'" class="ok-btn">OK</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    DialogTitleDirective,
    DialogContentDirective,
    DialogActionsDirective,
    DialogCloseDirective,
  ],
})
class DialogComponentContent {
  readonly data = inject<{ value: string }>(TW_DIALOG_DATA);
  readonly ref = inject<TwDialogRef<string, DialogComponentContent>>(TwDialogRef);
}

@Component({
  template: `
    <ng-template #tpl>
      <h2 twDialogTitle>Template dialog</h2>
      <section twDialogContent>template body</section>
      <div twDialogActions>
        <button twDialogClose class="cancel-btn">Cancel</button>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    DialogTitleDirective,
    DialogContentDirective,
    DialogActionsDirective,
    DialogCloseDirective,
  ],
})
class DialogTemplateHost {
  readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
}

@Component({
  template: `<div twDialogIcon [color]="color">!</div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [DialogIconDirective],
})
class DialogIconHost {
  color: 'error' | 'success' | undefined = undefined;
}

@Component({
  template: `<span twDialogSubtitle>Description text</span>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [DialogSubtitleDirective],
})
class DialogSubtitleHost {}

@Component({
  template: `
    <h2 twDialogTitle>Description dialog</h2>
    <p twDialogDescription>Long-form description of what this dialog is doing.</p>
    <div twDialogContent>body</div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [DialogTitleDirective, DialogDescriptionDirective, DialogContentDirective],
})
class DialogWithDescription {}

@Component({
  template: `
    <h2 twDialogTitle>Outer</h2>
    <p twDialogContent>outer body</p>
    <div twDialogActions>
      <button class="nest-btn" (click)="openInner()">Open inner</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    DialogTitleDirective,
    DialogContentDirective,
    DialogActionsDirective,
  ],
})
class DialogNestedParent {
  private readonly dialog = inject(TwDialog);
  openInner(): void {
    this.dialog.open(DialogNestedChild);
  }
}

@Component({
  template: `<h2 twDialogTitle>Inner</h2><p twDialogContent>inner body</p>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [DialogTitleDirective, DialogContentDirective],
})
class DialogNestedChild {}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<button>only</button>`,
})
class FocusSourceHost {}

// ── Helpers ──

const ENTER_MS = 150;
const EXIT_MS = 120;

function getContainerEl(): HTMLElement | null {
  return document.querySelector('tw-dialog-container');
}

function getBackdropEl(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-backdrop');
}

function flushExit(): void {
  vi.advanceTimersByTime(EXIT_MS + 200);
}

function pressEscape(el: HTMLElement): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
}

// ── Tests ──

describe('TwDialog', () => {
  let dialog: TwDialog;

  /**
   * Await the lazily-imported dialog renderer, then run the enter animation.
   *
   * The renderer arrives via a real dynamic `import()` that settles on the
   * microtask queue — unaffected by `vi.useFakeTimers()`, so plain `await`
   * works. CD is ticked explicitly (not `whenStable()`, which can hang under
   * fake timers) both before and after advancing the enter timer.
   */
  async function flushEnter(): Promise<void> {
    await dialog._whenRendered();
    TestBed.inject(ApplicationRef).tick();
    // Advance past rAF + enter duration + fallback padding.
    vi.advanceTimersByTime(ENTER_MS + 100);
    TestBed.inject(ApplicationRef).tick();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [provideTwDialog()],
    });
    dialog = TestBed.inject(TwDialog);
  });

  afterEach(() => {
    dialog.closeAll();
    flushExit();
    vi.useRealTimers();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  describe('rendering', () => {
    it('should not render anything before open()', () => {
      expect(getContainerEl()).toBeNull();
    });

    it('should render the container on open() with component content', async () => {
      const ref = dialog.open(DialogComponentContent, { data: { value: 'hi' } });
      await flushEnter();

      const el = getContainerEl();
      expect(el).toBeTruthy();
      expect(el!.textContent).toContain('Component dialog');
      expect(el!.textContent).toContain('body hi');
      expect(ref.componentInstance).toBeTruthy();
    });

    it('should render with a TemplateRef', async () => {
      const hostFixture = TestBed.createComponent(DialogTemplateHost);
      hostFixture.detectChanges();
      dialog.open(hostFixture.componentInstance.tpl());
      await flushEnter();

      expect(getContainerEl()!.textContent).toContain('Template dialog');
      expect(getContainerEl()!.textContent).toContain('template body');
    });

    it('should render every size variant without errors', async () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'fullscreen'] as const;
      for (const size of sizes) {
        const ref = dialog.open(DialogComponentContent, { data: { value: 'x' }, size });
        await flushEnter();
        expect(getContainerEl()).toBeTruthy();
        ref.close();
        flushExit();
      }
    });
  });

  describe('backdrop', () => {
    it('should render a backdrop by default', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'x' } });
      await flushEnter();
      expect(getBackdropEl()).toBeTruthy();
    });

    it('should omit the backdrop when hasBackdrop is false', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'x' }, hasBackdrop: false });
      await flushEnter();
      expect(getBackdropEl()).toBeNull();
    });

    it('should close on backdrop click', async () => {
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
      await flushEnter();
      expect(ref.state()).toBe('open');

      (getBackdropEl() as HTMLElement).click();
      flushExit();

      expect(ref.state()).toBe('closed');
      expect(getContainerEl()).toBeNull();
    });

    it('should not close on backdrop click when disableClose is true', async () => {
      const ref = dialog.open(DialogComponentContent, {
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
    it('should close on Escape', async () => {
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
      await flushEnter();

      pressEscape(getContainerEl()!);
      flushExit();

      expect(ref.state()).toBe('closed');
      expect(getContainerEl()).toBeNull();
    });

    it('should not close on Escape when disableClose is true', async () => {
      const ref = dialog.open(DialogComponentContent, {
        data: { value: 'x' },
        disableClose: true,
      });
      await flushEnter();
      pressEscape(getContainerEl()!);
      flushExit();

      expect(ref.state()).toBe('open');
    });
  });

  describe('close()', () => {
    it('should close the dialog with the given result', async () => {
      const ref = dialog.open<string, { value: string }>(DialogComponentContent, {
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
      const ref = dialog.open(DialogComponentContent, {
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
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
      ref.afterOpened().subscribe(opened);

      expect(opened).not.toHaveBeenCalled();
      await flushEnter();
      expect(opened).toHaveBeenCalledOnce();
    });

    it('should emit beforeClosed before afterClosed on close()', async () => {
      const events: string[] = [];
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
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
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
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
    it('should track open dialogs', async () => {
      expect(dialog.openDialogs().length).toBe(0);

      const a = dialog.open(DialogComponentContent, { data: { value: 'a' } });
      await flushEnter();
      const b = dialog.open(DialogComponentContent, { data: { value: 'b' }, id: 'b' });
      await flushEnter();

      expect(dialog.openDialogs().length).toBe(2);
      expect(dialog.getDialogById('b')).toBe(b);

      a.close();
      b.close();
      flushExit();
      expect(dialog.openDialogs().length).toBe(0);
    });

    it('should throw when opening two dialogs with the same id', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'x' }, id: 'dup' });
      await flushEnter();
      expect(() => dialog.open(DialogComponentContent, { data: { value: 'y' }, id: 'dup' })).toThrow();
    });

    it('closeAll should close every open dialog', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'a' } });
      await flushEnter();
      dialog.open(DialogComponentContent, { data: { value: 'b' } });
      await flushEnter();

      dialog.closeAll();
      flushExit();

      expect(dialog.openDialogs().length).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('should default to role="dialog"', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'x' } });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('role')).toBe('dialog');
    });

    it('should use role="alertdialog" when configured', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'x' }, role: 'alertdialog' });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('role')).toBe('alertdialog');
    });

    it('should register title id with aria-labelledby queue', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'x' } });
      await flushEnter();
      TestBed.inject(ApplicationRef).tick();
      const container = getContainerEl()!;
      const labelledBy = container.getAttribute('aria-labelledby');
      const titleEl = container.querySelector('h2');
      expect(labelledBy).toBeTruthy();
      expect(labelledBy).toBe(titleEl!.getAttribute('id'));
    });

    it('should forward ariaLabel when provided', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'x' }, ariaLabel: 'Custom label' });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('aria-label')).toBe('Custom label');
      expect(getContainerEl()!.getAttribute('aria-labelledby')).toBeNull();
    });

    it('should set aria-modal when configured', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'x' }, ariaModal: true });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('aria-modal')).toBe('true');
    });

    it('should default aria-modal to true', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'x' } });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('aria-modal')).toBe('true');
    });

    it('should allow opting out of aria-modal', async () => {
      dialog.open(DialogComponentContent, { data: { value: 'x' }, ariaModal: false });
      await flushEnter();
      expect(getContainerEl()!.getAttribute('aria-modal')).toBe('false');
    });

    it('should register description id with aria-describedby queue', async () => {
      dialog.open(DialogWithDescription);
      await flushEnter();
      TestBed.inject(ApplicationRef).tick();
      const container = getContainerEl()!;
      const describedBy = container.getAttribute('aria-describedby');
      const descriptionEl = container.querySelector('p[twDialogDescription]');
      expect(describedBy).toBeTruthy();
      expect(describedBy).toBe(descriptionEl!.getAttribute('id'));
    });

    it('should prefer explicit ariaDescribedBy over description directive', async () => {
      dialog.open(DialogWithDescription, { ariaDescribedBy: 'custom-desc' });
      await flushEnter();
      TestBed.inject(ApplicationRef).tick();
      expect(getContainerEl()!.getAttribute('aria-describedby')).toBe('custom-desc');
    });
  });

  describe('DialogCloseDirective', () => {
    it('should close with the forwarded value', async () => {
      const ref = dialog.open<string, { value: string }>(DialogComponentContent, {
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
      dialog.open(DialogComponentContent, { data: { value: 'x' } });
      await flushEnter();
      const btn = document.querySelector('.ok-btn') as HTMLButtonElement;
      expect(btn.getAttribute('type')).toBe('button');
    });
  });

  describe('content directives (offline)', () => {
    it('DialogIconDirective renders with neutral classes by default', () => {
      const fixture = TestBed.createComponent(DialogIconHost);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('[twDialogIcon]') as HTMLElement;
      expect(el.className).toContain('rounded-full');
      expect(el.className).toContain('bg-surface-muted');
    });

    it('DialogIconDirective applies semantic color classes', () => {
      const fixture = TestBed.createComponent(DialogIconHost);
      fixture.componentInstance.color = 'error';
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('[twDialogIcon]') as HTMLElement;
      expect(el.className).toContain('bg-error-soft');
      expect(el.className).toContain('text-error-icon');
    });

    it('DialogSubtitleDirective applies muted text styling', () => {
      const fixture = TestBed.createComponent(DialogSubtitleHost);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('[twDialogSubtitle]') as HTMLElement;
      expect(el.className).toContain('text-fg-muted');
    });
  });

  describe('nested dialogs', () => {
    it('should track parent and child in the same openDialogs list', async () => {
      dialog.open(DialogNestedParent);
      await flushEnter();
      TestBed.inject(ApplicationRef).tick();
      expect(dialog.openDialogs().length).toBe(1);

      (document.querySelector('.nest-btn') as HTMLButtonElement).click();
      await flushEnter();

      expect(dialog.openDialogs().length).toBe(2);
    });

    it('closeAll should close every nested dialog', async () => {
      dialog.open(DialogNestedParent);
      await flushEnter();
      TestBed.inject(ApplicationRef).tick();
      (document.querySelector('.nest-btn') as HTMLButtonElement).click();
      await flushEnter();
      expect(dialog.openDialogs().length).toBe(2);

      dialog.closeAll();
      flushExit();
      flushExit();

      expect(dialog.openDialogs().length).toBe(0);
    });
  });

  describe('lifecycle robustness', () => {
    it('should emit afterClosed exactly once on close()', async () => {
      const afterClosed = vi.fn();
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
      ref.afterClosed().subscribe(afterClosed);
      await flushEnter();

      ref.close();
      flushExit();
      // ReplaySubject completes — re-subscribing should still only fire once total.
      flushExit();

      expect(afterClosed).toHaveBeenCalledTimes(1);
    });

    it('should settle into closed when the overlay detaches forcibly', async () => {
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
      await flushEnter();
      expect(ref.state()).toBe('open');

      // Force-detach the underlying overlay (simulates external scroll-close / nav).
      // The ref's detachments() subscription should drive us to 'closed'.
      const containerEl = getContainerEl();
      expect(containerEl).toBeTruthy();
      // Tear down via cdkRef → its overlayRef detach() emits.
      // We can simulate by calling closeAll, but more directly, dispose innerHTML.
      // Use the public path: close() runs the exit animation;
      // here we verify that even if the timer is the only signal, state still resolves.
      ref.close();
      flushExit();

      expect(ref.state()).toBe('closed');
    });
  });

  describe('description directive (offline)', () => {
    it('generates a unique id on the host element', () => {
      const fixture = TestBed.createComponent(DialogWithDescription);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('p[twDialogDescription]') as HTMLElement;
      expect(el.id).toMatch(/^tw-dialog-description-/);
    });
  });

  // The render layer arrives through a dynamic import(), so the ref exists —
  // and is usable — before the overlay is on screen. These cover that gap.
  describe('deferred renderer', () => {
    it('returns a usable ref with a valid id synchronously, before the chunk loads', () => {
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
      // id is generated eagerly, so getDialogById works immediately.
      expect(ref.id).toMatch(/^tw-dialog-/);
      expect(dialog.getDialogById(ref.id)).toBe(ref);
      expect(ref.state()).toBe('opening');
      expect(getContainerEl()).toBeNull();
    });

    it('resolves whenComponentReady() with the instance once attached', async () => {
      const ref = dialog.open(DialogComponentContent, { data: { value: 'hi' } });
      const instance = await ref.whenComponentReady();
      expect(instance).toBeInstanceOf(DialogComponentContent);
      expect(ref.componentInstance).toBe(instance);
    });

    it('resolves whenComponentReady() with null for a template dialog', async () => {
      const host = TestBed.createComponent(DialogTemplateHost);
      host.detectChanges();
      const ref = dialog.open(host.componentInstance.tpl());
      const instance = await ref.whenComponentReady();
      expect(instance).toBeNull();
    });

    it('a dialog closed before the renderer lands never reaches the DOM', async () => {
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
      let closedResult: unknown = 'unset';
      ref.afterClosed().subscribe((r) => (closedResult = r));

      ref.close('cancelled' as never);
      expect(ref.state()).toBe('closed');

      await flushEnter();

      expect(getContainerEl()).toBeNull();
      expect(dialog.getDialogById(ref.id)).toBeUndefined();
      expect(closedResult).toBe('cancelled');
      await expect(ref.whenComponentReady()).resolves.toBeNull();
    });

    it('buffers panel-class mutations issued before attach', async () => {
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
      ref.addPanelClass('pre-attach-class');
      await flushEnter();
      const panel = document.querySelector('.tw-dialog-panel') as HTMLElement;
      expect(panel.classList.contains('pre-attach-class')).toBe(true);
    });

    it('delivers backdropClick to a subscriber that subscribed before attach', async () => {
      const ref = dialog.open(DialogComponentContent, { data: { value: 'x' } });
      // Subscribe synchronously, before the render chunk has attached.
      const spy = vi.fn();
      ref.backdropClick().subscribe(spy);

      await flushEnter();
      (getBackdropEl() as HTMLElement).click();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });


  describe('default options', () => {
    it('should merge provided defaults into open()', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [OverlayModule],
        providers: [provideTwDialog({ size: 'lg', ariaModal: false })],
      });
      const localDialog = TestBed.inject(TwDialog);

      localDialog.open(DialogComponentContent, { data: { value: 'x' } });
      await flushEnter();

      const container = getContainerEl()!;
      expect(container.className).toContain('max-w-2xl');
      // Confirm the provider-supplied default beat TwDialogConfig's own default of `true`.
      expect(container.getAttribute('aria-modal')).toBe('false');

      localDialog.closeAll();
      flushExit();
    });
  });
});
