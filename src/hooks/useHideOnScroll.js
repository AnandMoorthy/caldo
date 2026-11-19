import { useEffect, useRef, useState } from "react";

/**
 * Mobile chrome: hide on sustained scroll-down, reveal on sustained scroll-up.
 *
 * Document capture includes nested scrollers (scroll does not bubble).
 * Uses sponge accumulation + post-toggle lock so layout reflow from collapsing
 * chrome cannot flip state mid-gesture (the old height-tween flicker).
 */
export default function useHideOnScroll(
  containerRef,
  {
    enabled = true,
    /** |accumulated delta| required before toggling */
    threshold = 56,
    /** Always show chrome near the top of the scroller */
    topReveal = 16,
    /** Ignore scroll briefly after a toggle (covers layout reflow noise) */
    lockMs = 360,
    /** Cap on |accum| so stale progress cannot overshoot */
    accumCap = 120,
    resetKey = null,
  } = {}
) {
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(new WeakMap());
  const hiddenRef = useRef(false);
  const accumRef = useRef(0);
  const lockUntilRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      hiddenRef.current = false;
      setHidden(false);
      accumRef.current = 0;
      return undefined;
    }

    function setHiddenState(next) {
      if (hiddenRef.current === next) return;
      hiddenRef.current = next;
      accumRef.current = 0;
      lockUntilRef.current = performance.now() + lockMs;
      setHidden(next);
    }

    function onScroll(event) {
      const root = containerRef?.current;
      if (!root) return;

      const el = event.target;
      if (!(el instanceof Element)) return;
      if (el !== root && !root.contains(el)) return;

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
      if (delta === 0) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (y <= topReveal) {
          setHiddenState(false);
          return;
        }
        if (performance.now() < lockUntilRef.current) return;

        // Sponge: reverse micro-jitter only nibbles progress; does not hard-reset
        let next = accumRef.current + delta;
        if (next > accumCap) next = accumCap;
        if (next < -accumCap) next = -accumCap;
        accumRef.current = next;

        if (!hiddenRef.current && next >= threshold) {
          setHiddenState(true);
        } else if (hiddenRef.current && next <= -threshold) {
          setHiddenState(false);
        }
      });
    }

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, enabled, threshold, topReveal, lockMs, accumCap]);

  useEffect(() => {
    hiddenRef.current = false;
    setHidden(false);
    accumRef.current = 0;
    lockUntilRef.current = 0;
    lastYRef.current = new WeakMap();
  }, [enabled, resetKey]);

  return hidden;
}
