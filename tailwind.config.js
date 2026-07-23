const colorVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: colorVar("--color-primary"),
        "primary-container": colorVar("--color-primary-container"),
        "primary-fixed": colorVar("--color-primary-fixed"),
        "primary-fixed-dim": colorVar("--color-primary-fixed-dim"),
        secondary: colorVar("--color-secondary"),
        "secondary-container": colorVar("--color-secondary-container"),
        "secondary-fixed": colorVar("--color-secondary-fixed"),
        "secondary-fixed-dim": colorVar("--color-secondary-fixed-dim"),
        background: colorVar("--color-background"),
        surface: colorVar("--color-surface"),
        "surface-bright": colorVar("--color-surface-bright"),
        "surface-container-lowest": colorVar("--color-surface-container-lowest"),
        "surface-container-low": colorVar("--color-surface-container-low"),
        "surface-container": colorVar("--color-surface-container"),
        "surface-container-high": colorVar("--color-surface-container-high"),
        "surface-container-highest": colorVar("--color-surface-container-highest"),
        "surface-variant": colorVar("--color-surface-variant"),
        outline: colorVar("--color-outline"),
        "outline-variant": colorVar("--color-outline-variant"),
        "on-surface": colorVar("--color-on-surface"),
        "on-surface-variant": colorVar("--color-on-surface-variant"),
        "on-background": colorVar("--color-on-background"),
        "on-primary": colorVar("--color-on-primary"),
        "on-primary-container": colorVar("--color-on-primary-container"),
        "on-error-container": colorVar("--color-on-error-container"),
        "on-secondary-fixed": colorVar("--color-on-secondary-fixed"),
        "on-secondary-fixed-variant": colorVar("--color-on-secondary-fixed-variant"),
        error: colorVar("--color-error"),
        "error-container": colorVar("--color-error-container"),
        tertiary: colorVar("--color-tertiary"),
        "tertiary-container": colorVar("--color-tertiary-container"),
        success: colorVar("--color-success"),

        cornsilk: colorVar("--color-surface-container-lowest"),
        ecru: colorVar("--color-primary-fixed"),
        "light-red": colorVar("--color-primary-fixed-dim"),
        maroon: colorVar("--color-primary"),
        "black-bean": colorVar("--color-black-bean"),
        "rose-white": colorVar("--color-surface-container-lowest"),
        "rose-mist": colorVar("--color-surface-container-low"),
        cream: colorVar("--color-background"),
        line: colorVar("--color-surface-variant")
      },
      spacing: {
        base: "4px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        gutter: "16px",
        "margin-mobile": "20px",
        lg: "24px",
        xl: "32px",
        "margin-desktop": "40px"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "label-sm": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "label-md": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "body-md": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "body-lg": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "headline-md": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "headline-lg": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "headline-lg-mobile": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      fontSize: {
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" }
        ],
        display: ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "700" }]
      }
    }
  },
  plugins: []
};
