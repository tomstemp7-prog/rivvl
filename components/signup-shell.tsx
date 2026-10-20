import { Logo } from "./logo";

const STEPS = [
  { title: "Your business", hint: "Sector, postcode and catchment" },
  { title: "Your prices", hint: "Share to unlock more detail" },
  { title: "Your local market", hint: "See every rival’s price" },
];

type Props = {
  step: 1 | 2;
  /** Replaces the hint under completed steps, e.g. "Gym · RG1 3EU · 3 miles". */
  doneSummary?: string;
  asideCard: React.ReactNode;
  children: React.ReactNode;
};

export function SignupShell({ step, doneSummary, asideCard, children }: Props) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <aside className="flex min-w-0 flex-[1_1_380px] flex-col gap-12 bg-ink px-6 py-10 text-paper sm:px-12">
        <Logo dark />
        <ol aria-label="Sign-up steps" className="m-0 flex list-none flex-col gap-7 p-0">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <li key={s.title} className="flex items-start gap-4" aria-current={current ? "step" : undefined}>
                {done ? (
                  <span aria-label="Done" className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-data">
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                ) : (
                  <span
                    className={`flex h-9 w-9 flex-none items-center justify-center rounded-full font-bold ${
                      current ? "bg-accent text-ink" : "border-[1.5px] border-muted text-on-dark-muted"
                    }`}
                  >
                    {n}
                  </span>
                )}
                <div className="flex flex-col gap-1">
                  <strong className={`text-[17px] ${done || current ? "" : "text-on-dark"}`}>{s.title}</strong>
                  <span className="text-[15px] text-on-dark-muted">{done && doneSummary ? doneSummary : s.hint}</span>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex-1" />
        <div className="flex flex-col gap-2 rounded-[20px] border border-ink-line bg-ink-2 p-6">{asideCard}</div>
      </aside>
      <main className="flex min-w-0 max-w-[860px] flex-[999_1_560px] flex-col gap-10 px-4 py-14 sm:px-16 sm:py-18">
        {children}
      </main>
    </div>
  );
}

export function StepHeading({ step, title, intro }: { step: number; title: string; intro: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow text-data-dark">Step {step} of 3</p>
      <h1 className="m-0 font-display text-4xl leading-[1.1] font-semibold tracking-[-1px] sm:text-[44px]">{title}</h1>
      <p className="m-0 text-[17px] leading-[1.55] text-body">{intro}</p>
    </div>
  );
}
