import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

/*
 * The origami page transition — the page is ONE sheet of paper.
 *
 * On navigation the live page is snapshotted and overlaid pixel-aligned
 * on top of itself; the route swaps immediately underneath (same paint,
 * so there is no flash), then the snapshot folds away as a single
 * connected sheet, revealing the new page.
 *
 * Each navigation folds with a style drawn at random (never the same
 * one twice in a row); set FOLD_STYLE to a name to pin one. All three
 * run top-to-bottom, revealing the new page in reading order:
 *   "accordion"  — connected zigzag pleat attached at the bottom edge;
 *                  the sheet folds up from the top, gathering downward.
 *                  Segments are nested so every crease is a shared
 *                  hinge driven by one fold angle.
 *   "bird"       — the sheet folds in half along a corner-to-corner
 *                  diagonal (top-left corner first), in half again along
 *                  the other diagonal (top-right corner), and the
 *                  remaining bottom triangle lies down off the screen.
 *   "waterbomb"  — stylized waterbomb base: the top half folds behind,
 *                  the side wedges tuck behind along the diagonals, and
 *                  the remaining content triangle lies down flat.
 *
 * The bases use mountain folds (flaps swing behind the sheet, and with
 * backfaces hidden they vanish at edge-on). The visible face keeps
 * showing page content while the silhouette collapses, everything odd
 * about the fold — stretched proportions, landing overlaps — is lost
 * behind the paper, and the screen never needs to be square.
 */

const FOLD_STYLES = ["accordion", "bird", "waterbomb"];
const FOLD_STYLE = null; // pin to "accordion" | "bird" | "waterbomb", or null for random

const SEGMENTS = 6; // accordion pleat count
const ACCORDION_MS = 650;

/* ---------- flap-plan geometry ---------- */

const reflect = ([px, py], [ox, oy], [dx, dy]) => {
  const t = ((px - ox) * dx + (py - oy) * dy) / (dx * dx + dy * dy);
  return [2 * (ox + t * dx) - px, 2 * (oy + t * dy) - py];
};

const toClip = (pts) =>
  `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(", ")})`;

const centroid = (pts) =>
  pts
    .reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0])
    .map((s) => s / pts.length);

/*
 * A plan is a list of flaps: { poly, O, d, mode, delay, ms, landOn }.
 * Each flap is a clip-path region of the sheet rotating about the crease
 * line through point O with direction d. The rotation sign is derived
 * from the crease geometry: "valley" swings toward the viewer (and lands
 * at 178°, back showing), "mountain" swings behind (backfaces are
 * hidden, so it vanishes at edge-on). `landOn` names the flap index that
 * carries this flap's landed patch onward.
 */
function compilePlan(plan) {
  const flaps = plan.map((f) => {
    const c = centroid(f.poly);
    const cross = f.d[0] * (c[1] - f.O[1]) - f.d[1] * (c[0] - f.O[0]);
    const toward = cross > 0 ? 178 : -178; // sign that lifts toward the viewer
    return {
      ...f,
      deg: f.mode === "valley" ? toward : -toward,
      clip: toClip(f.poly),
      origin: `${f.O[0]}px ${f.O[1]}px`,
      patches: [],
    };
  });
  flaps.forEach((f) => {
    if (f.mode === "valley") {
      f.backClip = toClip(f.poly.map((p) => reflect(p, f.O, f.d)));
      f.landAt = f.delay + f.ms;
      if (f.landOn != null) {
        flaps[f.landOn].patches.push({ clip: f.backClip, at: f.landAt });
      }
    }
  });
  return flaps;
}

function birdPlan(W, H) {
  const C = [W / 2, H / 2];
  const TL = [0, 0];
  const TR = [W, 0];
  const BL = [0, H];
  const BR = [W, H];
  return compilePlan([
    // fold in half along the TR–BL diagonal: the top-LEFT half goes behind
    { poly: [TL, TR, BL], O: TR, d: [-W, H], mode: "mountain", delay: 0, ms: 300 },
    // fold in half again along the TL–BR diagonal: the top-RIGHT wedge follows
    { poly: [C, TR, BR], O: BR, d: [W, H], mode: "mountain", delay: 300, ms: 260 },
    // the remaining bottom triangle lies down off the screen
    { poly: [BL, C, BR], O: BL, d: [1, 0], mode: "mountain", delay: 560, ms: 280 },
  ]);
}

function waterbombPlan(W, H) {
  const mid = H / 2;
  const A = [W / 2, mid]; // apex of the base
  return compilePlan([
    // top half folds behind — content stays up front
    { poly: [[0, 0], [W, 0], [W, mid], [0, mid]], O: [0, mid], d: [1, 0], mode: "mountain", delay: 0, ms: 300 },
    // side wedges tuck behind along the diagonals
    { poly: [[0, mid], A, [0, H]], O: A, d: [-W / 2, mid], mode: "mountain", delay: 300, ms: 260 },
    { poly: [A, [W, mid], [W, H]], O: A, d: [W / 2, mid], mode: "mountain", delay: 300, ms: 260 },
    // the remaining content triangle lies down flat
    { poly: [A, [W, H], [0, H]], O: [0, H], d: [1, 0], mode: "mountain", delay: 560, ms: 280 },
  ]);
}

const FoldContext = createContext(null);

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const foldDuration = (snapshot) =>
  snapshot?.flaps
    ? Math.max(...snapshot.flaps.map((f) => f.delay + f.ms))
    : ACCORDION_MS;

/* A full-width copy of the snapshot, shifted so viewport point (dx, dy)
   sits on the container's top-left corner (the container clips it). */
