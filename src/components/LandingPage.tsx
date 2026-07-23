import { useState } from "react";
import { usePwaInstall } from "../hooks/usePwaInstall";
import BrandIcon from "./BrandIcon";
import ThemeToggle, { type ThemeMode } from "./ThemeToggle";

interface LandingPageProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const featureCards = [
  {
    icon: "receipt_long",
    number: "01",
    title: "Everything in one monthly view",
    description:
      "Log income and spending, then see your balance, categories, and daily activity without spreadsheet upkeep."
  },
  {
    icon: "tune",
    number: "02",
    title: "A budget that fits your priorities",
    description:
      "Shape your essentials, savings, and non-essential targets around the way you actually manage money."
  },
  {
    icon: "bar_chart",
    number: "03",
    title: "Patterns you can act on",
    description:
      "Move between monthly and annual reports to understand where your money is going over time."
  }
] as const;

interface InstallGuidance {
  buttonLabel: string;
  hint: string;
  instructions: string;
  steps: Array<{ title: string; description: string }>;
  title: string;
}

type InstallMessageTarget = "hero" | "section";

export default function LandingPage({ onToggleTheme, theme }: LandingPageProps) {
  const { canInstall, install, isIos } = usePwaInstall();
  const [isPrompting, setIsPrompting] = useState(false);
  const [installMessage, setInstallMessage] = useState("");
  const [installMessageTarget, setInstallMessageTarget] = useState<InstallMessageTarget>("hero");
  const installGuidance = getInstallGuidance(isIos);

  async function handleInstall(target: InstallMessageTarget) {
    setInstallMessageTarget(target);
    setInstallMessage("");

    if (!canInstall) {
      setInstallMessage(installGuidance.instructions);
      if (target === "section") {
        document.getElementById("install")?.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    setIsPrompting(true);
    try {
      const accepted = await install();
      setInstallMessage(
        accepted
          ? "BudgetBuddy is installing. Open it from your home screen or app launcher."
          : "Installation was not completed. You can try again from your browser menu."
      );
    } finally {
      setIsPrompting(false);
    }
  }

  return (
    <main className="landing-page">
      <header className="landing-header">
        <a className="landing-brand" href="#top" aria-label="BudgetBuddy home">
          <BrandIcon className="h-8 w-8 shrink-0" />
          <span>BudgetBuddy</span>
        </a>

        <nav className="landing-nav" aria-label="Landing page">
          <a href="#features">Features</a>
          <a href="#install">How to install</a>
        </nav>

        <div className="landing-header-actions">
          <ThemeToggle compact theme={theme} onToggle={onToggleTheme} />
          <button
            className="landing-install-button is-compact"
            type="button"
            onClick={() => void handleInstall("section")}
          >
            {canInstall ? "Install app" : "Install guide"}
          </button>
        </div>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">
            <span aria-hidden="true" />A clearer relationship with money
          </p>
          <h1>
            See the month clearly.
            <br />
            <em>Spend with intention.</em>
          </h1>
          <p className="landing-hero-description">
            BudgetBuddy brings income, essentials, savings, and everyday spending into one calm
            place—so you can make the next decision with context.
          </p>

          <div className="landing-hero-actions">
            <button
              className="landing-install-button"
              disabled={isPrompting}
              type="button"
              onClick={() => void handleInstall("hero")}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                system_update_alt
              </span>
              {isPrompting
                ? "Opening installer…"
                : canInstall
                  ? "Install BudgetBuddy"
                  : installGuidance.buttonLabel}
            </button>
            <a href="#features">Explore the details</a>
          </div>

          <p className="landing-install-note">
            <span className="material-symbols-outlined" aria-hidden="true">
              check_circle
            </span>
            The full app opens only from your installed copy.
          </p>
          <p className="landing-platform-hint">
            <strong>{installGuidance.title}:</strong> {installGuidance.hint}
          </p>
          <InstallMessage
            guidanceTitle={installGuidance.title}
            message={installMessageTarget === "hero" ? installMessage : ""}
          />
        </div>

        <div
          className="landing-preview-wrap"
          aria-label="Illustrative BudgetBuddy dashboard preview"
        >
          <div className="landing-preview-stamp" aria-hidden="true">
            <span>Sample</span>
            <strong>Monthly view</strong>
          </div>
          <div className="landing-preview">
            <div className="landing-preview-topbar">
              <div className="landing-preview-brand">
                <BrandIcon className="h-7 w-7" />
                <strong>BudgetBuddy</strong>
              </div>
              <span className="landing-avatar">A</span>
            </div>

            <div className="landing-preview-body">
              <div className="landing-preview-heading">
                <div>
                  <span>Overview</span>
                  <strong>August</strong>
                </div>
                <button type="button" tabIndex={-1}>
                  + New entry
                </button>
              </div>

              <div className="landing-balance-card">
                <span>Available balance</span>
                <strong>₱18,450.00</strong>
                <small>
                  <span aria-hidden="true">↗</span> ₱3,200 ahead of last month
                </small>
              </div>

              <div className="landing-preview-grid">
                <div className="landing-budget-card">
                  <div className="landing-card-label">
                    <span>Budget allocation</span>
                    <small>On track</small>
                  </div>
                  <div className="landing-donut" aria-hidden="true">
                    <div>
                      <strong>68%</strong>
                      <span>allocated</span>
                    </div>
                  </div>
                  <ul>
                    <li>
                      <span className="is-red" />
                      Essentials <strong>50%</strong>
                    </li>
                    <li>
                      <span className="is-rose" />
                      Savings <strong>30%</strong>
                    </li>
                    <li>
                      <span className="is-taupe" />
                      Lifestyle <strong>20%</strong>
                    </li>
                  </ul>
                </div>

                <div className="landing-activity-card">
                  <div className="landing-card-label">
                    <span>Recent activity</span>
                    <small>Today</small>
                  </div>
                  <div className="landing-activity-row">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      shopping_bag
                    </span>
                    <div>
                      <strong>Groceries</strong>
                      <small>Essentials</small>
                    </div>
                    <b>−₱1,240</b>
                  </div>
                  <div className="landing-activity-row">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      savings
                    </span>
                    <div>
                      <strong>Future fund</strong>
                      <small>Savings</small>
                    </div>
                    <b>−₱3,000</b>
                  </div>
                  <div className="landing-activity-row">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      payments
                    </span>
                    <div>
                      <strong>Monthly pay</strong>
                      <small>Income</small>
                    </div>
                    <b className="is-positive">+₱26,500</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features" aria-labelledby="features-title">
        <div className="landing-section-heading">
          <p>Built for the everyday</p>
          <h2 id="features-title">Less financial noise. More useful signals.</h2>
        </div>
        <div className="landing-feature-grid">
          {featureCards.map((feature) => (
            <article key={feature.number} className="landing-feature-card">
              <div>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {feature.icon}
                </span>
                <small>{feature.number}</small>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-install-section" id="install" aria-labelledby="install-title">
        <div className="landing-install-copy">
          <p>Install once. Keep it close.</p>
          <h2 id="install-title">Your budget belongs on your home screen.</h2>
          <p>
            BudgetBuddy is an install-first web app. Once added to your device, it launches in its
            own focused window and keeps the full account experience out of the browser tab.
          </p>
          <button
            className="landing-install-button is-light"
            disabled={isPrompting}
            type="button"
            onClick={() => void handleInstall("section")}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              system_update_alt
            </span>
            {canInstall ? "Install the app" : installGuidance.buttonLabel}
          </button>
          <InstallMessage
            guidanceTitle={installGuidance.title}
            isLight
            message={installMessageTarget === "section" ? installMessage : ""}
          />
        </div>

        <ol className="landing-install-steps">
          {installGuidance.steps.map((step, index) => (
            <li key={step.title}>
              <span>{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="landing-footer">
        <div className="landing-brand">
          <BrandIcon className="h-7 w-7 shrink-0" />
          <span>BudgetBuddy</span>
        </div>
        <p>A personal budget tracker, made for clearer decisions.</p>
        <div>
          <a href="/privacy.html">Privacy</a>
          <a href="/terms.html">Terms</a>
          <a href="https://github.com/ostenmatrixx/budget-tracker/security" rel="noreferrer">
            Security
          </a>
        </div>
      </footer>
    </main>
  );
}

function InstallMessage({
  guidanceTitle,
  isLight = false,
  message
}: {
  guidanceTitle: string;
  isLight?: boolean;
  message: string;
}) {
  return (
    <div className={`landing-install-message${isLight ? " is-light" : ""}`} aria-live="polite">
      {message ? (
        <>
          <strong>{guidanceTitle}</strong>
          <p>{message}</p>
        </>
      ) : null}
    </div>
  );
}

function getInstallGuidance(isIos: boolean): InstallGuidance {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const isSafari =
    /Safari/i.test(userAgent) && !/(Chrome|Chromium|CriOS|Edg|EdgiOS|FxiOS|OPiOS)/i.test(userAgent);
  const isMacSafari = isSafari && /Macintosh|Mac OS X/i.test(userAgent);
  const isChromium = /(Chrome|Chromium|CriOS|Edg|EdgiOS)/i.test(userAgent);

  if (isIos && !isSafari) {
    return {
      buttonLabel: "Show install steps",
      title: "iPhone or iPad",
      hint: "Installation must be completed in Safari.",
      instructions:
        "Open this page in Safari first. Tap Share, choose “Add to Home Screen,” turn on “Open as Web App,” then tap Add.",
      steps: [
        {
          title: "Open this page in Safari",
          description:
            "Copy this page’s address and open it in Safari; other iOS browsers cannot install it."
        },
        {
          title: "Add it to your Home Screen",
          description:
            "Tap Share, choose “Add to Home Screen,” turn on “Open as Web App,” then tap Add."
        },
        {
          title: "Open BudgetBuddy",
          description: "Launch the new BudgetBuddy icon from your Home Screen to sign in."
        }
      ]
    };
  }

  if (isIos) {
    return {
      buttonLabel: "Show install steps",
      title: "Safari on iPhone or iPad",
      hint: "Use Share → Add to Home Screen.",
      instructions:
        "Tap Safari’s Share button, choose “Add to Home Screen,” turn on “Open as Web App,” then tap Add.",
      steps: [
        {
          title: "Tap Safari’s Share button",
          description: "Open the Share menu from Safari’s toolbar."
        },
        {
          title: "Choose Add to Home Screen",
          description: "Turn on “Open as Web App,” then tap Add to confirm."
        },
        {
          title: "Open BudgetBuddy",
          description: "Launch the new BudgetBuddy icon from your Home Screen to sign in."
        }
      ]
    };
  }

  if (isMacSafari) {
    return {
      buttonLabel: "Show install steps",
      title: "Safari on Mac",
      hint: "Use File or Share → Add to Dock.",
      instructions:
        "In Safari, choose File → Add to Dock, or Share → Add to Dock, then click Add. This requires macOS Sonoma 14 or later.",
      steps: [
        {
          title: "Choose Add to Dock",
          description: "In Safari, use File → Add to Dock or Share → Add to Dock."
        },
        {
          title: "Confirm the web app",
          description: "Review the BudgetBuddy name and icon, then click Add."
        },
        {
          title: "Open BudgetBuddy",
          description: "Launch it from your Dock, Applications folder, or Spotlight to sign in."
        }
      ]
    };
  }

  if (isChromium) {
    return {
      buttonLabel: "How to install",
      title: "Chrome or Edge",
      hint: "The button opens the browser’s secure install confirmation.",
      instructions:
        "Use the Install icon in the address bar. If it is not shown, open the browser menu and choose the option to install BudgetBuddy.",
      steps: [
        {
          title: "Select Install BudgetBuddy",
          description: "Use the button here to open Chrome or Edge’s installation confirmation."
        },
        {
          title: "Confirm Install",
          description: "The browser will show BudgetBuddy’s name and app icon before adding it."
        },
        {
          title: "Open BudgetBuddy",
          description: "Launch it from your home screen, dock, or app launcher to sign in."
        }
      ]
    };
  }

  return {
    buttonLabel: "How to install",
    title: "Your browser",
    hint: "We’ll show the installation path available on your device.",
    instructions:
      "For the simplest install, open this page in Chrome, Edge, or Safari and use that browser’s install or add-to-device option.",
    steps: [
      {
        title: "Open a supported browser",
        description: "Use Chrome or Edge, or Safari on an Apple device."
      },
      {
        title: "Add BudgetBuddy",
        description: "Use the browser’s install, Add to Home Screen, or Add to Dock option."
      },
      {
        title: "Open BudgetBuddy",
        description: "Launch it from your home screen, dock, or app launcher to sign in."
      }
    ]
  };
}
