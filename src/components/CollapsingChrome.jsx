import React from "react";

/**
 * Collapses mobile chrome without animating height.
 * Height snaps (avoids scroll-container resize thrash / flicker);
 * opacity + translate provide the fade. Pass `hidden={false}` on desktop.
 */
export default function CollapsingChrome({
  hidden = false,
  className = "",
  /** Extra bottom margin while expanded (px). Collapses with chrome. */
  expandedMarginBottom = 0,
  as: Comp = "div",
  style,
  children,
  ...rest
}) {
  return (
    <Comp
      {...rest}
      className={`overflow-hidden will-change-transform ${className}`.trim()}
      style={{
        // Height must not tween — mid-scroll height animation reflows the
        // scroller and fights hide-on-scroll (visible flicker).
        height: hidden ? 0 : "auto",
        marginBottom: hidden ? 0 : expandedMarginBottom,
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translate3d(0, -6px, 0)" : "translate3d(0, 0, 0)",
        transition: "opacity 180ms ease-out, transform 180ms ease-out",
        pointerEvents: hidden ? "none" : undefined,
        ...style,
      }}
      aria-hidden={hidden ? true : undefined}
    >
      {children}
    </Comp>
  );
}
