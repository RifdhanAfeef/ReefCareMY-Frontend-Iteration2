"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

let lastNavigationUsedKeyboard = false;

export function RouteFocusManager() {
  const pathname = usePathname();

  useEffect(() => {
    const rememberKeyboardNavigation = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      lastNavigationUsedKeyboard = true;
    };
    const rememberPointerNavigation = () => {
      lastNavigationUsedKeyboard = false;
    };

    document.addEventListener("keydown", rememberKeyboardNavigation, true);
    document.addEventListener("pointerdown", rememberPointerNavigation, true);
    return () => {
      document.removeEventListener("keydown", rememberKeyboardNavigation, true);
      document.removeEventListener("pointerdown", rememberPointerNavigation, true);
    };
  }, []);

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("main h1");
    if (!heading) return;

    heading.tabIndex = -1;
    heading.style.outline = lastNavigationUsedKeyboard ? "" : "none";
    heading.style.outlineOffset = lastNavigationUsedKeyboard ? "" : "0";
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
