import { Chip, IconClock, useClock } from "./components/atoms";
import { Module1 } from "./components/Module1";
import { Module2 } from "./components/Module2";
import { Module3 } from "./components/Module3";

function LogoMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="36"
        height="36"
        rx="10"
        fill="rgba(255,255,255,0.045)"
        stroke="rgba(255,255,255,0.14)"
      />
      <path
        d="M8 10.5 C 16 10.5, 18.5 27, 30.5 27.5"
        stroke="#4fc8de"
        strokeWidth="2.1"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="12" r="1.9" fill="#6c9bf5" />
      <circle cx="18.5" cy="17.5" r="1.9" fill="#6c9bf5" />
      <circle cx="24.5" cy="23.5" r="1.9" fill="#6c9bf5" />
    </svg>
  );
}

export default function App() {
  const clock = useClock();

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* layered backdrop: engineering grid + slow ambient tints */}
      <div className="hud-grid pointer-events-none fixed inset-0" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="drift-a absolute -top-44 left-[6%] h-[540px] w-[760px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(79,200,222,0.06), transparent 70%)" }}
        />
        <div
          className="drift-b absolute right-[-12%] top-[28%] h-[620px] w-[820px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(108,155,245,0.055), transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-22%] left-[28%] h-[520px] w-[720px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(62,207,142,0.04), transparent 70%)" }}
        />
      </div>

      {/* HUD header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-abyss-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <h1 className="font-display text-[16px] font-bold leading-tight tracking-tight text-steel-100">
                Kinetics Console
              </h1>
              <div className="font-mono text-[9px] tracking-[0.24em] text-steel-500">
                RK-4 SOLVER · FIRST-ORDER REACTION KINETICS
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Chip tone="emerald">
              <span className="pulse-dot inline-block h-[6px] w-[6px] rounded-full bg-em-400" />
              SOLVER READY
            </Chip>
            <Chip>dC/dt = −k·C</Chip>
            <Chip>
              <IconClock size={11} />
              {clock}
            </Chip>
          </div>
        </div>
      </header>

      {/* modules */}
      <main className="relative z-10 mx-auto max-w-[1320px] px-5 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <Module1 />
          </div>
          <div className="xl:col-span-8">
            <Module2 />
          </div>
          <div className="xl:col-span-12">
            <Module3 />
          </div>
        </div>
      </main>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-2 px-5 py-5 font-mono text-[10.5px] text-steel-500 sm:flex-row sm:px-6">
          <span>
            MODEL&nbsp;&nbsp;dC/dt = −k·C · C(0) = C₀ · k = A·exp(−Eₐ/RT)
          </span>
          <span>
            RK4 CONSOLE v2.1 · e⁻¹ = 0.36787944117… · 4 stages / step
          </span>
        </div>
      </footer>
    </div>
  );
}
