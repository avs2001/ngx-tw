import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import { AvatarComponent, AvatarGroupComponent } from '@cdevhub/ngx-tw/avatar';
import { BadgeComponent, BadgeDotDirective } from '@cdevhub/ngx-tw/badge';
import { IconComponent } from '@cdevhub/ngx-tw/icon';
import { ItemComponent, ItemDescriptionDirective, ItemTitleDirective } from '@cdevhub/ngx-tw/item';
import type { ItemSize } from '@cdevhub/ngx-tw/item';
import { StatComponent, StatLabelDirective, StatValueDirective } from '@cdevhub/ngx-tw/stat';
import { SeparatorComponent } from '@cdevhub/ngx-tw/separator';
import { AspectRatioDirective } from '@cdevhub/ngx-tw/aspect-ratio';
import { SkeletonComponent } from '@cdevhub/ngx-tw/skeleton';
import { SpinnerComponent } from '@cdevhub/ngx-tw/spinner';
import { ProgressBarComponent } from '@cdevhub/ngx-tw/progress-bar';
import type { ProgressBarOptions, ProgressBarSize } from '@cdevhub/ngx-tw/progress-bar';
import { RhythmCell } from '../rhythm-cell';
import { RhythmPaper } from '../rhythm-paper';
import type { RhythmSettings } from '../rhythm-settings';

/**
 * `tw-item` publishes a narrower size axis than the toolbar (`ItemSize` is
 * `sm | md | lg`). The toolbar's ends clamp onto it rather than being dropped,
 * so the cell keeps re-measuring across the whole sweep.
 */
const ITEM_SIZE: Record<TwSize, ItemSize> = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg',
};

/** Same clamp for `tw-progress-bar`, whose `ProgressBarSize` is rail thickness only. */
const PROGRESS_SIZE: Record<TwSize, ProgressBarSize> = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg',
};

/**
 * Display primitives on the rhythm paper.
 *
 * These are the pieces that live *inside* other components — a badge in a table
 * cell, an avatar in a list row, a spinner in a button. None of them is a form
 * control, so none carries `group="form-row"`; what matters here is that their
 * heights are small, fixed, and predictable, because a host component only
 * stays on the baseline if the primitive it wraps does too.
 */
@Component({
  selector: 'app-display-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RhythmPaper,
    RhythmCell,
    AvatarComponent,
    AvatarGroupComponent,
    BadgeComponent,
    BadgeDotDirective,
    IconComponent,
    ItemComponent,
    ItemTitleDirective,
    ItemDescriptionDirective,
    StatComponent,
    StatLabelDirective,
    StatValueDirective,
    SeparatorComponent,
    AspectRatioDirective,
    SkeletonComponent,
    SpinnerComponent,
    ProgressBarComponent,
  ],
  template: `
    <app-rhythm-paper
      heading="Display primitives"
      lede="The small inline pieces that sit inside other components — so their heights are what
            decide whether their hosts stay on the grid."
      [settings]="settings()"
    >
      <app-rhythm-cell
        label="Avatar"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="container sub-scale — 24px at xs up to 64px at xl, above the glyph ceiling"
      >
        <tw-avatar initials="JD" color="primary" alt="Jane Doe" [size]="settings().size" />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Avatar group"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="the group's size overrides each child avatar's own size input"
      >
        <tw-avatar-group [size]="settings().size" aria-label="Project members">
          <tw-avatar initials="JD" color="primary" alt="Jane Doe" />
          <tw-avatar initials="AB" color="success" alt="Alice Brown" />
          <tw-avatar initials="MK" color="accent" alt="Mike Keller" />
        </tw-avatar-group>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Badge"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="[twBadge] — height is padding plus a text-xs/text-sm line box, not a control height"
      >
        <span twBadge [size]="settings().size" color="info" variant="soft">Active</span>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Badge dot"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="[twBadgeDot] — dot sub-scale, 6px at xs to 10px at xl; named via role=img so the pip
              can be measured bare instead of behind an adjacent label"
      >
        <span twBadgeDot [size]="settings().size" color="success" role="img" aria-label="Online"></span>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Icon"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="glyph sub-scale — 12px at xs to 32px at xl; decorative, so aria-hidden"
      >
        <tw-icon name="star" [size]="settings().size" />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Item"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="list row: size axis is sm/md/lg only, so the toolbar's xs and xl clamp to the ends"
      >
        <tw-item [size]="itemSize()">
          <span twItemTitle>Weekly digest</span>
          <span twItemDescription>Sent every Monday at 09:00.</span>
        </tw-item>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Stat"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="KPI tile — height is container padding plus the label/value stack"
      >
        <tw-stat [size]="settings().size" class="w-full">
          <span twStatLabel>Revenue</span>
          <span twStatValue>$24,580</span>
        </tw-stat>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Separator"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="no size input — a rule, so the reading is the 1px border itself, not a box"
      >
        <tw-separator />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Aspect ratio"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="no size input — height follows width, ratio-driven not size-driven (w-32 at 16/9 = 72px)"
      >
        <div twAspectRatio="16/9" class="w-32 rounded-lg bg-surface-muted"></div>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Skeleton"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="no size input — height comes from shape (text is h-4) or an explicit width/height"
      >
        <tw-skeleton />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Spinner"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="glyph sub-scale, track ring on by default — the arc alone would not read as loading"
      >
        <tw-spinner [size]="settings().size" color="primary" />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Progress bar"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
        note="rail thickness only (h-1/h-2/h-3); the toolbar's xs and xl clamp to the ends"
      >
        <tw-progress-bar [size]="progressSize()" [value]="42" [options]="progressOptions" />
      </app-rhythm-cell>
    </app-rhythm-paper>
  `,
})
export class DisplayPanel {
  /** Toolbar state forwarded from the rhythm page. */
  readonly settings = input.required<RhythmSettings>();

  /** Toolbar size clamped onto `tw-item`'s narrower `sm | md | lg` axis. */
  protected readonly itemSize = computed<ItemSize>(() => ITEM_SIZE[this.settings().size]);

  /** Toolbar size clamped onto `tw-progress-bar`'s narrower `sm | md | lg` axis. */
  protected readonly progressSize = computed<ProgressBarSize>(
    () => PROGRESS_SIZE[this.settings().size],
  );

  /**
   * Stable object so the bar is not re-configured on every change detection.
   * `ariaLabel` (rather than `label`) keeps the visible header off, so the
   * measured height is the rail alone.
   */
  protected readonly progressOptions: ProgressBarOptions = { ariaLabel: 'Upload progress' };
}
