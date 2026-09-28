// Resets a dialog's `pending` state when the page is restored from the bfcache (back/forward navigation) instead
// of a fresh load — a `pageshow` event with `persisted: true`. Without this, a submit button that set `pending`
// before navigating away (e.g. a form POST) stays stuck on its pending text forever after the user hits "back"
// (undo-import F4, S-04 F8). `onPersistedPageShow` is the pure, directly-testable half — it takes any
// `EventTarget` so a unit test can drive it without a DOM (`new EventTarget()` + a plain `Event`); `usePageShowReset`
// is the thin `useEffect` wiring it to `window` for real components.
import { useEffect } from "react";

export function onPersistedPageShow(target: EventTarget, callback: () => void): () => void {
  const handlePageShow = (event: Event) => {
    if ((event as PageTransitionEvent).persisted) {
      callback();
    }
  };
  target.addEventListener("pageshow", handlePageShow);
  return () => {
    target.removeEventListener("pageshow", handlePageShow);
  };
}

export function usePageShowReset(reset: () => void): void {
  useEffect(() => onPersistedPageShow(window, reset), [reset]);
}
