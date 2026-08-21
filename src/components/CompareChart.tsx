import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { clamp } from "../lib/kinetics";
import { useRef } from "react";

export interface CurveSpec {
  id: string;
  label: string;
  color: string;
  values: number[]; // conversion fraction, 0..1
}

const W = 720;
const H = 300;
const PL = 44;
const PR = 16;
const PT = 16;
const PB = 30;

function pathFrom(pts: Array<[number, number]>): string {
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

export function CompareChart({
  tMax,
  curves,
  marker,
  runKey,
}: {
  tMax: number; // seconds
  curves: CurveSpec[];
  marker?: { t: number; label: string; color: string };
  runKey: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hi, setHi] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    setDrawn(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, [runKey]);

  const n = curves[0]?.values.length ?? 0;
  const x = (i: number) => PL + (i / Math.max(1, n - 1)) * (W - PL - PR);
  const y = (v: number) => PT + (1 - v) * (H - PT - PB);

  const paths = useMemo(
    () =>
      curves.map((c) => ({
        ...c,
        d: pathFrom(c.values.map((v, i) => [x(i), y(v)] as [number, number])),
      })),
    [curves, tMax], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const f = clamp((px - PL) / (W - PL - PR), 0, 1);
    setHi(Math.round(f * (n - 1)));
  };

  const xTicks = [0, 0.25, 0.5, 0.75, 1];
  const tipFrac = hi !== null ? x(hi) / W : 0;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full cursor-crosshair"
        onMouseMove={onMove}
        onMouseLeave={() => setHi(null)}
      >
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
              x={PL - 7}
              y={y(v) + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="#5d6f84"
              fontFamily="IBM Plex Mono, monospace"
            >
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}
        {xTicks.map((f) => (
          <g key={f}>
            <line x1={x(f * (n - 1))} x2={x(f * (n - 1))} y1={PT} y2={H - PB} stroke="rgba(255,255,255,0.04)" />
            <text
              x={x(f * (n - 1))}
              y={H - PB + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#5d6f84"
              fontFamily="IBM Plex Mono, monospace"
            >
              {Math.round((f * tMax) / 3600)} h
            </text>
          </g>
        ))}
        <line x1={PL} x2={PL} y1={PT} y2={H - PB} stroke="rgba(255,255,255,0.14)" />
        <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="rgba(255,255,255,0.14)" />
        <text x={PL + 4} y={PT - 5} fontSize="10" fill="#7f91a6" fontFamily="IBM Plex Mono, monospace">
          conversion X
        </text>

        {/* 90 % target line */}
        <line
          x1={PL}
          x2={W - PR}
          y1={y(0.9)}
          y2={y(0.9)}
          stroke="rgba(217,164,91,0.5)"
          strokeDasharray="6 5"
        />
        <text
          x={W - PR - 2}
          y={y(0.9) - 6}
          textAnchor="end"
          fontSize="10"
          fill="#d9a45b"
          fontFamily="IBM Plex Mono, monospace"
        >
          90% target
        </text>

        {/* curves */}
        {paths.map((c, ci) => (
          <path
            key={c.id}
            d={c.d}
            fill="none"
            stroke={c.color}
            strokeWidth={ci === paths.length - 1 ? 2.4 : 1.9}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            style={{
              strokeDashoffset: drawn ? 0 : 1,
              transition: `stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1) ${ci * 0.15}s`,
            }}
          />
        ))}

        {/* t90 marker on the recommended curve */}
        {marker && marker.t <= tMax && (
          <g style={{ opacity: drawn ? 1 : 0, transition: "opacity 0.6s ease 1.1s" }}>
            <line
              x1={PL + (marker.t / tMax) * (W - PL - PR)}
              x2={PL + (marker.t / tMax) * (W - PL - PR)}
              y1={PT}
              y2={H - PB}
              stroke={marker.color}
              strokeOpacity="0.28"
              strokeDasharray="2 4"
            />
            <circle
              cx={PL + (marker.t / tMax) * (W - PL - PR)}
              cy={y(0.9)}
              r="7.5"
              fill={marker.color}
              opacity="0.18"
            />
            <circle cx={PL + (marker.t / tMax) * (W - PL - PR)} cy={y(0.9)} r="3.4" fill={marker.color} />
            <text
              x={PL + (marker.t / tMax) * (W - PL - PR) + 7}
              y={PT + 12}
              fontSize="10"
              fill={marker.color}
              fontFamily="IBM Plex Mono, monospace"
            >
              {marker.label}
            </text>
          </g>
        )}

        {/* crosshair */}
        {hi !== null && (
          <g>
            <line
              x1={x(hi)}
              x2={x(hi)}
              y1={PT}
              y2={H - PB}
              stroke="rgba(233,239,246,0.28)"
              strokeDasharray="2 3"
            />
            {curves.map((c) => (
              <circle key={c.id} cx={x(hi)} cy={y(c.values[hi])} r="3.4" fill={c.color} stroke="#0a1017" strokeWidth="1.2" />
            ))}
          </g>
        )}
      </svg>

      {hi !== null && (
        <div
          className="pointer-events-none absolute top-3 z-10 rounded-lg border border-white/10 bg-abyss-900/95 px-3 py-2 font-mono text-[11px] leading-[1.7] text-steel-300 shadow-xl backdrop-blur-md"
          style={{
            left: `${tipFrac * 100}%`,
            transform: tipFrac > 0.6 ? "translateX(-104%)" : "translateX(14px)",
          }}
        >
          <div className="text-steel-100">t = {((hi / Math.max(1, n - 1)) * (tMax / 3600)).toFixed(2)} h</div>
          {curves.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <span className="inline-block h-[3px] w-3 rounded" style={{ background: c.color }} />
              {c.label}&nbsp;{(c.values[hi] * 100).toFixed(2)}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
