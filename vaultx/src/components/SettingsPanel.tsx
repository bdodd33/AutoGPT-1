import { useState, useRef } from 'react';
import {
  X, Download, Upload, Printer, Lock, Info, Shield,
} from 'lucide-react';
import type { VaultSettings, VaultData } from '../types';

interface SettingsPanelProps {
  vault: VaultData;
  onUpdateSettings: (partial: Partial<VaultSettings>) => Promise<void>;
  onExportVault: () => string | null;
  onImportVault: (data: string, pw: string) => Promise<void>;
  onExportCSV: () => string;
  onImportCSV: (csv: string) => Promise<number>;
  onLock: () => void;
  onClose: () => void;
}

type Tab = 'general' | 'security' | 'backup';

export default function SettingsPanel({
  vault, onUpdateSettings, onExportVault, onImportVault,
  onExportCSV, onImportCSV, onLock, onClose,
}: SettingsPanelProps) {
  const [tab, setTab] = useState<Tab>('general');
  const [importPw, setImportPw] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const s = vault.settings;

  const update = (k: keyof VaultSettings, v: unknown) =>
    onUpdateSettings({ [k]: v } as Partial<VaultSettings>);

  const exportVault = () => {
    const data = onExportVault();
    if (!data) return;
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vaultx-backup-${new Date().toISOString().slice(0, 10)}.vx`;
    a.click();
    URL.revokeObjectURL(a.href);
    onUpdateSettings({ lastBackupReminder: new Date().toISOString() });
  };

  const exportCSV = () => {
    const csv = onExportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vaultx-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setImportError(''); setImportMsg('');
      try {
        await onImportVault(reader.result as string, importPw);
        setImportMsg('Vault imported successfully!');
        setImportPw('');
      } catch {
        setImportError('Failed to import — check the password and try again.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setImportError(''); setImportMsg('');
      try {
        const count = await onImportCSV(reader.result as string);
        setImportMsg(`Imported ${count} entries from CSV.`);
      } catch {
        setImportError('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const Toggle = ({ label, desc, checked, onChange }: {
    label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void;
  }) => (
    <div className="settings-row">
      <div>
        <div className="settings-row-label">{label}</div>
        {desc && <div className="settings-row-desc">{desc}</div>}
      </div>
      <button className={`toggle${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
        <div className="toggle-thumb" />
      </button>
    </div>
  );

  const totalEntries = vault.entries.length;
  const activeEntries = vault.entries.filter((e) => !e.isArchived).length;
  const lastBackup = s.lastBackupReminder
    ? new Date(s.lastBackupReminder).toLocaleDateString()
    : 'Never';

  return (
    <div className="modal-bd" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide">
        <div className="modal-hd">
          <Shield size={20} color="var(--blue)" />
          <div className="modal-hd-title">Settings</div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body" style={{ paddingTop: 16 }}>
          <div className="settings-tabs">
            {(['general', 'security', 'backup'] as Tab[]).map((t) => (
              <button key={t} className={`settings-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* ─── General ─── */}
          {tab === 'general' && (
            <div className="fade-up">
              <div className="settings-section">
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Theme</div>
                    <div className="settings-row-desc">App color scheme</div>
                  </div>
                  <select
                    className="field-input"
                    style={{ width: 120 }}
                    value={s.theme}
                    onChange={(e) => update('theme', e.target.value)}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Clipboard clear</div>
                    <div className="settings-row-desc">Clear clipboard after copying a password</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="range" min={0} max={120} step={5}
                      value={s.clipboardClearSeconds}
                      className="range-input"
                      onChange={(e) => update('clipboardClearSeconds', Number(e.target.value))}
                    />
                    <span className="settings-row-val" style={{ minWidth: 40, textAlign: 'right' }}>
                      {s.clipboardClearSeconds === 0 ? 'Off' : `${s.clipboardClearSeconds}s`}
                    </span>
                  </div>
                </div>

                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Default password length</div>
                    <div className="settings-row-desc">Used by the password generator</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="range" min={8} max={64}
                      value={s.defaultPasswordLength}
                      className="range-input"
                      onChange={(e) => update('defaultPasswordLength', Number(e.target.value))}
                    />
                    <span className="settings-row-val" style={{ minWidth: 28, textAlign: 'right' }}>
                      {s.defaultPasswordLength}
                    </span>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <Toggle
                  label="Uppercase (A–Z)"
                  checked={s.defaultPasswordOptions.uppercase}
                  onChange={(v) => update('defaultPasswordOptions', { ...s.defaultPasswordOptions, uppercase: v })}
                />
                <Toggle
                  label="Numbers (0–9)"
                  checked={s.defaultPasswordOptions.numbers}
                  onChange={(v) => update('defaultPasswordOptions', { ...s.defaultPasswordOptions, numbers: v })}
                />
                <Toggle
                  label="Symbols (!@#…)"
                  checked={s.defaultPasswordOptions.symbols}
                  onChange={(v) => update('defaultPasswordOptions', { ...s.defaultPasswordOptions, symbols: v })}
                />
                <Toggle
                  label="Exclude ambiguous characters"
                  desc="Removes I, l, 1, O, 0, etc."
                  checked={s.defaultPasswordOptions.excludeAmbiguous}
                  onChange={(v) => update('defaultPasswordOptions', { ...s.defaultPasswordOptions, excludeAmbiguous: v })}
                />
              </div>
            </div>
          )}

          {/* ─── Security ─── */}
          {tab === 'security' && (
            <div className="fade-up">
              <div className="settings-section">
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Auto-lock</div>
                    <div className="settings-row-desc">Lock after inactivity</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="range" min={0} max={60} step={5}
                      value={s.autoLockMinutes}
                      className="range-input"
                      onChange={(e) => update('autoLockMinutes', Number(e.target.value))}
                    />
                    <span className="settings-row-val" style={{ minWidth: 48, textAlign: 'right' }}>
                      {s.autoLockMinutes === 0 ? 'Never' : `${s.autoLockMinutes}m`}
                    </span>
                  </div>
                </div>

                <div className="settings-row" style={{ cursor: 'pointer' }} onClick={onLock}>
                  <div>
                    <div className="settings-row-label">Lock vault now</div>
                    <div className="settings-row-desc">Immediately lock and clear memory</div>
                  </div>
                  <Lock size={16} color="var(--t3)" />
                </div>
              </div>

              {/* Vault info */}
              <div className="settings-section">
                {[
                  { label: 'Total entries', val: String(totalEntries) },
                  { label: 'Active entries', val: String(activeEntries) },
                  { label: 'Archived entries', val: String(totalEntries - activeEntries) },
                  { label: 'Decoy vault', val: s.hasDecoyVault ? 'Enabled' : 'Disabled' },
                  { label: 'Encryption', val: 'AES-256-GCM' },
                  { label: 'Key derivation', val: 'PBKDF2 · 310,000 iterations' },
                ].map(({ label, val }) => (
                  <div key={label} className="settings-row">
                    <div className="settings-row-label">{label}</div>
                    <span className="settings-row-val">{val}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: 'var(--radius)' }}>
                <Info size={15} color="var(--blue)" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 }}>
                  VaultX uses Web Crypto API only — no external crypto dependencies.
                  Your vault data never leaves your device.
                </p>
              </div>
            </div>
          )}

          {/* ─── Backup ─── */}
          {tab === 'backup' && (
            <div className="fade-up">
              <div style={{ marginBottom: 16 }}>
                <div className="field-label">Last backup: {lastBackup}</div>
              </div>

              <div className="settings-section">
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Export encrypted backup (.vx)</div>
                    <div className="settings-row-desc">Full vault, encrypted with your master password</div>
                  </div>
                  <button className="pill-btn secondary sm" onClick={exportVault}>
                    <Download size={13} /> Export
                  </button>
                </div>

                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Export as CSV (plaintext)</div>
                    <div className="settings-row-desc">Titles, URLs, usernames, passwords — no encryption</div>
                  </div>
                  <button className="pill-btn secondary sm" onClick={exportCSV}>
                    <Download size={13} /> CSV
                  </button>
                </div>

                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Print to PDF</div>
                    <div className="settings-row-desc">Open browser print dialog</div>
                  </div>
                  <button className="pill-btn secondary sm" onClick={() => window.print()}>
                    <Printer size={13} /> Print
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div className="settings-row-label">Import .vx backup</div>
                    <div className="settings-row-desc">Requires the original export password</div>
                  </div>
                  <input
                    type="password"
                    className="field-input"
                    placeholder="Export password"
                    value={importPw}
                    onChange={(e) => setImportPw(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <button className="pill-btn secondary sm" onClick={() => fileRef.current?.click()}>
                    <Upload size={13} /> Choose .vx file
                  </button>
                  <input type="file" accept=".vx,.txt" ref={fileRef} style={{ display: 'none' }} onChange={handleImportFile} />
                </div>

                <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div className="settings-row-label">Import CSV</div>
                    <div className="settings-row-desc">Chrome, Firefox, Bitwarden, LastPass formats</div>
                  </div>
                  <button className="pill-btn secondary sm" onClick={() => csvRef.current?.click()}>
                    <Upload size={13} /> Choose CSV file
                  </button>
                  <input type="file" accept=".csv,.txt" ref={csvRef} style={{ display: 'none' }} onChange={handleImportCSV} />
                </div>
              </div>

              {importMsg && <p style={{ color: 'var(--green)', fontSize: 13, marginTop: 8 }}>✓ {importMsg}</p>}
              {importError && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>✗ {importError}</p>}

              <div className="settings-section">
                <div className="settings-row">
                  <div>
                    <div className="settings-row-label">Backup reminder</div>
                    <div className="settings-row-desc">Remind me to back up every</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="range" min={7} max={90} step={7}
                      value={s.backupReminderDays}
                      className="range-input"
                      onChange={(e) => update('backupReminderDays', Number(e.target.value))}
                    />
                    <span className="settings-row-val" style={{ minWidth: 48, textAlign: 'right' }}>
                      {s.backupReminderDays}d
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-ft">
          <button className="pill-btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
