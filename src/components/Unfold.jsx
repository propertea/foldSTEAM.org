import { useEffect, useRef, useState } from "react";

/*
 * Wraps content so it unfolds like paper when scrolled into view:
 * a perspective rotateX from a top crease, with a shading gradient
 * that lifts as the fold opens. Honors prefers-reduced-motion.
 */
export default function Unfold({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOpen(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`unfold ${open ? "is-open" : ""} ${className}`.trim()}
      style={{ "--d": `${delay}ms` }}
    >
      {children}
    </div>
  );
}
