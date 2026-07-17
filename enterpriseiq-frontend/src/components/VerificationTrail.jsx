import { useEffect, useState } from 'react';

const QUERY = 'What was our Q3 vendor renewal spend, and which contracts auto-renew next month?';

const DOCS = [
  { id: 'DOC-4471', name: 'Vendor_Master_Q3.xlsx', page: 12 },
  { id: 'DOC-2098', name: 'Procurement_Policy.pdf', page: 4 },
  { id: 'DOC-3312', name: 'Contracts_AutoRenew.pdf', page: 1 },
];

const STAGES = ['query', 'plan', 'retrieve', 'draft', 'verify'];
const STAGE_LABEL = {
  query: 'Query received',
  plan: 'Planner routes intent',
  retrieve: 'Retrieval pulls sources',
  draft: 'Draft answer composed',
  verify: 'Verification checks claims',
};

export default function VerificationTrail() {
  const [stageIdx, setStageIdx] = useState(0);
  const [typedLen, setTypedLen] = useState(0);

  useEffect(() => {
    if (stageIdx !== 0) return;
    if (typedLen >= QUERY.length) {
      const t = setTimeout(() => setStageIdx(1), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTypedLen((n) => n + 1), 18);
    return () => clearTimeout(t);
  }, [typedLen, stageIdx]);

  useEffect(() => {
    if (stageIdx === 0 || stageIdx >= STAGES.length) return;
    const delay = stageIdx === STAGES.length - 1 ? 2600 : 950;
    const t = setTimeout(() => {
      setStageIdx((i) => (i + 1 >= STAGES.length ? 0 : i + 1));
      if (stageIdx + 1 >= STAGES.length) setTypedLen(0);
    }, delay);
    return () => clearTimeout(t);
  }, [stageIdx]);

  const stage = STAGES[stageIdx];
  const stepDone = (name) => STAGES.indexOf(name) < stageIdx || (STAGES.indexOf(name) === stageIdx && name !== STAGES[STAGES.length - 1]);

  return (
    <div className="card relative w-full max-w-[480px] overflow-hidden bg-white/90">
      <div className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-3">
        <span className="eyebrow">Query trace</span>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-verified" />
          live
        </span>
      </div>

      <div className="space-y-4 px-5 py-5">
        {/* Query input line */}
        <div className="rounded-[3px] border border-ink/10 bg-paper/60 px-3.5 py-3">
          <p className="font-mono text-[12.5px] leading-relaxed text-navy-800">
            {QUERY.slice(0, typedLen)}
            {stage === 'query' && <span className="animate-blink text-brass">▌</span>}
          </p>
        </div>

        {/* Pipeline steps */}
        <ol className="space-y-2.5 border-l border-dashed border-ink/15 pl-4">
          {STAGES.slice(1, 4).map((s) => {
            const active = stage === s;
            const done = STAGES.indexOf(s) < stageIdx;
            return (
              <li key={s} className="relative">
                <span
                  className={`absolute -left-[21px] top-1 h-2 w-2 rounded-full transition-colors ${
                    done ? 'bg-verified' : active ? 'bg-brass' : 'bg-ink/15'
                  }`}
                />
                <p className={`font-body text-[13px] transition-colors ${active || done ? 'text-ink' : 'text-slate-300'}`}>
                  {STAGE_LABEL[s]}
                </p>
                {s === 'retrieve' && (active || done) && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {DOCS.map((d, i) => (
                      <span
                        key={d.id}
                        className="animate-rise rounded-[2px] border border-brass/30 bg-brass/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-brass-600"
                        style={{ animationDelay: `${i * 120}ms`, animationFillMode: 'backwards' }}
                      >
                        {d.id} · p.{d.page}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* Verification result */}
        <div className="relative flex items-center justify-between rounded-[3px] border border-ink/10 bg-navy-900 px-4 py-3.5">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/40">Answer, with citations</p>
            <p className="mt-1 font-body text-[12.5px] leading-relaxed text-paper/85">
              $482K across 14 vendors · 3 contracts auto-renew before Aug 14.
            </p>
          </div>
          {stage === 'verify' && (
            <div className="flex h-14 w-14 shrink-0 animate-stamp items-center justify-center rounded-full border-2 border-brass bg-brass/10 shadow-seal">
              <span className="font-mono text-[9px] font-semibold uppercase leading-tight tracking-[0.06em] text-brass-400 text-center">
                Verified
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
