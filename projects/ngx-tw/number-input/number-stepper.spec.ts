import {
  ChangeDetectionStrategy,
  Component,
  signal,
  type Type,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, it, expect } from 'vitest';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import { InputDirective } from '@cdevhub/ngx-tw/input';
import { NumberInputDirective } from './number-input';
import { NumberStepperComponent } from './number-stepper';

@Component({
  imports: [
    InputDirective,
    NumberInputDirective,
    NumberStepperComponent,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      twInput
      twNumberInput
      #n="twNumberInput"
      [formControl]="ctrl"
      [min]="min()"
      [max]="max()"
    />
    <tw-number-stepper [for]="n" [size]="size()" class="my-class" />
  `,
})
class StepperHost {
  readonly ctrl = new FormControl<number | null>(0);
  readonly min = signal<number | undefined>(undefined);
  readonly max = signal<number | undefined>(undefined);
  readonly size = signal<TwSize>('md');
  readonly stepper = viewChild.required(NumberStepperComponent);
  readonly directive = viewChild.required(NumberInputDirective);
}

@Component({
  imports: [NumberStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-number-stepper />`,
})
class NoTargetHost {
  readonly stepper = viewChild.required(NumberStepperComponent);
}

@Component({
  imports: [InputDirective, NumberInputDirective, NumberStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput twNumberInput #n="twNumberInput" readonly />
    <tw-number-stepper [for]="n" />`,
})
class ReadonlyTargetHost {}

@Component({
  imports: [InputDirective, NumberInputDirective, NumberStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput twNumberInput #n="twNumberInput" />
    <tw-number-stepper [for]="n">
      <span slot="up" class="custom-up">U</span>
      <span slot="down" class="custom-down">D</span>
    </tw-number-stepper>`,
})
class SlotHost {}

async function create<T>(host: Type<T>): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({ imports: [host] }).compileComponents();
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function buttons<T>(fixture: ComponentFixture<T>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button'));
}

describe('NumberStepperComponent', () => {
  it('renders an up and a down button, both type=button, tabindex=-1, labeled', async () => {
    const fixture = await create(StepperHost);
    const [up, down] = buttons(fixture);
    expect(up.type).toBe('button');
    expect(down.type).toBe('button');
    expect(up.getAttribute('tabindex')).toBe('-1');
    expect(down.getAttribute('tabindex')).toBe('-1');
    expect(up.getAttribute('aria-label')).toBe('Increase');
    expect(down.getAttribute('aria-label')).toBe('Decrease');
  });

  it('renders a visible focus ring on each spinner button', async () => {
    const fixture = await create(StepperHost);
    for (const btn of buttons(fixture)) {
      expect(btn.className).toContain('focus-visible:outline-primary-500');
    }
  });

  it('renders each size without error', async () => {
    const fixture = await create(StepperHost);
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      fixture.componentInstance.size.set(size);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(buttons(fixture).length).toBe(2);
    }
  });

  it('clicking up increments and refocuses the input', async () => {
    const fixture = await create(StepperHost);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    buttons(fixture)[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.directive().value()).toBe(1);
    expect(document.activeElement).toBe(input);
  });

  it('clicking down decrements and refocuses the input', async () => {
    const fixture = await create(StepperHost);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    buttons(fixture)[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.directive().value()).toBe(-1);
    expect(document.activeElement).toBe(input);
  });

  it('preventDefaults mousedown so the input does not blur on click', async () => {
    const fixture = await create(StepperHost);
    const event = new MouseEvent('mousedown', { cancelable: true });
    buttons(fixture)[0].dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('disables both buttons when no target is bound', async () => {
    const fixture = await create(NoTargetHost);
    for (const btn of buttons(fixture)) {
      expect(btn.disabled).toBe(true);
    }
  });

  it('disables both buttons when the target FormControl is disabled', async () => {
    const fixture = await create(StepperHost);
    fixture.componentInstance.ctrl.disable();
    fixture.detectChanges();
    await fixture.whenStable();
    for (const btn of buttons(fixture)) {
      expect(btn.disabled).toBe(true);
    }
  });

  it('disables both buttons when the target input is readonly', async () => {
    const fixture = await create(ReadonlyTargetHost);
    for (const btn of buttons(fixture)) {
      expect(btn.disabled).toBe(true);
    }
  });

  it('projects [slot=up] / [slot=down] content over the default chevrons', async () => {
    const fixture = await create(SlotHost);
    expect(fixture.nativeElement.querySelector('.custom-up')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.custom-down')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('svg').length).toBe(0);
  });

  it('preserves a consumer class on the host and renders the flex group', async () => {
    const fixture = await create(StepperHost);
    const hostEl = fixture.nativeElement.querySelector('tw-number-stepper');
    expect(hostEl.classList.contains('my-class')).toBe(true);
    expect(fixture.nativeElement.querySelector('div')?.className).toContain(
      'flex',
    );
  });
});
