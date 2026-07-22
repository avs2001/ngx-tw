import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadgeComponent } from './badge';
import { AvatarComponent } from '@cdevhub/ngx-tw/avatar';
import { IconComponent } from '@cdevhub/ngx-tw/icon';
import { provideTwIcons } from '@cdevhub/ngx-tw/icon';
import type { TwIconData } from '@cdevhub/ngx-tw/icon';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import type { BadgeVariant } from './badge';

// ── Test icon data ───────────────────────────────────────────────

const CHECK_ICON: TwIconData = [['polyline', { points: '20 6 9 17 4 12' }]];
const TEST_ICONS = { Check: CHECK_ICON };

// ── Test host components ──────────────────────────────────────────

@Component({
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadge>Default</span>`,
})
class BasicBadgeHost {}

@Component({
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadge [variant]="variant()" [color]="color()" [size]="size()">Styled</span>`,
})
class StyledBadgeHost {
  readonly variant = input<BadgeVariant>('soft');
  readonly color = input<TwColor>('neutral');
  readonly size = input<TwSize>('md');
}

@Component({
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadge [pill]="isPill()">Pill</span>`,
})
class PillBadgeHost {
  readonly isPill = input(false);
}

@Component({
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadge [dismissible]="isDismissible()" [dismissLabel]="dismissLabel()" (dismissed)="onDismiss()">Dismiss me</span>`,
})
class DismissibleBadgeHost {
  readonly isDismissible = input(false);
  readonly dismissLabel = input('Dismiss');
  onDismiss = vi.fn();
}

@Component({
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadge [size]="size()" [dismissible]="true" (dismissed)="onDismiss()">Sized</span>`,
})
class SizedDismissibleBadgeHost {
  readonly size = input<TwSize>('md');
  onDismiss = vi.fn();
}

@Component({
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadge [live]="live()">Live</span>`,
})
class LiveBadgeHost {
  readonly live = input(false);
}

