import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../lib/api';

const STATUS_STYLES = {
  searchable: 'text-verified bg-verified-100',
  processing: 'text-brass-600 bg-brass/[0.12]',
  uploaded: 'text-slate bg-ink/[0.06]',
  failed: 'text-rust bg-rust/[0.08]',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [docs, setDocs] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiClient.listDocuments({ page: 1, page_size: 5 }),
      apiClient.chatHistory({ page: 1, page_size: 5 }),
    ])
      .then(([d, h]) => {
        if (!mounted) return;
        setDocs(d);
        setHistory(h);
      })
      .catch((err) => mounted && setError(apiClient.err(err)));
    return () => {
      mounted = false;
    };
  }, []);

  const searchableCount = docs?.documents.filter((d) => d.processing_status === 'searchable').length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-2 font-display text-[30px] font-semibold text-ink">
            Welcome back, {user?.full_name?.split(' ')[0]}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link to="/documents" className="btn-secondary">Upload a document</Link>
          <Link to="/chat" className="btn-primary">Ask a question</Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-[3px] border border-rust/25 bg-rust/[0.06] px-4 py-3 font-body text-[13.5px] text-rust">
          {error}
        </p>
      )}

      {/* Stat cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <p className="eyebrow">Documents</p>
          <p className="mt-3 font-display text-[32px] font-semibold text-ink">{docs?.total ?? '—'}</p>
          <p className="mt-1 font-body text-[13px] text-slate">in your library</p>
        </div>
        <div className="card p-6">
          <p className="eyebrow">Searchable</p>
          <p className="mt-3 font-display text-[32px] font-semibold text-verified">{docs ? searchableCount : '—'}</p>
          <p className="mt-1 font-body text-[13px] text-slate">indexed &amp; ready to query</p>
        </div>
        <div className="card p-6">
          <p className="eyebrow">Your role</p>
          <p className="mt-3 font-display text-[22px] font-semibold capitalize text-ink">{user?.role}</p>
          <p className="mt-1 font-body text-[13px] text-slate">{user?.organization || 'No organization set'}</p>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* Recent documents */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[17px] font-semibold text-ink">Recent documents</h2>
            <Link to="/documents" className="font-mono text-[11px] uppercase tracking-[0.08em] text-brass-600 hover:text-brass">View all</Link>
          </div>
          <div className="mt-4 space-y-3">
            {docs === null && <p className="font-body text-[13.5px] text-slate">Loading…</p>}
            {docs?.documents.length === 0 && (
              <p className="font-body text-[13.5px] text-slate">No documents yet — upload your first one to get started.</p>
            )}
            {docs?.documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-b border-ink/[0.06] pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-body text-[13.5px] text-ink">{d.file_name}</p>
                  <p className="font-mono text-[11px] text-slate-300">{(d.file_size / 1024).toFixed(0)} KB</p>
                </div>
                <span className={`shrink-0 rounded-[2px] px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] ${STATUS_STYLES[d.processing_status] || 'bg-ink/5 text-slate'}`}>
                  {d.processing_status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent questions */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[17px] font-semibold text-ink">Recent questions</h2>
            <Link to="/chat" className="font-mono text-[11px] uppercase tracking-[0.08em] text-brass-600 hover:text-brass">Ask another</Link>
          </div>
          <div className="mt-4 space-y-3">
            {history === null && <p className="font-body text-[13.5px] text-slate">Loading…</p>}
            {history?.length === 0 && (
              <p className="font-body text-[13.5px] text-slate">No questions asked yet.</p>
            )}
            {history?.map((h) => (
              <div key={h.id} className="border-b border-ink/[0.06] pb-3 last:border-0 last:pb-0">
                <p className="truncate font-body text-[13.5px] text-ink">{h.query}</p>
                <p className={`mt-1 font-mono text-[10.5px] uppercase tracking-[0.06em] ${h.verified ? 'text-verified' : 'text-brass-600'}`}>
                  {h.verified ? 'Verified' : 'Unverified'} · {h.intent}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
