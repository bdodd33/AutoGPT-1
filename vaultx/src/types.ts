export type CategoryId =
  | 'banking' | 'email' | 'social' | 'ai_tools' | 'hosting'
  | 'learning' | 'browsers' | 'subscriptions' | 'shopping' | 'work'
  | 'gaming' | 'crypto' | 'wifi' | 'licenses' | 'custom';

export interface VaultEntry {
  id: string;
  title: string;
  username: string;
  email: string;
  password: string;
  url: string;
  category: string;
  tags: string[];
  notes: string;
  securityQuestion: string;
  securityAnswer: string;
  recoveryEmail: string;
  backupPhone: string;
  pin: string;
  apiKey: string;
  isFavorite: boolean;
  isArchived: boolean;
  isCompromised: boolean;
  createdAt: string;
  updatedAt: string;
  lastAccessed: string;
  passwordHistory: Array<{ password: string; changedAt: string }>;
  customFields: Array<{ key: string; value: string }>;
}

export interface Category {
  id: CategoryId | string;
  label: string;
  icon: string;
  dot: string;
  bg: string;
}

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  pronounceable: boolean;
  passphrase: boolean;
  wordCount: number;
}

export interface VaultSettings {
  autoLockMinutes: number;
  theme: 'dark' | 'light' | 'system';
  clipboardClearSeconds: number;
  lastBackupReminder: string;
  backupReminderDays: number;
  hasDecoyVault: boolean;
  masterHint: string;
  defaultPasswordLength: number;
  defaultPasswordOptions: PasswordOptions;
}

export interface VaultData {
  entries: VaultEntry[];
  categories: Category[];
  settings: VaultSettings;
}
