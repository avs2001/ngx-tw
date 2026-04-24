import { Component, input } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvatarComponent, AvatarGroupComponent } from './avatar';
import type { TwColor, TwSize } from 'ngx-tw/core';
import type { AvatarRounded, AvatarStatus } from './avatar';

// ── Test host components ──────────────────────────────────────────

@Component({
  imports: [AvatarComponent],
  template: `<tw-avatar [alt]="alt()" />`,
})
class BasicAvatarHost {
  readonly alt = input('');
}

@Component({
  imports: [AvatarComponent],
  template: `<tw-avatar [src]="src()" [alt]="alt()" />`,
})
class ImageAvatarHost {
  readonly src = input<string | null>(null);
  readonly alt = input('Test user');
}

@Component({
  imports: [AvatarComponent],
  template: `<tw-avatar [initials]="initials()" [color]="color()" [alt]="alt()" />`,
})
class InitialsAvatarHost {
  readonly initials = input<string | null>(null);
  readonly color = input<TwColor>('neutral');
  readonly alt = input('Test user');
}

@Component({
  imports: [AvatarComponent],
  template: `<tw-avatar [size]="size()" [rounded]="rounded()" alt="Test" />`,
})
class SizedAvatarHost {
  readonly size = input<TwSize>('md');
  readonly rounded = input<AvatarRounded>('full');
}

@Component({
  imports: [AvatarComponent],
  template: `<tw-avatar [status]="status()" alt="Test" />`,
})
class StatusAvatarHost {
  readonly status = input<AvatarStatus | null>(null);
}

@Component({
  imports: [AvatarComponent],
  template: `
    <tw-avatar alt="Custom icon" color="accent">
      <svg data-testid="custom-icon" viewBox="0 0 24 24"></svg>
    </tw-avatar>
  `,
})
class ProjectedContentHost {}

@Component({
  imports: [AvatarComponent, AvatarGroupComponent],
  template: `
    <tw-avatar-group [size]="size()" [max]="max()">
      <tw-avatar src="/a.jpg" alt="A" />
      <tw-avatar src="/b.jpg" alt="B" />
      <tw-avatar initials="CD" alt="C" />
      <tw-avatar initials="DE" alt="D" />
    </tw-avatar-group>
  `,
})
class AvatarGroupHost {
  readonly size = input<TwSize>('md');
  readonly max = input<number | null>(null);
}

// ── Helpers ───────────────────────────────────────────────────────

function getAvatar(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-avatar')!;
}

