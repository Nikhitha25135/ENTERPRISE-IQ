import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../lib/api';
import { useToast } from '../context/ToastContext';
import './Documents.css';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FILE_TYPES = {
  pdf: { label: 'PDF', kind: 'pdf' },
  doc: { label: 'DOC', kind: 'word' },
  docx: { label: 'DOC', kind: 'word' },
  xls: { label: 'XLS', kind: 'excel' },
  xlsx: { label: 'XLS', kind: 'excel' },
  csv: { label: 'CSV', kind: 'excel' },
  ppt: { label: 'PPT', kind: 'slides' },
  pptx: { label: 'PPT', kind: 'slides' },
  png: { label: 'IMG', kind: 'image' },
  jpg: { label: 'IMG', kind: 'image' },
  jpeg: { label: 'IMG', kind: 'image' },
  txt: { label: 'TXT', kind: 'text' },
};

function getFileType(fileName = '') {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return FILE_TYPES[ext] || { label: ext ? ext.slice(0, 3).toUpperCase() : 'FILE', kind: 'default' };
}

export function FileTypeIcon({ fileName }) {
  const { kind } = getFileType(fileName);
  return (
    <span className={`file-type-icon ${kind}`} aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 2.5h6L15 6v10.5a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M11.5 2.5V6H15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </span>
  );
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
      <h1 className="docs-title mt-2 text-[30px]">Documents</h1>
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
        className={`dropzone mt-8 flex flex-col items-center justify-center px-6 py-12 text-center ${dragOver ? 'drag-over' : ''}`}
      >
        <p className="dropzone-title text-[16px]">
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
      <div className="docs-table-wrap mt-4">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th />
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
              <tr key={d.id}>
                <td className="max-w-[280px]">
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
                    <span className="flex items-center gap-2.5">
                      <FileTypeIcon fileName={d.file_name} />
                      <span className="truncate font-body text-[13.5px] text-ink">{d.file_name}</span>
                    </span>
                  )}
                </td>
                <td>
                  <span className={`status-pill ${d.processing_status}`}>
                    {d.processing_status}
                  </span>
                </td>
                <td className="font-mono text-[12px] text-slate">{formatSize(d.file_size)}</td>
                <td className="font-mono text-[12px] text-slate">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                <td>
                  <div className="flex items-center justify-end gap-3">
                    <a href={apiClient.downloadUrl(d.id)} className="docs-row-action">Download</a>
                    <button onClick={() => startRename(d)} className="docs-row-action">Rename</button>
                    <button onClick={() => onDelete(d)} className="docs-row-action danger">Delete</button>
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
