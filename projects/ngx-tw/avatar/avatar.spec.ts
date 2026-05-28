import { Component, input } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvatarComponent, AvatarGroupComponent } from './avatar';
import type { TwColor, TwSize } from 'ngx-tw/core';
import type { AvatarAppearance, AvatarStatus } from './avatar';

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
  template: `<tw-avatar [src]="src()" [initials]="initials()" [alt]="alt()" (imageError)="onImageError($event)" />`,
})
class ImageAvatarHost {
  readonly src = input<string | null>(null);
  readonly initials = input<string | null>(null);
  readonly alt = input('Test user');
  imageErrorEvent: Event | null = null;
  onImageError(event: Event) {
    this.imageErrorEvent = event;
  }
}

@Component({
  imports: [AvatarComponent],
  template: `<tw-avatar [initials]="initials()" [color]="color()" [size]="size()" [alt]="alt()" />`,
})
class InitialsAvatarHost {
  readonly initials = input<string | null>(null);
  readonly color = input<TwColor>('neutral');
  readonly size = input<TwSize>('md');
  readonly alt = input('Test user');
}

@Component({
  imports: [AvatarComponent],
  template: `<tw-avatar [size]="size()" [appearance]="appearance()" alt="Test" />`,
})
class SizedAvatarHost {
  readonly size = input<TwSize>('md');
  readonly appearance = input<AvatarAppearance>({});
}

@Component({
  imports: [AvatarComponent],
  template: `<tw-avatar [appearance]="appearance()" alt="Test" />`,
})
class StatusAvatarHost {
  readonly appearance = input<AvatarAppearance>({});
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

    it('should render image (not initials) when both src and initials are set', () => {
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/photo.jpg');
      fixture.componentRef.setInput('initials', 'JD');
      fixture.detectChanges();
      const root = getAvatar(fixture);
      expect(root.querySelector('img')).toBeTruthy();
      // No initials span while the image is the active mode
      expect(root.querySelector('span')).toBeNull();
    });

    it('should render initials in uppercase even when input is lowercase', () => {
      const fixture = TestBed.createComponent(InitialsAvatarHost);
      fixture.componentRef.setInput('initials', 'jd');
      fixture.detectChanges();
      const span = getAvatar(fixture).querySelector('span')!;
      // Text content stays as-is, the `uppercase` utility transforms render
      expect(span.textContent?.trim()).toBe('jd');
      expect(span.className).toContain('uppercase');
    });

    it('should fall back to initials when image fails to load', () => {
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/bad.jpg');
      fixture.componentRef.setInput('initials', 'JD');
      fixture.detectChanges();

      const img = getAvatar(fixture).querySelector('img')!;
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      const span = getAvatar(fixture).querySelector('span');
      expect(span).toBeTruthy();
      expect(span!.textContent?.trim()).toBe('JD');
    });

