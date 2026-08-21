import { useMemo, useState } from "react";
import {
  CONDITIONS,
  arrhenius,
  conversion,
  fmtDuration,
  fmtHours,
  timeToConversion,
} from "../lib/kinetics";
import {
  Chip,
  GlassPanel,
  IconAlert,
  IconCheck,
  IconX,
  Ring,
  useCountUp,
} from "./atoms";
import { CompareChart, type CurveSpec } from "./CompareChart";

interface CondEval {
  id: string;
  T: number;
  color: string;
  label: string;
  k: number;
  X: number; // conversion at horizon
  x100: number; // conversion at t = 100 s
  t90: number; // time to 90 % conversion
}

function CondCard({ c, recommended }: { c: CondEval; recommended: boolean }) {
  const disp = useCountUp(c.X * 100, 900);
  return (
    <div
      className={`relative rounded-xl border p-3.5 transition-colors duration-300 ${
        recommended
          ? "border-em-400/30 bg-em-400/[0.05] hover:border-em-400/45"
          : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.035]"
      }`}
    >
      {recommended && (
        <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-md border border-em-400/35 bg-abyss-900 px-2 py-[3px] font-mono text-[9px] font-semibold tracking-[0.16em] text-em-300">
          <IconCheck size={9} strokeWidth={3} />
          RECOMMENDED
        </span>
      )}
      <div className="flex items-center gap-4">
        <Ring pct={c.X * 100} color={c.color} size={86} stroke={7.5}>
          <span className="tabular font-mono text-[17px] font-semibold leading-5 text-steel-100">
            {disp.toFixed(1)}
          </span>
          <span className="font-mono text-[9px] text-steel-500">% conv.</span>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[14.5px] font-semibold text-steel-100">{c.label}</span>
            <Chip>{c.T} K</Chip>
          </div>
          <div className="tabular mt-1 font-mono text-[11px] text-steel-400">
            k = {c.k.toExponential(4)} s⁻¹
          </div>
          <div className="mt-2 flex flex-col items-start gap-1">
            {c.id === "A" && (
              <>
                <Chip tone="warn">
                  <IconX size={9} strokeWidth={3} />
                  &lt; 90% at 100 s
                </Chip>
                <span className="font-mono text-[10px] text-steel-500">
                  X(100 s) = {(c.x100 * 100).toFixed(4)}% · t₉₀ ≈ {fmtDuration(c.t90)}
                </span>
              </>
            )}
            {c.id === "B" && (
              <>
                <Chip>
                  t₉₀ ≈ {fmtDuration(c.t90)}
                </Chip>
                <span className="font-mono text-[10px] text-steel-500">
                  X(100 s) = {(c.x100 * 100).toFixed(3)}%
                </span>
              </>
            )}
            {c.id === "C" && (
              <>
                <Chip tone="emerald">
                  <IconCheck size={9} strokeWidth={3} />
                  Highest conversion
                </Chip>
                <span className="font-mono text-[10px] text-em-300/80">
                  90% target met at t₉₀ ≈ {fmtDuration(c.t90)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Module3() {
  const [hours, setHours] = useState(8);
  const horizon = hours * 3600;

  const cond: CondEval[] = useMemo(
    () =>
      CONDITIONS.map((c) => {
        const k = arrhenius(c.T);
        return {
          ...c,
          k,
          X: conversion(k, horizon),
          x100: conversion(k, 100),
          t90: timeToConversion(k, 0.9),
        };
      }),
    [horizon],
  );

  const [A, B, C] = cond;
  const recId = cond.reduce((best, c) => (c.X > best.X ? c : best), cond[0]).id;

  const curves: CurveSpec[] = useMemo(
    () =>
      cond.map((c) => ({
        id: c.id,
        label: `${c.id} · ${c.T} K`,
        color: c.color,
        values: Array.from({ length: 97 }, (_, i) => conversion(c.k, (horizon * i) / 96)),
      })),
    [cond, horizon],
  );

  return (
    <GlassPanel
      mod="MOD·03 — DECISION SUPPORT"
      tone="emerald"
      title="Operating-Condition Comparison"
      sub="Projected conversion per condition — change the batch horizon to re-evaluate all three"
      right={
        <>
          <Chip>batch horizon</Chip>
          <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {[4, 8, 12].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`rounded-md px-3 py-[5px] font-mono text-[11px] transition-all active:scale-95 ${
                  hours === h
                    ? "bg-white/[0.1] text-steel-100 shadow-sm"
                    : "text-steel-500 hover:text-steel-300"
                }`}
              >
                {h} h
              </button>
            ))}
          </div>
        </>
      }
      delay={180}
    >
      <div className="grid gap-5 lg:grid-cols-12">
        {/* condition cards */}
        <div className="flex flex-col gap-3.5 lg:col-span-5 xl:col-span-4">
          {cond.map((c) => (
            <CondCard key={c.id} c={c} recommended={c.id === recId} />
          ))}
          <div className="flex items-start gap-2.5 rounded-lg border border-warn-400/20 bg-warn-400/[0.05] px-3.5 py-3">
            <IconAlert size={14} className="mt-[1px] shrink-0 text-warn-400" />
            <p className="text-[11.5px] leading-relaxed text-steel-300">
              <span className="font-semibold text-warn-300">
                Condition A does not reach 90% conversion in 100 s
              </span>{" "}
              — it achieves only{" "}
              <span className="font-mono text-warn-300">{(A.x100 * 100).toFixed(4)}%</span> in that
              window; reaching 90% would take ≈{" "}
              <span className="font-mono text-warn-300">{fmtDuration(A.t90)}</span>.
            </p>
          </div>
        </div>

        {/* comparison chart + decision */}
        <div className="flex flex-col gap-4 lg:col-span-7 xl:col-span-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
            {cond.map((c) => (
              <span key={c.id} className="flex items-center gap-1.5 font-mono text-[10.5px] text-steel-400">
                <span className="inline-block h-[3px] w-4 rounded-full" style={{ background: c.color }} />
                {c.id} · {c.T} K
                <span className="tabular text-steel-300">{(c.X * 100).toFixed(1)}%</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-steel-400">
              <span className="inline-block w-4 border-t-2 border-dashed border-warn-400/70" />
              90% target
            </span>
          </div>

          <CompareChart
            tMax={horizon}
            curves={curves}
            runKey={hours}
            marker={{ t: C.t90, label: `t₉₀ ≈ ${fmtHours(C.t90)}`, color: "#3ecf8e" }}
          />

          <div className="rounded-r-lg border-l-2 border-em-400 bg-em-400/[0.05] px-4 py-3">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-em-400">
              Decision
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-steel-300">
              <span className="font-semibold text-steel-100">Condition C (350 K)</span> yields the
              highest conversion —{" "}
              <span className="tabular font-mono text-em-300">{(C.X * 100).toFixed(1)}%</span> over
              the {hours} h horizon — and clears the 90% target at t₉₀ ≈{" "}
              <span className="tabular font-mono text-em-300">{fmtDuration(C.t90)}</span>. Condition
              B trails at{" "}
              <span className="tabular font-mono text-cy-300">{(B.X * 100).toFixed(1)}%</span>, while
              Condition A remains negligible.
            </p>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
