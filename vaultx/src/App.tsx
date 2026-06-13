import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Grid, List, Lock, Settings, Shield, Zap,
  Star, Archive, ChevronDown, Check, Menu, X, AlertTriangle,
} from 'lucide-react';
import type { VaultEntry, VaultData, VaultSettings } from './types';
import Favicon from './components/Favicon';
import EntryForm from './components/EntryForm';
import EntryDetail from './components/EntryDetail';
import HealthDashboard from './components/HealthDashboard';
import PasswordGenerator from './components/PasswordGenerator';
import SettingsPanel from './components/SettingsPanel';
import { measurePasswordStrength } from './crypto';

interface AppProps {
  vault: VaultData;
  onAddEntry: (e: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'passwordHistory'>) => Promise<VaultEntry>;
  onUpdateEntry: (id: string, updates: Partial<VaultEntry>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onTouchEntry: (id: string) => Promise<void>;
  onUpdateSettings: (partial: Partial<VaultSettings>) => Promise<void>;
  onExportVault: () => string | null;
  onImportVault: (data: string, pw: string) => Promise<void>;
  onExportCSV: () => string;
  onImportCSV: (csv: string) => Promise<number>;
  onLock: () => void;
}

type ViewId = 'all' | 'favorites' | 'archived' | 'generator' | string;
type SortMode = 'recent' | 'az' | 'category' | 'added';
type ViewMode = 'list' | 'grid';

export default function App({
  vault, onAddEntry, onUpdateEntry, onDeleteEntry, onTouchEntry,
  onUpdateSettings, onExportVault, onImportVault, onExportCSV, onImportCSV, onLock,
}: AppProps) {
  const [view, setView] = useState<ViewId>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [addingEntry, setAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<VaultEntry | null>(null);
  const [showHealth, setShowHealth] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const { entries, categories, settings } = vault;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAddingEntry(false); setEditingEntry(null); setViewingEntry(null);
        setShowHealth(false); setShowGenerator(false); setShowSettings(false);
        setShowSortMenu(false); setMobileSidebarOpen(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === 'f') { e.preventDefault(); searchRef.current?.focus(); }
        if (e.key === 'n') { e.preventDefault(); setAddingEntry(true); }
        if (e.key === 'l') { e.preventDefault(); onLock(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onLock]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtered + sorted entries
  const filtered = useMemo(() => {
    let list = entries;

    if (view === 'favorites') list = list.filter((e) => e.isFavorite);
    else if (view === 'archived') list = list.filter((e) => e.isArchived);
    else if (view === 'all') list = list.filter((e) => !e.isArchived);
    else list = list.filter((e) => e.category === view && !e.isArchived);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.url.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q) ||
        e.tags.some((t) => t.includes(q))
      );
    }

    return [...list].sort((a, b) => {
      if (sort === 'recent') return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
      if (sort === 'az') return a.title.localeCompare(b.title);
      if (sort === 'category') return a.category.localeCompare(b.category) || a.title.localeCompare(b.title);
      if (sort === 'added') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [entries, view, search, sort]);

  // Category counts
  const catCounts = useMemo(() => {
    const map = new Map<string, number>();
    entries.filter((e) => !e.isArchived).forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + 1);
    });
    return map;
  }, [entries]);

  // Health score
  const healthScore = useMemo(() => {
    const active = entries.filter((e) => !e.isArchived);
    if (!active.length) return 100;
    const pwCounts = new Map<string, number>();
    active.forEach((e) => e.password && pwCounts.set(e.password, (pwCounts.get(e.password) || 0) + 1));
    let issues = 0;
    active.forEach((e) => {
      if (!e.password) return;
      if (measurePasswordStrength(e.password).score < 40) issues++;
      if ((pwCounts.get(e.password) || 0) > 1) issues++;
      if (e.isCompromised) issues++;
    });
    return Math.max(0, Math.round(100 - (issues / active.length) * 100));
  }, [entries]);

  const healthColor = healthScore >= 80 ? 'var(--green)' : healthScore >= 60 ? 'var(--amber)' : 'var(--red)';
  const R = 9; const circ = 2 * Math.PI * R;

