export type Theme = "light" | "dark";

const storageKey = "prostefakty-theme";
let preference: Theme | null = null;

function readPreference(): Theme | null {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#090b10" : "#f1f5fa");
  window.dispatchEvent(new Event("themechange"));
}

export function initializeTheme() {
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  preference = readPreference();
  const sync = () =>
    applyTheme(preference ?? (system.matches ? "dark" : "light"));
  const onStorage = () => {
    preference = readPreference();
    sync();
  };

  sync();
  system.addEventListener("change", sync);
  window.addEventListener("storage", onStorage);
  return () => {
    system.removeEventListener("change", sync);
    window.removeEventListener("storage", onStorage);
  };
}

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function subscribeTheme(onChange: () => void) {
  window.addEventListener("themechange", onChange);
  return () => window.removeEventListener("themechange", onChange);
}

export function setTheme(theme: Theme) {
  preference = theme;
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // The selected theme still works for this session when storage is blocked.
  }
  applyTheme(theme);
}
