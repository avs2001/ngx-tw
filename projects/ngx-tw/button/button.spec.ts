import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FocusMonitor } from '@angular/cdk/a11y';
import { ButtonDirective, ButtonIconDirective } from './button';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import type { ButtonVariant } from './button';

// ── Test host components ──────────────────────────────────────────

@Component({
  imports: [ButtonDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<button twButton>Click me</button>`,
})
class BasicButtonHost {}

@Component({
  imports: [ButtonDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<a twButton href="#">Link</a>`,
})
class AnchorButtonHost {}

@Component({
  imports: [ButtonDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<button twButton [variant]="variant()" [color]="color()" [size]="size()">Styled</button>`,
})
class StyledButtonHost {
  readonly variant = input<ButtonVariant>('solid');
  readonly color = input<TwColor>('primary');
  readonly size = input<TwSize>('md');
}

@Component({
  imports: [ButtonDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<button twButton [disabled]="isDisabled()">Disabled</button>`,
})
class DisabledButtonHost {
  readonly isDisabled = input(false);
}

@Component({
  imports: [ButtonDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<a twButton [disabled]="isDisabled()" href="#">Disabled Link</a>`,
})
class DisabledAnchorHost {
  readonly isDisabled = input(false);
}

@Component({
  imports: [ButtonDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<button twButton [loading]="isLoading()">Loading</button>`,
})
class LoadingButtonHost {
  readonly isLoading = input(false);
}

@Component({
  imports: [ButtonDirective, ButtonIconDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <button twButton [size]="size()">
      <svg twButtonIcon data-testid="icon">icon</svg>
      Label
    </button>
  `,
})
class IconButtonHost {
  readonly size = input<TwSize>('md');
}

@Component({
  imports: [ButtonDirective, ButtonIconDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <button twButton>
      Label
      <svg twButtonIcon="trailing" data-testid="trailing-icon">icon</svg>
    </button>
  `,
})
class TrailingIconHost {}

// ── Helpers ───────────────────────────────────────────────────────

function getButton(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('[twButton]')!;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('ButtonDirective', () => {
  const focusMonitorSpy = {
    monitor: vi.fn(),
    stopMonitoring: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  describe('rendering', () => {
    it('should render a button with default classes', () => {
      const fixture = TestBed.createComponent(BasicButtonHost);
      fixture.detectChanges();
      const el = getButton(fixture);
      expect(el).toBeTruthy();
      expect(el.className).toContain('inline-flex');
      expect(el.className).toContain('rounded-md');
      expect(el.className).toContain('font-medium');
    });

    it('should render an anchor with the directive', () => {
      const fixture = TestBed.createComponent(AnchorButtonHost);
      fixture.detectChanges();
      const el = getButton(fixture);
      expect(el.tagName).toBe('A');
      expect(el.className).toContain('inline-flex');
    });

    it('should render canonical focus-visible outline classes', () => {
      const fixture = TestBed.createComponent(BasicButtonHost);
      fixture.detectChanges();
      const cls = getButton(fixture).className;
      expect(cls).toContain('focus-visible:outline-2');
      expect(cls).toContain('focus-visible:outline-offset-2');
      expect(cls).toContain('focus-visible:outline-primary-500');
    });
  });

  describe('variants', () => {
    const variants: ButtonVariant[] = ['solid', 'outline', 'ghost', 'soft', 'link'];

    for (const variant of variants) {
      it(`should render variant="${variant}" without errors`, () => {
        const fixture = TestBed.createComponent(StyledButtonHost);
        fixture.componentRef.setInput('variant', variant);
        fixture.detectChanges();
        expect(getButton(fixture)).toBeTruthy();
      });
    }

    it('should apply border class for outline variant', () => {
      const fixture = TestBed.createComponent(StyledButtonHost);
      fixture.componentRef.setInput('variant', 'outline');
      fixture.detectChanges();
      expect(getButton(fixture).className).toContain('border');
    });

    it('should strip padding for link variant', () => {
      const fixture = TestBed.createComponent(StyledButtonHost);
      fixture.componentRef.setInput('variant', 'link');
      fixture.detectChanges();
      const classes = getButton(fixture).className;
      expect(classes).not.toMatch(/px-[2-6]/);
    });
  });

  describe('colors', () => {
    const colors: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];

    for (const color of colors) {
      it(`should render color="${color}" without errors`, () => {
        const fixture = TestBed.createComponent(StyledButtonHost);
        fixture.componentRef.setInput('color', color);
        fixture.detectChanges();
        expect(getButton(fixture)).toBeTruthy();
      });
    }
  });

  describe('sizes', () => {
    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

    for (const size of sizes) {
      it(`should render size="${size}" without errors`, () => {
        const fixture = TestBed.createComponent(StyledButtonHost);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(getButton(fixture)).toBeTruthy();
      });
    }
  });

  describe('disabled state', () => {
    it('should set aria-disabled on button', () => {
      const fixture = TestBed.createComponent(DisabledButtonHost);
      fixture.componentRef.setInput('isDisabled', true);
      fixture.detectChanges();
      const el = getButton(fixture);
      expect(el.getAttribute('aria-disabled')).toBe('true');
    });

    it('should set native disabled on button element', () => {
      const fixture = TestBed.createComponent(DisabledButtonHost);
      fixture.componentRef.setInput('isDisabled', true);
      fixture.detectChanges();
      const el = getButton(fixture) as HTMLButtonElement;
      expect(el.disabled).toBe(true);
    });

    it('should set aria-disabled on anchor without native disabled', () => {
      const fixture = TestBed.createComponent(DisabledAnchorHost);
      fixture.componentRef.setInput('isDisabled', true);
      fixture.detectChanges();
      const el = getButton(fixture);
      expect(el.getAttribute('aria-disabled')).toBe('true');
      expect(el.hasAttribute('disabled')).toBe(false);
    });

    it('should set tabindex=-1 on disabled anchor', () => {
      const fixture = TestBed.createComponent(DisabledAnchorHost);
      fixture.componentRef.setInput('isDisabled', true);
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('tabindex')).toBe('-1');
    });

    it('should apply opacity-50 when disabled', () => {
      const fixture = TestBed.createComponent(DisabledButtonHost);
      fixture.componentRef.setInput('isDisabled', true);
      fixture.detectChanges();
      expect(getButton(fixture).className).toContain('opacity-50');
    });

    it('should block click events when disabled on anchor', () => {
      const fixture = TestBed.createComponent(DisabledAnchorHost);
      fixture.componentRef.setInput('isDisabled', true);
      fixture.detectChanges();
      const el = getButton(fixture);
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopImmediatePropagation');
      el.dispatchEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopImmediatePropagation).toHaveBeenCalled();
    });

    it('should not set tabindex on a disabled native button', () => {
      const fixture = TestBed.createComponent(DisabledButtonHost);
      fixture.componentRef.setInput('isDisabled', true);
      fixture.detectChanges();
      expect(getButton(fixture).hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('loading state', () => {
    it('should set aria-busy when loading', () => {
      const fixture = TestBed.createComponent(LoadingButtonHost);
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('aria-busy')).toBe('true');
    });

    it('should set aria-disabled when loading', () => {
      const fixture = TestBed.createComponent(LoadingButtonHost);
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('aria-disabled')).toBe('true');
    });

    it('should apply pointer-events-none when loading', () => {
      const fixture = TestBed.createComponent(LoadingButtonHost);
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();
      expect(getButton(fixture).className).toContain('pointer-events-none');
    });

    it('should block click events when loading', () => {
      const fixture = TestBed.createComponent(LoadingButtonHost);
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();
      const el = getButton(fixture);
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopImmediatePropagation');
      el.dispatchEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopImmediatePropagation).toHaveBeenCalled();
    });
  });

  describe('FocusMonitor', () => {
    it('should monitor the element on init', () => {
      const fixture = TestBed.createComponent(BasicButtonHost);
      fixture.detectChanges();
      expect(focusMonitorSpy.monitor).toHaveBeenCalled();
    });

    it('should stop monitoring on destroy', () => {
      const fixture = TestBed.createComponent(BasicButtonHost);
      fixture.detectChanges();
      fixture.destroy();
      expect(focusMonitorSpy.stopMonitoring).toHaveBeenCalled();
    });
  });
});

describe('ButtonIconDirective', () => {
  const focusMonitorSpy = {
    monitor: vi.fn(),
    stopMonitoring: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  it('should apply size-5 for md button', () => {
    const fixture = TestBed.createComponent(IconButtonHost);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('[data-testid="icon"]');
    expect(icon.getAttribute('class')).toContain('size-5');
    expect(icon.getAttribute('class')).toContain('shrink-0');
  });

  it('should apply size-4 for sm button', () => {
    const fixture = TestBed.createComponent(IconButtonHost);
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('[data-testid="icon"]');
    expect(icon.getAttribute('class')).toContain('size-4');
  });

  it('should apply size-4 for xs button', () => {
    const fixture = TestBed.createComponent(IconButtonHost);
    fixture.componentRef.setInput('size', 'xs');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('[data-testid="icon"]');
    expect(icon.getAttribute('class')).toContain('size-4');
  });

  it('should apply size-5 for lg button', () => {
    const fixture = TestBed.createComponent(IconButtonHost);
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('[data-testid="icon"]');
    expect(icon.getAttribute('class')).toContain('size-5');
  });

  it('should apply size-5 for xl button', () => {
    const fixture = TestBed.createComponent(IconButtonHost);
    fixture.componentRef.setInput('size', 'xl');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('[data-testid="icon"]');
    expect(icon.getAttribute('class')).toContain('size-5');
  });

  it('should apply order-last for trailing icon', () => {
    const fixture = TestBed.createComponent(TrailingIconHost);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('[data-testid="trailing-icon"]');
    expect(icon.getAttribute('class')).toContain('order-last');
  });
});
