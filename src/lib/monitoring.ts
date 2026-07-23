let monitoringEnabled = false;
let sentryClient: typeof import("@sentry/react") | undefined;

export async function initializeMonitoring(): Promise<boolean> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!import.meta.env.PROD || !dsn || monitoringEnabled) {
    return false;
  }

  try {
    const Sentry = await import("@sentry/react");

    Sentry.init({
      dsn,
      enabled: true,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      integrations(defaultIntegrations) {
        return defaultIntegrations.filter((integration) => integration.name !== "BrowserSession");
      },
      beforeBreadcrumb: () => null,
      beforeSend(event) {
        if (!event.exception) {
          return null;
        }

        event.breadcrumbs = undefined;
        event.contexts = undefined;
        event.extra = undefined;
        event.message = undefined;
        event.request = undefined;
        event.tags = undefined;
        event.transaction = undefined;
        event.user = undefined;

        if (event.exception?.values) {
          event.exception.values = event.exception.values.map((exception) => ({
            ...exception,
            value: "Application error"
          }));
        }

        return event;
      }
    });

    sentryClient = Sentry;
    monitoringEnabled = true;
    return true;
  } catch {
    return false;
  }
}

export function captureApplicationError(error: unknown) {
  if (monitoringEnabled && sentryClient) {
    sentryClient.captureException(error);
  }
}
