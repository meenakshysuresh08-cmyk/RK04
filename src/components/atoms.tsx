import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { clamp } from "../lib/kinetics";

/* ------------------------------- hooks ---------------------------- */

export function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setOn(true);
            io.disconnect();
          }
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, on };
}

/** Animated number that eases toward `target` whenever it changes. */
export function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) {
      setVal(target);
      return;
    }
    let raf = 0;
    let latest = from;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = clamp((now - t0) / duration, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      latest = from + (target - from) * e;
      setVal(latest);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = latest;
    };
  }, [target, duration]);
  return val;
}

/** Ticking UTC clock string. */
export function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())} UTC`;
}

/* ------------------------------- icons ---------------------------- */

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function Svg({
  size = 14,
  className,
  strokeWidth = 2,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const IconX = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);

export const IconPlay = (p: IconProps) => (
  <Svg {...p}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </Svg>
);

export const IconFlask = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 2v6.5L4.7 17.8A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.8-3.2L14 8.5V2" />
    <line x1="8.5" y1="2" x2="15.5" y2="2" />
    <line x1="7.2" y1="14" x2="16.8" y2="14" />
  </Svg>
);

export const IconTarget = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.5" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 14" />
  </Svg>
);

export const IconSigma = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 6V4H6l6 8-6 8h12v-2" />
  </Svg>
);

export const IconGauge = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 14 3.5-3.5" />
    <path d="M20.2 17.5a9 9 0 1 0-16.4 0" />
  </Svg>
);

/* ------------------------------- panel ---------------------------- */

export type Tone = "blue" | "cyan" | "emerald" | "warn" | "steel";

const toneText: Record<Tone, string> = {
  blue: "text-tech-400",
  cyan: "text-cy-400",
  emerald: "text-em-400",
  warn: "text-warn-400",
  steel: "text-steel-400",
};

const toneBg: Record<Tone, string> = {
  blue: "bg-tech-400",
  cyan: "bg-cy-400",
  emerald: "bg-em-400",
  warn: "bg-warn-400",
  steel: "bg-steel-400",
};

export function GlassPanel({
  mod,
  tone = "cyan",
  title,
  sub,
  right,
  children,
  className = "",
  bodyClassName = "",
  delay = 0,
}: {
  mod: string;
  tone?: Tone;
  title: string;
  sub?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  delay?: number;
}) {
  const { ref, on } = useReveal<HTMLElement>();
  return (
    <section
      ref={ref}
      className={`glass rv ${on ? "rv-in" : ""} flex flex-col ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-5 pb-3.5 pt-4">
        <div className="min-w-0">
          <div
            className={`flex items-center gap-2 font-mono text-[10px] font-medium tracking-[0.22em] ${toneText[tone]}`}
          >
            <span className={`inline-block h-[7px] w-[7px] rounded-[2px] ${toneBg[tone]}`} />
            {mod}
          </div>
          <h2 className="mt-1 font-display text-[17px] font-semibold leading-tight text-steel-100">
            {title}
          </h2>
          {sub && <p className="mt-0.5 text-xs leading-snug text-steel-400">{sub}</p>}
        </div>
        {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
      </header>
      <div className={`flex-1 p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/* -------------------------------- chip ---------------------------- */

const chipTones: Record<Tone, string> = {
  steel: "border-white/10 bg-white/[0.04] text-steel-300",
  blue: "border-tech-400/25 bg-tech-400/[0.08] text-tech-300",
  cyan: "border-cy-400/25 bg-cy-400/[0.08] text-cy-300",
  emerald: "border-em-400/25 bg-em-400/[0.08] text-em-300",
  warn: "border-warn-400/30 bg-warn-400/[0.08] text-warn-300",
};

export function Chip({
  tone = "steel",
  className = "",
  children,
  title,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[5px] font-mono text-[10.5px] leading-none tracking-wide ${chipTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------ stat block ------------------------ */

export function Stat({
  label,
  value,
  unit,
  sub,
  tone = "steel",
  size = "md",
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  tone?: Tone;
  size?: "md" | "lg";
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3.5 py-3">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-steel-500">
        {label}
      </div>
      <div
        className={`tabular mt-1 font-mono font-medium text-steel-100 ${
          size === "lg" ? "text-[22px] leading-7" : "text-[15px] leading-5"
        } ${tone === "steel" ? "" : toneText[tone]}`}
      >
        {value}
        {unit && <span className="ml-1 text-[11px] font-normal text-steel-400">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 text-[10.5px] text-steel-500">{sub}</div>}
    </div>
  );
}

/* ------------------------------- slider --------------------------- */

export function Slider({
  label,
  unit,
  min,
  max,
  step,
  value,
  display,
  color,
  ticks,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  color: string;
  ticks: string[];
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-medium text-steel-300">{label}</span>
        <span className="tabular font-mono text-[15px] font-medium text-steel-100">
          {display}
          <span className="ml-1 text-[10.5px] font-normal text-steel-400">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={
          {
            "--thumb": color,
            background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.09) ${pct}%)`,
          } as CSSProperties
        }
      />
      <div className="mt-1.5 flex justify-between font-mono text-[9.5px] tracking-wide text-steel-500">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- progress ring ---------------------- */

export function Ring({
  pct,
  color,
  size = 92,
  stroke = 8,
  children,
}: {
  pct: number; // 0..100
  color: string;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setArmed(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  const r = (size - stroke) / 2 - 1;
  const off = armed ? 100 - clamp(pct, 0, 100) : 100;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={off}
          style={{
            transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
            opacity: 0.92,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
