import { useEffect, useRef, useState } from 'react';
import apiClient from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function Chat() {
  const { push } = useToast();
  const [query, setQuery] = useState('');
  const [asking, setAsking] = useState(false);
  const [thread, setThread] = useState([]);
  const [history, setHistory] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    apiClient
      .chatHistory({ page: 1, page_size: 15 })
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread, asking]);

  const submit = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || asking) return;
    setQuery('');
    setThread((t) => [...t, { role: 'user', text: q }]);
    setAsking(true);
    try {
      const res = await apiClient.askQuery({ query: q });
      setThread((t) => [...t, { role: 'assistant', ...res }]);
      setHistory((h) => [{ id: Date.now(), query: q, answer: res.answer, intent: res.intent, verified: res.verified }, ...(h || [])]);
    } catch (err) {
      push(apiClient.err(err), 'error');
      setThread((t) => [...t, { role: 'assistant', error: apiClient.err(err) }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[1fr_280px] lg:px-10">
      {/* Chat column */}
      <div className="flex min-h-[70vh] flex-col">
        <p className="eyebrow">Ask</p>
        <h1 className="mt-2 font-display text-[26px] font-semibold text-ink">Ask your document library</h1>

        <div className="mt-6 flex-1 space-y-5 overflow-y-auto pb-4">
          {thread.length === 0 && (
            <div className="card flex flex-col items-start gap-2 p-6">
              <p className="font-display text-[15px] font-semibold text-ink">Try asking something like:</p>
              <ul className="mt-1 space-y-1.5 font-body text-[13.5px] text-slate">
                <li>"Summarize the vendor renewal policy."</li>
                <li>"What's our PTO carryover limit?"</li>
                <li>"Which contracts mention a termination-for-convenience clause?"</li>
              </ul>
            </div>
          )}

          {thread.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[75%] rounded-[4px] bg-navy px-4 py-3 font-body text-[14px] text-paper">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-start">
                <div className="max-w-[85%] card p-5">
                  {m.error ? (
                    <p className="font-body text-[13.5px] text-rust">{m.error}</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-[2px] px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] ${
                            m.verified ? 'bg-verified-100 text-verified' : 'bg-brass/[0.12] text-brass-600'
                          }`}
                        >
                          {m.verified ? 'Verified' : 'Unverified'}
                        </span>
                        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-slate-300">{m.intent}</span>
                      </div>
                      <p className="mt-3 font-body text-[14.5px] leading-relaxed text-ink">{m.answer}</p>
                      {m.verification_note && (
                        <p className="mt-2 font-body text-[12px] italic text-slate">{m.verification_note}</p>
                      )}
                      {m.citations?.length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-ink/[0.07] pt-3">
                          <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-slate-300">Sources</p>
                          {m.citations.map((c) => (
                            <div key={c.chunk_id} className="rounded-[3px] border border-ink/[0.08] bg-paper/60 px-3 py-2">
                              <p className="font-mono text-[11px] text-brass-600">
                                {c.file_name}{c.page != null ? ` · p.${c.page}` : ''}
                              </p>
                              <p className="mt-1 font-body text-[12.5px] leading-snug text-slate">{c.text_preview}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          )}

          {asking && (
            <div className="flex justify-start">
              <div className="card flex items-center gap-2 px-4 py-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass" />
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate">Planner → Retrieval → Verification…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={submit} className="sticky bottom-0 mt-4 flex gap-3 border-t border-ink/[0.08] bg-paper pt-4">
          <input
            className="field-input flex-1"
            placeholder="Ask a question about your documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={2000}
          />
          <button type="submit" disabled={asking || !query.trim()} className="btn-primary shrink-0">
            {asking ? 'Asking…' : 'Ask'}
          </button>
        </form>
      </div>

      {/* History sidebar */}
      <aside className="hidden lg:block">
        <p className="eyebrow">Recent</p>
        <div className="mt-4 space-y-3">
          {history === null && <p className="font-body text-[13px] text-slate">Loading…</p>}
          {history?.length === 0 && <p className="font-body text-[13px] text-slate">No previous questions.</p>}
          {history?.map((h) => (
            <button
              key={h.id}
              onClick={() => setQuery(h.query)}
              className="block w-full rounded-[3px] border border-ink/[0.08] bg-white/50 px-3 py-2.5 text-left transition-colors hover:border-brass/40"
            >
              <p className="truncate font-body text-[12.5px] text-ink">{h.query}</p>
              <p className={`mt-1 font-mono text-[10px] uppercase tracking-[0.06em] ${h.verified ? 'text-verified' : 'text-brass-600'}`}>
                {h.verified ? 'Verified' : 'Unverified'}
              </p>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
