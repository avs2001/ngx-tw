export {
  StepperComponent,
  StepComponent,
  StepLabelDirective,
  StepperIconDirective,
  StepperNextDirective,
  StepperPreviousDirective,
  provideTwStepperOptions,
} from './stepper';
export type { StepperVariant, StepperIconContext } from './stepper';

// Re-exports from CDK so consumers don't depend on @angular/cdk/stepper directly.
export {
  STEP_STATE,
  STEPPER_GLOBAL_OPTIONS,
  StepperSelectionEvent,
} from '@angular/cdk/stepper';
export type {
  StepState,
  StepperOptions,
  StepperOrientation,
} from '@angular/cdk/stepper';
