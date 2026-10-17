import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import styles from "./Chest.module.scss";

// Chest assets (WebP optimized for 90%+ faster load time)
import circusBase from "./circusBase.webp";
import circusLidClosed from "./circusLidClosed.webp";
import circusLidInner from "./circusLidInner.webp";
import circusBooks from "./circusBooks.webp";
import circusStage from "./circusStage.webp";
import bgCosmic from "./bg.webp";

import btnDev from "./btn_developers.webp";
import btnWall from "./btn_wallmag.webp";
import btnSpon from "./btn_sponsors.webp";
import btnGall from "./btn_gallery.webp";
import btnMedia from "./btn_mediapartners.webp";

export interface BoardItem {
  label: string;
  pos: "boardDev" | "boardWall" | "boardSpon" | "boardGall" | "boardMedia";
  to: string;
  img: string;
  dx: string;
  dy: string;
  onClick?: () => void;
}

const DEFAULT_BOARDS: BoardItem[] = [
  { label: "DEVELOPERS", pos: "boardDev", to: "#developers", img: btnDev, dx: "8vw", dy: "-16vh" },
  { label: "WALL MAG", pos: "boardWall", to: "#wallmag", img: btnWall, dx: "-8vw", dy: "-16vh" },
  { label: "SPONSORS", pos: "boardSpon", to: "#sponsors", img: btnSpon, dx: "6vw", dy: "-24vh" },
  { label: "GALLERY", pos: "boardGall", to: "#gallery", img: btnGall, dx: "-6vw", dy: "-24vh" },
  { label: "MEDIA PARTNERS", pos: "boardMedia", to: "#mediapartners", img: btnMedia, dx: "0vw", dy: "-30vh" },
];

// ---------- Easing ----------
const bezier = (x1: number, y1: number, x2: number, y2: number) => (x: number) => {
  if (x <= 0 || x >= 1) return x;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const e = ((ax * t + bx) * t + cx) * t - x;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
    t -= e / d;
  }
  return ((ay * t + by) * t + cy) * t;
};

const linearEase = (spec: string) => {
  const stops = spec.split(",").map((s) => s.trim().split(/\s+/));
  const v = stops.map((s) => parseFloat(s[0]));
  const p = stops.map((s) => (s[1] ? parseFloat(s[1]) / 100 : NaN));
  if (isNaN(p[0])) p[0] = 0;
  if (isNaN(p[p.length - 1])) p[p.length - 1] = 1;
  for (let i = 1; i < p.length; i++) {
    if (!isNaN(p[i])) continue;
    let j = i;
    while (isNaN(p[j])) j++;
    for (let k = i; k < j; k++) p[k] = p[i - 1] + ((p[j] - p[i - 1]) * (k - i + 1)) / (j - i + 1);
  }
  return (t: number) => {
    if (t <= 0) return v[0];
    if (t >= 1) return v[v.length - 1];
    let i = 1;
    while (p[i] < t) i++;
    const k = (t - p[i - 1]) / (p[i] - p[i - 1] || 1);
    return v[i - 1] + (v[i] - v[i - 1]) * k;
  };
};

const E = {
  ease: bezier(0.25, 0.1, 0.25, 1),
  out: bezier(0, 0, 0.58, 1),
  inOut: bezier(0.42, 0, 0.58, 1),
  iris: bezier(0.65, 0, 0.35, 1),
  rise: bezier(0.3, 0, 0.2, 1),
  emerge: bezier(0.45, 0.05, 0.3, 1),
  sand: bezier(0.16, 1, 0.3, 1),
  fly: bezier(0.2, 0.6, 0.3, 1),
  zoom: bezier(0.4, 0, 0.2, 1),
  spring: linearEase(
    "0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 84.1%, 1"
  ),
};

export interface ChestProps {
  boards?: BoardItem[];
  onBoardClick?: (item: BoardItem) => void;
  className?: string;
  style?: CSSProperties;
}