@Component({
  imports: [BadgeComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadge [size]="size()" [color]="color()"><tw-icon name="check" />With Icon</span>`,
})
class IconBadgeHost {
  readonly size = input<TwSize>('md');
  readonly color = input<TwColor>('success');
}

@Component({
  imports: [BadgeComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadge [size]="size()" [color]="color()"><tw-avatar src="/test.jpg" alt="Test" />With Avatar</span>`,
})
class AvatarBadgeHost {
  readonly size = input<TwSize>('md');
  readonly color = input<TwColor>('primary');
}

@Component({
  imports: [BadgeComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadge [pill]="true" [dismissible]="true" (dismissed)="onDismiss()" color="info"><tw-avatar initials="JD" color="info" />John Doe</span>`,
})
class AvatarPillDismissHost {
  onDismiss = vi.fn();
}

@Component({
  imports: [BadgeComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadge [dismissible]="true" (dismissed)="onDismiss()" color="error"><tw-icon name="check" />Critical</span>`,
})
class IconDismissHost {
  onDismiss = vi.fn();
}

// ── Helpers ───────────────────────────────────────────────────────

function getBadge(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('[twBadge]')!;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('BadgeComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default classes', () => {
      const fixture = TestBed.createComponent(BasicBadgeHost);
      fixture.detectChanges();
      const el = getBadge(fixture);
      expect(el).toBeTruthy();
      expect(el.className).toContain('inline-flex');
      expect(el.className).toContain('rounded-md');
      expect(el.className).toContain('font-medium');
    });

    it('should render projected content', () => {
      const fixture = TestBed.createComponent(BasicBadgeHost);
      fixture.detectChanges();
      expect(getBadge(fixture).textContent?.trim()).toBe('Default');
    });

    it('should not render a dismiss button by default', () => {
      const fixture = TestBed.createComponent(BasicBadgeHost);
      fixture.detectChanges();
      expect(getBadge(fixture).querySelector('button')).toBeNull();
    });
  });

  describe('variants', () => {
    const variants: BadgeVariant[] = ['solid', 'outline', 'soft'];

    for (const variant of variants) {
      it(`should render variant="${variant}" without errors`, () => {
        const fixture = TestBed.createComponent(StyledBadgeHost);
        fixture.componentRef.setInput('variant', variant);
        fixture.detectChanges();
        expect(getBadge(fixture)).toBeTruthy();
      });
    }

    it('should apply border class for outline variant', () => {
      const fixture = TestBed.createComponent(StyledBadgeHost);
      fixture.componentRef.setInput('variant', 'outline');
      fixture.detectChanges();
      expect(getBadge(fixture).className).toContain('border');
    });
  });

  describe('colors', () => {
    const colors: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];

    for (const color of colors) {
      it(`should render color="${color}" without errors`, () => {
        const fixture = TestBed.createComponent(StyledBadgeHost);
        fixture.componentRef.setInput('color', color);
        fixture.detectChanges();
        expect(getBadge(fixture)).toBeTruthy();
      });
    }
  });

  describe('sizes', () => {
    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

    for (const size of sizes) {
      it(`should render size="${size}" without errors`, () => {
        const fixture = TestBed.createComponent(StyledBadgeHost);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(getBadge(fixture)).toBeTruthy();
      });
    }
  });

  describe('pill', () => {
    it('should apply rounded-md by default', () => {
      const fixture = TestBed.createComponent(PillBadgeHost);
      fixture.detectChanges();
      expect(getBadge(fixture).className).toContain('rounded-md');
    });

    it('should apply rounded-full when pill is true', () => {
      const fixture = TestBed.createComponent(PillBadgeHost);
      fixture.componentRef.setInput('isPill', true);
      fixture.detectChanges();
      const classes = getBadge(fixture).className;
      expect(classes).toContain('rounded-full');
      expect(classes).not.toContain('rounded-md');
    });
  });

  describe('dismissible', () => {
    it('should render a dismiss button when dismissible is true', () => {
      const fixture = TestBed.createComponent(DismissibleBadgeHost);
      fixture.componentRef.setInput('isDismissible', true);
      fixture.detectChanges();
      const button = getBadge(fixture).querySelector('button');
      expect(button).toBeTruthy();
      expect(button!.getAttribute('aria-label')).toBe('Dismiss');
    });

    it('should emit dismissed when dismiss button is clicked', () => {
      const fixture = TestBed.createComponent(DismissibleBadgeHost);
      fixture.componentRef.setInput('isDismissible', true);
      fixture.detectChanges();
      const button = getBadge(fixture).querySelector('button')!;
      button.click();
      expect(fixture.componentInstance.onDismiss).toHaveBeenCalledOnce();
    });

    it('should emit dismissed on Enter key', () => {
      const fixture = TestBed.createComponent(DismissibleBadgeHost);
      fixture.componentRef.setInput('isDismissible', true);
      fixture.detectChanges();
      const button = getBadge(fixture).querySelector('button')!;
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      // Native button handles Enter → click
      button.click();
      expect(fixture.componentInstance.onDismiss).toHaveBeenCalled();
    });

    it('should not render dismiss button when dismissible is false', () => {
      const fixture = TestBed.createComponent(DismissibleBadgeHost);
      fixture.detectChanges();
      expect(getBadge(fixture).querySelector('button')).toBeNull();
    });

    it('should render a focus-visible outline on the dismiss button', () => {
      const fixture = TestBed.createComponent(DismissibleBadgeHost);
      fixture.componentRef.setInput('isDismissible', true);
      fixture.detectChanges();
      const button = getBadge(fixture).querySelector('button')!;
      const classes = button.className;
      expect(classes).toContain('focus-visible:outline-2');
      expect(classes).toContain('focus-visible:outline-offset-2');
      expect(classes).toContain('focus-visible:outline-primary-500');
    });

    const hitTargetMatrix: readonly { size: TwSize; expected: string }[] = [
      { size: 'xs', expected: 'size-6' },
      { size: 'sm', expected: 'size-6' },
      { size: 'md', expected: 'size-7' },
      { size: 'lg', expected: 'size-8' },
      { size: 'xl', expected: 'size-8' },
    ];

    for (const { size, expected } of hitTargetMatrix) {
      it(`should use square-interactive hit target ${expected} for size="${size}"`, () => {
        const fixture = TestBed.createComponent(SizedDismissibleBadgeHost);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        const button = getBadge(fixture).querySelector('button')!;
        expect(button.className).toContain(expected);
      });
    }
  });

  describe('accessibility', () => {
    it('should not set role on the host by default', () => {
      const fixture = TestBed.createComponent(BasicBadgeHost);
      fixture.detectChanges();
      // Without `live`, badges are decorative labels — no implicit live region.
      expect(getBadge(fixture).getAttribute('role')).toBeNull();
    });

    it('should set role="status" when live is true', () => {
      const fixture = TestBed.createComponent(LiveBadgeHost);
      fixture.componentRef.setInput('live', true);
      fixture.detectChanges();
      expect(getBadge(fixture).getAttribute('role')).toBe('status');
    });

    it('should remove role when live flips back to false', () => {
      const fixture = TestBed.createComponent(LiveBadgeHost);
      fixture.componentRef.setInput('live', true);
      fixture.detectChanges();
      expect(getBadge(fixture).getAttribute('role')).toBe('status');
      fixture.componentRef.setInput('live', false);
      fixture.detectChanges();
      expect(getBadge(fixture).getAttribute('role')).toBeNull();
    });

    it('should have aria-label="Dismiss" on the dismiss button', () => {
      const fixture = TestBed.createComponent(DismissibleBadgeHost);
      fixture.componentRef.setInput('isDismissible', true);
      fixture.detectChanges();
      const button = getBadge(fixture).querySelector('button')!;
      expect(button.getAttribute('aria-label')).toBe('Dismiss');
    });

    it('dismiss button should contain an SVG icon', () => {
      const fixture = TestBed.createComponent(DismissibleBadgeHost);
      fixture.componentRef.setInput('isDismissible', true);
      fixture.detectChanges();
      const svg = getBadge(fixture).querySelector('button svg');
      expect(svg).toBeTruthy();
    });

    it('should override the dismiss button aria-label when dismissLabel changes', () => {
      const fixture = TestBed.createComponent(DismissibleBadgeHost);
      fixture.componentRef.setInput('isDismissible', true);
      fixture.componentRef.setInput('dismissLabel', 'Fermer');
      fixture.detectChanges();
      const button = getBadge(fixture).querySelector('button')!;
      expect(button.getAttribute('aria-label')).toBe('Fermer');
    });
  });

  describe('leading icon', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideTwIcons(TEST_ICONS)],
      });
    });

    it('should render a leading icon inside the badge', () => {
      const fixture = TestBed.createComponent(IconBadgeHost);
      fixture.detectChanges();
      const badge = getBadge(fixture);
      const iconWrapper = badge.querySelector('span:has(> tw-icon)');
      expect(iconWrapper).toBeTruthy();
      expect(badge.querySelector('tw-icon')).toBeTruthy();
    });

    it('should render text content alongside the icon', () => {
      const fixture = TestBed.createComponent(IconBadgeHost);
      fixture.detectChanges();
      expect(getBadge(fixture).textContent).toContain('With Icon');
    });

    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    for (const size of sizes) {
      it(`should render size="${size}" with leading icon without errors`, () => {
        const fixture = TestBed.createComponent(IconBadgeHost);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(getBadge(fixture).querySelector('tw-icon')).toBeTruthy();
      });
    }

    it('should render icon with dismiss button together', () => {
      const fixture = TestBed.createComponent(IconDismissHost);
      fixture.detectChanges();
      const badge = getBadge(fixture);
      expect(badge.querySelector('tw-icon')).toBeTruthy();
      expect(badge.querySelector('button')).toBeTruthy();
      expect(badge.textContent).toContain('Critical');
    });
  });

  describe('leading avatar', () => {
    it('should render a leading avatar inside the badge', () => {
      const fixture = TestBed.createComponent(AvatarBadgeHost);
      fixture.detectChanges();
      const badge = getBadge(fixture);
      const avatarWrapper = badge.querySelector('span:has(> tw-avatar)');
      expect(avatarWrapper).toBeTruthy();
      expect(badge.querySelector('tw-avatar')).toBeTruthy();
    });

    it('should render text content alongside the avatar', () => {
      const fixture = TestBed.createComponent(AvatarBadgeHost);
      fixture.detectChanges();
      expect(getBadge(fixture).textContent).toContain('With Avatar');
    });

    it('should apply rounded-full and overflow-hidden to avatar wrapper', () => {
      const fixture = TestBed.createComponent(AvatarBadgeHost);
      fixture.detectChanges();
      const avatarWrapper = getBadge(fixture).querySelector('span:has(> tw-avatar)')!;
      expect(avatarWrapper.className).toContain('rounded-full');
      expect(avatarWrapper.className).toContain('overflow-hidden');
    });

    it('should reduce left padding when avatar is present', () => {
      const fixture = TestBed.createComponent(AvatarBadgeHost);
      fixture.detectChanges();
      const rootClasses = getBadge(fixture).className;
      expect(rootClasses).toContain('pl-1');
    });

    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    for (const size of sizes) {
      it(`should render size="${size}" with leading avatar without errors`, () => {
        const fixture = TestBed.createComponent(AvatarBadgeHost);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(getBadge(fixture).querySelector('tw-avatar')).toBeTruthy();
      });
    }

    it('should render avatar with pill and dismiss together', () => {
      const fixture = TestBed.createComponent(AvatarPillDismissHost);
      fixture.detectChanges();
      const badge = getBadge(fixture);
      expect(badge.querySelector('tw-avatar')).toBeTruthy();
      expect(badge.querySelector('button')).toBeTruthy();
      expect(badge.className).toContain('rounded-full');
      expect(badge.textContent).toContain('John Doe');
    });
  });
});