  // Recently used (last 6, only for 'all' view without search)
  const recentlyUsed = useMemo(() => {
    if (view !== 'all' || search) return [];
    return [...entries]
      .filter((e) => !e.isArchived)
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, 6);
  }, [entries, view, search]);

  // Backup warning
  const backupOverdue = useMemo(() => {
    if (!settings.lastBackupReminder) return false;
    const days = (Date.now() - new Date(settings.lastBackupReminder).getTime()) / 86400000;
    return days > settings.backupReminderDays;
  }, [settings]);

  const openEntry = useCallback(async (entry: VaultEntry) => {
    await onTouchEntry(entry.id);
    setViewingEntry(entry);
  }, [onTouchEntry]);

  const handleSave = useCallback(async (data: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'passwordHistory'> | Partial<VaultEntry>) => {
    if ('id' in data && data.id) {
      await onUpdateEntry(data.id, data as Partial<VaultEntry>);
    } else {
      await onAddEntry(data as Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'passwordHistory'>);
    }
    setAddingEntry(false);
    setEditingEntry(null);
  }, [onAddEntry, onUpdateEntry]);

  const handleDelete = useCallback(async (id: string) => {
    await onDeleteEntry(id);
    setViewingEntry(null);
  }, [onDeleteEntry]);

  const catForEntry = useCallback((e: VaultEntry) =>
    categories.find((c) => c.id === e.category) || categories[0],
    [categories]);

  const viewLabel = useMemo(() => {
    if (view === 'all') return 'All Entries';
    if (view === 'favorites') return '⭐ Favorites';
    if (view === 'archived') return '🗄️ Archived';
    const cat = categories.find((c) => c.id === view);
    return cat ? `${cat.icon} ${cat.label}` : 'Entries';
  }, [view, categories]);

  const sortLabels: Record<SortMode, string> = { recent: 'Recently used', az: 'A to Z', category: 'Category', added: 'Date added' };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`app-sidebar${mobileSidebarOpen ? ' open' : ''}`}>
        <div className="logo-bar">
          <span style={{ fontSize: 22 }}>🔐</span>
          <span className="logo-text">VaultX</span>
          {/* Health mini-ring */}
          <button
            className="icon-btn"
            onClick={() => setShowHealth(true)}
            title={`Health: ${healthScore}`}
          >
            <svg width={22} height={22} className="health-ring">
              <circle cx={11} cy={11} r={R} fill="none" stroke="var(--b2)" strokeWidth={2.5} />
              <circle
                cx={11} cy={11} r={R} fill="none"
                stroke={healthColor} strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - healthScore / 100)}
                style={{ transition: 'stroke-dashoffset 0.5s' }}
              />
              <text x={11} y={14} textAnchor="middle" fontSize={7} fill={healthColor} fontWeight={700}>
                {healthScore}
              </text>
            </svg>
          </button>
        </div>

        <div className="sidebar-scroll">
          <span className="section-label">Vault</span>
          {[
            { id: 'all', label: 'All Entries', icon: '🔒', count: entries.filter((e) => !e.isArchived).length },
            { id: 'favorites', label: 'Favorites', icon: '⭐', count: entries.filter((e) => e.isFavorite).length },
          ].map(({ id, label, icon, count }) => (
            <button
              key={id}
              className={`nav-item${view === id ? ' active' : ''}`}
              onClick={() => { setView(id); setMobileSidebarOpen(false); }}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
              {count > 0 && <span className="nav-badge">{count}</span>}
            </button>
          ))}

          <span className="section-label" style={{ marginTop: 8 }}>Categories</span>
          {categories.map((cat) => {
            const count = catCounts.get(cat.id as string) || 0;
            return (
              <button
                key={cat.id as string}
                className={`nav-item${view === cat.id ? ' active' : ''}`}
                onClick={() => { setView(cat.id as string); setMobileSidebarOpen(false); }}
              >
                <div className="cat-dot" style={{ background: cat.dot }} />
                <span style={{ fontSize: 13 }}>{cat.icon}</span>
                {cat.label}
                {count > 0 && <span className="nav-badge">{count}</span>}
              </button>
            );
          })}

          <span className="section-label" style={{ marginTop: 8 }}>Tools</span>
          {[
            { id: 'archived', label: 'Archived', icon: <Archive size={14} /> },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              className={`nav-item${view === id ? ' active' : ''}`}
              onClick={() => { setView(id); setMobileSidebarOpen(false); }}
            >
              {icon} {label}
              {id === 'archived' && entries.filter((e) => e.isArchived).length > 0 && (
                <span className="nav-badge">{entries.filter((e) => e.isArchived).length}</span>
              )}
            </button>
          ))}
          <button className="nav-item" onClick={() => { setShowGenerator(true); setMobileSidebarOpen(false); }}>
            <Zap size={14} /> Generator
          </button>
          <button className="nav-item" onClick={() => { setShowSettings(true); setMobileSidebarOpen(false); }}>
            <Settings size={14} /> Settings
          </button>
          <button className="nav-item" onClick={onLock}>
            <Lock size={14} /> Lock Vault
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="app-main">
        {/* Top bar */}
        <div className="app-topbar">
          <button className="icon-btn" style={{ display: 'none' }} onClick={() => setMobileSidebarOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              ref={searchRef}
              className="search-input"
              placeholder="Search entries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: 2, display: 'flex' }}
                onClick={() => setSearch('')}
              >
                <X size={13} />
              </button>
            )}
            {!search && (
              <span className="kbd" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                ⌘F
              </span>
            )}
          </div>
          <button className="icon-btn" title="Add entry (⌘N)" onClick={() => setAddingEntry(true)}>
            <Plus size={16} />
          </button>
          <button
            className={`icon-btn${viewMode === 'list' ? ' active' : ''}`}
            onClick={() => setViewMode('list')} title="List view"
          >
            <List size={15} />
          </button>
          <button
            className={`icon-btn${viewMode === 'grid' ? ' active' : ''}`}
            onClick={() => setViewMode('grid')} title="Grid view"
          >
            <Grid size={15} />
          </button>
        </div>

        {/* Backup warning */}
        {backupOverdue && (
          <div className="alert-strip">
            <AlertTriangle size={14} color="var(--amber)" />
            <span style={{ flex: 1 }}>
              Backup overdue — last backup was {Math.floor((Date.now() - new Date(settings.lastBackupReminder).getTime()) / 86400000)} days ago.
            </span>
            <button className="pill-btn sm" style={{ height: 26, padding: '0 10px' }} onClick={() => setShowSettings(true)}>
              Back up now
            </button>
          </div>
        )}

        {/* Content */}
        <div className="content-area">
          {/* Recently used chips */}
          {recentlyUsed.length > 0 && (
            <div className="recent-section">
              <div className="recent-label">Recently used</div>
              <div className="recent-chips">
                {recentlyUsed.map((e) => (
                  <button key={e.id} className="recent-chip" onClick={() => openEntry(e)}>
                    <Favicon url={e.url} fallback={catForEntry(e).icon} size={18} />
                    {e.title}
                  </button>
                ))}
              </div>
              <div className="divider" style={{ marginTop: 12 }} />
            </div>
          )}

          {/* Entries header */}
          <div className="entries-header">
            <span className="entries-title">{viewLabel} · {filtered.length}</span>
            <div style={{ position: 'relative' }} ref={sortMenuRef}>
              <button
                className="pill-btn secondary sm"
                style={{ gap: 4 }}
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                {sortLabels[sort]} <ChevronDown size={12} />
              </button>
              {showSortMenu && (
                <div className="dropdown" style={{ right: 0, top: 'calc(100% + 4px)' }}>
                  {(Object.entries(sortLabels) as [SortMode, string][]).map(([k, label]) => (
                    <div
                      key={k}
                      className={`dropdown-item${sort === k ? ' active' : ''}`}
                      onClick={() => { setSort(k); setShowSortMenu(false); }}
                    >
                      {sort === k && <Check size={13} />}
                      {sort !== k && <span style={{ width: 13 }} />}
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">{search ? '🔍' : '🔒'}</div>
              <div className="empty-state-title">
                {search ? 'No results' : view === 'all' ? 'No entries yet' : `No ${viewLabel.toLowerCase()}`}
              </div>
              <div className="empty-state-desc">
                {search ? `Nothing matches "${search}"` : view === 'all' ? 'Add your first entry with ⌘N' : ''}
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="entry-list">
              {filtered.map((e) => {
                const cat = catForEntry(e);
                return (
                  <div key={e.id} className="entry-row" onClick={() => openEntry(e)}>
                    <Favicon url={e.url} fallback={cat.icon} size={32} />
                    <div className="entry-row-info">
                      <div className="entry-row-title">
                        {e.isCompromised && <AlertTriangle size={12} color="var(--red)" />}
                        {e.isFavorite && <Star size={11} color="var(--amber)" fill="var(--amber)" />}
                        {e.title}
                      </div>
                      <div className="entry-row-sub">{e.username || e.email || e.url}</div>
                    </div>
                    <div className="row-actions" onClick={(ev) => ev.stopPropagation()}>
                      <button
                        className="icon-btn"
                        onClick={() => onUpdateEntry(e.id, { isFavorite: !e.isFavorite })}
                        title={e.isFavorite ? 'Unfavorite' : 'Favorite'}
                      >
                        <Star size={13} color={e.isFavorite ? 'var(--amber)' : undefined} fill={e.isFavorite ? 'var(--amber)' : 'none'} />
                      </button>
                      <button className="icon-btn" onClick={() => { setEditingEntry(e); }}>
                        <Shield size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="entry-grid">
              {filtered.map((e) => {
                const cat = catForEntry(e);
                return (
                  <div key={e.id} className="entry-card" onClick={() => openEntry(e)}>
                    <Favicon url={e.url} fallback={cat.icon} size={40} />
                    <div className="entry-card-title">
                      {e.isCompromised && <AlertTriangle size={11} color="var(--red)" style={{ marginRight: 4 }} />}
                      {e.title}
                    </div>
                    <div className="entry-card-sub">{e.username || e.email || e.url || cat.label}</div>
                    {e.tags.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {e.tags.slice(0, 3).map((t) => (
                          <span key={t} className="tag-chip" style={{ fontSize: 10 }}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─── Modals ─── */}
      {addingEntry && (
        <EntryForm
          categories={categories}
          defaultPasswordLength={settings.defaultPasswordLength}
          onSave={handleSave}
          onClose={() => setAddingEntry(false)}
        />
      )}

      {editingEntry && (
        <EntryForm
          entry={editingEntry}
          categories={categories}
          defaultPasswordLength={settings.defaultPasswordLength}
          onSave={handleSave}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {viewingEntry && !editingEntry && (
        <EntryDetail
          entry={viewingEntry}
          categories={categories}
          clipboardClearSeconds={settings.clipboardClearSeconds}
          onEdit={() => { setEditingEntry(viewingEntry); setViewingEntry(null); }}
          onDelete={() => handleDelete(viewingEntry.id)}
          onFavorite={() => {
            onUpdateEntry(viewingEntry.id, { isFavorite: !viewingEntry.isFavorite });
            setViewingEntry({ ...viewingEntry, isFavorite: !viewingEntry.isFavorite });
          }}
          onClose={() => setViewingEntry(null)}
        />
      )}

      {showHealth && (
        <HealthDashboard
          entries={entries}
          categories={categories}
          onSelectEntry={(e) => { setShowHealth(false); openEntry(e); }}
          onClose={() => setShowHealth(false)}
        />
      )}

      {showGenerator && (
        <div className="modal-bd" onClick={(e) => e.target === e.currentTarget && setShowGenerator(false)}>
          <div className="modal narrow">
            <div className="modal-hd">
              <Zap size={18} color="var(--blue)" />
              <div className="modal-hd-title">Password Generator</div>
              <button className="icon-btn" onClick={() => setShowGenerator(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <PasswordGenerator />
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsPanel
          vault={vault}
          onUpdateSettings={onUpdateSettings}
          onExportVault={onExportVault}
          onImportVault={onImportVault}
          onExportCSV={onExportCSV}
          onImportCSV={onImportCSV}
          onLock={onLock}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
