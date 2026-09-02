import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Directionality, type Direction } from '@angular/cdk/bidi';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import {
  TabsComponent,
  TabComponent,
  TabTriggerDirective,
  TabContentDirective,
} from './tabs';
import type { TabsVariant } from './tabs';

// ── Test host components ──

@Component({
  imports: [TabsComponent, TabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-tabs [(value)]="activeTab">
      <tw-tab value="one" label="One">Content one</tw-tab>
      <tw-tab value="two" label="Two">Content two</tw-tab>
      <tw-tab value="three" label="Three">Content three</tw-tab>
    </tw-tabs>
  `,
})
class BasicHost {
  activeTab = signal('one');
}

@Component({
  imports: [TabsComponent, TabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-tabs
      [variant]="variant()"
      [color]="color()"
      [size]="size()"
      [orientation]="orientation()"
      [fitted]="fitted()"
      [(value)]="activeTab"
    >
      <tw-tab value="a" label="Tab A">Content A</tw-tab>
      <tw-tab value="b" label="Tab B">Content B</tw-tab>
      <tw-tab value="c" label="Tab C">Content C</tw-tab>
    </tw-tabs>
  `,
})
class VariantHost {
  variant = signal<TabsVariant>('underline');
  color = signal<TwColor>('primary');
  size = signal<TwSize>('md');
  orientation = signal<'horizontal' | 'vertical'>('horizontal');
  fitted = signal(false);
  activeTab = signal('a');
}

@Component({
  imports: [TabsComponent, TabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-tabs [(value)]="activeTab">
      <tw-tab value="enabled" label="Enabled">Enabled content</tw-tab>
      <tw-tab value="disabled" label="Disabled" [disabled]="true">Disabled content</tw-tab>
      <tw-tab value="also-enabled" label="Also Enabled">Also enabled content</tw-tab>
    </tw-tabs>
  `,
})
class DisabledHost {
  activeTab = signal('enabled');
}

@Component({
  imports: [TabsComponent, TabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-tabs [(value)]="activeTab" (closed)="onClosed($event)">
      <tw-tab value="closable" label="Closable" [closable]="true">Closable content</tw-tab>
      <tw-tab value="normal" label="Normal">Normal content</tw-tab>
    </tw-tabs>
  `,
})
class ClosableHost {
  activeTab = signal('closable');
  closedValue = signal('');
  onClosed(value: string): void {
    this.closedValue.set(value);
  }
}

@Component({
  imports: [TabsComponent, TabComponent, TabContentDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-tabs [(value)]="activeTab">
      <tw-tab value="eager" label="Eager">Eager content</tw-tab>
      <tw-tab value="lazy" label="Lazy" [lazy]="true">
        <ng-template twTabContent>
          <div class="lazy-content">Lazy loaded content</div>
        </ng-template>
      </tw-tab>
    </tw-tabs>
  `,
})
class LazyHost {
  activeTab = signal('eager');
}

@Component({
  imports: [TabsComponent, TabComponent, TabTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-tabs [(value)]="activeTab">
      <tw-tab value="custom">
        <ng-template twTabTrigger let-ctx>
          <span class="custom-trigger">{{ ctx.active ? 'Active!' : 'Inactive' }}</span>
        </ng-template>
        Custom content
      </tw-tab>
      <tw-tab value="plain" label="Plain">Plain content</tw-tab>
    </tw-tabs>
  `,
})
class CustomTriggerHost {
  activeTab = signal('custom');
}

// ── Tests ──

describe('TabsComponent', () => {
  describe('default render', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BasicHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
    });

    it('should create without errors', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render the tablist', () => {
      const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();
    });

    it('should render three tab triggers', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(triggers.length).toBe(3);
    });

    it('should render tab labels', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(triggers[0].textContent).toContain('One');
      expect(triggers[1].textContent).toContain('Two');
      expect(triggers[2].textContent).toContain('Three');
    });

    it('should show the active panel', () => {
      const panels = fixture.nativeElement.querySelectorAll('[role="tabpanel"]');
      const visible = Array.from(panels).filter((p: any) => !p.hidden);
      expect(visible.length).toBe(1);
    });
  });

  describe('ARIA attributes', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BasicHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
    });

    it('should set role="tablist" on the list container', () => {
      const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();
    });

    it('should set aria-orientation on tablist', () => {
      const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
      expect(tablist.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('should set role="tab" on each trigger', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(triggers.length).toBe(3);
    });

    it('should set aria-selected on the active trigger', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(triggers[0].getAttribute('aria-selected')).toBe('true');
      expect(triggers[1].getAttribute('aria-selected')).toBe('false');
      expect(triggers[2].getAttribute('aria-selected')).toBe('false');
    });

    it('should set aria-controls linking trigger to panel', () => {
      const trigger = fixture.nativeElement.querySelector('[role="tab"]');
      const controlsId = trigger.getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();
      const panel = fixture.nativeElement.querySelector(`#${controlsId}`);
      expect(panel).toBeTruthy();
      expect(panel.getAttribute('role')).toBe('tabpanel');
    });

    it('should set aria-labelledby linking panel to trigger', () => {
      const trigger: HTMLElement = fixture.nativeElement.querySelector('[role="tab"]');
      const panel = fixture.nativeElement.querySelector('[role="tabpanel"]:not([hidden])');
      expect(panel.getAttribute('aria-labelledby')).toBe(trigger.id);
    });

    it('should set role="tabpanel" on panel', () => {
      const panel = fixture.nativeElement.querySelector('[role="tabpanel"]');
      expect(panel).toBeTruthy();
    });

    it('should set tabindex="0" on active trigger and -1 on others', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(triggers[0].getAttribute('tabindex')).toBe('0');
      expect(triggers[1].getAttribute('tabindex')).toBe('-1');
      expect(triggers[2].getAttribute('tabindex')).toBe('-1');
    });

    it('should set tabindex="0" on panel for focus', () => {
      const panel = fixture.nativeElement.querySelector('[role="tabpanel"]:not([hidden])');
      expect(panel.getAttribute('tabindex')).toBe('0');
    });

    // Tab-order recovery (SC 2.1.1). A `value` matching no tab used to leave
    // every trigger at tabindex="-1", so the whole tablist silently dropped
    // out of the tab order and could not be reached by keyboard at all.
    it('should keep exactly one tab stop when value matches no tab', () => {
      fixture.componentInstance.activeTab.set('does-not-exist');
      fixture.detectChanges();

      const triggers: HTMLElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('[role="tab"]'),
      );
      expect(triggers.filter(t => t.getAttribute('tabindex') === '0')).toHaveLength(1);
      expect(triggers[0].getAttribute('tabindex')).toBe('0');
      expect(triggers[0].getAttribute('aria-selected')).toBe('false');
    });

    it('should keep a tab stop when value is cleared to an empty string', () => {
      fixture.componentInstance.activeTab.set('');
      fixture.detectChanges();

      const triggers: HTMLElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('[role="tab"]'),
      );
      expect(triggers[0].getAttribute('tabindex')).toBe('0');
    });
  });

  describe('tab selection via click', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BasicHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
    });

    it('should activate the clicked tab', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].click();
      fixture.detectChanges();

      expect(triggers[1].getAttribute('aria-selected')).toBe('true');
      expect(triggers[0].getAttribute('aria-selected')).toBe('false');
    });

    it('should update the two-way bound value', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[2].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('three');
    });

    it('should show the newly selected panel content', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].click();
      fixture.detectChanges();

      const panels = fixture.nativeElement.querySelectorAll('[role="tabpanel"]');
      const visible = Array.from(panels).find((p: any) => !p.hidden) as HTMLElement;
      expect(visible.textContent).toContain('Content two');
    });
  });

  describe('variants', () => {
    let fixture: ComponentFixture<VariantHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VariantHost],
      }).compileComponents();
      fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
    });

    it('should render underline variant without errors', () => {
      fixture.componentInstance.variant.set('underline');
      fixture.detectChanges();
      const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();
    });

    it('should render enclosed variant without errors', () => {
      fixture.componentInstance.variant.set('enclosed');
      fixture.detectChanges();
      const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();
    });

    it('should render pill variant without errors', () => {
      fixture.componentInstance.variant.set('pill');
      fixture.detectChanges();
      const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();
    });
  });

  describe('sizes', () => {
    let fixture: ComponentFixture<VariantHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VariantHost],
      }).compileComponents();
      fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
    });

    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    for (const size of sizes) {
      it(`should render ${size} size without errors`, () => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
        expect(triggers.length).toBe(3);
      });
    }
  });

  describe('orientation', () => {
    let fixture: ComponentFixture<VariantHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VariantHost],
      }).compileComponents();
      fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
    });

    it('should set horizontal orientation on tablist', () => {
      const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
      expect(tablist.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('should set vertical orientation on tablist', () => {
      fixture.componentInstance.orientation.set('vertical');
      fixture.detectChanges();
      const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
      expect(tablist.getAttribute('aria-orientation')).toBe('vertical');
    });
  });

  describe('fitted mode', () => {
    let fixture: ComponentFixture<VariantHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VariantHost],
      }).compileComponents();
      fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
    });

    it('should render fitted tabs without errors', () => {
      fixture.componentInstance.fitted.set(true);
      fixture.detectChanges();
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(triggers.length).toBe(3);
    });
  });

  describe('disabled tabs', () => {
    let fixture: ComponentFixture<DisabledHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DisabledHost],
      }).compileComponents();
      fixture = TestBed.createComponent(DisabledHost);
      fixture.detectChanges();
    });

    it('should set aria-disabled on disabled trigger', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(triggers[1].getAttribute('aria-disabled')).toBe('true');
    });

    it('should not activate disabled tab on click', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('enabled');
      expect(triggers[1].getAttribute('aria-selected')).toBe('false');
    });

    it('should move the tab stop to the first enabled tab when the active tab is disabled', () => {
      fixture.componentInstance.activeTab.set('disabled');
      fixture.detectChanges();

      const triggers: HTMLElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('[role="tab"]'),
      );
      expect(triggers[1].getAttribute('tabindex')).toBe('-1');
      expect(triggers[0].getAttribute('tabindex')).toBe('0');
    });
  });

  describe('closable tabs', () => {
    let fixture: ComponentFixture<ClosableHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ClosableHost],
      }).compileComponents();
      fixture = TestBed.createComponent(ClosableHost);
      fixture.detectChanges();
    });

    it('should render a close affordance on closable tab', () => {
      const closeControl = fixture.nativeElement.querySelector('[data-tw-tab-close]');
      expect(closeControl).toBeTruthy();
    });

    it('should emit closed output when the close affordance is clicked', () => {
      const closeControl: HTMLElement = fixture.nativeElement.querySelector('[data-tw-tab-close]');
      closeControl.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.closedValue()).toBe('closable');
    });

    it('should not render a close affordance on non-closable tab', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      const normalTrigger = triggers[1];
      expect(normalTrigger.querySelector('[data-tw-tab-close]')).toBeNull();
    });

    it('should keep the close affordance out of the tab order and the a11y tree', () => {
      // A focusable descendant of `role="tab"` fails axe's nested-interactive
      // rule, so the close control is pointer-only: not a button, not
      // focusable, hidden from assistive tech. Delete on the tab is the
      // keyboard path.
      const trigger: HTMLElement = fixture.nativeElement.querySelector('[role="tab"]');
      const closeControl = trigger.querySelector('[data-tw-tab-close]');
      expect(closeControl?.tagName).toBe('SPAN');
      expect(closeControl?.getAttribute('aria-hidden')).toBe('true');
      expect(closeControl?.hasAttribute('tabindex')).toBe(false);
      expect(trigger.querySelectorAll('button, [tabindex]')).toHaveLength(0);
    });

    it('should advertise the Delete shortcut on a closable tab only', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(triggers[0].getAttribute('aria-keyshortcuts')).toBe('Delete');
      expect(triggers[1].getAttribute('aria-keyshortcuts')).toBeNull();
    });

    it('should emit closed output when Delete is pressed on the parent tab', () => {
      const closableTrigger: HTMLElement = fixture.nativeElement.querySelector('[role="tab"]');
      closableTrigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Delete', keyCode: 46, bubbles: true }),
      );
      fixture.detectChanges();

      expect(fixture.componentInstance.closedValue()).toBe('closable');
    });
  });

  describe('lazy content', () => {
    let fixture: ComponentFixture<LazyHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [LazyHost],
      }).compileComponents();
      fixture = TestBed.createComponent(LazyHost);
      fixture.detectChanges();
    });

    it('should not render lazy content when tab is inactive', () => {
      const lazyContent = fixture.nativeElement.querySelector('.lazy-content');
      expect(lazyContent).toBeNull();
    });

    it('should render lazy content when tab becomes active', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].click();
      fixture.detectChanges();

      const lazyContent = fixture.nativeElement.querySelector('.lazy-content');
      expect(lazyContent).toBeTruthy();
      expect(lazyContent.textContent).toContain('Lazy loaded content');
    });

    it('should keep lazy content alive after deactivation', () => {
      // Activate lazy tab
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].click();
      fixture.detectChanges();

      // Switch back to eager tab
      triggers[0].click();
      fixture.detectChanges();

      // Lazy content should still be in the DOM (hidden)
      const lazyContent = fixture.nativeElement.querySelector('.lazy-content');
      expect(lazyContent).toBeTruthy();
    });
  });

  describe('custom trigger template', () => {
    let fixture: ComponentFixture<CustomTriggerHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CustomTriggerHost],
      }).compileComponents();
      fixture = TestBed.createComponent(CustomTriggerHost);
      fixture.detectChanges();
    });

    it('should render custom trigger content', () => {
      const customTrigger = fixture.nativeElement.querySelector('.custom-trigger');
      expect(customTrigger).toBeTruthy();
    });

    it('should pass context to custom trigger template', () => {
      const customTrigger = fixture.nativeElement.querySelector('.custom-trigger');
      expect(customTrigger.textContent).toContain('Active!');
    });

    it('should update context when tab becomes inactive', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].click();
      fixture.detectChanges();

      const customTrigger = fixture.nativeElement.querySelector('.custom-trigger');
      expect(customTrigger.textContent).toContain('Inactive');
    });
  });

  describe('keyboard navigation', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BasicHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      // Wait for afterNextRender to initialize the key manager
      await fixture.whenStable();
    });

    it('should handle ArrowRight to move to next tab', async () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');

      triggers[0].focus();
      fixture.detectChanges();

      triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('two');
    });

    it('should handle ArrowLeft to move to previous tab', async () => {
      // Start at second tab
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].click();
      fixture.detectChanges();

      triggers[1].focus();
      fixture.detectChanges();

      triggers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', keyCode: 37, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('one');
    });

    it('should handle Home key to go to first tab', async () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[2].click();
      fixture.detectChanges();

      triggers[2].focus();
      fixture.detectChanges();

      triggers[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', keyCode: 36, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('one');
    });

    it('should handle End key to go to last tab', async () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');

      triggers[0].focus();
      fixture.detectChanges();

      triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', keyCode: 35, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('three');
    });

    it('should wrap around with ArrowRight from the last tab', async () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      // Activate the last tab
      triggers[2].click();
      fixture.detectChanges();
      triggers[2].focus();
      fixture.detectChanges();

      triggers[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('one');
    });

    it('should activate the focused tab when Enter is pressed', async () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].focus();
      fixture.detectChanges();

      triggers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.activeTab()).toBe('two');
    });

    it('should activate the focused tab when Space is pressed', async () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[2].focus();
      fixture.detectChanges();

      triggers[2].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', keyCode: 32, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.activeTab()).toBe('three');
    });
  });

  describe('vertical orientation keyboard navigation', () => {
    let fixture: ComponentFixture<VariantHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VariantHost],
      }).compileComponents();
      fixture = TestBed.createComponent(VariantHost);
      fixture.componentInstance.orientation.set('vertical');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should move to next tab on ArrowDown when vertical', async () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[0].focus();
      fixture.detectChanges();

      triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('b');
    });

    it('should move to previous tab on ArrowUp when vertical', async () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].click();
      fixture.detectChanges();
      triggers[1].focus();
      fixture.detectChanges();

      triggers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', keyCode: 38, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('a');
    });

    it('should not respond to ArrowRight/ArrowLeft in vertical mode', async () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[0].focus();
      fixture.detectChanges();

      triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Active tab unchanged — horizontal arrows are inert in vertical orientation.
      expect(fixture.componentInstance.activeTab()).toBe('a');
    });
  });

  describe('two-way binding', () => {
    let fixture: ComponentFixture<BasicHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BasicHost],
      }).compileComponents();
      fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
    });

    it('should reflect external value changes', () => {
      fixture.componentInstance.activeTab.set('three');
      fixture.detectChanges();

      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      expect(triggers[2].getAttribute('aria-selected')).toBe('true');
      expect(triggers[0].getAttribute('aria-selected')).toBe('false');
    });

    it('should update external value on tab click', () => {
      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('two');
    });
  });

  describe('RTL keyboard navigation', () => {
    it('inverts ArrowRight/ArrowLeft when the layout direction is rtl', async () => {
      // The tablist hardcoded `withHorizontalOrientation('ltr')`, so in an RTL
      // locale ArrowRight moved to the next tab in DOM order but the *previous*
      // tab visually — the standard RTL inversion bug. CdkStepper and tw-split
      // both honour Directionality, so this was an internal inconsistency too.
      TestBed.configureTestingModule({
        providers: [
          {
            provide: Directionality,
            useValue: { value: 'rtl', change: new Subject<Direction>() },
          },
        ],
      });
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]');
      triggers[1].focus();
      fixture.detectChanges();
      fixture.componentInstance.activeTab.set('two');
      fixture.detectChanges();
      await fixture.whenStable();

      // In RTL, ArrowRight means "previous".
      triggers[1].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, bubbles: true }),
      );
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('one');
    });
  });


});
