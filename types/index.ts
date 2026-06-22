// Hubby Helper — shared type definitions

export type DateType =
  | 'anniversary'
  | 'birthday'
  | 'first_date'
  | 'kids_birthday'
  | 'custom';

export interface ImportantDate {
  id: string;
  user_id: string;
  title: string;
  /** ISO date string, format YYYY-MM-DD */
  date: string;
  date_type: DateType;
  /** Name of the person this date relates to (e.g. a child's name) */
  person_name?: string | null;
  notes?: string | null;
  /** Whether this date repeats every year (birthdays, anniversaries) */
  is_recurring: boolean;
  /** Days-before offsets at which to remind, e.g. [30, 7, 3, 1] */
  reminder_days_before?: number[];
}

export type MessageType =
  | 'romantic'
  | 'encouraging'
  | 'appreciation'
  | 'fun'
  | 'spiritual';

export interface MessagePrompt {
  id: string;
  type: MessageType;
  prompt: string;
  hint: string;
  starter: string;
}

export interface GiftLogEntry { id: string; user_id: string; important_date_id: string | null; occasion: string; gift_description: string; idea_note: string | null; given_at: string | null; created_at: string; }
