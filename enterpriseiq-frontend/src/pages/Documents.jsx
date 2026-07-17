import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../lib/api';
import { useToast } from '../context/ToastContext';

const STATUS_STYLES = {
  searchable: 'text-verified bg-verified-100',
  processing: 'text-brass-600 bg-brass/[0.12]',
  uploaded: 'text-slate bg-ink/[0.06]',
  failed: 'text-rust bg-rust/[0.08]',
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const { push } = useToast();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    apiClient
      .listDocuments({ page, page_size: 10, search: search || undefined })
      .then(setData)
      .catch((err) => push(apiClient.err(err), 'error'))
      .finally(() => setLoading(false));
  }, [page, search, push]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      try {
        await apiClient.uploadDocument(file);
        push(`Uploaded ${file.name}`, 'success');
      } catch (err) {
        push(`${file.name}: ${apiClient.err(err)}`, 'error');
      }
    }
    setUploading(false);
    setPage(1);
    load();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const onDelete = async (doc) => {
    if (!confirm(`Delete "${doc.file_name}"? This can't be undone.`)) return;
    try {
      await apiClient.deleteDocument(doc.id);
      push('Document deleted', 'success');
      load();
    } catch (err) {
      push(apiClient.err(err), 'error');
    }
  };

  const startRename = (doc) => {
    setRenaming(doc.id);
    setRenameValue(doc.file_name);
  };

  const submitRename = async (doc) => {
    if (!renameValue.trim() || renameValue === doc.file_name) {
      setRenaming(null);
      return;
    }
    try {
      await apiClient.renameDocument(doc.id, renameValue.trim());
      push('Renamed', 'success');
      setRenaming(null);
      load();
    } catch (err) {
      push(apiClient.err(err), 'error');
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
      <p className="eyebrow">Library</p>
      <h1 className="mt-2 font-display text-[30px] font-semibold text-ink">Documents</h1>
      <p className="mt-2 max-w-lg font-body text-[14px] text-slate">
        PDF, Word, Excel, CSV, and images — text is extracted and indexed automatically, with OCR for scans.
      </p>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mt-8 flex flex-col items-center justify-center rounded-[4px] border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragOver ? 'border-brass bg-brass/[0.06]' : 'border-ink/15 bg-white/40'
        }`}
      >
        <p className="font-display text-[16px] font-semibold text-ink">
          {uploading ? 'Uploading…' : 'Drag files here, or browse'}
        </p>
        <p className="mt-1 font-body text-[13px] text-slate">Up to 25 MB per file</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(Array.from(e.target.files))}
          accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
        />
        <button className="btn-primary mt-5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Choose files'}
        </button>
      </div>

      {/* Search */}
      <div className="mt-10 flex items-center justify-between gap-4">
        <input
          className="field-input max-w-xs"
          placeholder="Search documents…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {data && <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-300">{data.total} total</p>}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-[4px] border border-ink/[0.08]">
        <table className="w-full border-collapse bg-white/60 text-left">
          <thead>
            <tr className="border-b border-ink/[0.08] bg-paper-dim/50">
              <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate">Name</th>
              <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate">Status</th>
              <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate">Size</th>
              <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate">Uploaded</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center font-body text-[13.5px] text-slate">Loading…</td></tr>
            )}
            {!loading && data?.documents.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center font-body text-[13.5px] text-slate">No documents match.</td></tr>
            )}
            {!loading && data?.documents.map((d) => (
              <tr key={d.id} className="border-b border-ink/[0.06] last:border-0 hover:bg-paper-dim/30">
                <td className="max-w-[280px] px-4 py-3">
                  {renaming === d.id ? (
                    <input
                      autoFocus
                      className="field-input !py-1.5 !text-[13px]"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitRename(d)}
                      onBlur={() => submitRename(d)}
                    />
                  ) : (
                    <span className="truncate font-body text-[13.5px] text-ink block">{d.file_name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-[2px] px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] ${STATUS_STYLES[d.processing_status] || 'bg-ink/5 text-slate'}`}>
                    {d.processing_status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate">{formatSize(d.file_size)}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                    <a href={apiClient.downloadUrl(d.id)} className="text-slate hover:text-ink">Download</a>
                    <button onClick={() => startRename(d)} className="text-slate hover:text-ink">Rename</button>
                    <button onClick={() => onDelete(d)} className="text-rust hover:text-rust/70">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > data.page_size && (
        <div className="mt-4 flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary !py-2 disabled:opacity-30">
            Previous
          </button>
          <span className="font-mono text-[11px] text-slate">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary !py-2 disabled:opacity-30">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
