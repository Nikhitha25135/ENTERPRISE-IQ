import { Link } from 'react-router-dom';
import VerificationTrail from '../components/VerificationTrail';

const CATEGORIES = [
  { label: 'Finance', note: 'Spend, budgets, close' },
  { label: 'HR', note: 'Policy, benefits, onboarding' },
  { label: 'Legal', note: 'Contracts, clauses, risk' },
  { label: 'Sales', note: 'Proposals, pricing, terms' },
  { label: 'Operations', note: 'Runbooks, SOPs, vendors' },
];

const PIPELINE = [
  {
    stage: 'Planner',
    title: 'Reads intent before it reads documents',
    body: "Every question is classified first — a factual lookup and a request to summarize a whole contract shouldn't be handled the same way. The planner decides the route before retrieval starts.",
  },
  {
    stage: 'Retrieval',
    title: 'Hybrid search across your library',
    body: 'Vector similarity and keyword search run together, scoped to the workspace and document the person is allowed to see, then re-ranked down to the passages worth answering from.',
  },
  {
    stage: 'Response',
    title: 'An answer, or a summary — never a guess dressed up as one',
    body: 'The same pipeline branches to a direct answer or a structured summary depending on what was asked, composed only from the retrieved passages.',
  },
  {
    stage: 'Verification',
    title: 'Checked against the source before it reaches you',
    body: "A separate pass re-reads the draft against its citations and flags anything unsupported — retrying the retrieval rather than letting a weak answer through.",
  },
];

const FEATURES = [
  {
    title: 'Citations on every claim',
    body: 'Answers link back to the exact document, page, and passage they came from — not a vague "based on your files."',
  },
  {
    title: 'Role-aware from day one',
    body: 'Admins, managers, and employees see different tools. Role changes take effect immediately, enforced on the API, not just hidden in the UI.',
  },
  {
    title: 'Handles the messy formats',
    body: 'PDFs, Word, Excel, CSV and scanned images — OCR runs automatically so a photographed invoice is as searchable as a native PDF.',
  },
  {
    title: 'Workspaces, not one shared pile',
    body: "Documents can be scoped to a team or project, so retrieval only ever draws from the library a person is meant to see.",
  },
  {
    title: 'A record of every question asked',
    body: "Chat history is kept per person, with the intent, the verification outcome, and the sources — a searchable trail of what the organization has asked and been told.",
  },
  {
    title: 'Built on your infrastructure',
    body: 'Runs against MongoDB and Redis you control, with JWT-based sessions and short-lived access tokens backed by refresh rotation.',
  },
];

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-paper">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
          <div>
            <p className="eyebrow">Enterprise knowledge, answered</p>
            <h1 className="mt-4 max-w-xl font-display text-[40px] font-semibold leading-[1.08] tracking-[-0.015em] text-ink sm:text-[52px]">
              Ask your company's documents.
              <span className="block text-navy-400">Get an answer you can audit.</span>
            </h1>
            <p className="mt-6 max-w-md font-body text-[16px] leading-relaxed text-slate">
              EnterpriseIQ turns your policies, contracts, and spreadsheets into a single
              place to ask a question — and traces every sentence of the answer back to
              the page it came from.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/register" className="btn-primary">
                Get started free
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign in
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-300">
              <span>Planner → Retrieval → Response → Verification</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <VerificationTrail />
          </div>
        </div>
      </section>

      {/* CATEGORY BAR */}
      <section id="platform" className="border-y border-ink/[0.07] bg-navy-900">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <p className="eyebrow mb-6 text-brass-400/80">One assistant, every function</p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
            {CATEGORIES.map((c) => (
              <div key={c.label} className="border-l border-paper/15 pl-4">
                <p className="font-display text-[17px] font-medium text-paper">{c.label}</p>
                <p className="mt-1 font-body text-[12.5px] leading-snug text-paper/45">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-paper py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-xl">
            <p className="eyebrow">How a question moves through the system</p>
            <h2 className="mt-4 font-display text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
              Four checkpoints, in a fixed order
            </h2>
            <p className="mt-4 font-body text-[15px] leading-relaxed text-slate">
              Nothing is answered from memory. Each query passes through the same
              pipeline, so the process behind a one-line answer and a full-document
              summary is equally accountable.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[4px] border border-ink/[0.08] bg-ink/[0.08] md:grid-cols-4">
            {PIPELINE.map((p, i) => (
              <div key={p.stage} className="flex flex-col bg-paper p-7">
                <span className="font-mono text-[11px] text-brass-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-slate">{p.stage}</p>
                <h3 className="mt-3 font-display text-[17px] font-semibold leading-snug text-ink">{p.title}</h3>
                <p className="mt-2.5 font-body text-[13.5px] leading-relaxed text-slate">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-ink/[0.07] bg-paper-dim/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-xl">
            <p className="eyebrow">What's included</p>
            <h2 className="mt-4 font-display text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
              Built for how enterprise knowledge actually lives
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <h3 className="font-display text-[16.5px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-2.5 font-body text-[13.5px] leading-relaxed text-slate">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="bg-navy-900 py-20 text-paper lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10">
          <div>
            <p className="eyebrow text-brass-400/80">Security &amp; access</p>
            <h2 className="mt-4 font-display text-[32px] font-semibold leading-tight text-paper sm:text-[38px]">
              Access control isn't an afterthought here
            </h2>
            <p className="mt-4 font-body text-[15px] leading-relaxed text-paper/60">
              Three roles, enforced at the API — not just hidden in a menu. Sessions run
              on short-lived access tokens with rotating refresh tokens, so a stolen token
              has a short shelf life.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { role: 'Admin', desc: 'Full control, including changing anyone\u2019s role.' },
              { role: 'Manager', desc: 'Sees the org roster and its document activity.' },
              { role: 'Employee', desc: 'Full use of chat and their own workspaces.' },
            ].map((r) => (
              <div key={r.role} className="rounded-[3px] border border-paper/15 p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-brass-400">{r.role}</p>
                <p className="mt-2 font-body text-[13px] leading-relaxed text-paper/70">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-paper py-24">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
          <h2 className="font-display text-[34px] font-semibold leading-tight text-ink sm:text-[42px]">
            Put your documents to work.
          </h2>
          <p className="mx-auto mt-4 max-w-md font-body text-[15px] leading-relaxed text-slate">
            Create a workspace, upload the first policy or contract, and ask it a
            question in under five minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="btn-brass">
              Create your account
            </Link>
            <Link to="/login" className="btn-secondary">
              I already have one
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