    it('should fall back to default SVG when image fails and no initials are provided', () => {
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/bad.jpg');
      fixture.detectChanges();

      const img = getAvatar(fixture).querySelector('img')!;
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(getAvatar(fixture).querySelector('svg')).toBeTruthy();
    });
  });

  describe('imageError output', () => {
    it('should emit imageError when the underlying <img> dispatches an error event', () => {
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/bad.jpg');
      fixture.detectChanges();

      const img = getAvatar(fixture).querySelector('img')!;
      const errorEvent = new Event('error');
      img.dispatchEvent(errorEvent);
      fixture.detectChanges();

      expect(fixture.componentInstance.imageErrorEvent).toBe(errorEvent);
    });

    it('should not emit imageError on successful load', () => {
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/ok.jpg');
      fixture.detectChanges();

      const img = getAvatar(fixture).querySelector('img')!;
      img.dispatchEvent(new Event('load'));
      fixture.detectChanges();

      expect(fixture.componentInstance.imageErrorEvent).toBeNull();
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

    it('should apply text-sm to initials at md size', () => {
      const fixture = TestBed.createComponent(InitialsAvatarHost);
      fixture.componentRef.setInput('initials', 'JD');
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();
      // The text-* class is applied on the host element (root slot) via the size variant
      expect(getAvatar(fixture).className).toContain('text-sm');
    });

    it('should apply text-xs to initials at xs/sm size', () => {
      const fixture = TestBed.createComponent(InitialsAvatarHost);
      fixture.componentRef.setInput('initials', 'JD');
      fixture.componentRef.setInput('size', 'xs');
      fixture.detectChanges();
      expect(getAvatar(fixture).className).toContain('text-xs');
    });

    it('should apply text-base to initials at xl size', () => {
      const fixture = TestBed.createComponent(InitialsAvatarHost);
      fixture.componentRef.setInput('initials', 'JD');
      fixture.componentRef.setInput('size', 'xl');
      fixture.detectChanges();
      expect(getAvatar(fixture).className).toContain('text-base');
    });
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

  describe('appearance.rounded', () => {
    it('should apply rounded-full by default', () => {
      const fixture = TestBed.createComponent(SizedAvatarHost);
      fixture.detectChanges();
      expect(getAvatar(fixture).className).toContain('rounded-full');
    });

    it('should apply rounded-lg when appearance.rounded="lg"', () => {
      const fixture = TestBed.createComponent(SizedAvatarHost);
      fixture.componentRef.setInput('appearance', { rounded: 'lg' } satisfies AvatarAppearance);
      fixture.detectChanges();
      expect(getAvatar(fixture).className).toContain('rounded-lg');
    });

    it('should apply rounded-none when appearance.rounded="none"', () => {
      const fixture = TestBed.createComponent(SizedAvatarHost);
      fixture.componentRef.setInput('appearance', { rounded: 'none' } satisfies AvatarAppearance);
      fixture.detectChanges();
      expect(getAvatar(fixture).className).toContain('rounded-none');
    });
  });

  describe('appearance.status', () => {
    it('should not render status dot when appearance.status is omitted', () => {
      const fixture = TestBed.createComponent(StatusAvatarHost);
      fixture.detectChanges();
      const dots = getAvatar(fixture).querySelectorAll('span[aria-hidden="true"]');
      expect(dots.length).toBe(0);
    });

    it('should not render status dot when appearance.status is null', () => {
      const fixture = TestBed.createComponent(StatusAvatarHost);
      fixture.componentRef.setInput('appearance', { status: null } satisfies AvatarAppearance);
      fixture.detectChanges();
      const dots = getAvatar(fixture).querySelectorAll('span[aria-hidden="true"]');
      expect(dots.length).toBe(0);
    });

    it('should render status dot when appearance.status is set', () => {
      const fixture = TestBed.createComponent(StatusAvatarHost);
      fixture.componentRef.setInput('appearance', { status: 'online' } satisfies AvatarAppearance);
      fixture.detectChanges();
      const dot = getAvatar(fixture).querySelector('span[aria-hidden="true"]');
      expect(dot).toBeTruthy();
    });

    const statusValues: AvatarStatus[] = ['online', 'busy', 'away', 'offline'];

    for (const status of statusValues) {
      it(`should render status="${status}" without errors`, () => {
        const fixture = TestBed.createComponent(StatusAvatarHost);
        fixture.componentRef.setInput('appearance', { status } satisfies AvatarAppearance);
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

    it('should not apply aria-hidden on image-mode avatars even when alt is empty', () => {
      // Image-mode avatars carry their accessibility on the underlying <img>'s
      // alt attribute; hiding the host would suppress the image entirely.
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/photo.jpg');
      fixture.componentRef.setInput('alt', '');
      fixture.detectChanges();
      expect(getAvatar(fixture).getAttribute('aria-hidden')).toBeNull();
    });

    it('should not apply aria-hidden on image-mode avatars with alt text', () => {
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/photo.jpg');
      fixture.componentRef.setInput('alt', 'A user photo');
      fixture.detectChanges();
      expect(getAvatar(fixture).getAttribute('aria-hidden')).toBeNull();
    });

    it('should log a dev-mode warning when image-mode avatar has no alt', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/photo.jpg');
      fixture.componentRef.setInput('alt', '');
      fixture.detectChanges();
      expect(warnSpy).toHaveBeenCalledWith(
        '<tw-avatar> rendered as image without alt text — provide alt for accessibility',
      );
      warnSpy.mockRestore();
    });

    it('should not log a dev-mode warning when image-mode avatar has alt text', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fixture = TestBed.createComponent(ImageAvatarHost);
      fixture.componentRef.setInput('src', '/photo.jpg');
      fixture.componentRef.setInput('alt', 'A user photo');
      fixture.detectChanges();
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should mark status dot as aria-hidden', () => {
      const fixture = TestBed.createComponent(StatusAvatarHost);
      fixture.componentRef.setInput('appearance', { status: 'online' } satisfies AvatarAppearance);
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
    it('should hide excess avatars via [hidden] attribute when max is set', async () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.componentRef.setInput('max', 2);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const avatars = getGroup(fixture).querySelectorAll('tw-avatar');
      const visible = Array.from(avatars).filter(
        (el) => !(el as HTMLElement).hasAttribute('hidden'),
      );
      expect(visible.length).toBe(2);

      // The overflowed avatars carry the `hidden` attribute set by the group
      // (signal-driven, not `style.display` mutation).
      const hiddenAvatars = Array.from(avatars).filter(
        (el) => (el as HTMLElement).hasAttribute('hidden'),
      );
      expect(hiddenAvatars.length).toBe(2);
      for (const el of hiddenAvatars) {
        expect((el as HTMLElement).style.display).toBe('');
      }
    });

    it('should show "+N" overflow indicator', async () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.componentRef.setInput('max', 2);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const overflow = getGroup(fixture).querySelector(':scope > span');
      expect(overflow).toBeTruthy();
      expect(overflow!.textContent?.trim()).toBe('+2');
    });

    it('should not show overflow indicator when max is null', () => {
      const fixture = TestBed.createComponent(AvatarGroupHost);
      fixture.detectChanges();
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
      avatars.forEach((avatar) => {
        expect(avatar.className).toContain('size-8');
      });
    });
  });
});
