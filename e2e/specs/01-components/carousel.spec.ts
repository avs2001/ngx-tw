import { expect, test } from '../../fixtures/base';
import { CarouselPage } from '../../pages/carousel.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Carousel slide-sizing regression — see
 * `docs/prompts/tw-carousel-slide-sizing-refactor.md`.
 *
 * The jsdom suite in `projects/ngx-tw/carousel/carousel.spec.ts` proves the
 * host-style binding is wired (inline `flex-basis` matches `slideBasis()`)
 * but cannot prove the value resolves against real geometry. These browser
 * assertions are the load-bearing regression: each slide must measure exactly
 * one viewport along the main axis at `slidesPerView = 1`, and a navigation
 * to the last slide must visibly scroll the previous slides off-screen.
 *
 * Why scope every interaction through `carouselIn(...)`: the examples route
 * renders multiple autoplaying carousels, every one of which contributes
 * `[aria-label="Pause autoplay"]` to the page. Page-level locators would
 * race. The page object exposes section-scoped helpers (`heroSection`,
 * `verticalTickerSection`) so we never pick the wrong one.
 */
test.describe('Carousel — slide sizing', () => {
  test('@regression horizontal: each slide width equals viewport width, and activeIndex change scrolls the viewport', async ({
    page,
  }) => {
    const carouselPage = new CarouselPage(page);
    await carouselPage.goto();

    const carousel = carouselPage.carouselIn(carouselPage.heroSection);
    await expect(carousel).toBeVisible();

    // Stop autoplay so the geometry assertions are not racing the ticker.
    await carouselPage.pauseControlIn(carousel).click();

    const viewport = carouselPage.viewportIn(carousel);
    const slides = carouselPage.slidesIn(carousel);
    await expect(slides).toHaveCount(4);

    // Each slide's width must equal the viewport's clientWidth (±1px for sub-
    // pixel rounding). Without the fix, slides fall back to intrinsic width
    // (= content width, much smaller than the viewport) and every slide fits
    // in the viewport at once.
    const viewportWidth = await viewport.evaluate((el: HTMLElement) => el.clientWidth);
    const slideWidths = await slides.evaluateAll((els) =>
      (els as HTMLElement[]).map((el) => el.getBoundingClientRect().width),
    );
    expect(slideWidths.length).toBe(4);
    for (const width of slideWidths) {
      expect(Math.abs(width - viewportWidth)).toBeLessThanOrEqual(1);
    }

    // Click the fourth indicator dot — same path autoplay would take.
    const indicators = carousel.locator('tw-carousel-indicators button');
    await expect(indicators).toHaveCount(4);
    await indicators.nth(3).click();

    // Wait for the scroll to settle. Under `reducedMotion: 'reduce'` (set in
    // playwright.config.ts) the carousel resolves `scrollTo` to `'auto'` so
    // the position update is synchronous; still poll until scrollLeft lands
    // on the target rather than asserting on the next animation frame.
    await expect
      .poll(() =>
        viewport.evaluate((el: HTMLElement) => el.scrollLeft),
        { timeout: 2000 },
      )
      .toBeGreaterThan(0);

    const { scrollLeft, lastOffset, firstRight, viewportLeft } = await page.evaluate(() => {
      const carouselEl = document.querySelector(
        'tw-carousel[aria-label="Featured promotions"]',
      ) as HTMLElement;
      const viewportEl = carouselEl.querySelector(
        '[data-tw-carousel-viewport]',
      ) as HTMLElement;
      const slideEls = carouselEl.querySelectorAll(
        'tw-carousel-slide',
      ) as NodeListOf<HTMLElement>;
      return {
        scrollLeft: viewportEl.scrollLeft,
        lastOffset: slideEls[3].offsetLeft,
        firstRight: slideEls[0].getBoundingClientRect().right,
        viewportLeft: viewportEl.getBoundingClientRect().left,
      };
    });

    // The viewport must have scrolled to align slide 3, and slide 0 must now
    // sit entirely to the left of the viewport — together these prove the
    // navigation visibly moves content, not just the indicator dot.
    expect(Math.abs(scrollLeft - lastOffset)).toBeLessThanOrEqual(1);
    expect(firstRight).toBeLessThan(viewportLeft);
  });

  test('@regression vertical: each slide height equals viewport height (smoke check for vertical orientation)', async ({
    page,
  }) => {
    // NOTE: The vertical news ticker uses `class="h-16"` on the carousel host
    // AND `class="h-16"` on the inner content div. Under the buggy code, the
    // slide takes its content's intrinsic 64px height; under the fix, it takes
    // `flex-basis: 100%` of the 64px viewport. Both equal 64px, so this
    // assertion alone does NOT discriminate the bug. The discriminating test
    // is the horizontal Hero gallery above. This case stays as a wiring smoke
    // for the vertical axis — it proves the same flex-basis binding doesn't
    // crash or stretch incorrectly when `flex-direction: column` is in play.
    const carouselPage = new CarouselPage(page);
    await carouselPage.goto();

    const carousel = carouselPage.carouselIn(carouselPage.verticalTickerSection);
    await expect(carousel).toBeVisible();
    await carouselPage.pauseControlIn(carousel).click();

    const viewport = carouselPage.viewportIn(carousel);
    const slides = carouselPage.slidesIn(carousel);
    await expect(slides).toHaveCount(5);

    const viewportHeight = await viewport.evaluate((el: HTMLElement) => el.clientHeight);
    const slideHeights = await slides.evaluateAll((els) =>
      (els as HTMLElement[]).map((el) => el.getBoundingClientRect().height),
    );
    expect(viewportHeight).toBeGreaterThan(0);
    for (const height of slideHeights) {
      expect(Math.abs(height - viewportHeight)).toBeLessThanOrEqual(1);
    }
  });
});
