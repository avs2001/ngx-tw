import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import { provideTwIcons } from '@cdevhub/ngx-tw/icon';
import type { TwIconData } from '@cdevhub/ngx-tw/icon';
import {
  EmptyStateComponent,
  EmptyStateIconDirective,
  EmptyStateTitleDirective,
  EmptyStateDescriptionDirective,
  EmptyStateActionsDirective,
} from './empty-state';
import type { EmptyStateTitleLevel, EmptyStateVariant } from './empty-state';

const INBOX_ICON: TwIconData = [['rect', { x: '2', y: '4', width: '20', height: '16', rx: '2' }]];
const TEST_ICONS = { Inbox: INBOX_ICON };

// ── Test host components ──

@Component({
  imports: [EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-empty-state />`,
})
class BareHost {}

@Component({
  imports: [EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-empty-state
      [size]="size()"
      [variant]="variant()"
      [title]="title()"
      [description]="description()"
      [titleLevel]="titleLevel()"
    />
  `,
})
class InputsHost {
  size = signal<TwSize>('md');
  variant = signal<EmptyStateVariant>('centered');
  title = signal<string | undefined>(undefined);
  description = signal<string | undefined>(undefined);
  titleLevel = signal<EmptyStateTitleLevel>(3);
}

@Component({
  imports: [
    EmptyStateComponent,
    EmptyStateIconDirective,
    EmptyStateTitleDirective,
    EmptyStateDescriptionDirective,
    EmptyStateActionsDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-empty-state>
      <svg twEmptyStateIcon data-testid="projected-icon" class="size-10">icon</svg>
      <span *twEmptyStateTitle data-testid="projected-title" class="user-class">No results</span>
      <span *twEmptyStateDescription data-testid="projected-description" class="user-class">Try a different search.</span>
      <div twEmptyStateActions data-testid="projected-actions">
        <button>Action</button>
      </div>
    </tw-empty-state>
  `,
})
class FullSlotsHost {}

@Component({
  imports: [EmptyStateComponent, EmptyStateTitleDirective, EmptyStateDescriptionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-empty-state title="Input title" description="Input description">
      <span *twEmptyStateTitle data-testid="projected-title">Projected title</span>
      <span *twEmptyStateDescription data-testid="projected-description">Projected description</span>
    </tw-empty-state>
  `,
})
class ProjectionWinsHost {}

@Component({
  imports: [EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-empty-state class="bg-purple-500 rounded-none" />`,
})
class OverrideHost {}

// ── Tests ──

describe('EmptyStateComponent', () => {
  describe('default render', () => {
    let fixture: ComponentFixture<BareHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BareHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      fixture = TestBed.createComponent(BareHost);
      fixture.detectChanges();
    });

    it('should create without errors', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render the host element', () => {
      const host = fixture.nativeElement.querySelector('tw-empty-state');
      expect(host).toBeTruthy();
    });

    it('should render the fallback inbox icon when no slot is projected', () => {
      const icon = fixture.nativeElement.querySelector('tw-icon');
      expect(icon).toBeTruthy();
      expect(icon.getAttribute('name')).toBe('inbox');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    it('should not render a heading element when no title is provided', () => {
      const heading = fixture.nativeElement.querySelector('h1, h2, h3, h4, h5, h6');
      expect(heading).toBeNull();
    });

    it('should not render a description paragraph when no description is provided', () => {
      const p = fixture.nativeElement.querySelector('tw-empty-state p');
      expect(p).toBeNull();
    });

    it('should apply centered md classes by default', () => {
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-empty-state');
      expect(host.className).toContain('flex-col');
      expect(host.className).toContain('items-center');
      expect(host.className).toContain('text-center');
      expect(host.className).toContain('p-4');
      expect(host.className).toContain('gap-3');
    });

    it('should not have a role attribute on the host', () => {
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-empty-state');
      expect(host.getAttribute('role')).toBeNull();
    });
  });

  describe('inputs', () => {
    let fixture: ComponentFixture<InputsHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [InputsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      fixture = TestBed.createComponent(InputsHost);
      fixture.detectChanges();
    });

    it('should render `title` inside the heading element', () => {
      fixture.componentInstance.title.set('Hello world');
      fixture.detectChanges();
      const h3 = fixture.nativeElement.querySelector('h3');
      expect(h3).toBeTruthy();
      expect(h3.textContent.trim()).toBe('Hello world');
    });

    it('should render `description` inside a paragraph element', () => {
      fixture.componentInstance.description.set('Try again later.');
      fixture.detectChanges();
      const p = fixture.nativeElement.querySelector('tw-empty-state p');
      expect(p).toBeTruthy();
      expect(p.textContent.trim()).toBe('Try again later.');
    });

    it('should render an <h1> when titleLevel is 1', () => {
      fixture.componentInstance.title.set('T1');
      fixture.componentInstance.titleLevel.set(1);
      fixture.detectChanges();
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1.textContent.trim()).toBe('T1');
    });

    it('should render an <h2> when titleLevel is 2', () => {
      fixture.componentInstance.title.set('T2');
      fixture.componentInstance.titleLevel.set(2);
      fixture.detectChanges();
      const h2 = fixture.nativeElement.querySelector('h2');
      expect(h2).toBeTruthy();
    });

    it('should render an <h6> when titleLevel is 6', () => {
      fixture.componentInstance.title.set('T6');
      fixture.componentInstance.titleLevel.set(6);
      fixture.detectChanges();
      const h6 = fixture.nativeElement.querySelector('h6');
      expect(h6).toBeTruthy();
    });

    it('should switch root layout to flex-row when variant is inline', () => {
      fixture.componentInstance.variant.set('inline');
      fixture.detectChanges();
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-empty-state');
      expect(host.className).toContain('flex-row');
      expect(host.className).toContain('text-left');
    });

    it('should change root padding per size', () => {
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-empty-state');
      const cases: Array<{ size: TwSize; padding: string }> = [
        { size: 'xs', padding: 'p-2' },
        { size: 'sm', padding: 'p-3' },
        { size: 'md', padding: 'p-4' },
        { size: 'lg', padding: 'p-6' },
        { size: 'xl', padding: 'p-8' },
      ];
      for (const { size, padding } of cases) {
        fixture.componentInstance.size.set(size);
        fixture.componentInstance.variant.set('centered');
        fixture.detectChanges();
        expect(host.className, `size=${size}`).toContain(padding);
      }
    });

    it('should keep the title at text-sm font-semibold across every size (regression guard against text-base)', () => {
      fixture.componentInstance.title.set('Locked typography');
      for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as TwSize[]) {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        const heading: HTMLElement = fixture.nativeElement.querySelector('h3');
        expect(heading.className, `size=${size}`).toContain('text-sm');
        expect(heading.className, `size=${size}`).toContain('font-semibold');
        expect(heading.className, `size=${size}`).not.toContain('text-base');
      }
    });
  });

  describe('icon sizing (fallback icon)', () => {
    let fixture: ComponentFixture<InputsHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [InputsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      fixture = TestBed.createComponent(InputsHost);
      fixture.detectChanges();
    });

    // The fallback <tw-icon>'s host class includes `size-{3|4|5|6|8}` per
    // its `iconVariants` tv mapping (xs→size-3, sm→size-4, md→size-5,
    // lg→size-6, xl→size-8). Host class IS reactive to `size` input
    // changes; the SVG's width/height attributes are not (the icon caches
    // the SVG and only rebuilds on data/stroke/viewBox/label changes).
    function iconHostClass(): string {
      const icon: HTMLElement | null = fixture.nativeElement.querySelector('tw-icon');
      return icon?.className ?? '';
    }

    it('centered + md → xl (size-8)', () => {
      fixture.componentInstance.variant.set('centered');
      fixture.componentInstance.size.set('md');
      fixture.detectChanges();
      expect(iconHostClass()).toContain('size-8');
    });

    it('centered + xs → sm (size-4)', () => {
      fixture.componentInstance.variant.set('centered');
      fixture.componentInstance.size.set('xs');
      fixture.detectChanges();
      expect(iconHostClass()).toContain('size-4');
    });

    it('inline + sm → sm (size-4)', () => {
      fixture.componentInstance.variant.set('inline');
      fixture.componentInstance.size.set('sm');
      fixture.detectChanges();
      expect(iconHostClass()).toContain('size-4');
    });

    it('inline + xl → lg (size-6)', () => {
      fixture.componentInstance.variant.set('inline');
      fixture.componentInstance.size.set('xl');
      fixture.detectChanges();
      expect(iconHostClass()).toContain('size-6');
    });
  });

  describe('content projection', () => {
    it('should replace the fallback icon when [twEmptyStateIcon] is projected', async () => {
      await TestBed.configureTestingModule({
        imports: [FullSlotsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullSlotsHost);
      fixture.detectChanges();

      const fallback = fixture.nativeElement.querySelector('tw-icon[name="inbox"]');
      expect(fallback).toBeNull();
      const projected = fixture.nativeElement.querySelector('[data-testid="projected-icon"]');
      expect(projected).toBeTruthy();
    });

    it('should render projected title slot content', async () => {
      await TestBed.configureTestingModule({
        imports: [FullSlotsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullSlotsHost);
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('[data-testid="projected-title"]');
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('No results');
    });

    it('should render projected description slot content', async () => {
      await TestBed.configureTestingModule({
        imports: [FullSlotsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullSlotsHost);
      fixture.detectChanges();

      const desc = fixture.nativeElement.querySelector('[data-testid="projected-description"]');
      expect(desc).toBeTruthy();
      expect(desc.textContent).toBe('Try a different search.');
    });

    it('should let the projected title slot win over the title input', async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectionWinsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      const fixture = TestBed.createComponent(ProjectionWinsHost);
      fixture.detectChanges();

      const headingText = fixture.nativeElement.querySelector('tw-empty-state h3').textContent.trim();
      expect(headingText).toBe('Projected title');
      expect(headingText).not.toContain('Input title');
    });

    it('should let the projected description slot win over the description input', async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectionWinsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      const fixture = TestBed.createComponent(ProjectionWinsHost);
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('tw-empty-state p');
      expect(paragraph.textContent.trim()).toBe('Projected description');
      expect(paragraph.textContent).not.toContain('Input description');
    });

    it('should stamp actionsClasses on the [twEmptyStateActions] host element', async () => {
      await TestBed.configureTestingModule({
        imports: [FullSlotsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullSlotsHost);
      fixture.detectChanges();

      const actions: HTMLElement = fixture.nativeElement.querySelector('[data-testid="projected-actions"]');
      expect(actions).toBeTruthy();
      expect(actions.className).toContain('flex');
      expect(actions.className).toContain('gap-2');
      expect(actions.className).toContain('justify-center'); // centered variant default
    });

    it('should NOT stamp parent typography classes on the [twEmptyStateTitle] / [twEmptyStateDescription] host elements', async () => {
      await TestBed.configureTestingModule({
        imports: [FullSlotsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullSlotsHost);
      fixture.detectChanges();

      const title: HTMLElement = fixture.nativeElement.querySelector('[data-testid="projected-title"]');
      const desc: HTMLElement = fixture.nativeElement.querySelector('[data-testid="projected-description"]');
      // The user's projected element keeps only its own classes.
      expect(title.className).toContain('user-class');
      expect(title.className).not.toContain('font-semibold');
      expect(desc.className).toContain('user-class');
      expect(desc.className).not.toContain('text-fg-muted');
      // The wrapping heading/paragraph carries the parent classes.
      const headingWrapper: HTMLElement = fixture.nativeElement.querySelector('tw-empty-state h3');
      expect(headingWrapper.className).toContain('font-semibold');
      const paragraphWrapper: HTMLElement = fixture.nativeElement.querySelector('tw-empty-state p');
      expect(paragraphWrapper.className).toContain('text-fg-muted');
    });
  });

  describe('variants × sizes smoke', () => {
    let fixture: ComponentFixture<InputsHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [InputsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      fixture = TestBed.createComponent(InputsHost);
      fixture.detectChanges();
    });

    it('should render every variant × size combination without errors', () => {
      const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      const variants: EmptyStateVariant[] = ['centered', 'inline'];
      for (const v of variants) {
        for (const s of sizes) {
          fixture.componentInstance.variant.set(v);
          fixture.componentInstance.size.set(s);
          fixture.detectChanges();
          const host = fixture.nativeElement.querySelector('tw-empty-state');
          expect(host, `variant=${v} size=${s}`).toBeTruthy();
        }
      }
    });

    it('should include flex-col / text-center for the centered variant', () => {
      fixture.componentInstance.variant.set('centered');
      fixture.detectChanges();
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-empty-state');
      expect(host.className).toContain('flex-col');
      expect(host.className).toContain('text-center');
    });

    it('should include flex-row / text-left for the inline variant', () => {
      fixture.componentInstance.variant.set('inline');
      fixture.detectChanges();
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-empty-state');
      expect(host.className).toContain('flex-row');
      expect(host.className).toContain('text-left');
    });
  });

  describe('class merging', () => {
    it('should merge consumer-provided classes with internal classes via twMerge', async () => {
      await TestBed.configureTestingModule({
        imports: [OverrideHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      const fixture = TestBed.createComponent(OverrideHost);
      fixture.detectChanges();

      const host: HTMLElement = fixture.nativeElement.querySelector('tw-empty-state');
      expect(host.className).toContain('bg-purple-500');
      // Internal layout classes survive — bg/rounded are overridden but flex/p-* are not in the same group.
      expect(host.className).toContain('flex-col');
      expect(host.className).toContain('p-4');
    });
  });

  describe('accessibility', () => {
    let fixture: ComponentFixture<InputsHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [InputsHost],
        providers: [provideTwIcons(TEST_ICONS)],
      }).compileComponents();
      fixture = TestBed.createComponent(InputsHost);
      fixture.detectChanges();
    });

    it('should render the title as a real heading tag (not a styled div)', () => {
      fixture.componentInstance.title.set('A11y heading');
      fixture.componentInstance.titleLevel.set(2);
      fixture.detectChanges();
      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading).toBeTruthy();
      expect(heading.tagName).toBe('H2');
    });

    it('should keep aria-hidden="true" on the fallback icon', () => {
      const icon = fixture.nativeElement.querySelector('tw-icon');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    it('should leave the host without aria-live / role attributes (consumer-owned)', () => {
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-empty-state');
      expect(host.getAttribute('role')).toBeNull();
      expect(host.getAttribute('aria-live')).toBeNull();
    });
  });
});
