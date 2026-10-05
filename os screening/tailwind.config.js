/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette - Deep Moss
        "primary": "#284536",
        "on-primary": "#ffffff",
        "primary-container": "#3f5d4c",
        "on-primary-container": "#b3d4bf",
        "primary-fixed": "#c9ebd4",
        "primary-fixed-dim": "#adceb9",
        "on-primary-fixed": "#022113",
        "on-primary-fixed-variant": "#2f4d3d",
        "inverse-primary": "#adceb9",
        // Secondary palette - Warm Clay/Terracotta (High Risk)
        "secondary": "#924a2f",
        "on-secondary": "#ffffff",
        "secondary-container": "#fda280",
        "on-secondary-container": "#77361c",
        "secondary-fixed": "#ffdbcf",
        "secondary-fixed-dim": "#ffb59a",
        "on-secondary-fixed": "#380d00",
        "on-secondary-fixed-variant": "#74341a",
        // Tertiary palette - Warm Amber (Moderate Risk)
        "tertiary": "#583900",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#774e00",
        "on-tertiary-container": "#fcc270",
        "tertiary-fixed": "#ffddb2",
        "tertiary-fixed-dim": "#f5bc6b",
        "on-tertiary-fixed": "#291800",
        "on-tertiary-fixed-variant": "#624000",
        // Surface palette
        "surface": "#f1fcf5",
        "surface-bright": "#f1fcf5",
        "surface-dim": "#d1ddd6",
        "surface-variant": "#dae5df",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#ebf6f0",
        "surface-container": "#e5f1ea",
        "surface-container-high": "#dfebe4",
        "surface-container-highest": "#dae5df",
        "surface-tint": "#476554",
        "on-surface": "#141e1a",
        "on-surface-variant": "#424843",
        "inverse-surface": "#28332e",
        "inverse-on-surface": "#e8f3ed",
        // Error
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        // Outline
        "outline": "#727973",
        "outline-variant": "#c2c8c2",
        // Background
        "background": "#f1fcf5",
        "on-background": "#141e1a",
      },
      fontFamily: {
        sans: ["Atkinson Hyperlegible Next", "sans-serif"],
        headline: ["Work Sans", "sans-serif"],
      },
      fontSize: {
        "headline-xl": ["36px", { lineHeight: "44px", fontWeight: "700", letterSpacing: "-0.02em" }],
        "headline-xl-mobile": ["28px", { lineHeight: "36px", fontWeight: "700", letterSpacing: "-0.01em" }],
        "headline-lg": ["28px", { lineHeight: "36px", fontWeight: "600" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-md": ["22px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-lg": ["16px", { lineHeight: "22px", fontWeight: "700", letterSpacing: "0.01em" }],
        "label-md": ["14px", { lineHeight: "18px", fontWeight: "600", letterSpacing: "0.02em" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.03em" }],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",    // 8px - buttons, inputs, badges
        xl: "0.75rem",   // 12px - cards, form fields
        "2xl": "1rem",   // 16px - larger cards
        "3xl": "1.5rem", // 24px - floating controls
        full: "9999px",  // pills, avatars
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2.5rem",
        "gutter": "1rem",
        "gutter-tablet": "1.5rem",
        "gutter-desktop": "2rem",
        "margin": "1rem",
        "margin-tablet": "2rem",
        "margin-desktop": "3rem",
      },
      boxShadow: {
        "card-1": "0 2px 4px rgba(26,36,32,0.06), 0 1px 2px rgba(26,36,32,0.04)",
        "card-2": "0 8px 20px rgba(26,36,32,0.10)",
        "header": "0 1px 8px rgba(20,30,26,0.05)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
}
