import { useState, useEffect } from 'react';
import {
  X, Edit2, Trash2, Star, StarOff, Copy, Check, Eye, EyeOff,
  Clock, Shield, AlertTriangle, Archive, ExternalLink,
} from 'lucide-react';
import type { VaultEntry, Category } from '../types';
import Favicon from './Favicon';

interface EntryDetailProps {
  entry: VaultEntry;
  categories: Category[];
  clipboardClearSeconds: number;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
  onClose: () => void;
}

type SecretKey = 'password' | 'pin' | 'apiKey' | 'securityAnswer';

interface CopyState { field: string; countdown: number }

export default function EntryDetail({
  entry, categories, clipboardClearSeconds, onEdit, onDelete, onFavorite, onClose,
}: EntryDetailProps) {
  const [shown, setShown] = useState<Set<SecretKey>>(new Set());
  const [copyState, setCopyState] = useState<CopyState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cat = categories.find((c) => c.id === entry.category) || categories[0];

  useEffect(() => {
    if (!copyState) return;
    if (copyState.countdown <= 0) {
      navigator.clipboard.writeText('').catch(() => {});
      setCopyState(null);
      return;
    }
    const t = setTimeout(
      () => setCopyState((s) => s ? { ...s, countdown: s.countdown - 1 } : null),
      1000
    );
    return () => clearTimeout(t);
  }, [copyState]);

  const toggleShown = (k: SecretKey) =>
    setShown((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const copy = async (field: string, value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopyState({ field, countdown: clipboardClearSeconds });
  };

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const daysSince = (iso: string) => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 0;

  const Field = ({
    label, value, secret, secretKey, mono,
  }: {
    label: string; value: string; secret?: boolean; secretKey?: SecretKey; mono?: boolean;
  }) => {
    if (!value) return null;
    const isShown = !secret || (secretKey && shown.has(secretKey));
    const isCopying = copyState?.field === label;

    return (
      <div style={{ marginBottom: 14 }}>
        <div className="field-label">{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              flex: 1,
              fontSize: 13.5,
              color: 'var(--t1)',
              fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
              letterSpacing: mono ? '0.03em' : 'normal',
              wordBreak: 'break-all',
              lineHeight: 1.5,
            }}
          >
            {secret && !isShown ? '•'.repeat(Math.min(value.length, 24)) : value}
          </span>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {secret && secretKey && (
              <button className="icon-btn" onClick={() => toggleShown(secretKey)}>
                {isShown ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            )}
            <button
              className="icon-btn"
              onClick={() => copy(label, value)}
              style={{ minWidth: 52, gap: 4, fontSize: 11 }}
            >
              {isCopying ? (
                <><Check size={12} color="var(--green)" /> {copyState!.countdown}s</>
              ) : (
                <><Copy size={12} /> Copy</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const pwDays = daysSince(
    entry.passwordHistory[0]?.changedAt || entry.updatedAt
  );

  return (
    <div className="modal-bd" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <Favicon url={entry.url} fallback={cat.icon} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-hd-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {entry.title}
              {entry.isFavorite && <Star size={13} color="var(--amber)" fill="var(--amber)" />}
              {entry.isCompromised && <AlertTriangle size={13} color="var(--red)" />}
              {entry.isArchived && <Archive size={13} color="var(--t3)" />}
            </div>
            {entry.url && (
              <a
                href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-hd-sub text-link"
                style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
              >
                {entry.url} <ExternalLink size={10} />
              </a>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="icon-btn" onClick={onFavorite} title={entry.isFavorite ? 'Unfavorite' : 'Favorite'}>
              {entry.isFavorite ? <Star size={15} color="var(--amber)" fill="var(--amber)" /> : <StarOff size={15} />}
            </button>
            <button className="icon-btn" onClick={onEdit}><Edit2 size={14} /></button>
            <button className="icon-btn" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /></button>
            <button className="icon-btn" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="modal-body">
          {/* Badges */}
          {(entry.isCompromised || pwDays > 90) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {entry.isCompromised && (
                <span className="badge red"><AlertTriangle size={10} style={{ marginRight: 4 }} />Compromised</span>
              )}
              {pwDays > 90 && (
                <span className="badge amber"><Clock size={10} style={{ marginRight: 4 }} />Password {pwDays}d old</span>
              )}
            </div>
          )}

          {/* Category */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div className="cat-dot" style={{ background: cat.dot }} />
            <span style={{ fontSize: 13, color: 'var(--t2)' }}>{cat.icon} {cat.label}</span>
            {entry.tags.map((t) => (
              <span key={t} className="tag-chip" style={{ fontSize: 11 }}>#{t}</span>
            ))}
          </div>

          <Field label="Username" value={entry.username} />
          <Field label="Email" value={entry.email} />
          <Field label="Password" value={entry.password} secret secretKey="password" mono />

          {entry.notes && (
            <div style={{ marginBottom: 14 }}>
              <div className="field-label">Notes</div>
              <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {entry.notes}
              </p>
            </div>
          )}

          <Field label="PIN" value={entry.pin} secret secretKey="pin" mono />
          <Field label="API / License Key" value={entry.apiKey} secret secretKey="apiKey" mono />
          <Field label="Security Question" value={entry.securityQuestion} />
          <Field label="Security Answer" value={entry.securityAnswer} secret secretKey="securityAnswer" />
          <Field label="Recovery Email" value={entry.recoveryEmail} />
          <Field label="Backup Phone" value={entry.backupPhone} />

          {entry.customFields.filter((f) => f.key || f.value).map((cf, i) => (
            <Field key={i} label={cf.key || `Field ${i + 1}`} value={cf.value} />
          ))}

          {/* Password history */}
          {entry.passwordHistory.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="field-label" style={{ marginBottom: 8 }}>Password History</div>
              {entry.passwordHistory.map((h, i) => (
                <div key={i} className="pw-history-item">
                  <Shield size={12} color="var(--t4)" />
                  <span className="pw-history-val">{'•'.repeat(Math.min(h.password.length, 20))}</span>
                  <span className="pw-history-date">{fmt(h.changedAt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Timestamps */}
          <div className="divider" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Created', val: fmt(entry.createdAt) },
              { label: 'Updated', val: fmt(entry.updatedAt) },
              { label: 'Last Accessed', val: fmt(entry.lastAccessed) },
              { label: 'Category', val: `${cat.icon} ${cat.label}` },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className="field-label" style={{ marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--t2)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--b1)', background: 'var(--red-bg)' }}>
            <p style={{ fontSize: 13, color: 'var(--t1)', margin: '0 0 12px' }}>
              Delete <strong>{entry.title}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="pill-btn secondary sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="pill-btn danger sm" onClick={onDelete}>Delete</button>
            </div>
          </div>
        )}

        <div className="modal-ft">
          <button className="pill-btn secondary" onClick={onClose}>Close</button>
          <button className="pill-btn primary" onClick={onEdit}><Edit2 size={13} /> Edit</button>
        </div>
      </div>
    </div>
  );
}
