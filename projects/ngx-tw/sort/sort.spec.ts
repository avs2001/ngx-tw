import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSortDirectionCycle,
  SortDirective,
  type SortDirection,
  type TwSortable,
  type TwSortEvent,
} from './sort';
import { SortHeaderComponent } from './sort-header';

@Component({
  imports: [SortDirective, SortHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      twSort
      [(twSortActive)]="active"
      [(twSortDirection)]="direction"
      [twSortStart]="start()"
      [twSortDisableClear]="disableClear()"
      [twSortDisabled]="disabled()"
      (twSortChange)="onSortChange($event)"
    >
      <span tw-sort-header id="name">Name</span>
      <span tw-sort-header id="age">Age</span>
      <span
        tw-sort-header
        id="score"
        [disabled]="scoreDisabled()"
        [start]="scoreStart()"
        [disableClear]="scoreDisableClear()"
      >
        Score
      </span>
    </div>
  `,
})
class SortHost {
  active = signal<string | null>(null);
  direction = signal<SortDirection>(null);
  start = signal<'asc' | 'desc'>('asc');
  disableClear = signal(false);
  disabled = signal(false);
  scoreDisabled = signal(false);
  scoreStart = signal<'asc' | 'desc' | undefined>(undefined);
  scoreDisableClear = signal<boolean | undefined>(undefined);
  events: TwSortEvent[] = [];
  onSortChange(e: TwSortEvent): void {
    this.events.push(e);
  }
}

function getHeader(fixture: ComponentFixture<SortHost>, id: string): HTMLElement {
  return fixture.nativeElement.querySelector(
    `[tw-sort-header][id="${id}"]`,
  ) as HTMLElement;
}

function getContainer(header: HTMLElement): HTMLElement {
  return header.querySelector('[role], [tabindex]') as HTMLElement
    ?? (header.firstElementChild as HTMLElement);
}

describe('getSortDirectionCycle (pure helper)', () => {
  it('asc start, clearable → [asc, desc, null]', () => {
    expect(getSortDirectionCycle('asc', false)).toEqual(['asc', 'desc', null]);
  });

  it('desc start, clearable → [desc, asc, null]', () => {
    expect(getSortDirectionCycle('desc', false)).toEqual(['desc', 'asc', null]);
  });

  it('asc start, not clearable → [asc, desc]', () => {
    expect(getSortDirectionCycle('asc', true)).toEqual(['asc', 'desc']);
  });

  it('desc start, not clearable → [desc, asc]', () => {
    expect(getSortDirectionCycle('desc', true)).toEqual(['desc', 'asc']);
  });
});

describe('SortDirective', () => {
  let fixture: ComponentFixture<SortHost>;
  let host: SortHost;
  let directive: SortDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SortHost] }).compileComponents();
    fixture = TestBed.createComponent(SortHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    directive = fixture.debugElement
      .query(By.directive(SortDirective))
      .injector.get(SortDirective);
  });

  it('starts with null active and null direction', () => {
    expect(directive.active()).toBeNull();
    expect(directive.direction()).toBeNull();
  });

  it('registers all child headers', () => {
    const nameHeader = getHeader(fixture, 'name');
    expect(nameHeader).toBeTruthy();
    // Indirect test: sorting on a registered header works.
    directive.sort({ id: 'name', start: undefined, disableClear: undefined, disabled: false });
    expect(directive.active()).toBe('name');
  });

  it('first click activates header and sets direction to start', () => {
    const nameContainer = getContainer(getHeader(fixture, 'name'));
    nameContainer.click();
    fixture.detectChanges();
    expect(directive.active()).toBe('name');
    expect(directive.direction()).toBe('asc');
    expect(host.events.length).toBe(1);
    expect(host.events[0]).toEqual({
      active: 'name',
      direction: 'asc',
      previous: { active: null, direction: null },
    });
  });

  it('cycles asc → desc → null on repeated clicks of same header', () => {
    const nameContainer = getContainer(getHeader(fixture, 'name'));

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBe('asc');

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBe('desc');

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBeNull();
    expect(directive.active()).toBeNull();

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBe('asc');
  });

  it('with disableClear=true skips null state', () => {
    host.disableClear.set(true);
    fixture.detectChanges();
    const nameContainer = getContainer(getHeader(fixture, 'name'));

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBe('asc');

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBe('desc');

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBe('asc');

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBe('desc');
  });

  it('with start=desc cycles desc → asc → null', () => {
    host.start.set('desc');
    fixture.detectChanges();
    const nameContainer = getContainer(getHeader(fixture, 'name'));

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBe('desc');

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBe('asc');

    nameContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBeNull();
  });

  it('clicking a different header restarts at parent start regardless of prior direction', () => {
    const nameContainer = getContainer(getHeader(fixture, 'name'));
    const ageContainer = getContainer(getHeader(fixture, 'age'));

    // Put name into desc.
    nameContainer.click();
    fixture.detectChanges();
    nameContainer.click();
    fixture.detectChanges();
    expect(directive.active()).toBe('name');
    expect(directive.direction()).toBe('desc');

    ageContainer.click();
    fixture.detectChanges();
    expect(directive.active()).toBe('age');
    expect(directive.direction()).toBe('asc');
  });

  it('per-header start overrides parent start', () => {
    host.scoreStart.set('desc');
    fixture.detectChanges();
    const scoreContainer = getContainer(getHeader(fixture, 'score'));
    scoreContainer.click();
    fixture.detectChanges();
    expect(directive.direction()).toBe('desc');
  });

  it('per-header disableClear overrides parent', () => {
    host.scoreDisableClear.set(true);
    fixture.detectChanges();
    const scoreContainer = getContainer(getHeader(fixture, 'score'));

    scoreContainer.click(); // → asc
    fixture.detectChanges();
    scoreContainer.click(); // → desc
    fixture.detectChanges();
    scoreContainer.click(); // → asc (not null, since per-header disableClear=true)
    fixture.detectChanges();
    expect(directive.direction()).toBe('asc');
  });

  it('disabled directive blocks sorts', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    const nameContainer = getContainer(getHeader(fixture, 'name'));
    nameContainer.click();
    fixture.detectChanges();
    expect(directive.active()).toBeNull();
    expect(host.events.length).toBe(0);
  });

  it('disabled header blocks its own sort', () => {
    host.scoreDisabled.set(true);
    fixture.detectChanges();
    const scoreContainer = getContainer(getHeader(fixture, 'score'));
    scoreContainer.click();
    fixture.detectChanges();
    expect(directive.active()).toBeNull();
    expect(host.events.length).toBe(0);
  });

  it('programmatic writes to active/direction do NOT emit sortChange', () => {
    host.active.set('name');
    host.direction.set('asc');
    fixture.detectChanges();
    expect(host.events.length).toBe(0);
  });

  it('two-way binding updates the host after user interaction', () => {
    const nameContainer = getContainer(getHeader(fixture, 'name'));
    nameContainer.click();
    fixture.detectChanges();
    expect(host.active()).toBe('name');
    expect(host.direction()).toBe('asc');
  });

  it('throws in dev mode when two headers share an id', async () => {
    @Component({
      imports: [SortDirective, SortHeaderComponent],
      template: `
        <div twSort>
          <span tw-sort-header id="dup">A</span>
          <span tw-sort-header id="dup">B</span>
        </div>
      `,
    })
    class DupHost {}

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [DupHost] }).compileComponents();
    expect(() => {
      const f = TestBed.createComponent(DupHost);
      f.detectChanges();
    }).toThrowError(/same id \(dup\)/);
  });

  it('deregisters headers on destroy', () => {
    const spy = vi.spyOn(directive, 'deregister');
    fixture.destroy();
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('getNextSortDirection returns start when header is not active', () => {
    const header: TwSortable = {
      id: 'ghost',
      start: undefined,
      disableClear: undefined,
      disabled: false,
    };
    expect(directive.getNextSortDirection(header)).toBe('asc');
  });
});

describe('SortHeaderComponent', () => {
  let fixture: ComponentFixture<SortHost>;
  let host: SortHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SortHost] }).compileComponents();
    fixture = TestBed.createComponent(SortHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders projected label content', () => {
    const nameHeader = getHeader(fixture, 'name');
    expect(nameHeader.textContent?.trim()).toContain('Name');
  });

  it('aria-sort is "none" when inactive', () => {
    const nameHeader = getHeader(fixture, 'name');
    expect(nameHeader.getAttribute('aria-sort')).toBe('none');
  });

  it('aria-sort reflects direction when active', () => {
    const nameContainer = getContainer(getHeader(fixture, 'name'));
    nameContainer.click();
    fixture.detectChanges();
    expect(getHeader(fixture, 'name').getAttribute('aria-sort')).toBe('ascending');

    nameContainer.click();
    fixture.detectChanges();
    expect(getHeader(fixture, 'name').getAttribute('aria-sort')).toBe('descending');
  });

  it('only the active header shows non-none aria-sort', () => {
    const nameContainer = getContainer(getHeader(fixture, 'name'));
    nameContainer.click();
    fixture.detectChanges();
    expect(getHeader(fixture, 'name').getAttribute('aria-sort')).toBe('ascending');
    expect(getHeader(fixture, 'age').getAttribute('aria-sort')).toBe('none');
    expect(getHeader(fixture, 'score').getAttribute('aria-sort')).toBe('none');
  });

  it('inner container has role=button and tabindex=0 when enabled', () => {
    const container = getContainer(getHeader(fixture, 'name'));
    expect(container.getAttribute('role')).toBe('button');
    expect(container.getAttribute('tabindex')).toBe('0');
  });

  it('inner container has no role/tabindex when disabled', () => {
    host.scoreDisabled.set(true);
    fixture.detectChanges();
    const container = getContainer(getHeader(fixture, 'score'));
    expect(container.getAttribute('role')).toBeNull();
    expect(container.getAttribute('tabindex')).toBeNull();
  });

  it('host has aria-disabled="true" when disabled', () => {
    host.scoreDisabled.set(true);
    fixture.detectChanges();
    expect(getHeader(fixture, 'score').getAttribute('aria-disabled')).toBe('true');
  });

  it('Enter key triggers sort', () => {
    const container = getContainer(getHeader(fixture, 'name'));
    container.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();
    expect(host.events.length).toBe(1);
    expect(host.events[0].active).toBe('name');
  });

  it('Space key triggers sort and preventDefault is called', () => {
    const container = getContainer(getHeader(fixture, 'name'));
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    const prevented = vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);
    fixture.detectChanges();
    expect(host.events.length).toBe(1);
    expect(prevented).toHaveBeenCalled();
  });

  it('other keys do not trigger sort', () => {
    const container = getContainer(getHeader(fixture, 'name'));
    container.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', bubbles: true }),
    );
    fixture.detectChanges();
    expect(host.events.length).toBe(0);
  });

  it('renders the default chevron SVG when no custom icon projected', () => {
    const nameHeader = getHeader(fixture, 'name');
    const svg = nameHeader.querySelector('[data-tw-sort-arrow] svg');
    expect(svg).toBeTruthy();
  });

  it('renders custom projected [twSortHeaderIcon] instead of default SVG', async () => {
    @Component({
      imports: [SortDirective, SortHeaderComponent],
      template: `
        <div twSort>
          <span tw-sort-header id="a">
            A
            <span twSortHeaderIcon class="custom-icon">⇅</span>
          </span>
        </div>
      `,
    })
    class IconHost {}

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [IconHost] }).compileComponents();
    const f = TestBed.createComponent(IconHost);
    f.detectChanges();
    const arrow = f.nativeElement.querySelector('[data-tw-sort-arrow]');
    expect(arrow.querySelector('.custom-icon')).toBeTruthy();
    expect(arrow.querySelector('svg')).toBeFalsy();
  });

  it('applies color-specific class to arrow when active', async () => {
    @Component({
      imports: [SortDirective, SortHeaderComponent],
      template: `
        <div twSort>
          <span tw-sort-header id="a" color="success">A</span>
        </div>
      `,
    })
    class ColorHost {}

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [ColorHost] }).compileComponents();
    const f = TestBed.createComponent(ColorHost);
    f.detectChanges();
    const header = f.nativeElement.querySelector('[tw-sort-header]');
    const container = getContainer(header);
    container.click();
    f.detectChanges();
    const arrow = header.querySelector('[data-tw-sort-arrow]') as HTMLElement;
    expect(arrow.className).toContain('text-success-600');
  });

  it('arrow icon has rotate-180 class when direction is asc', () => {
    const nameContainer = getContainer(getHeader(fixture, 'name'));
    nameContainer.click();
    fixture.detectChanges();
    const icon = getHeader(fixture, 'name').querySelector(
      '[data-tw-sort-arrow] svg',
    ) as SVGElement;
    expect(icon.getAttribute('class')).toContain('rotate-180');
  });

  it('arrow is visually hidden (opacity-0) when inactive and enabled', () => {
    const arrow = getHeader(fixture, 'name').querySelector(
      '[data-tw-sort-arrow]',
    ) as HTMLElement;
    expect(arrow.className).toContain('opacity-0');
  });

  it('renders arrow before label when arrowPosition="before"', async () => {
    @Component({
      imports: [SortDirective, SortHeaderComponent],
      template: `
        <div twSort>
          <span tw-sort-header id="a" arrowPosition="before">Label</span>
        </div>
      `,
    })
    class BeforeHost {}

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [BeforeHost] }).compileComponents();
    const f = TestBed.createComponent(BeforeHost);
    f.detectChanges();
    const container = getContainer(
      f.nativeElement.querySelector('[tw-sort-header]'),
    );
    const children = Array.from(container.children);
    const arrowIdx = children.findIndex((c) =>
      (c as HTMLElement).matches('[data-tw-sort-arrow]'),
    );
    const labelIdx = children.findIndex((c) => (c as HTMLElement).tagName === 'SPAN' && !(c as HTMLElement).matches('[data-tw-sort-arrow]'));
    expect(arrowIdx).toBeGreaterThanOrEqual(0);
    expect(labelIdx).toBeGreaterThan(arrowIdx);
  });

  it('size variant applies the pinned height and horizontal padding', () => {
    // The 'md' default applies `px-3 text-sm h-9` to the container. Vertical
    // padding is intentionally absent — the height is pinned to the control
    // scale (docs/vertical-rhythm.md) and `py-*` would fight it.
    const container = getContainer(getHeader(fixture, 'name'));
    expect(container.className).toContain('px-3');
    expect(container.className).toContain('h-9');
    expect(container.className).not.toContain('py-');
  });

  it('throws when header is rendered without a parent twSort directive', async () => {
    @Component({
      imports: [SortHeaderComponent],
      template: `<span tw-sort-header id="orphan">Orphan</span>`,
    })
    class OrphanHost {}

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [OrphanHost] }).compileComponents();
    expect(() => {
      const f = TestBed.createComponent(OrphanHost);
      f.detectChanges();
    }).toThrowError(/must be placed within a parent element with the twSort directive/);
  });
});