function getGroup(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-avatar-group')!;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('AvatarComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default fallback SVG when no inputs are set', () => {
      const fixture = TestBed.createComponent(BasicAvatarHost);
      fixture.detectChanges();
      const el = getAvatar(fixture);
      expect(el).toBeTruthy();
      expect(el.querySelector('svg')).toBeTruthy();
    });

    it('should render an img element when src is provided', () => {
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/photo.jpg');
      fixture.detectChanges();
      const img = getAvatar(fixture).querySelector('img');
      expect(img).toBeTruthy();
      expect(img!.getAttribute('src')).toBe('/photo.jpg');
      expect(img!.getAttribute('alt')).toBe('Test user');
    });

    it('should render initials when no src is provided', () => {
      const fixture = TestBed.createComponent(InitialsAvatarHost);
      fixture.componentRef.setInput('initials', 'JD');
      fixture.detectChanges();
      const span = getAvatar(fixture).querySelector('span');
      expect(span).toBeTruthy();
      expect(span!.textContent?.trim()).toBe('JD');
    });

    it('should fall back to initials when image fails to load', () => {
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/bad.jpg');
      fixture.detectChanges();

      // Trigger error on the img
      const img = getAvatar(fixture).querySelector('img')!;
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      // Now it should show fallback SVG (no initials on this host)
      expect(getAvatar(fixture).querySelector('svg')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

    for (const size of sizes) {
      it(`should render size="${size}" without errors`, () => {
        const fixture = TestBed.createComponent(SizedAvatarHost);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(getAvatar(fixture)).toBeTruthy();
      });
    }

    const sizeClassMap: Record<TwSize, string> = {
      xs: 'size-6',
      sm: 'size-8',
      md: 'size-10',
      lg: 'size-12',
      xl: 'size-16',
    };

    for (const [size, expectedClass] of Object.entries(sizeClassMap)) {
      it(`should apply ${expectedClass} for size="${size}"`, () => {
        const fixture = TestBed.createComponent(SizedAvatarHost);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(getAvatar(fixture).className).toContain(expectedClass);
      });
    }
  });

  describe('colors', () => {
    const colors: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];

    for (const color of colors) {
      it(`should render color="${color}" without errors`, () => {
        const fixture = TestBed.createComponent(InitialsAvatarHost);
        fixture.componentRef.setInput('initials', 'AB');
        fixture.componentRef.setInput('color', color);
        fixture.detectChanges();
        expect(getAvatar(fixture)).toBeTruthy();
      });
    }
  });

  describe('rounded', () => {
    it('should apply rounded-full by default', () => {
      const fixture = TestBed.createComponent(SizedAvatarHost);
      fixture.detectChanges();
      expect(getAvatar(fixture).className).toContain('rounded-full');
    });

    it('should apply rounded-lg when rounded="lg"', () => {
      const fixture = TestBed.createComponent(SizedAvatarHost);
      fixture.componentRef.setInput('rounded', 'lg');
      fixture.detectChanges();
      expect(getAvatar(fixture).className).toContain('rounded-lg');
    });

    it('should apply rounded-none when rounded="none"', () => {
      const fixture = TestBed.createComponent(SizedAvatarHost);
      fixture.componentRef.setInput('rounded', 'none');
      fixture.detectChanges();
      expect(getAvatar(fixture).className).toContain('rounded-none');
    });
  });

  describe('status indicator', () => {
    it('should not render status dot when status is null', () => {
      const fixture = TestBed.createComponent(StatusAvatarHost);
      fixture.detectChanges();
      const dots = getAvatar(fixture).querySelectorAll('span[aria-hidden="true"]');
      expect(dots.length).toBe(0);
    });

    it('should render status dot when status is set', () => {
      const fixture = TestBed.createComponent(StatusAvatarHost);
      fixture.componentRef.setInput('status', 'online');
      fixture.detectChanges();
      const dot = getAvatar(fixture).querySelector('span[aria-hidden="true"]');
      expect(dot).toBeTruthy();
    });

    const statusValues: AvatarStatus[] = ['online', 'busy', 'away', 'offline'];

    for (const status of statusValues) {
      it(`should render status="${status}" without errors`, () => {
        const fixture = TestBed.createComponent(StatusAvatarHost);
        fixture.componentRef.setInput('status', status);
        fixture.detectChanges();
        const dot = getAvatar(fixture).querySelector('span[aria-hidden="true"]');
        expect(dot).toBeTruthy();
      });
    }
  });

  describe('content projection', () => {
    it('should render projected content as fallback', () => {
      const fixture = TestBed.createComponent(ProjectedContentHost);
      fixture.detectChanges();
      const icon = getAvatar(fixture).querySelector('[data-testid="custom-icon"]');
      expect(icon).toBeTruthy();
    });

    it('should not render default SVG when content is projected', () => {
      const fixture = TestBed.createComponent(ProjectedContentHost);
      fixture.detectChanges();
      const svgs = getAvatar(fixture).querySelectorAll('svg');
      // Only the projected SVG should be present, not the fallback
      expect(svgs.length).toBe(1);
      expect(svgs[0].hasAttribute('data-testid')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should apply role="img" on non-image avatars with alt text', () => {
      const fixture = TestBed.createComponent(InitialsAvatarHost);
      fixture.componentRef.setInput('initials', 'JD');
      fixture.componentRef.setInput('alt', 'Jane Doe');
      fixture.detectChanges();
      expect(getAvatar(fixture).getAttribute('role')).toBe('img');
      expect(getAvatar(fixture).getAttribute('aria-label')).toBe('Jane Doe');
    });

    it('should apply aria-hidden when alt is empty', () => {
      const fixture = TestBed.createComponent(BasicAvatarHost);
      fixture.detectChanges();
      expect(getAvatar(fixture).getAttribute('aria-hidden')).toBe('true');
    });

    it('should not apply role="img" on image avatars', () => {
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/photo.jpg');
      fixture.detectChanges();
      expect(getAvatar(fixture).getAttribute('role')).toBeNull();
    });

    it('should not apply aria-hidden when alt text is provided', () => {
      const fixture = TestBed.createComponent(InitialsAvatarHost);
      fixture.componentRef.setInput('initials', 'JD');
      fixture.componentRef.setInput('alt', 'Jane Doe');
      fixture.detectChanges();
      expect(getAvatar(fixture).getAttribute('aria-hidden')).toBeNull();
    });

    it('should mark status dot as aria-hidden', () => {
      const fixture = TestBed.createComponent(StatusAvatarHost);
      fixture.componentRef.setInput('status', 'online');
      fixture.detectChanges();
      const dot = getAvatar(fixture).querySelector('span');
      expect(dot!.getAttribute('aria-hidden')).toBe('true');
    });
  });
});

describe('AvatarGroupComponent', () => {
  describe('rendering', () => {
    it('should render all child avatars', () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.detectChanges();
      const avatars = getGroup(fixture).querySelectorAll('tw-avatar');
      expect(avatars.length).toBe(4);
    });

    it('should have role="group"', () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.detectChanges();
      expect(getGroup(fixture).getAttribute('role')).toBe('group');
    });

    it('should have aria-label', () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.detectChanges();
      expect(getGroup(fixture).getAttribute('aria-label')).toBe('Avatar group');
    });
  });

  describe('max overflow', () => {
    it('should hide excess avatars when max is set', async () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.componentRef.setInput('max', 2);
      fixture.detectChanges();
      await fixture.whenStable();

      const avatars = getGroup(fixture).querySelectorAll('tw-avatar');
      const visible = Array.from(avatars).filter(
        (el) => (el as HTMLElement).style.display !== 'none',
      );
      expect(visible.length).toBe(2);
    });

    it('should show "+N" overflow indicator', async () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.componentRef.setInput('max', 2);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // The overflow indicator is a direct child span of the group, not inside a tw-avatar
      const overflow = getGroup(fixture).querySelector(':scope > span');
      expect(overflow).toBeTruthy();
      expect(overflow!.textContent?.trim()).toBe('+2');
    });

    it('should not show overflow indicator when max is null', () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.detectChanges();
      // No overflow span should be rendered
      const spans = getGroup(fixture).querySelectorAll(':scope > span');
      expect(spans.length).toBe(0);
    });

    it('should not show overflow indicator when max >= avatar count', async () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.componentRef.setInput('max', 10);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const spans = getGroup(fixture).querySelectorAll(':scope > span');
      expect(spans.length).toBe(0);
    });
  });

  describe('size propagation', () => {
    it('should propagate size to child avatars', () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();

      const avatars = getGroup(fixture).querySelectorAll('tw-avatar');
      // All child avatars should have the sm size class
      avatars.forEach((avatar) => {
        expect(avatar.className).toContain('size-8');
      });
    });
  });
});
