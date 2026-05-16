"use client";

import { useEffect } from "react";

export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;

    const body = document.body;
    const html = document.documentElement;

    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevHtmlOverflow = html.style.overflow;

    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "contain";
    html.style.overflow = "hidden";

    return () => {
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [locked]);
}
