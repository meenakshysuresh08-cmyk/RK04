import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { clamp, fmtExp, fmtFixed } from "../lib/kinetics";

/* ------------------------------------------------------------------ */
/*  Main concentration-vs-time chart (Module 2)                        */
/* ------------------------------------------------------------------ */

const W = 780;
const H = 330;
const PL = 50;
const PR = 16;
const PT = 16;
const PB = 34;

const CY = "#4fc8de";
const BL = "#6c9bf5";

function pathFrom(pts: Array<[number, number]>): string {
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

export function SimChart({
  t,
  rk4,
  ana,
  showRk4,
  showAna,
  runId,
}: {
  t: number[];
  rk4: number[];
  ana: number[];
  showRk4: boolean;
  showAna: boolean;
  runId: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hi, setHi] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    setDrawn(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, [runId]);

  const tMax = t[t.length - 1];
  const x = (tv: number) => PL + (tv / tMax) * (W - PL - PR);
  const y = (c: number) => PT + (1 - c) * (H - PT - PB);

  const rk4Pts = useMemo(() => t.map((tv, i) => [x(tv), y(rk4[i])] as [number, number]), [t, rk4]); // eslint-disable-line react-hooks/exhaustive-deps
  const anaPts = useMemo(() => t.map((tv, i) => [x(tv), y(ana[i])] as [number, number]), [t, ana]); // eslint-disable-line react-hooks/exhaustive-deps

  const areaPath = useMemo(() => {
    const base = y(0);
    return `${pathFrom(rk4Pts)} L${x(tMax).toFixed(2)} ${base} L${x(0).toFixed(2)} ${base} Z`;
  }, [rk4Pts]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const tv = clamp(((px - PL) / (W - PL - PR)) * tMax, 0, tMax);
    setHi(Math.round((tv / tMax) * (t.length - 1)));
  };

  const hv = hi !== null ? hi : null;
  const frac = hv !== null ? x(t[hv]) / W : 0;
  const tipTransform = frac > 0.6 ? "translateX(-104%)" : "translateX(14px)";

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full cursor-crosshair"
        onMouseMove={onMove}
        onMouseLeave={() => setHi(null)}
      >
        <defs>
          <linearGradient id="rk4area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CY} stopOpacity="0.16" />
            <stop offset="100%" stopColor={CY} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid + axes */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1={PL}
              x2={W - PR}
              y1={y(v)}
              y2={y(v)}
              stroke="rgba(255,255,255,0.055)"
              strokeDasharray={v === 0 ? undefined : "3 5"}
            />
            <text
              x={PL - 8}
              y={y(v) + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="#5d6f84"
              fontFamily="IBM Plex Mono, monospace"
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={PT} y2={H - PB} stroke="rgba(255,255,255,0.04)" />
            <text
              x={x(v)}
              y={H - PB + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#5d6f84"
              fontFamily="IBM Plex Mono, monospace"
            >
              {v}
            </text>
          </g>
        ))}
        <line x1={PL} x2={PL} y1={PT} y2={H - PB} stroke="rgba(255,255,255,0.14)" />
        <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="rgba(255,255,255,0.14)" />
        <text
          x={PL + 4}
          y={PT - 5}
          fontSize="10"
          fill="#7f91a6"
          fontFamily="IBM Plex Mono, monospace"
        >
          C / C₀
        </text>
        <text
          x={W - PR}
          y={H - 6}
          textAnchor="end"
          fontSize="10"
          fill="#7f91a6"
          fontFamily="IBM Plex Mono, monospace"
        >
          time t [s]
        </text>

        {/* series */}
        {showRk4 && (
          <>
            <path
              d={areaPath}
              fill="url(#rk4area)"
              style={{ opacity: drawn ? 1 : 0, transition: "opacity 1.1s ease 0.5s" }}
            />
            <path
              d={pathFrom(rk4Pts)}
              fill="none"
              stroke={CY}
              strokeWidth="2.25"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              style={{
                strokeDashoffset: drawn ? 0 : 1,
                transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </>
        )}
        {showAna && (
          <path
            d={pathFrom(anaPts)}
            fill="none"
            stroke={BL}
            strokeWidth="1.75"
            strokeDasharray="6 5"
            style={{ opacity: drawn ? 0.9 : 0, transition: "opacity 0.9s ease 0.7s" }}
          />
        )}

        {/* terminal point */}
        {showRk4 && (
          <g style={{ opacity: drawn ? 1 : 0, transition: "opacity 0.5s ease 1.3s" }}>
            <circle cx={x(tMax)} cy={y(rk4[rk4.length - 1])} r="8" fill={CY} opacity="0.16" />
            <circle cx={x(tMax)} cy={y(rk4[rk4.length - 1])} r="3.4" fill={CY} />
          </g>
        )}

        {/* crosshair */}
        {hv !== null && (
          <g>
            <line
              x1={x(t[hv])}
              x2={x(t[hv])}
              y1={PT}
              y2={H - PB}
              stroke="rgba(233,239,246,0.28)"
              strokeDasharray="2 3"
            />
            {showAna && <circle cx={x(t[hv])} cy={y(ana[hv])} r="3.4" fill={BL} stroke="#0a1017" strokeWidth="1.2" />}
            {showRk4 && <circle cx={x(t[hv])} cy={y(rk4[hv])} r="3.4" fill={CY} stroke="#0a1017" strokeWidth="1.2" />}
          </g>
        )}
      </svg>

      {/* tooltip */}
      {hv !== null && (
        <div
          className="pointer-events-none absolute top-3 z-10 rounded-lg border border-white/10 bg-abyss-900/95 px-3 py-2 font-mono text-[11px] leading-[1.7] text-steel-300 shadow-xl backdrop-blur-md"
          style={{ left: `${frac * 100}%`, transform: tipTransform }}
        >
          <div className="text-steel-100">t = {fmtFixed(t[hv], 0)} s</div>
          {showAna && (
            <div className="flex items-center gap-2">
              <span className="inline-block h-[3px] w-3 rounded" style={{ background: BL }} />
              exact&nbsp;{fmtFixed(ana[hv], 8)}
            </div>
          )}
          {showRk4 && (
            <div className="flex items-center gap-2">
              <span className="inline-block h-[3px] w-3 rounded" style={{ background: CY }} />
              RK4&nbsp;&nbsp;{fmtFixed(rk4[hv], 8)}
            </div>
          )}
          {showAna && showRk4 && (
            <div className="text-steel-500">|Δ|&nbsp;&nbsp;{fmtExp(Math.abs(rk4[hv] - ana[hv]), 2)}</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pointwise error strip — log10 |RK4 − exact|                        */
/* ------------------------------------------------------------------ */

const EH = 132;
const EPT = 12;
const EPB = 24;
const D0 = -16;
const D1 = -10;

export function ErrorStrip({
  t,
  rk4,
  ana,
  runId,
}: {
  t: number[];
  rk4: number[];
  ana: number[];
  runId: number;
}) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    setDrawn(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, [runId]);

  const tMax = t[t.length - 1];
  const x = (tv: number) => PL + (tv / tMax) * (W - PL - PR);
  const yv = (err: number) => {
    const v = Math.log10(Math.max(err, 1e-16));
    return EPT + (1 - (v - D0) / (D1 - D0)) * (EH - EPT - EPB);
  };

  const pts = useMemo(
    () => t.map((tv, i) => [x(tv), yv(Math.abs(rk4[i] - ana[i]))] as [number, number]),
    [t, rk4, ana], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const line = pathFrom(pts);
  const area = `${line} L${x(tMax).toFixed(2)} ${EH - EPB} L${x(0).toFixed(2)} ${EH - EPB} Z`;

  const refY = yv(3.0913e-11);

  return (
    <svg viewBox={`0 0 ${W} ${EH}`} className="block w-full">
      <defs>
        <linearGradient id="errarea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3ecf8e" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#3ecf8e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[D1, -13, D0].map((v) => (
        <g key={v}>
          <line
            x1={PL}
            x2={W - PR}
            y1={EPT + (1 - (v - D0) / (D1 - D0)) * (EH - EPT - EPB)}
            y2={EPT + (1 - (v - D0) / (D1 - D0)) * (EH - EPT - EPB)}
            stroke="rgba(255,255,255,0.055)"
            strokeDasharray="3 5"
          />
          <text
            x={PL - 8}
            y={EPT + (1 - (v - D0) / (D1 - D0)) * (EH - EPT - EPB) + 3.5}
            textAnchor="end"
            fontSize="9.5"
            fill="#5d6f84"
            fontFamily="IBM Plex Mono, monospace"
          >
            1e{v}
          </text>
        </g>
      ))}
      {[0, 50, 100].map((v) => (
        <text
          key={v}
          x={x(v)}
          y={EH - EPB + 15}
          textAnchor="middle"
          fontSize="9.5"
          fill="#5d6f84"
          fontFamily="IBM Plex Mono, monospace"
        >
          {v} s
        </text>
      ))}
      <line x1={PL} x2={PL} y1={EPT} y2={EH - EPB} stroke="rgba(255,255,255,0.14)" />
      <line x1={PL} x2={W - PR} y1={EH - EPB} y2={EH - EPB} stroke="rgba(255,255,255,0.14)" />

      {/* reference level of the published error */}
      <line
        x1={PL}
        x2={W - PR}
        y1={refY}
        y2={refY}
        stroke="rgba(62,207,142,0.35)"
        strokeDasharray="5 5"
      />
      <text
        x={W - PR - 2}
        y={refY - 5}
        textAnchor="end"
        fontSize="9.5"
        fill="#3ecf8e"
        fontFamily="IBM Plex Mono, monospace"
        opacity="0.85"
      >
        ref 3.0913e-11
      </text>

      <path
        d={area}
        fill="url(#errarea)"
        style={{ opacity: drawn ? 1 : 0, transition: "opacity 1s ease 0.6s" }}
      />
      <path
        d={line}
        fill="none"
        stroke="#3ecf8e"
        strokeWidth="1.6"
        pathLength={1}
        strokeDasharray="1"
        style={{
          strokeDashoffset: drawn ? 0 : 1,
          transition: "stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.15s",
        }}
      />
    </svg>
  );
}