export default function Chest({ boards = DEFAULT_BOARDS, onBoardClick, className, style }: ChestProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Pointer parallax: lerped, sleeps once settled
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduced || !finePointer) return;

    let raf = 0;
    let tx = 0, ty = 0, x = 0, y = 0;

    const tick = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty("--px", x.toFixed(4));
      el.style.setProperty("--py", y.toFixed(4));
      const settled = Math.abs(tx - x) < 0.0005 && Math.abs(ty - y) < 0.0005;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Entrance choreography: master timeline - runs consistently on EVERY device
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = (n: string) => `.${styles[n]}`;

    const ctx = gsap.context(() => {
      // ---- snappy timing knobs ----
      const riseDelay = 0.08, riseTime = 1.4;
      const lidDelay = riseDelay + riseTime - 0.15;
      const lidTime = 1.1;
      const hoverLift = -2.5;
      const letGo = lidDelay + 0.25;
      const landAt = lidDelay + 0.5;
      const popDelay = lidDelay + 0.5;
      const popStagger = 0.09;
      const popTime = 0.7;

      const tl = gsap.timeline();
      tlRef.current = tl;

      // Initial state: firmly closed
      gsap.set(q("lidClosed"), { opacity: 1, rotationX: 0, display: "block" });
      gsap.set(q("chestTop"), { opacity: 0, rotationX: -90, display: "none" });
      gsap.set(q("inner"), { filter: "brightness(0.35)" });
      gsap.set(q("chestBooks"), { opacity: 1, scale: 1, transformOrigin: "90% 90%" });
      gsap.set(q("lantern"), { opacity: 0 });

      // Root fade in
      tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: E.out }, 0)
        .fromTo(
          q("bgHome"),
          { clipPath: "circle(0% at 50% 50%)", "--dim": 0.5 },
          { clipPath: "circle(150% at 50% 50%)", "--dim": 0, duration: 2.2, ease: E.iris },
          0.6
        );

      // Stage entrance
      tl.fromTo(
        q("circusStage"),
        { yPercent: 40, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.3, ease: E.sand },
        0.05
      );

      // Chest zoom while rising
      tl.fromTo(q("lChest"), { scale: 0.65 }, { scale: 0.75, duration: lidDelay - riseDelay, ease: E.ease }, riseDelay)
        .to(q("lChest"), { scale: 1, duration: lidTime, ease: E.zoom }, lidDelay);

      // 1. CHEST RISES FROM GRASS CLOSED
      tl.fromTo(q("chestRig"), { yPercent: 120 }, { yPercent: hoverLift, duration: riseTime, ease: E.emerge }, riseDelay)
        .fromTo(q("chestRig"), { opacity: 0 }, { opacity: 1, duration: riseTime * 0.25, ease: E.rise }, riseDelay)
        .to(q("chestRig"), { yPercent: 0, duration: landAt - letGo, ease: "power3.in" }, letGo);

      // Weightless floating drift while ascending
      const rig = root.querySelector<HTMLElement>(q("chestRig"));
      if (rig) {
        gsap.set(rig, { transformOrigin: "50% 65%" });
        const vh = window.innerHeight / 100;
        const smooth = (x: number) => {
          const c = Math.min(1, Math.max(0, x));
          return c * c * (3 - 2 * c);
        };
        const floatDur = landAt - riseDelay;
        const fade = 0.7;
        const fl = { t: 0 };
        tl.to(
          fl,
          {
            t: floatDur,
            duration: floatDur,
            ease: "none",
            onUpdate: () => {
              const t = fl.t;
              const env = smooth(t / 0.5) * (1 - smooth((t - (floatDur - fade)) / fade));
              const lean = -5 * (1 - E.emerge(Math.min(1, t / riseTime))) * (1 - smooth((t - (floatDur - fade)) / fade));
              gsap.set(rig, {
                y: Math.sin(t * 2.0) * 0.9 * vh * env,
                x: Math.sin(t * 1.25 + 1) * 0.7 * vh * env,
                rotation: lean + Math.sin(t * 1.6 + 0.5) * 1.2 * env + Math.sin(t * 31) * 0.12 * env,
              });
            },
            onComplete: () => {
              gsap.set(rig, { x: 0, y: 0, rotation: 0 });
            },
          },
          riseDelay
        );
      }

      // 2. LID OPENS (Guaranteed transitions for all laptop GPUs)
      // Closed lid tilts backward and vanishes deterministically on timeline
      tl.to(
        q("lidClosed"),
        {
          rotationX: 82,
          opacity: 0,
          duration: lidTime * 0.45,
          ease: "power2.in",
        },
        lidDelay
      ).set(q("lidClosed"), { display: "none" }, lidDelay + lidTime * 0.45);

      // Open lid rotates upright into full view with natural wooden bounce
      tl.set(q("chestTop"), { display: "block" }, lidDelay + 0.08)
        .fromTo(
          q("chestTop"),
          { rotationX: -85, opacity: 0 },
          {
            rotationX: 0,
            opacity: 1,
            duration: lidTime,
            ease: "back.out(1.35)",
          },
          lidDelay + 0.08
        );

      // Inside faces brighten as the lid catches light
      tl.to(q("inner"), { filter: "brightness(1)", duration: 0.9, ease: E.out }, lidDelay + 0.2);

      // Books wobble on landing
      tl.to(q("chestBooks"), { rotation: 2.2, duration: 0.08, yoyo: true, repeat: 3, ease: "power1.inOut" }, landAt);

      // Lantern glow fades in and begins flickering
      tl.to(q("lantern"), { opacity: 1, duration: 0.8, ease: E.out }, lidDelay + 0.6);

      // Thud camera shake when the heavy lid lands
      tl.to(
        root,
        {
          keyframes: {
            y: [0, 6, -4, 2, 0],
            easeEach: "power1.inOut",
          },
          duration: 0.2,
        },
        lidDelay + 0.65
      );

      // 3. BUTTONS LAUNCH OUT OF CHEST MOUTH
      gsap.utils.toArray<HTMLElement>(q("sign")).forEach((sign, i) => {
        const b = boards[i];
        if (!b) return;
        const at = popDelay + i * popStagger;
        tl.fromTo(
          sign,
          { x: b.dx, scale: 0.3, opacity: 0 },
          { x: "0vw", scale: 1, opacity: 1, duration: popTime, ease: E.fly },
          at
        )
          .fromTo(
            sign.firstElementChild,
            { y: b.dy, rotation: i * 8 - 16 },
            { y: "0vh", rotation: 0, duration: popTime, ease: E.spring },
            at
          )
          .set(sign, { pointerEvents: "auto" }, at + popTime);
      });
    }, root);

    // Watchdog fallback: guarantees box is 100% open even if laptop tab was backgrounded or frame rate dropped
    const watchdog = setTimeout(() => {
      gsap.set(q("lidClosed"), { display: "none" });
      gsap.set(q("chestTop"), { display: "block", opacity: 1, rotationX: 0 });
      gsap.set(q("sign"), { pointerEvents: "auto", opacity: 1 });
      const rig = root.querySelector<HTMLElement>(q("chestRig"));
      if (rig) gsap.set(rig, { x: 0, y: 0, rotation: 0 });
    }, 4000);

    return () => {
      clearTimeout(watchdog);
      ctx.revert();
    };
  }, [boards]);

  // Fast-forward on click/tap if user wants immediate access
  const handleChestClick = () => {
    if (tlRef.current && tlRef.current.progress() < 0.95) {
      tlRef.current.progress(1);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`${styles.container} ${className ?? ""}`}
      style={style}
      onClick={handleChestClick}
    >
      {/* Background galaxy iris */}
      <div className={`${styles.layer} ${styles.lBg}`}>
        <div className={styles.bgHome}>
          <img src={bgCosmic} alt="Galaxy Night Sky" />
        </div>
      </div>

      {/* Rolling grass hill base */}
      <div className={`${styles.layer} ${styles.lStage}`}>
        <div className={styles.circusStage}>
          <img src={circusStage} alt="Rolling Grass Hill Base" />
        </div>
      </div>

      {/* Chest rig: 3D perspective stage for chest and lid */}
      <div className={`${styles.layer} ${styles.lChest}`}>
        <div className={styles.chestRig}>
          {/* Closed lid: visible at start, swings back */}
          <div className={styles.lidClosed} aria-hidden="true">
            <img src={circusLidClosed} alt="" />
          </div>

          {/* Open lid: rotates upright with Supragna circus treasures */}
          <div className={styles.chestTop}>
            <img
              src={circusLidInner}
              alt="Supragna open chest"
              className={`${styles.face} ${styles.inner}`}
            />
          </div>

          {/* Stack of books on the right */}
          <div className={styles.chestBooks} aria-hidden="true">
            <img src={circusBooks} alt="" />
          </div>

          {/* Chest base (front wall) */}
          <div className={styles.chestBase} aria-hidden="true">
            <img src={circusBase} alt="" />
          </div>

          {/* Lantern warm candlelight flicker */}
          <div className={styles.lantern} aria-hidden="true" />

          {/* 5 Interactive Marquee Button signs */}
          <nav className={styles.boards} aria-label="Navigation Sections">
            {boards.map((b, i) => (
              <a
                key={b.label}
                href={b.to}
                onClick={(e) => {
                  if (b.onClick) {
                    e.preventDefault();
                    b.onClick();
                  } else if (onBoardClick) {
                    e.preventDefault();
                    onBoardClick(b);
                  }
                }}
                className={`${styles.sign} ${styles[b.pos]}`}
                style={{ "--i": i } as CSSProperties}
              >
                <div className={styles.drop}>
                  <div className={styles.plank}>
                    <img src={b.img} alt={b.label} />
                  </div>
                </div>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
