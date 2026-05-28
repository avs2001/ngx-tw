import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import {
  CardComponent,
  CardHeaderDirective,
  CardBodyDirective,
  CardFooterDirective,
  CardMediaDirective,
} from './card';
import type { CardVariant } from './card';

// ── Test host components ──

@Component({
  imports: [CardComponent, CardBodyDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-card>
      <div twCardBody>Body content</div>
    </tw-card>
  `,
})
class BodyOnlyHost {}

@Component({
  imports: [
    CardComponent,
    CardHeaderDirective,
    CardBodyDirective,
    CardFooterDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-card [variant]="variant()" [color]="color()" [size]="size()">
      <div twCardHeader>Header</div>
      <div twCardBody>Body</div>
      <div twCardFooter>Footer</div>
    </tw-card>
  `,
})
class FullCardHost {
  variant = signal<CardVariant>('elevated');
  color = signal<TwColor>('neutral');
  size = signal<TwSize>('md');
}

@Component({
  imports: [CardComponent, CardMediaDirective, CardBodyDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-card [size]="size()">
      <img twCardMedia src="test.jpg" alt="Test" />
      <div twCardBody>Caption</div>
    </tw-card>
  `,
})
class MediaCardHost {
  size = signal<TwSize>('md');
}

@Component({
  imports: [CardComponent, CardBodyDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-card class="rounded-2xl shadow-md custom-card">
      <div twCardBody>Body</div>
    </tw-card>
  `,
})
class TwMergeHost {}

// ── Tests ──

describe('CardComponent', () => {
  describe('default render', () => {
    let fixture: ComponentFixture<BodyOnlyHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BodyOnlyHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BodyOnlyHost);
      fixture.detectChanges();
    });

    it('should create without errors', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render the card element', () => {
      const card = fixture.nativeElement.querySelector('tw-card');
      expect(card).toBeTruthy();
    });

    it('should project body content', () => {
      const body = fixture.nativeElement.querySelector('[twCardBody]');
      expect(body).toBeTruthy();
      expect(body.textContent).toContain('Body content');
    });

    it('should apply elevated variant classes by default', () => {
      const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
      expect(card.className).toContain('rounded-lg');
      expect(card.className).toContain('shadow');
    });

    it('should apply hover:shadow-md on elevated variant', () => {
      const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
      expect(card.className).toContain('hover:shadow-md');
      expect(card.className).toContain('transition-shadow');
    });
  });

  describe('variants', () => {
    let fixture: ComponentFixture<FullCardHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullCardHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullCardHost);
      fixture.detectChanges();
    });

    it('should render elevated variant', () => {
      const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
      expect(card.className).toContain('shadow');
      expect(card.className).toContain('hover:shadow-md');
      expect(card.className).toContain('bg-surface-raised');
    });

    it('should render outlined variant', () => {
      fixture.componentInstance.variant.set('outlined');
      fixture.detectChanges();
      const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
      expect(card.className).toContain('border');
      expect(card.className).toContain('bg-surface');
      expect(card.className).not.toContain('shadow');
      expect(card.className).not.toContain('hover:shadow-md');
    });

    it('should render ghost variant', () => {
      fixture.componentInstance.variant.set('ghost');
      fixture.detectChanges();
      const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
      expect(card.className).toContain('bg-transparent');
      expect(card.className).not.toContain('shadow');
      expect(card.className).not.toContain('hover:shadow-md');
    });
  });

  describe('color input', () => {
    let fixture: ComponentFixture<FullCardHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullCardHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullCardHost);
      fixture.detectChanges();
    });

    const TINTABLE_COLORS: TwColor[] = [
      'primary',
      'secondary',
      'accent',
      'info',
      'success',
      'warning',
      'error',
    ];

    for (const color of TINTABLE_COLORS) {
      it(`should apply border-${color}-300 on outlined variant`, () => {
        fixture.componentInstance.variant.set('outlined');
        fixture.componentInstance.color.set(color);
        fixture.detectChanges();
        const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
        expect(card.className).toContain(`border-${color}-300`);

        for (const otherColor of TINTABLE_COLORS) {
          if (otherColor === color) continue;
          expect(card.className).not.toContain(`border-${otherColor}-300`);
        }
      });
    }

    it('should not apply any color border on neutral color', () => {
      fixture.componentInstance.variant.set('outlined');
      fixture.componentInstance.color.set('neutral');
      fixture.detectChanges();
      const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
      for (const color of TINTABLE_COLORS) {
        expect(card.className).not.toContain(`border-${color}-300`);
      }
    });

    it('should not apply color border on elevated variant', () => {
      fixture.componentInstance.variant.set('elevated');
      fixture.componentInstance.color.set('error');
      fixture.detectChanges();
      const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
      expect(card.className).not.toContain('border-error-300');
    });

    it('should not apply color border on ghost variant', () => {
      fixture.componentInstance.variant.set('ghost');
      fixture.componentInstance.color.set('primary');
      fixture.detectChanges();
      const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
      expect(card.className).not.toContain('border-primary-300');
    });
  });

  describe('size input', () => {
    let fixture: ComponentFixture<FullCardHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullCardHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullCardHost);
      fixture.detectChanges();
    });

    it('should apply md padding by default', () => {
      const body: HTMLElement =
        fixture.nativeElement.querySelector('[twCardBody]');
      expect(body.className).toContain('p-4');
    });

    it('should apply xs padding', () => {
      fixture.componentInstance.size.set('xs');
      fixture.detectChanges();
      const body: HTMLElement =
        fixture.nativeElement.querySelector('[twCardBody]');
      expect(body.className).toContain('p-2');
    });

    it('should apply xl padding', () => {
      fixture.componentInstance.size.set('xl');
      fixture.detectChanges();
      const body: HTMLElement =
        fixture.nativeElement.querySelector('[twCardBody]');
      expect(body.className).toContain('p-8');
    });

    it('should apply size to all sections', () => {
      fixture.componentInstance.size.set('lg');
      fixture.detectChanges();
      const header: HTMLElement =
        fixture.nativeElement.querySelector('[twCardHeader]');
      const body: HTMLElement =
        fixture.nativeElement.querySelector('[twCardBody]');
      const footer: HTMLElement =
        fixture.nativeElement.querySelector('[twCardFooter]');
      expect(header.className).toContain('p-6');
      expect(body.className).toContain('p-6');
      expect(footer.className).toContain('p-6');
    });
  });

  describe('content projection', () => {
    it('should project header, body, and footer', async () => {
      await TestBed.configureTestingModule({
        imports: [FullCardHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullCardHost);
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelector('[twCardHeader]').textContent,
      ).toContain('Header');
      expect(
        fixture.nativeElement.querySelector('[twCardBody]').textContent,
      ).toContain('Body');
      expect(
        fixture.nativeElement.querySelector('[twCardFooter]').textContent,
      ).toContain('Footer');
    });

    it('should render without header or footer', async () => {
      await TestBed.configureTestingModule({
        imports: [BodyOnlyHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(BodyOnlyHost);
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelector('[twCardHeader]'),
      ).toBeNull();
      expect(
        fixture.nativeElement.querySelector('[twCardFooter]'),
      ).toBeNull();
      expect(
        fixture.nativeElement.querySelector('[twCardBody]'),
      ).toBeTruthy();
    });
  });

  describe('media slot', () => {
    let fixture: ComponentFixture<MediaCardHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [MediaCardHost],
      }).compileComponents();
      fixture = TestBed.createComponent(MediaCardHost);
      fixture.detectChanges();
    });

    it('should project media content', () => {
      const media = fixture.nativeElement.querySelector('[twCardMedia]');
      expect(media).toBeTruthy();
      expect(media.tagName).toBe('IMG');
    });

    it('should apply media base classes', () => {
      const media: HTMLElement =
        fixture.nativeElement.querySelector('[twCardMedia]');
      expect(media.className).toContain('w-full');
      expect(media.className).toContain('overflow-hidden');
    });

    const PADDING_UTILITY = /(?:^|\s)p-\d+(?:\.\d+)?(?:\s|$)/;
    const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

    for (const size of SIZES) {
      it(`should not apply any p-* utility at size="${size}"`, () => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        const media: HTMLElement =
          fixture.nativeElement.querySelector('[twCardMedia]');
        expect(PADDING_UTILITY.test(media.className)).toBe(false);
      });
    }
  });

  describe('section dividers', () => {
    it('should apply border-b on header', async () => {
      await TestBed.configureTestingModule({
        imports: [FullCardHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullCardHost);
      fixture.detectChanges();

      const header: HTMLElement =
        fixture.nativeElement.querySelector('[twCardHeader]');
      expect(header.className).toContain('border-b');
    });

    it('should apply border-t on footer', async () => {
      await TestBed.configureTestingModule({
        imports: [FullCardHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullCardHost);
      fixture.detectChanges();

      const footer: HTMLElement =
        fixture.nativeElement.querySelector('[twCardFooter]');
      expect(footer.className).toContain('border-t');
    });
  });

  describe('accessibility', () => {
    it('should not apply an ARIA role by default', async () => {
      await TestBed.configureTestingModule({
        imports: [BodyOnlyHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(BodyOnlyHost);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('tw-card');
      expect(card.getAttribute('role')).toBeNull();
    });
  });

  describe('class merging', () => {
    it('should preserve consumer classes alongside internal classes', async () => {
      await TestBed.configureTestingModule({
        imports: [TwMergeHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(TwMergeHost);
      fixture.detectChanges();

      const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
      expect(card.className).toContain('rounded-2xl');
      expect(card.className).toContain('shadow-md');
      expect(card.className).toContain('custom-card');
      expect(card.className).toContain('bg-surface-raised');
    });

    it('should resolve internal border-color conflicts via twMerge on outlined+color', async () => {
      await TestBed.configureTestingModule({
        imports: [FullCardHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullCardHost);
      fixture.componentInstance.variant.set('outlined');
      fixture.componentInstance.color.set('primary');
      fixture.detectChanges();

      const card: HTMLElement = fixture.nativeElement.querySelector('tw-card');
      const matches = card.className.match(/\bborder-[a-z]+-\d{3}\b/g) ?? [];
      expect(matches).toEqual(['border-primary-300']);
    });
  });
});