function PageSlice({ snapshot, dx = 0, dy = 0 }) {
  return (
    <div
      className="fold-strip-inner"
      style={{
        width: `${snapshot.vw}px`,
        transform: `translate(${-dx}px, ${-(snapshot.scrollY + dy)}px)`,
      }}
      dangerouslySetInnerHTML={{ __html: snapshot.html }}
    />
  );
}

/* Connected zigzag: each segment is nested inside the one below, hinged
   on its bottom edge, with the root attached to the bottom of the
   screen. One fold angle θ drives everything — the root swings to -90°
   while each hinge opens to ±180° — so the sheet stays continuous and
   pleats downward, the top of the page folding away first. */
function AccordionFold({ snapshot }) {
  const h = snapshot.vh / SEGMENTS;
  let chain = null;
  // built innermost-first: slice 0 (top of the page) is the free end of
  // the pleat, slice SEGMENTS-1 is the root on the bottom screen edge
  for (let k = 0; k < SEGMENTS; k++) {
    const level = SEGMENTS - 1 - k; // nesting depth below the root
    chain = (
      <div
        className={`acc-seg ${
          level === 0 ? "is-root" : level % 2 ? "is-valley" : "is-mountain"
        }`}
      >
        <div className="acc-face">
          <PageSlice snapshot={snapshot} dy={k * h} />
        </div>
        {chain}
      </div>
    );
  }
  return (
    <div className="acc-chain" style={{ "--h": `${h}px` }}>
      {chain}
    </div>
  );
}

/* Base folds. Each flap renders its content face (with any landed-flap
   patches it carries), and valley flaps additionally render a back face:
   the sheet's reverse side, pre-flipped 180° about the same crease so it
   swings into view exactly when the flap passes edge-on. */
function BaseFold({ snapshot }) {
  return snapshot.flaps.map((f, i) => {
    const vars = {
      transformOrigin: f.origin,
      "--ax": f.d[0],
      "--ay": f.d[1],
      "--target": `${f.deg}deg`,
      "--fold-ms": `${f.ms}ms`,
      "--fold-delay": `${f.delay}ms`,
    };
    return (
      <Fragment key={i}>
        <div className="flap" style={{ ...vars, clipPath: f.clip }}>
          <PageSlice snapshot={snapshot} />
          {f.patches.map((p, j) => (
            <div
              key={j}
              className="flap-patch"
              style={{ clipPath: p.clip, "--land-at": `${p.at}ms` }}
            />
          ))}
          <div className="flap-shade" />
        </div>
        {f.mode === "valley" && (
          <div
            className="flap flap-back"
            style={{
              ...vars,
              clipPath: f.backClip,
              "--land-at": `${f.landAt}ms`,
            }}
          />
        )}
      </Fragment>
    );
  });
}

export function FoldProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState("idle");
  const [snapshot, setSnapshot] = useState(null);
  const timers = useRef([]);
  const contentRef = useRef(null);
  const lastStyle = useRef(null);

  /* a random fold each navigation, never the same one twice in a row */
  const pickStyle = () => {
    if (FOLD_STYLE) return FOLD_STYLE;
    const pool = FOLD_STYLES.filter((s) => s !== lastStyle.current);
    const style = pool[Math.floor(Math.random() * pool.length)];
    lastStyle.current = style;
    return style;
  };

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  /* Freeze the page as it looks right now, so it can fold away while the
     real DOM swaps routes underneath. */
  const takeSnapshot = () => {
    const el = contentRef.current;
    if (!el) return null;
    const clone = el.cloneNode(true);
    // the cloned nav won't stick, but it must keep its flow space or the
    // page below it shifts up — so translate it (visual only) down to
    // where the sticky nav sits on screen
    const nav = clone.querySelector(".nav");
    if (nav) {
      nav.style.transform = `translateY(${window.scrollY}px)`;
    }
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const style = pickStyle();
    return {
      html: clone.outerHTML,
      scrollY: window.scrollY,
      vw,
      vh,
      flaps:
        style === "bird"
          ? birdPlan(vw, vh)
          : style === "waterbomb"
            ? waterbombPlan(vw, vh)
            : null, // accordion renders from the segment chain instead
    };
  };

  const go = (to) => {
    if (to === location.pathname) return;
    if (phase !== "idle" || prefersReducedMotion()) {
      navigate(to);
      window.scrollTo(0, 0);
      return;
    }
    // snapshot first (it reads the current scroll), then swap the route;
    // React commits the overlay and the new page in the same paint
    const snap = takeSnapshot();
    setSnapshot(snap);
    setPhase("folding");
    navigate(to);
    window.scrollTo(0, 0);
    timers.current.push(
      setTimeout(() => {
        setSnapshot(null);
        setPhase("idle");
      }, foldDuration(snap) + 80)
    );
  };

  return (
    <FoldContext.Provider value={{ go, phase }}>
      <div ref={contentRef} className="fold-content">
        {children}
      </div>
      <div className={`fold-overlay ${phase}`} aria-hidden="true">
        {snapshot && phase === "folding" && (
          <div
            className="fold-layer"
            style={{
              width: `${snapshot.vw}px`,
              "--fold-ms": `${ACCORDION_MS}ms`,
            }}
          >
            {snapshot.flaps ? (
              <BaseFold snapshot={snapshot} />
            ) : (
              <AccordionFold snapshot={snapshot} />
            )}
          </div>
        )}
      </div>
    </FoldContext.Provider>
  );
}

export function useFold() {
  return useContext(FoldContext);
}

/** A link that routes through the fold transition. */
export function FoldLink({ to, className = "", children, ...rest }) {
  const { go } = useFold();
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <a
      href={`#${to}`}
      className={`${className} ${isActive ? "is-active" : ""}`.trim()}
      aria-current={isActive ? "page" : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
