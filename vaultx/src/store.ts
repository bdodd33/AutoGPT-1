import { useState, useEffect, useCallback, useRef } from 'react';
import type { VaultData, VaultEntry, VaultSettings, Category } from './types';
import {
  encryptVault, decryptVault, hashPassword, verifyPassword,
} from './crypto';

const VAULT_KEY = 'vaultx_v2';
const HASH_KEY = 'vaultx_hash';
const DECOY_HASH_KEY = 'vaultx_decoy_hash';
const DECOY_KEY = 'vaultx_decoy';

const DEFAULT_SETTINGS: VaultSettings = {
  autoLockMinutes: 15,
  theme: 'dark',
  clipboardClearSeconds: 30,
  lastBackupReminder: new Date().toISOString(),
  backupReminderDays: 30,
  hasDecoyVault: false,
  masterHint: '',
  defaultPasswordLength: 20,
  defaultPasswordOptions: {
    length: 20, uppercase: true, lowercase: true, numbers: true,
    symbols: true, excludeAmbiguous: false, pronounceable: false,
    passphrase: false, wordCount: 4,
  },
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'banking',       label: 'Banking',       icon: '🏦', dot: '#22c55e', bg: 'rgba(34,197,94,0.12)'    },
  { id: 'email',         label: 'Email',          icon: '📧', dot: '#4F8EF7', bg: 'rgba(79,142,247,0.12)'  },
  { id: 'social',        label: 'Social',         icon: '💬', dot: '#a855f7', bg: 'rgba(168,85,247,0.12)'  },
  { id: 'ai_tools',      label: 'AI Tools',       icon: '🤖', dot: '#06b6d4', bg: 'rgba(6,182,212,0.12)'   },
  { id: 'hosting',       label: 'Hosting',        icon: '🖥️', dot: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  { id: 'learning',      label: 'Learning',       icon: '📚', dot: '#eab308', bg: 'rgba(234,179,8,0.12)'   },
  { id: 'browsers',      label: 'Browsers',       icon: '🌐', dot: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  { id: 'subscriptions', label: 'Subscriptions',  icon: '🔔', dot: '#ec4899', bg: 'rgba(236,72,153,0.12)'  },
  { id: 'shopping',      label: 'Shopping',       icon: '🛍️', dot: '#f43f5e', bg: 'rgba(244,63,94,0.12)'   },
  { id: 'work',          label: 'Work',           icon: '💼', dot: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  { id: 'gaming',        label: 'Gaming',         icon: '🎮', dot: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  { id: 'crypto',        label: 'Crypto',         icon: '₿',  dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  { id: 'wifi',          label: 'Wi-Fi',          icon: '📶', dot: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  { id: 'licenses',      label: 'Licenses',       icon: '🔑', dot: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
  { id: 'custom',        label: 'Custom',         icon: '📁', dot: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
];

function emptyVault(): VaultData {
  return {
    entries: [],
    categories: DEFAULT_CATEGORIES,
    settings: { ...DEFAULT_SETTINGS },
  };
}

export type VaultMode = 'locked' | 'unlocked' | 'decoy' | 'setup';

export interface UseVaultReturn {
  mode: VaultMode;
  vault: VaultData;
  loading: boolean;
  fails: number;
  lockout: number | null;
  isFirst: boolean;
  setupVault: (password: string, hint: string, decoyPassword?: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  addEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'passwordHistory'>) => Promise<VaultEntry>;
  updateEntry: (id: string, updates: Partial<VaultEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  touchEntry: (id: string) => Promise<void>;
  updateSettings: (partial: Partial<VaultSettings>) => Promise<void>;
  exportVault: () => string | null;
  importVault: (data: string, password: string) => Promise<void>;
  exportCSV: () => string;
  importCSV: (csv: string) => Promise<number>;
}

export function useVault(): UseVaultReturn {
  const [mode, setMode] = useState<VaultMode>('locked');
  const [vault, setVault] = useState<VaultData>(emptyVault());
  const [loading, setLoading] = useState(false);
  const [fails, setFails] = useState(0);
  const [lockout, setLockout] = useState<number | null>(null);
  const [isFirst, setIsFirst] = useState(false);
  const masterPasswordRef = useRef<string>('');
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hasVault = !!localStorage.getItem(VAULT_KEY);
    const hasHash = !!localStorage.getItem(HASH_KEY);
    setIsFirst(!hasVault && !hasHash);
    setMode(!hasVault && !hasHash ? 'setup' : 'locked');
  }, []);

  // Auto-lock
  useEffect(() => {
    if (mode !== 'unlocked' && mode !== 'decoy') return;
    const mins = vault.settings.autoLockMinutes;
    if (!mins) return;

    const reset = () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      lockTimerRef.current = setTimeout(() => {
        masterPasswordRef.current = '';
        setVault(emptyVault());
        setMode('locked');
      }, mins * 60 * 1000);
    };

    reset();
    window.addEventListener('mousedown', reset);
    window.addEventListener('keydown', reset);
    window.addEventListener('touchstart', reset);

    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      window.removeEventListener('mousedown', reset);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('touchstart', reset);
    };
  }, [mode, vault.settings.autoLockMinutes]);

  // Apply theme
  useEffect(() => {
    const theme = vault.settings.theme;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.remove('light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.remove('light');
      else root.classList.add('light');
    }
  }, [vault.settings.theme]);

  async function persist(data: VaultData) {
    const json = JSON.stringify(data);
    const encrypted = await encryptVault(json, masterPasswordRef.current);
    localStorage.setItem(VAULT_KEY, encrypted);
  }

  const setupVault = useCallback(async (password: string, hint: string, decoyPassword?: string) => {
    setLoading(true);
    try {
      const newVault: VaultData = {
        ...emptyVault(),
        settings: { ...DEFAULT_SETTINGS, masterHint: hint, hasDecoyVault: !!decoyPassword },
      };
      masterPasswordRef.current = password;
      const [hash, encrypted] = await Promise.all([
        hashPassword(password),
        encryptVault(JSON.stringify(newVault), password),
      ]);
      localStorage.setItem(HASH_KEY, hash);
      localStorage.setItem(VAULT_KEY, encrypted);

      if (decoyPassword) {
        const decoyVault = emptyVault();
        const [decoyHash, decoyEncrypted] = await Promise.all([
          hashPassword(decoyPassword),
          encryptVault(JSON.stringify(decoyVault), decoyPassword),
        ]);
        localStorage.setItem(DECOY_HASH_KEY, decoyHash);
        localStorage.setItem(DECOY_KEY, decoyEncrypted);
      }

      setVault(newVault);
      setIsFirst(false);
      setMode('unlocked');
    } finally {
      setLoading(false);
    }
  }, []);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    if (lockout && Date.now() < lockout) return false;

    setLoading(true);
    try {
      const hash = localStorage.getItem(HASH_KEY);
      const decoyHash = localStorage.getItem(DECOY_HASH_KEY);

      // Check decoy first
      if (decoyHash) {
        const isDecoy = await verifyPassword(password, decoyHash);
        if (isDecoy) {
          const decoyData = localStorage.getItem(DECOY_KEY);
          if (decoyData) {
            const decrypted = await decryptVault(decoyData, password);
            masterPasswordRef.current = password;
            setVault(JSON.parse(decrypted) as VaultData);
            setFails(0);
            setLockout(null);
            setMode('decoy');
            return true;
          }
        }
      }

      if (!hash) return false;
      const valid = await verifyPassword(password, hash);

      if (!valid) {
        const newFails = fails + 1;
        setFails(newFails);
        if (newFails >= 5) {
          const backoff = 30_000 * Math.pow(2, newFails - 5);
          setLockout(Date.now() + backoff);
        }
        return false;
      }

      const raw = localStorage.getItem(VAULT_KEY);
      if (!raw) return false;
      const decrypted = await decryptVault(raw, password);
      masterPasswordRef.current = password;
      setVault(JSON.parse(decrypted) as VaultData);
      setFails(0);
      setLockout(null);
      setMode('unlocked');
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [fails, lockout]);

  const lock = useCallback(() => {
    masterPasswordRef.current = '';
    setVault(emptyVault());
    setMode('locked');
  }, []);

  const addEntry = useCallback(async (
    partial: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'passwordHistory'>
  ): Promise<VaultEntry> => {
    const now = new Date().toISOString();
    const entry: VaultEntry = {
      ...partial,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      lastAccessed: now,
      passwordHistory: [],
    };
    const updated: VaultData = { ...vault, entries: [entry, ...vault.entries] };
    setVault(updated);
    await persist(updated);
    return entry;
  }, [vault]);

  const updateEntry = useCallback(async (id: string, updates: Partial<VaultEntry>): Promise<void> => {
    const now = new Date().toISOString();
    const entries = vault.entries.map((e) => {
      if (e.id !== id) return e;
      const history = [...e.passwordHistory];
      if (updates.password && updates.password !== e.password) {
        history.unshift({ password: e.password, changedAt: now });
        if (history.length > 5) history.length = 5;
      }
      return { ...e, ...updates, updatedAt: now, passwordHistory: history };
    });
    const updated: VaultData = { ...vault, entries };
    setVault(updated);
    await persist(updated);
  }, [vault]);

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    const updated: VaultData = { ...vault, entries: vault.entries.filter((e) => e.id !== id) };
    setVault(updated);
    await persist(updated);
  }, [vault]);

  const touchEntry = useCallback(async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    const entries = vault.entries.map((e) =>
      e.id === id ? { ...e, lastAccessed: now } : e
    );
    const updated: VaultData = { ...vault, entries };
    setVault(updated);
    await persist(updated);
  }, [vault]);

  const updateSettings = useCallback(async (partial: Partial<VaultSettings>): Promise<void> => {
    const updated: VaultData = {
      ...vault,
      settings: { ...vault.settings, ...partial },
    };
    setVault(updated);
    await persist(updated);
  }, [vault]);

  const exportVault = useCallback((): string | null => {
    return localStorage.getItem(VAULT_KEY);
  }, []);

  const importVault = useCallback(async (data: string, password: string): Promise<void> => {
    const decrypted = await decryptVault(data, password);
    const imported = JSON.parse(decrypted) as VaultData;
    const re = await encryptVault(JSON.stringify(imported), masterPasswordRef.current);
    localStorage.setItem(VAULT_KEY, re);
    setVault(imported);
  }, []);

  const exportCSV = useCallback((): string => {
    const headers = ['name', 'url', 'username', 'password', 'note'];
    const rows = vault.entries.map((e) => [
      e.title, e.url, e.username || e.email, e.password, e.notes,
    ].map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(','));
    return [headers.join(','), ...rows].join('\n');
  }, [vault.entries]);

  const importCSV = useCallback(async (csv: string): Promise<number> => {
    const lines = csv.split('\n').filter(Boolean);
    if (!lines.length) return 0;
    const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/"/g, ''));
    const idx = (names: string[]) => names.findIndex((n) => header.includes(n));
    const titleIdx = idx(['title', 'name', 'site']);
    const urlIdx = idx(['url', 'website', 'login_uri']);
    const userIdx = idx(['username', 'login', 'login_username', 'user']);
    const passIdx = idx(['password', 'login_password', 'pass']);
    const noteIdx = idx(['note', 'notes', 'extra']);
    const emailIdx = idx(['email']);

    const now = new Date().toISOString();
    const newEntries: VaultEntry[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map(
        (c) => c.replace(/(^,|,$)/g, '').replace(/^"|"$/g, '').replace(/""/g, '"')
      ) || [];
      const get = (idx: number) => (idx >= 0 ? cols[idx] || '' : '');
      const title = get(titleIdx) || get(urlIdx) || 'Imported Entry';
      if (!title) continue;
      newEntries.push({
        id: crypto.randomUUID(),
        title,
        url: get(urlIdx),
        username: get(userIdx),
        email: get(emailIdx),
        password: get(passIdx),
        notes: get(noteIdx),
        category: 'custom',
        tags: [],
        securityQuestion: '',
        securityAnswer: '',
        recoveryEmail: '',
        backupPhone: '',
        pin: '',
        apiKey: '',
        isFavorite: false,
        isArchived: false,
        isCompromised: false,
        createdAt: now,
        updatedAt: now,
        lastAccessed: now,
        passwordHistory: [],
        customFields: [],
      });
    }

    const updated: VaultData = { ...vault, entries: [...newEntries, ...vault.entries] };
    setVault(updated);
    await persist(updated);
    return newEntries.length;
  }, [vault]);

  return {
    mode, vault, loading, fails, lockout, isFirst,
    setupVault, unlock, lock,
    addEntry, updateEntry, deleteEntry, touchEntry,
    updateSettings,
    exportVault, importVault, exportCSV, importCSV,
  };
}
