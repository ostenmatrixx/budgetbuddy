import type { Page } from "@playwright/test";

export async function emulateInstalledPwa(page: Page) {
  await page.addInitScript(() => {
    const browserMatchMedia = window.matchMedia.bind(window);

    window.matchMedia = (query: string) => {
      const result = browserMatchMedia(query);

      if (query !== "(display-mode: standalone)") {
        return result;
      }

      return new Proxy(result, {
        get(target, property) {
          if (property === "matches") {
            return true;
          }

          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        }
      });
    };
  });
}
