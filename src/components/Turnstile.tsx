import { useEffect, useRef } from "react";

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      theme: "auto";
    }
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const scriptId = "cloudflare-turnstile-script";
let scriptPromise: Promise<void> | undefined;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load CAPTCHA.")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Unable to load CAPTCHA.")), {
      once: true
    });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

interface TurnstileProps {
  action: "signin" | "signup" | "password_reset" | "resend_confirmation" | "delete_account";
  onTokenChange: (token: string | null) => void;
  siteKey?: string;
}

export default function Turnstile({ action, onTokenChange, siteKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey) {
      onTokenChange(null);
      return;
    }

    let isActive = true;
    let widgetId: string | undefined;

    loadTurnstile()
      .then(() => {
        if (!isActive || !containerRef.current || !window.turnstile) {
          return;
        }

        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          callback: (token) => onTokenChange(token),
          "error-callback": () => onTokenChange(null),
          "expired-callback": () => onTokenChange(null),
          theme: "auto"
        });
      })
      .catch(() => {
        if (isActive) {
          onTokenChange(null);
        }
      });

    return () => {
      isActive = false;
      onTokenChange(null);

      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [action, onTokenChange, siteKey]);

  if (!siteKey) {
    return null;
  }

  return <div ref={containerRef} className="min-h-[65px]" aria-label="Security check" />;
}
