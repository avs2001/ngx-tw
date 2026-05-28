import { expect, type Locator, type Page } from '@playwright/test';

export type CarouselSectionName =
  | 'Hero gallery'
  | 'Product gallery'
  | 'Testimonials'
  | 'Onboarding tour'
  | 'Vertical news ticker'
  | 'Indicator variants'
  | 'Playground';

/**
 * Thin POM for the carousel examples route. Scoping is by section heading so
 * the Hero gallery (horizontal autoplay) and Vertical news ticker (vertical
 * autoplay) interactions never leak across each other — both carousels render
 * a `[aria-label="Pause autoplay"]` button and the examples route has several
 * of them on screen at once.
 */
export class CarouselPage {
  readonly main: Locator;

  readonly heroSection: Locator;
  readonly verticalTickerSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.heroSection = this.section('Hero gallery');
    this.verticalTickerSection = this.section('Vertical news ticker');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/carousel/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Returns the `<tw-carousel>` host inside the given section. */
  carouselIn(section: Locator): Locator {
    return section.locator('tw-carousel').first();
  }

  /** Returns the scrollable viewport element inside the given carousel host. */
  viewportIn(carousel: Locator): Locator {
    return carousel.locator('[data-tw-carousel-viewport]');
  }

  /** Returns the slide hosts inside the given carousel host. */
  slidesIn(carousel: Locator): Locator {
    return carousel.locator('tw-carousel-slide');
  }

  /** Pause-autoplay control rendered by the carousel when `autoplay` is on. */
  pauseControlIn(carousel: Locator): Locator {
    return carousel.locator('button[aria-label="Pause autoplay"]');
  }

  private section(name: CarouselSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
