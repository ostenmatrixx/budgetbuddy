export const INSTALLED_APP_DISPLAY_MODE_QUERIES = [
  "(display-mode: standalone)",
  "(display-mode: minimal-ui)",
  "(display-mode: window-controls-overlay)"
] as const;

export function isInstalledAppDisplayMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    INSTALLED_APP_DISPLAY_MODE_QUERIES.some((query) => window.matchMedia(query).matches) ||
    iosNavigator.standalone === true
  );
}
