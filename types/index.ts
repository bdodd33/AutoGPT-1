// Hubby Helper — shared type definitions

export type DateType = 'birthday' | 'anniversary' | 'holiday' | 'custom';

export interface ImportantDate {
  id: string;
  title: string;
  /** ISO date string, format YYYY-MM-DD */
  date: string;
  type: DateType;
  /** Whether this date repeats every year (birthdays, anniversaries) */
  recurring?: boolean;
  notes?: string;
}
