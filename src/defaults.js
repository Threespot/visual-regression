const DISABLE_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
  }
`;

const HIDE_ADMIN_BAR_CSS = `
  #wpadminbar { display: none !important; }
  html { margin-top: 0 !important; }
`;

const SETTLE_DELAY_MS = 500;

async function applyWordPressDefaults(page) {
  await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS + HIDE_ADMIN_BAR_CSS });

  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const images = Array.from(document.images);
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
            })
      )
    );
  });

  await page.waitForTimeout(SETTLE_DELAY_MS);
}

module.exports = {
  applyWordPressDefaults,
  DISABLE_ANIMATIONS_CSS,
  HIDE_ADMIN_BAR_CSS,
  SETTLE_DELAY_MS,
};
