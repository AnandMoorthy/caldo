import { useEffect, useRef, useState } from "react";

/**
 * Mobile chrome pattern: hide on scroll-down, reveal on scroll-up.
 * Listens on document with capture so nested scrollers (e.g. TaskList) are included —
 * scroll events do not bubble, so a container-only listener would miss them.
 */
export default function useHideOnScroll(
  containerRef,
  { enabled = true, threshold = 10, topReveal = 28, resetKey = null } = {}
) {
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(new WeakMap());
  const hiddenRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      hiddenRef.current = false;
      setHidden(false);
      return undefined;
    }

    function setHiddenState(next) {
      if (hiddenRef.current === next) return;
      hiddenRef.current = next;
      setHidden(next);
    }

    function onScroll(event) {
      const root = containerRef?.current;
      if (!root) return;

      const el = event.target;
      if (!(el instanceof Element)) return;
      if (el !== root && !root.contains(el)) return;

      // Ignore non-vertical scroll containers (e.g. horizontal carousels)
      try {
        if (el.scrollHeight <= el.clientHeight + 1) return;
      } catch {
        return;
      }

      const y = el.scrollTop || 0;
      const prev = lastYRef.current.get(el);
      if (typeof prev !== "number") {
        lastYRef.current.set(el, y);
        if (y <= topReveal) setHiddenState(false);
        return;
      }

      const delta = y - prev;
      lastYRef.current.set(el, y);
      if (Math.abs(delta) < 1) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (y <= topReveal) {
          setHiddenState(false);
          return;
        }
        if (delta > threshold) setHiddenState(true);
        else if (delta < -threshold) setHiddenState(false);
      });
    }

    // document + capture reaches nested overflow scrollers; container-only does not
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, enabled, threshold, topReveal]);

  // Reset when disabling (desktop) or when the caller asks (tab change)
  useEffect(() => {
    hiddenRef.current = false;
    setHidden(false);
    lastYRef.current = new WeakMap();
  }, [enabled, resetKey]);

  return hidden;
}
