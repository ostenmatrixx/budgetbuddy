/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#af101a",
        "primary-container": "#d32f2f",
        "primary-fixed": "#ffdad6",
        "primary-fixed-dim": "#ffb3ac",
        secondary: "#9e4039",
        "secondary-container": "#fb877d",
        "secondary-fixed": "#ffdad6",
        "secondary-fixed-dim": "#ffb4ac",
        background: "#f9f9fb",
        surface: "#f9f9fb",
        "surface-bright": "#f9f9fb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f5",
        "surface-container": "#eeeef0",
        "surface-container-high": "#e8e8ea",
        "surface-container-highest": "#e2e2e4",
        "surface-variant": "#e2e2e4",
        outline: "#8f6f6c",
        "outline-variant": "#e4beba",
        "on-surface": "#1a1c1d",
        "on-surface-variant": "#5b403d",
        "on-background": "#1a1c1d",
        "on-primary": "#ffffff",
        "on-primary-container": "#fff2f0",
        "on-error-container": "#93000a",
        "on-secondary-fixed": "#410003",
        "on-secondary-fixed-variant": "#7f2924",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        tertiary: "#455b65",
        "tertiary-container": "#5e737d",
        success: "#2E7D32",

        cornsilk: "#ffffff",
        ecru: "#ffdad6",
        "light-red": "#ffb3ac",
        maroon: "#af101a",
        "black-bean": "#1a1c1d",
        "rose-white": "#ffffff",
        "rose-mist": "#f3f3f5",
        cream: "#f9f9fb",
        line: "#e2e2e4"
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
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" }],
        display: ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "700" }]
      }
    }
  },
  plugins: []
};
