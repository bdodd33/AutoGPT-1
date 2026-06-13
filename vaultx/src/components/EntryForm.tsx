import { useState, useMemo } from 'react';
import {
  X, ChevronDown, ChevronUp, Plus, Trash2, Wand2, Eye, EyeOff,
} from 'lucide-react';
import type { VaultEntry, Category } from '../types';
import Favicon from './Favicon';
import PasswordGenerator from './PasswordGenerator';
import { measurePasswordStrength } from '../crypto';

interface EntryFormProps {
  entry?: VaultEntry | null;
  categories: Category[];
  defaultPasswordLength?: number;
  onSave: (data: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'passwordHistory'> | Partial<VaultEntry>) => void;
  onClose: () => void;
}

type FormData = Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'passwordHistory'>;

export default function EntryForm({ entry, categories, defaultPasswordLength = 20, onSave, onClose }: EntryFormProps) {
  const isEdit = !!entry;

  const [form, setForm] = useState<FormData>({
    title: entry?.title || '',
    username: entry?.username || '',
    email: entry?.email || '',
    password: entry?.password || '',
    url: entry?.url || '',
    category: entry?.category || 'custom',
    tags: entry?.tags || [],
    notes: entry?.notes || '',
    securityQuestion: entry?.securityQuestion || '',
    securityAnswer: entry?.securityAnswer || '',
    recoveryEmail: entry?.recoveryEmail || '',
    backupPhone: entry?.backupPhone || '',
    pin: entry?.pin || '',
    apiKey: entry?.apiKey || '',
    isFavorite: entry?.isFavorite || false,
    isArchived: entry?.isArchived || false,
    isCompromised: entry?.isCompromised || false,
    customFields: entry?.customFields || [],
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [urlInput, setUrlInput] = useState(form.url);

  const set = (k: keyof FormData, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const strength = useMemo(() => measurePasswordStrength(form.password), [form.password]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(isEdit ? { ...form, id: entry!.id } : form);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => set('tags', form.tags.filter((t) => t !== tag));

  const addCustomField = () =>
    set('customFields', [...form.customFields, { key: '', value: '' }]);

  const updateCustomField = (i: number, k: 'key' | 'value', v: string) => {
    const next = form.customFields.map((f, idx) => idx === i ? { ...f, [k]: v } : f);
    set('customFields', next);
  };

  const removeCustomField = (i: number) =>
    set('customFields', form.customFields.filter((_, idx) => idx !== i));

  const cat = categories.find((c) => c.id === form.category) || categories[0];

  return (
    <div className="modal-bd" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide">
        <div className="modal-hd">
          <Favicon url={form.url} fallback={cat.icon} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-hd-title">{isEdit ? 'Edit Entry' : 'New Entry'}</div>
            {form.url && <div className="modal-hd-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.url}</div>}
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Title */}
          <div className="form-row">
            <label className="field-label">Title *</label>
            <input
              className="field-input"
              placeholder="e.g. Gmail, Netflix…"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              autoFocus
            />
          </div>

          {/* URL */}
          <div className="form-row">
            <label className="field-label">Website URL</label>
            <input
              className="field-input"
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) => {
                set('url', e.target.value);
                setUrlInput(e.target.value);
              }}
            />
          </div>

          {/* Username + Email */}
          <div className="form-grid form-row">
            <div>
              <label className="field-label">Username</label>
              <input
                className="field-input"
                placeholder="username"
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input
                className="field-input"
                placeholder="email@example.com"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-row">
            <label className="field-label">Password</label>
            <div className="field-input-wrap">
              <input
                className="field-input mono"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                style={{ paddingRight: 80 }}
              />
              <div className="field-input-actions">
                <button className="icon-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  className={`icon-btn${showGenerator ? ' active' : ''}`}
                  onClick={() => setShowGenerator(!showGenerator)}
                  title="Generate password"
                >
                  <Wand2 size={14} />
                </button>
              </div>
            </div>
            {form.password && (
              <div style={{ marginTop: 6 }}>
                <div className="str-info">
                  <span className="str-label" style={{ color: strength.color, fontSize: 11 }}>{strength.label}</span>
                </div>
                <div className="str-track">
                  <div className="str-fill" style={{ width: `${strength.score}%`, background: strength.color }} />
                </div>
              </div>
            )}
          </div>

          {/* Inline generator */}
          {showGenerator && (
            <div style={{ background: 'var(--s4)', border: '1px solid var(--b2)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 16 }}>
              <PasswordGenerator
                inline
                defaultOptions={{ length: defaultPasswordLength }}
                onUse={(pw) => { set('password', pw); setShowGenerator(false); }}
              />
            </div>
          )}

          {/* Category */}
          <div className="form-row">
            <label className="field-label">Category</label>
            <select
              className="field-input"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id as string} value={c.id as string}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="form-row">
            <label className="field-label">Notes</label>
            <textarea
              className="field-textarea"
              placeholder="Additional notes…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="form-row">
            <label className="field-label">Tags</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className="field-input"
                placeholder="Add a tag…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }}}
                style={{ flex: 1 }}
              />
              <button className="pill-btn secondary sm" onClick={addTag}>Add</button>
            </div>
            {form.tags.length > 0 && (
              <div className="tags-wrap">
                {form.tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                    <button onClick={() => removeTag(tag)}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Password history (edit only) */}
          {isEdit && entry!.passwordHistory.length > 0 && (
            <div className="form-row">
              <label className="field-label">Password History</label>
              {entry!.passwordHistory.map((h, i) => (
                <div key={i} className="pw-history-item">
                  <span className="pw-history-val">{'•'.repeat(Math.min(h.password.length, 20))}</span>
                  <span className="pw-history-date">{new Date(h.changedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Advanced section */}
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 13, padding: '4px 0', marginBottom: showAdvanced ? 14 : 0 }}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAdvanced ? 'Hide' : 'Show'} advanced fields
          </button>

          {showAdvanced && (
            <div className="fade-up">
              {/* PIN */}
              <div className="form-grid form-row">
                <div>
                  <label className="field-label">PIN</label>
                  <input className="field-input mono" placeholder="0000" value={form.pin} onChange={(e) => set('pin', e.target.value)} />
                </div>
                <div>
                  <label className="field-label">API / License Key</label>
                  <input className="field-input mono" placeholder="sk-…" value={form.apiKey} onChange={(e) => set('apiKey', e.target.value)} />
                </div>
              </div>

              {/* Security Q&A */}
              <div className="form-row">
                <label className="field-label">Security Question</label>
                <input className="field-input" placeholder="e.g. Mother's maiden name?" value={form.securityQuestion} onChange={(e) => set('securityQuestion', e.target.value)} />
              </div>
              <div className="form-row">
                <label className="field-label">Security Answer</label>
                <input className="field-input" placeholder="Answer" value={form.securityAnswer} onChange={(e) => set('securityAnswer', e.target.value)} />
              </div>

              {/* Recovery */}
              <div className="form-grid form-row">
                <div>
                  <label className="field-label">Recovery Email</label>
                  <input className="field-input" type="email" placeholder="backup@email.com" value={form.recoveryEmail} onChange={(e) => set('recoveryEmail', e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Backup Phone</label>
                  <input className="field-input" type="tel" placeholder="+1 555…" value={form.backupPhone} onChange={(e) => set('backupPhone', e.target.value)} />
                </div>
              </div>

              {/* Custom fields */}
              <div className="form-row">
                <label className="field-label">Custom Fields</label>
                {form.customFields.map((cf, i) => (
                  <div key={i} className="custom-field-row">
                    <input className="field-input" placeholder="Field name" value={cf.key} onChange={(e) => updateCustomField(i, 'key', e.target.value)} style={{ width: '38%' }} />
                    <input className="field-input" placeholder="Value" value={cf.value} onChange={(e) => updateCustomField(i, 'value', e.target.value)} style={{ flex: 1 }} />
                    <button className="icon-btn" onClick={() => removeCustomField(i)}><Trash2 size={13} /></button>
                  </div>
                ))}
                <button className="pill-btn secondary sm" style={{ marginTop: 6 }} onClick={addCustomField}>
                  <Plus size={13} /> Add Field
                </button>
              </div>

              {/* Flags */}
              <div className="form-row">
                <label className="field-label">Flags</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { k: 'isFavorite', label: '⭐ Favorite' },
                    { k: 'isArchived', label: '🗄️ Archived' },
                    { k: 'isCompromised', label: '⚠️ Compromised' },
                  ].map(({ k, label }) => (
                    <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--t2)' }}>
                      <input
                        type="checkbox"
                        checked={form[k as keyof FormData] as boolean}
                        onChange={(e) => set(k as keyof FormData, e.target.checked)}
                        style={{ accentColor: 'var(--blue)' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-ft">
          <button className="pill-btn secondary" onClick={onClose}>Cancel</button>
          <button className="pill-btn primary" onClick={handleSave} disabled={!form.title.trim()}>
            {isEdit ? 'Save Changes' : 'Add Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
