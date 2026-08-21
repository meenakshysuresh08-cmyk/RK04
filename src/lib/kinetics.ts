/* ------------------------------------------------------------------ */
/*  Reaction kinetics core — first-order decay  A -> products          */
/*  dC/dt = -k(T) · C,   k(T) = A · exp(-Ea / (R·T))                   */
/* ------------------------------------------------------------------ */

export const R_GAS = 8.314462618; // J·mol⁻¹·K⁻¹
export const A_FACTOR = 1.0e6; // s⁻¹  (pre-exponential factor)
export const EA_JMOL = 67232.87; // J·mol⁻¹  (=> Ea ≈ 67.23 kJ·mol⁻¹)

/** Arrhenius rate constant. Calibrated: k(300 K) = 1.9675e-6 s⁻¹. */
export function arrhenius(T: number): number {
  return A_FACTOR * Math.exp(-EA_JMOL / (R_GAS * T));
}

/** Closed-form solution C(t) = C0 · e^(-k t). */
export function analytical(k: number, t: number, c0 = 1): number {
  return c0 * Math.exp(-k * t);
}

/** Conversion X(t) = 1 - e^(-k t). */
export function conversion(k: number, t: number): number {
  return 1 - Math.exp(-k * t);
}

/** Time needed to reach conversion X (0..1). */
export function timeToConversion(k: number, X: number): number {
  return Math.log(1 / (1 - X)) / k;
}

export interface RK4Result {
  t: number[];
  c: number[];
}

/** Classical 4th-order Runge–Kutta for dC/dt = -k·C on [0, tEnd]. */
export function rk4FirstOrder(k: number, c0: number, tEnd: number, n: number): RK4Result {
  const h = tEnd / n;
  const f = (c: number) => -k * c;
  const t: number[] = [0];
  const c: number[] = [c0];
  let y = c0;
  for (let i = 1; i <= n; i++) {
    const k1 = f(y);
    const k2 = f(y + (h * k1) / 2);
    const k3 = f(y + (h * k2) / 2);
    const k4 = f(y + h * k3);
    y = y + (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
    t.push(i * h);
    c.push(y);
  }
  return { t, c };
}

/* ------------------------- reference results ---------------------- */

export const BENCH = {
  k: 1.0e-2, // s⁻¹  (validation benchmark)
  c0: 1.0, // mol·L⁻¹
  tEnd: 100, // s
  steps: 100, // h = 1.0 s
};

/** Published project results for the benchmark run (k·t = 1 => C/C0 = e⁻¹). */
export const PROJECT = {
  analytical: "0.36787944",
  rk4: "0.36787944",
  absError: "3.0913e-11",
};

export const CONDITIONS = [
  { id: "A", T: 300, color: "#7e93ad", label: "Condition A" },
  { id: "B", T: 325, color: "#4fc8de", label: "Condition B" },
  { id: "C", T: 350, color: "#3ecf8e", label: "Condition C" },
] as const;

/* ----------------------------- formatters ------------------------- */

/** 1.9675e-6 style scientific notation. */
export function fmtExp(x: number, digits = 4): string {
  return x.toExponential(digits);
}

export function fmtFixed(x: number, digits = 8): string {
  return x.toFixed(digits);
}

/** Human duration: d / h / min / s. */
export function fmtDuration(s: number): string {
  if (s >= 2 * 86400) return `${(s / 86400).toFixed(1)} d`;
  if (s >= 2 * 3600) return `${(s / 3600).toFixed(1)} h`;
  if (s >= 120) return `${(s / 60).toFixed(1)} min`;
  return `${s.toFixed(s < 10 ? 1 : 0)} s`;
}

export function fmtHours(s: number, digits = 2): string {
  return `${(s / 3600).toFixed(digits)} h`;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
