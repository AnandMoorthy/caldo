import { useEffect, useRef, useState } from "react";

/**
 * Pull-to-refresh for internal scroll containers (document scroll is locked).
 * Arms when the nearest scroll parent is at the top, then pulls down to refresh.
 */
export default function usePullToRefresh(containerRef, { onRefresh, threshold = 72 } = {}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const pullingRef = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const refreshFnRef = useRef(onRefresh);
  refreshFnRef.current = onRefresh;

  useEffect(() => {
    const root = containerRef?.current;
    if (!root) return;

    function scrollParent(node) {
      let el = node instanceof Element ? node : null;
      while (el && el !== document.documentElement) {
        try {
          const style = window.getComputedStyle(el);
          const oy = style.overflowY;
          if ((oy === "auto" || oy === "scroll" || oy === "overlay") && el.scrollHeight > el.clientHeight + 1) {
            return el;
          }
        } catch {}
        if (el === root) break;
        el = el.parentElement;
      }
      return root;
    }

    function setPullDistance(next) {
      pullRef.current = next;
      setPull(next);
    }

    function onTouchStart(e) {
      if (refreshingRef.current || e.touches.length !== 1) return;
      const scroller = scrollParent(e.target);
      if ((scroller.scrollTop || 0) > 1) {
        startYRef.current = null;
        pullingRef.current = false;
        return;
      }
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }

    function onTouchMove(e) {
      if (!pullingRef.current || startYRef.current == null || refreshingRef.current) return;
      const scroller = scrollParent(e.target);
      if ((scroller.scrollTop || 0) > 1) {
        pullingRef.current = false;
        setPullDistance(0);
        return;
      }
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        setPullDistance(0);
        return;
      }
      const next = Math.min(dy * 0.45, threshold * 1.35);
      setPullDistance(next);
      if (next > 8 && e.cancelable) e.preventDefault();
    }

    async function onTouchEnd() {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      startYRef.current = null;
      const distance = pullRef.current;
      if (distance < threshold || refreshingRef.current) {
        setPullDistance(0);
        return;
      }
      refreshingRef.current = true;
      setRefreshing(true);
      setPullDistance(threshold);
      try {
        await Promise.resolve(refreshFnRef.current?.());
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        setPullDistance(0);
      }
    }

    function onTouchCancel() {
      pullingRef.current = false;
      startYRef.current = null;
      setPullDistance(0);
    }

    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [containerRef, threshold]);

  return { pull, refreshing, threshold };
}
