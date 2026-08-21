import { useMemo, useState } from "react";
import { BENCH, PROJECT, analytical, fmtExp, rk4FirstOrder } from "../lib/kinetics";
import { Chip, GlassPanel, IconCheck, IconPlay } from "./atoms";
import { ErrorStrip, SimChart } from "./SimChart";

export function Module2() {
  const sim = useMemo(
    () => rk4FirstOrder(BENCH.k, BENCH.c0, BENCH.tEnd, BENCH.steps),
    [],
  );
  const ana = useMemo(() => sim.t.map((tv) => analytical(BENCH.k, tv, BENCH.c0)), [sim]);
  const liveErr = Math.abs(sim.c[sim.c.length - 1] - ana[ana.length - 1]);

  const [runId, setRunId] = useState(0);
  const [showRk4, setShowRk4] = useState(true);
  const [showAna, setShowAna] = useState(true);

  return (
    <GlassPanel
      mod="MOD·02 — RK4 SIMULATION"
      tone="cyan"
      title="Concentration vs. Time · Solver Validation"
      sub="Classical 4-stage Runge–Kutta benchmarked against the closed-form solution e⁻ᵏᵗ"
      right={
        <>
          <Chip>h = 1.0 s</Chip>
          <Chip>N = 100</Chip>
          <Chip tone="blue">order 4</Chip>
          <button
            onClick={() => setRunId((n) => n + 1)}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.12] bg-white/[0.06] px-2.5 py-[7px] font-mono text-[11px] text-steel-200 transition-all hover:border-cy-400/40 hover:bg-white/[0.11] hover:text-steel-100 active:scale-95"
          >
            <IconPlay size={10} />
            Run
          </button>
        </>
      }
      className="h-full"
      delay={90}
    >
      {/* series toggles */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowRk4((v) => !v)}
          className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-all active:scale-95 ${
            showRk4
              ? "border-cy-400/30 bg-cy-400/[0.09] text-cy-300"
              : "border-white/[0.08] text-steel-500 hover:text-steel-300"
          }`}
        >
          <span
            className="inline-block h-[3px] w-4 rounded-full"
            style={{ background: "#4fc8de", opacity: showRk4 ? 1 : 0.3 }}
          />
          RK4 · N = 100
        </button>
        <button
          onClick={() => setShowAna((v) => !v)}
          className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-all active:scale-95 ${
            showAna
              ? "border-tech-400/30 bg-tech-400/[0.09] text-tech-300"
              : "border-white/[0.08] text-steel-500 hover:text-steel-300"
          }`}
        >
          <span
            className="inline-block h-0 w-4 border-t-2 border-dashed"
            style={{ borderColor: "#6c9bf5", opacity: showAna ? 1 : 0.3 }}
          />
          Exact · C₀e⁻ᵏᵗ
        </button>
        <span className="ml-auto hidden font-mono text-[10px] text-steel-500 sm:block">
          k = 1.00×10⁻² s⁻¹ · C₀ = 1 mol·L⁻¹ · t ∈ [0, 100] s
        </span>
      </div>

      <SimChart t={sim.t} rk4={sim.c} ana={ana} showRk4={showRk4} showAna={showAna} runId={runId} />

      {/* terminal readouts */}
      <div className="mt-4 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-[3px] w-4 rounded-full border-t-2 border-dashed border-tech-400" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-steel-500">
              Analytical
            </span>
          </div>
          <div className="tabular mt-1 font-mono text-[23px] font-semibold leading-7 text-steel-100">
            {PROJECT.analytical}
          </div>
          <div className="mt-0.5 font-mono text-[10.5px] text-steel-500">C(100 s)/C₀ = e⁻¹ · exact</div>
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-[3px] w-4 rounded-full bg-cy-400" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-steel-500">
              RK4
            </span>
          </div>
          <div className="tabular mt-1 font-mono text-[23px] font-semibold leading-7 text-steel-100">
            {PROJECT.rk4}
          </div>
          <div className="mt-0.5 font-mono text-[10.5px] text-steel-500">
            h = 1.0 s · N = 100 · live |Δ| = {fmtExp(liveErr, 2)}
          </div>
        </div>
        <div className="flex items-center">
          <span
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-em-400/25 bg-em-400/[0.08] px-4 py-3 font-mono text-[12.5px] text-em-300 sm:w-auto"
            title={`Reference project result · live integration |Δ| = ${fmtExp(liveErr, 3)}`}
          >
            <IconCheck size={13} strokeWidth={2.5} />
            Absolute Error: 3.0913e-11
          </span>
        </div>
      </div>

      {/* pointwise error strip */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-baseline justify-between px-1">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-steel-500">
            Pointwise error
          </span>
          <span className="font-mono text-[9.5px] text-steel-500">log₁₀ |C_RK4 − C_exact|</span>
        </div>
        <ErrorStrip t={sim.t} rk4={sim.c} ana={ana} runId={runId} />
      </div>
    </GlassPanel>
  );
}
