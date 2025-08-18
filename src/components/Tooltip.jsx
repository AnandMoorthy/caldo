import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * TooltipProvider
 * - Shows instant tooltips for any element with `data-tip` attribute
 * - Optional positioning via `data-tip-pos` = top|bottom|left|right (default: bottom)
 * - Accessible: still keep aria-labels on controls; this is purely visual
 */
export default function TooltipProvider() {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState("");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [placement, setPlacement] = useState("bottom");
  const anchorRef = useRef(null);
  const usingMouseRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    function findTipElement(startEl) {
      if (!startEl) return null;
      try { return startEl.closest('[data-tip]'); } catch { return null; }
    }

    function updateFromElement(el) {
      if (!el) return;
      anchorRef.current = el;
      setContent(String(el.getAttribute('data-tip') || ''));
      setPlacement(String(el.getAttribute('data-tip-pos') || 'bottom'));
    }

    // Position relative to element rect, not mouse, to avoid covering icons

    function computePosFromRect(el, preferredPlacement) {
      const rect = el.getBoundingClientRect();
      const gap = 8;
      let x = rect.left + rect.width / 2;
      let y = rect.top - gap; // top by default
      const place = preferredPlacement || 'top';
      if (place === 'bottom') y = rect.bottom + gap;
      if (place === 'left') { x = rect.left - gap; y = rect.top + rect.height / 2; }
      if (place === 'right') { x = rect.right + gap; y = rect.top + rect.height / 2; }
      // Clamp lightly
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      x = Math.max(6, Math.min(vw - 6, x));
      y = Math.max(6, Math.min(vh - 6, y));
      setPos({ x, y });
    }

    function onMouseOver(e) {
      const el = findTipElement(e.target);
      if (!el) return;
      usingMouseRef.current = false;
      updateFromElement(el);
      computePosFromRect(el, el.getAttribute('data-tip-pos') || 'bottom');
      setVisible(true);
    }

    function onMouseMove(e) {
      // We anchor to element, so no mouse tracking needed
      return;
    }

    function onMouseOut(e) {
      if (!anchorRef.current) return;
      const toEl = e.relatedTarget;
      const stillInside = !!(toEl && anchorRef.current.contains && anchorRef.current.contains(toEl));
      if (!stillInside) {
        setVisible(false);
        anchorRef.current = null;
      }
    }

    function onFocusIn(e) {
      const el = findTipElement(e.target);
      if (!el) return;
      usingMouseRef.current = false;
      updateFromElement(el);
      computePosFromRect(el, el.getAttribute('data-tip-pos') || 'bottom');
      setVisible(true);
    }

    function onFocusOut(e) {
      if (!anchorRef.current) return;
      if (e.target === anchorRef.current) {
        setVisible(false);
        anchorRef.current = null;
      }
    }

    function onScrollOrResize() {
      if (!visible || !anchorRef.current) return;
      if (usingMouseRef.current) return;
      computePosFromRect(anchorRef.current, placement);
    }

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('mouseout', onMouseOut, true);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize, true);
    return () => {
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('mouseout', onMouseOut, true);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, placement]);

  if (!visible || !content) return null;

  const transform = placement === 'bottom'
    ? 'translate(-50%, 0)'
    : placement === 'top'
      ? 'translate(-50%, -100%)'
      : placement === 'left'
        ? 'translate(-100%, -50%)'
        : 'translate(0, -50%)';

  const node = (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{ left: `${pos.x}px`, top: `${pos.y}px`, transform }}
    >
      <div className="px-2 py-1 rounded-md text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-lg border border-slate-700/40 dark:border-slate-300/40 max-w-xs sm:max-w-sm whitespace-pre-line">
        {content}
      </div>
    </div>
  );

  const root = typeof document !== 'undefined' ? document.body : null;
  return root ? createPortal(node, root) : null;
}


