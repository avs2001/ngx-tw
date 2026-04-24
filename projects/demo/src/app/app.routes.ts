import type { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: 'components/accordion',
        loadChildren: () => import('./routes/accordion/accordion.routes').then(m => m.ACCORDION_ROUTES),
      },
      {
        path: 'components/alert',
        loadChildren: () => import('./routes/alert/alert.routes').then(m => m.ALERT_ROUTES),
      },
      {
        path: 'components/badge',
        loadChildren: () => import('./routes/badge/badge.routes').then(m => m.BADGE_ROUTES),
      },
      {
        path: 'components/button',
        loadChildren: () => import('./routes/button/button.routes').then(m => m.BUTTON_ROUTES),
      },
      {
        path: 'components/card',
        loadChildren: () => import('./routes/card/card.routes').then(m => m.CARD_ROUTES),
      },
      {
        path: 'components/item',
        loadChildren: () => import('./routes/item/item.routes').then(m => m.ITEM_ROUTES),
      },
      {
        path: 'components/tabs',
        loadChildren: () => import('./routes/tabs/tabs.routes').then(m => m.TABS_ROUTES),
      },
      {
        path: 'components/tab-nav',
        loadChildren: () => import('./routes/tab-nav/tab-nav.routes').then(m => m.TAB_NAV_ROUTES),
      },
      {
        path: 'components/separator',
        loadChildren: () => import('./routes/separator/separator.routes').then(m => m.SEPARATOR_ROUTES),
      },
      {
        path: 'components/tooltip',
        loadChildren: () => import('./routes/tooltip/tooltip.routes').then(m => m.TOOLTIP_ROUTES),
      },
      {
        path: 'components/code-block',
        loadChildren: () => import('./routes/code-block/code-block.routes').then(m => m.CODE_BLOCK_ROUTES),
      },
      {
        path: 'components/segmented-control',
        loadChildren: () => import('./routes/segmented-control/segmented-control.routes').then(m => m.SEGMENTED_CONTROL_ROUTES),
      },
      {
        path: 'components/avatar',
        loadChildren: () => import('./routes/avatar/avatar.routes').then(m => m.AVATAR_ROUTES),
      },
      {
        path: 'components/icon',
        loadChildren: () => import('./routes/icon/icon.routes').then(m => m.ICON_ROUTES),
      },
      {
        path: 'components/menu',
        loadChildren: () => import('./routes/menu/menu.routes').then(m => m.MENU_ROUTES),
      },
      {
        path: 'components/collapsible',
        loadChildren: () => import('./routes/collapsible/collapsible.routes').then(m => m.COLLAPSIBLE_ROUTES),
      },
      {
        path: 'components/command-palette',
        loadChildren: () => import('./routes/command-palette/command-palette.routes').then(m => m.COMMAND_PALETTE_ROUTES),
      },
      {
        path: 'components/popover',
        loadChildren: () => import('./routes/popover/popover.routes').then(m => m.POPOVER_ROUTES),
      },
      {
        path: 'components/dialog',
        loadChildren: () => import('./routes/dialog/dialog.routes').then(m => m.DIALOG_ROUTES),
      },
      {
        path: 'components/toast',
        loadChildren: () => import('./routes/toast/toast.routes').then(m => m.TOAST_ROUTES),
      },
      {
        path: 'components/flip-card',
        loadChildren: () => import('./routes/flip-card/flip-card.routes').then(m => m.FLIP_CARD_ROUTES),
      },
      {
        path: 'components/form-field',
        loadChildren: () => import('./routes/form-field/form-field.routes').then(m => m.FORM_FIELD_ROUTES),
      },
      {
        path: 'components/input',
        loadChildren: () => import('./routes/input/input.routes').then(m => m.INPUT_ROUTES),
      },
      {
        path: 'components/switch',
        loadChildren: () => import('./routes/switch/switch.routes').then(m => m.SWITCH_ROUTES),
      },
      {
        path: 'components/checkbox',
        loadChildren: () => import('./routes/checkbox/checkbox.routes').then(m => m.CHECKBOX_ROUTES),
      },
      {
        path: 'components/radio',
        loadChildren: () => import('./routes/radio/radio.routes').then(m => m.RADIO_ROUTES),
      },
      {
        path: 'components/select',
        loadChildren: () => import('./routes/select/select.routes').then(m => m.SELECT_ROUTES),
      },
      {
        path: 'components/spinner',
        loadChildren: () => import('./routes/spinner/spinner.routes').then(m => m.SPINNER_ROUTES),
      },
      {
        path: 'components/skeleton',
        loadChildren: () => import('./routes/skeleton/skeleton.routes').then(m => m.SKELETON_ROUTES),
      },
      {
        path: 'components/progress-bar',
        loadChildren: () => import('./routes/progress-bar/progress-bar.routes').then(m => m.PROGRESS_BAR_ROUTES),
      },
      {
        path: 'components/calendar',
        loadChildren: () => import('./routes/calendar/calendar.routes').then(m => m.CALENDAR_ROUTES),
      },
      {
        path: 'components/date-picker',
        loadChildren: () => import('./routes/date-picker/date-picker.routes').then(m => m.DATE_PICKER_ROUTES),
      },
      {
        path: 'components/date-range-picker',
        loadChildren: () => import('./routes/date-range-picker/date-range-picker.routes').then(m => m.DATE_RANGE_PICKER_ROUTES),
      },
      {
        path: 'components/time-picker',
        loadChildren: () => import('./routes/time-picker/time-picker.routes').then(m => m.TIME_PICKER_ROUTES),
      },
      {
        path: 'components/slider',
        loadChildren: () => import('./routes/slider/slider.routes').then(m => m.SLIDER_ROUTES),
      },
      {
        path: 'components/stepper',
        loadChildren: () => import('./routes/stepper/stepper.routes').then(m => m.STEPPER_ROUTES),
      },
      {
        path: 'components/paginator',
        loadChildren: () => import('./routes/paginator/paginator.routes').then(m => m.PAGINATOR_ROUTES),
      },
      {
        path: 'components/sort',
        loadChildren: () => import('./routes/sort/sort.routes').then(m => m.SORT_ROUTES),
      },
      {
        path: 'components/table',
        loadChildren: () => import('./routes/table/table.routes').then(m => m.TABLE_ROUTES),
      },
      {
        path: 'services/theme',
        loadChildren: () => import('./routes/theme/theme.routes').then(m => m.THEME_ROUTES),
      },
      {
        path: '',
        redirectTo: 'components/button',
        pathMatch: 'full',
      },
    ],
  },
];
