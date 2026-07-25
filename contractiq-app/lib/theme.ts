export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'contractiq-theme'

// Runs as a blocking inline <script> — the very first thing in <body>, per
// app/layout.tsx — so the correct `dark` class is already on <html> before
// React hydrates and before first paint. Without this, the page would
// briefly flash the light theme (server-rendered default) even for a user
// who has dark mode saved, then snap to dark once React mounts. Deliberately
// plain string interpolation, not a React component — it must execute
// synchronously as raw HTML, not through React's render cycle.
export function themeInitScript(): string {
  return `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`
}
