import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  getTheme,
  initializeTheme,
  setTheme,
  subscribeTheme,
} from "../src/lib/theme";

describe("theme preference", () => {
  let system: EventTarget & { matches: boolean };
  let browser: EventTarget;
  let values: Map<string, string>;
  let classes: Set<string>;
  let cleanup: (() => void) | undefined;
  let storageBlocked: boolean;
  let browserColor: string;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );

  beforeEach(() => {
    system = Object.assign(new EventTarget(), { matches: false });
    browser = new EventTarget();
    values = new Map();
    classes = new Set();
    storageBlocked = false;
    browserColor = "";
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: Object.assign(browser, {
        matchMedia: () => system,
        localStorage: {
          getItem(key: string) {
            if (storageBlocked) throw new Error("Storage unavailable");
            return values.get(key) ?? null;
          },
          setItem(key: string, value: string) {
            if (storageBlocked) throw new Error("Storage unavailable");
            values.set(key, value);
          },
        },
      }),
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        documentElement: {
          classList: {
            contains: (name: string) => classes.has(name),
            toggle(name: string, active: boolean) {
              if (active) classes.add(name);
              else classes.delete(name);
            },
          },
        },
        querySelector: () => ({
          setAttribute: (_name: string, value: string) => {
            browserColor = value;
          },
        }),
      },
    });
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  });

  test("follows system changes before a preference is selected", () => {
    cleanup = initializeTheme();
    expect(getTheme()).toBe("light");
    system.matches = true;
    system.dispatchEvent(new Event("change"));
    expect(getTheme()).toBe("dark");
    expect(browserColor).toBe("#090b10");
  });

  test("restores an explicit preference instead of the system theme", () => {
    system.matches = true;
    values.set("prostefakty-theme", "light");
    cleanup = initializeTheme();
    expect(getTheme()).toBe("light");
    expect(browserColor).toBe("#f1f5fa");
  });

  test("persists a selection and keeps it when the system changes", () => {
    cleanup = initializeTheme();
    setTheme("dark");
    expect(getTheme()).toBe("dark");
    expect(values.get("prostefakty-theme")).toBe("dark");
    system.dispatchEvent(new Event("change"));
    expect(getTheme()).toBe("dark");
  });

  test("treats invalid saved values as system preference", () => {
    values.set("prostefakty-theme", "invalid");
    system.matches = true;
    cleanup = initializeTheme();
    expect(getTheme()).toBe("dark");
  });

  test("allows a session preference when storage is unavailable", () => {
    storageBlocked = true;
    cleanup = initializeTheme();
    setTheme("dark");
    system.dispatchEvent(new Event("change"));
    expect(getTheme()).toBe("dark");
  });

  test("syncs another tab and follows the system after its preference is cleared", () => {
    cleanup = initializeTheme();
    values.set("prostefakty-theme", "dark");
    browser.dispatchEvent(new Event("storage"));
    expect(getTheme()).toBe("dark");
    values.delete("prostefakty-theme");
    browser.dispatchEvent(new Event("storage"));
    expect(getTheme()).toBe("light");
  });

  test("notifies subscribers and removes listeners on cleanup", () => {
    cleanup = initializeTheme();
    const observed: string[] = [];
    const unsubscribe = subscribeTheme(() => observed.push(getTheme()));
    setTheme("dark");
    unsubscribe();
    setTheme("light");
    expect(observed).toEqual(["dark"]);
    cleanup();
    cleanup = undefined;
    system.matches = true;
    system.dispatchEvent(new Event("change"));
    expect(getTheme()).toBe("light");
  });
});
