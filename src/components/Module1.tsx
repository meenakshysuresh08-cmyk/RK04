import { useMemo, useState } from "react";
import {
  A_FACTOR,
  EA_JMOL,
  R_GAS,
  arrhenius,
  fmtDuration,
  fmtExp,
} from "../lib/kinetics";
import { Chip, GlassPanel, Slider, Stat } from "./atoms";

/* ---------------------- Arrhenius mini-plot (ln k vs 1000/T) ------ */

const AW = 340;
const AH = 205;
const APL = 42;
const APR = 12;
const APT = 14;
const APB = 30;
const X0 = 2.5;
const X1 = 1000 / 300; // 3.333…
const Y0 = -13.8;
const Y1 = -5.8;

function ArrheniusPlot({ T }: { T: number }) {
  const ax = (Tv: number) => APL + ((1000 / Tv - X0) / (X1 - X0)) * (AW - APL - APR);
  const ay = (lnk: number) => APT + (1 - (lnk - Y0) / (Y1 - Y0)) * (AH - APT - APB);

  const pts = useMemo(() => {
    const out: string[] = [];
    for (let Tv = 300; Tv <= 400.001; Tv += 2.5) {
      out.push(`${ax(Tv).toFixed(2)} ${ay(Math.log(arrhenius(Tv))).toFixed(2)}`);
    }
    return `M${out.join(" L")}`;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kT = arrhenius(T);
  const mx = ax(T);
  const my = ay(Math.log(kT));
  const labelEnd = mx > AW - 90;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-steel-500">
          Arrhenius plot
        </span>
        <span className="font-mono text-[9.5px] text-steel-500">slope = −Eₐ/R</span>
      </div>
      <svg viewBox={`0 0 ${AW} ${AH}`} className="block w-full">
        {[-6, -8, -10, -12].map((v) => (
          <g key={v}>
            <line
              x1={APL}
              x2={AW - APR}
              y1={ay(v)}
              y2={ay(v)}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="3 5"
            />
            <text
              x={APL - 6}
              y={ay(v) + 3}
              textAnchor="end"
              fontSize="9"
              fill="#5d6f84"
              fontFamily="IBM Plex Mono, monospace"
            >
              {v}
            </text>
          </g>
        ))}
        {[2.6, 2.8, 3.0, 3.2].map((v) => (
          <text
            key={v}
            x={APL + ((v - X0) / (X1 - X0)) * (AW - APL - APR)}
            y={AH - APB + 14}
            textAnchor="middle"
            fontSize="9"
            fill="#5d6f84"
            fontFamily="IBM Plex Mono, monospace"
          >
            {v.toFixed(1)}
          </text>
        ))}
        <line x1={APL} x2={APL} y1={APT} y2={AH - APB} stroke="rgba(255,255,255,0.14)" />
        <line x1={APL} x2={AW - APR} y1={AH - APB} y2={AH - APB} stroke="rgba(255,255,255,0.14)" />
        <text x={APL - 6} y={APT - 4} textAnchor="end" fontSize="9" fill="#7f91a6" fontFamily="IBM Plex Mono, monospace">
          ln k
        </text>
        <text x={AW - APR} y={AH - 4} textAnchor="end" fontSize="9" fill="#7f91a6" fontFamily="IBM Plex Mono, monospace">
          1000/T [K⁻¹]
        </text>

        <path d={pts} fill="none" stroke="#6c9bf5" strokeWidth="1.75" strokeLinecap="round" opacity="0.85" />

        {/* live operating point */}
        <line x1={mx} x2={mx} y1={my} y2={AH - APB} stroke="#4fc8de" strokeOpacity="0.35" strokeDasharray="2 4" />
        <circle cx={mx} cy={my} r="8" fill="#4fc8de" opacity="0.16" />
        <circle
          cx={mx}
          cy={my}
          r="3.6"
          fill="#4fc8de"
          stroke="#0a1017"
          strokeWidth="1.4"
          style={{ transition: "cx 0.2s ease, cy 0.2s ease" }}
        />
        <text
          x={labelEnd ? mx - 9 : mx + 9}
          y={my - 8}
          textAnchor={labelEnd ? "end" : "start"}
          fontSize="10"
          fill="#8adbe9"
          fontFamily="IBM Plex Mono, monospace"
        >
          {T} K
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------- module --------------------------- */

export function Module1() {
  const [T, setT] = useState(300);
  const [c0, setC0] = useState(1.0);

  const k = arrhenius(T);
  const kBase = arrhenius(300);
  const ratio = k / kBase;
  const tHalf = Math.LN2 / k;
  const v0 = k * c0;

  return (
    <GlassPanel
      mod="MOD·01 — MODELING"
      tone="blue"
      title="Virtual Experiment Setup"
      sub="Arrhenius model of a first-order reaction A → products"
      right={
        <>
          <Chip tone="blue">1st order</Chip>
          <Chip>A → P</Chip>
        </>
      }
      className="h-full"
      delay={0}
    >
      <div className="flex h-full flex-col gap-5">
        <Slider
          label="Temperature"
          unit="K"
          min={300}
          max={400}
          step={1}
          value={T}
          display={String(T)}
          color="#4fc8de"
          ticks={["300", "325", "350", "375", "400"]}
          onChange={setT}
        />
        <Slider
          label="Initial concentration C₀"
          unit="mol·L⁻¹"
          min={0.2}
          max={2}
          step={0.05}
          value={c0}
          display={c0.toFixed(2)}
          color="#6c9bf5"
          ticks={["0.20", "0.65", "1.10", "1.55", "2.00"]}
          onChange={setC0}
        />

        {/* headline k readout */}
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-steel-500">
              Arrhenius rate constant k(T)
            </span>
            {T === 300 ? (
              <Chip>baseline 300 K</Chip>
            ) : (
              <Chip tone="cyan">×{ratio >= 100 ? ratio.toFixed(0) : ratio.toFixed(2)} vs 300 K</Chip>
            )}
          </div>
          <div className="tabular mt-1.5 font-mono text-[27px] font-semibold leading-8 text-cy-300">
            {fmtExp(k, 4)}
            <span className="ml-1.5 text-[12px] font-normal text-steel-400">s⁻¹</span>
          </div>
          <div className="mt-1 font-mono text-[10.5px] text-steel-500">
            k = A·exp(−Eₐ/RT) = {fmtExp(A_FACTOR, 2)}·exp(−{(EA_JMOL / 1000).toFixed(2)} / (
            {(R_GAS / 1000).toFixed(4)}·{T}))
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Half-life t½" value={fmtDuration(tHalf)} sub="ln 2 / k" />
          <Stat label="Initial rate v₀" value={fmtExp(v0, 3)} unit="mol·L⁻¹·s⁻¹" sub="k · C₀" />
        </div>

        <ArrheniusPlot T={T} />

        <div className="mt-auto flex flex-wrap gap-2">
          <Chip tone="blue">A = 1.00×10⁶ s⁻¹</Chip>
          <Chip tone="blue">Eₐ = 67.23 kJ·mol⁻¹</Chip>
          <Chip>R = 8.3145 J·mol⁻¹·K⁻¹</Chip>
        </div>
      </div>
    </GlassPanel>
  );
}
