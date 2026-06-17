import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { CalendarIcon, HeartIcon } from '@/components/SVGMotifs';

type DateType = 'anniversary' | 'birthday' | 'custom';

interface ImportantDate {
  id: string;
  label: string;
  date: string;
  type: DateType;
  notifyDaysBefore: number;
  recurring: boolean;
  notes?: string;
}

const DATE_TYPES: { value: DateType; label: string; color: string }[] = [
  { value: 'anniversary', label: 'Anniversary', color: Colors.gold.DEFAULT },
  { value: 'birthday', label: 'Birthday', color: Colors.rose.DEFAULT },
  { value: 'custom', label: 'Custom', color: Colors.gold.light },
];

const NOTIFY_OPTIONS = [
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
  { value: 14, label: '2 weeks before' },
];

function getDaysUntil(dateStr: string, recurring: boolean): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  if (recurring) {
    target.setFullYear(today.getFullYear());
    if (target < today) target.setFullYear(today.getFullYear() + 1);
  }
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getTypeColor(type: DateType): string {
  return DATE_TYPES.find((t) => t.value === type)?.color ?? Colors.gold.DEFAULT;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function DatesScreen() {
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);

  const [form, setForm] = useState({
    label: '',
    month: '',
    day: '',
    year: '',
    type: 'anniversary' as DateType,
    notifyDaysBefore: 7,
    recurring: true,
    notes: '',
  });

  useEffect(() => {
    loadDates();
  }, []);

  async function loadDates() {
    try {
      const raw = await AsyncStorage.getItem('important_dates');
      if (raw) setDates(JSON.parse(raw));
    } catch {}
  }

  async function saveDates(updated: ImportantDate[]) {
    setDates(updated);
    await AsyncStorage.setItem('important_dates', JSON.stringify(updated));
  }

  function openAdd() {
    setEditingDate(null);
    setForm({
      label: '',
      month: '',
      day: '',
      year: new Date().getFullYear().toString(),
      type: 'anniversary',
      notifyDaysBefore: 7,
      recurring: true,
      notes: '',
    });
    setShowModal(true);
  }

  function openEdit(d: ImportantDate) {
    const dt = new Date(d.date);
    setEditingDate(d);
    setForm({
      label: d.label,
      month: (dt.getMonth() + 1).toString(),
      day: dt.getDate().toString(),
      year: dt.getFullYear().toString(),
      type: d.type,
      notifyDaysBefore: d.notifyDaysBefore,
      recurring: d.recurring,
      notes: d.notes ?? '',
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.label.trim()) {
      Alert.alert('Missing info', 'Please enter a label for this date.');
      return;
    }
    const month = parseInt(form.month, 10);
    const day = parseInt(form.day, 10);
    const year = parseInt(form.year, 10);
    if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      Alert.alert('Invalid date', 'Please enter a valid month and day.');
      return;
    }

    const dateObj = new Date(year || new Date().getFullYear(), month - 1, day);
    const newDate: ImportantDate = {
      id: editingDate?.id ?? generateId(),
      label: form.label.trim(),
      date: dateObj.toISOString(),
      type: form.type,
      notifyDaysBefore: form.notifyDaysBefore,
      recurring: form.recurring,
      notes: form.notes.trim() || undefined,
    };

    const updated = editingDate
      ? dates.map((d) => (d.id === editingDate.id ? newDate : d))
      : [...dates, newDate];

    saveDates(updated);
    setShowModal(false);
  }

  function handleDelete(id: string) {
    Alert.alert('Delete Date', 'Remove this date from your tracker?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => saveDates(dates.filter((d) => d.id !== id)),
      },
    ]);
  }

  const sorted = [...dates].sort(
    (a, b) => getDaysUntil(a.date, a.recurring) - getDaysUntil(b.date, b.recurring)
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenLabel}>TRACKER</Text>
          <Text style={styles.screenTitle}>Important Dates</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAdd} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarIcon size={56} color={Colors.gold.dark} />
            <Text style={styles.emptyTitle}>No dates yet</Text>
            <Text style={styles.emptySubtext}>
              Add anniversaries, birthdays, and special moments so you never forget.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAdd}>
              <Text style={styles.emptyButtonText}>Add Your First Date</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sorted.map((item) => {
            const daysUntil = getDaysUntil(item.date, item.recurring);
            const typeColor = getTypeColor(item.type);
            const urgent = daysUntil <= 7;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.dateCard}
                onPress={() => openEdit(item)}
                onLongPress={() => handleDelete(item.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.typeBar, { backgroundColor: typeColor }]} />
                <View style={styles.dateBody}>
                  <View style={styles.dateTop}>
                    <View>
                      <Text style={styles.dateLabel}>{item.label}</Text>
                      <Text style={styles.dateFmt}>{formatDate(item.date)}</Text>
                    </View>
                    <View style={styles.countdown}>
                      <Text style={[styles.countdownNum, urgent && styles.countdownUrgent]}>
                        {daysUntil}
                      </Text>
                      <Text style={styles.countdownLabel}>days</Text>
                    </View>
                  </View>
                  <View style={styles.dateBottom}>
                    <View style={[styles.typePill, { borderColor: `${typeColor}44` }]}>
                      <Text style={[styles.typePillText, { color: typeColor }]}>
                        {DATE_TYPES.find((t) => t.value === item.type)?.label}
                      </Text>
                    </View>
                    {item.recurring && (
                      <Text style={styles.recurringBadge}>Yearly</Text>
                    )}
                    <Text style={styles.notifyBadge}>
                      Notify {item.notifyDaysBefore}d before
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingDate ? 'Edit Date' : 'Add Date'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Label</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Our Anniversary"
                placeholderTextColor={Colors.text.muted}
                value={form.label}
                onChangeText={(v) => setForm((f) => ({ ...f, label: v }))}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Date</Text>
              <View style={styles.dateRow}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="MM"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="numeric"
                  maxLength={2}
                  value={form.month}
                  onChangeText={(v) => setForm((f) => ({ ...f, month: v }))}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="DD"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="numeric"
                  maxLength={2}
                  value={form.day}
                  onChangeText={(v) => setForm((f) => ({ ...f, day: v }))}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                  style={[styles.input, styles.yearInput]}
                  placeholder="YYYY"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="numeric"
                  maxLength={4}
                  value={form.year}
                  onChangeText={(v) => setForm((f) => ({ ...f, year: v }))}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeRow}>
                {DATE_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.typePicker,
                      form.type === t.value && {
                        borderColor: t.color,
                        backgroundColor: `${t.color}18`,
                      },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, type: t.value }))}
                  >
                    <Text
                      style={[
                        styles.typePickerText,
                        form.type === t.value && { color: t.color },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Notify Me</Text>
              <View style={styles.notifyRow}>
                {NOTIFY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.notifyPicker,
                      form.notifyDaysBefore === opt.value && styles.notifyPickerActive,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, notifyDaysBefore: opt.value }))}
                  >
                    <Text
                      style={[
                        styles.notifyPickerText,
                        form.notifyDaysBefore === opt.value && styles.notifyPickerTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setForm((f) => ({ ...f, recurring: !f.recurring }))}
              >
                <View>
                  <Text style={styles.fieldLabel}>Recurring yearly</Text>
                  <Text style={styles.fieldHint}>Repeats every year on this date</Text>
                </View>
                <View style={[styles.toggle, form.recurring && styles.toggleOn]}>
                  <View style={[styles.toggleThumb, form.recurring && styles.toggleThumbOn]} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.formSection, { marginBottom: 40 }]}>
              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Gift ideas, dinner reservations, etc."
                placeholderTextColor={Colors.text.muted}
                multiline
                numberOfLines={3}
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy.DEFAULT },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  screenLabel: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  screenTitle: {
    fontFamily: Typography.display,
    fontSize: 26,
    color: Colors.white,
  },
  addButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold.DEFAULT,
  },
  addButtonText: {
    fontFamily: Typography.semibold,
    fontSize: 14,
    color: Colors.navy.dark,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontFamily: Typography.semibold,
    fontSize: 20,
    color: Colors.white,
  },
  emptySubtext: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold.DEFAULT,
  },
  emptyButtonText: {
    fontFamily: Typography.semibold,
    fontSize: 14,
    color: Colors.navy.dark,
  },
  dateCard: {
    flexDirection: 'row',
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${Colors.gold.DEFAULT}15`,
    ...Shadow.card,
  },
  typeBar: { width: 4 },
  dateBody: { flex: 1, padding: Spacing.md },
  dateTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dateLabel: { fontFamily: Typography.semibold, fontSize: 16, color: Colors.white, marginBottom: 2 },
  dateFmt: { fontFamily: Typography.body, fontSize: 13, color: Colors.text.muted },
  countdown: { alignItems: 'center' },
  countdownNum: { fontFamily: Typography.bold, fontSize: 28, color: Colors.gold.DEFAULT, lineHeight: 32 },
  countdownUrgent: { color: Colors.rose.DEFAULT },
  countdownLabel: { fontFamily: Typography.body, fontSize: 11, color: Colors.text.muted },
  dateBottom: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm, flexWrap: 'wrap', alignItems: 'center' },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  typePillText: { fontFamily: Typography.medium, fontSize: 11 },
  recurringBadge: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
    backgroundColor: `${Colors.white}10`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notifyBadge: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  bottomSpacer: { height: 100 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.navy.DEFAULT },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.gold.DEFAULT}22`,
  },
  modalCancel: { fontFamily: Typography.medium, fontSize: 16, color: Colors.text.secondary },
  modalTitle: { fontFamily: Typography.semibold, fontSize: 17, color: Colors.white },
  modalSave: { fontFamily: Typography.semibold, fontSize: 16, color: Colors.gold.DEFAULT },
  modalScroll: { flex: 1 },
  formSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
  fieldLabel: { fontFamily: Typography.semibold, fontSize: 13, color: Colors.text.secondary, marginBottom: Spacing.sm, letterSpacing: 0.5 },
  fieldHint: { fontFamily: Typography.body, fontSize: 12, color: Colors.text.muted, marginTop: 1 },
  input: {
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.gold.DEFAULT}22`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontFamily: Typography.body,
    fontSize: 16,
    color: Colors.white,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateInput: { flex: 1, textAlign: 'center' },
  yearInput: { flex: 1.5, textAlign: 'center' },
  dateSep: { fontFamily: Typography.semibold, fontSize: 18, color: Colors.text.muted },
  notesInput: { height: 80, textAlignVertical: 'top', paddingTop: Spacing.sm },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typePicker: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.white}18`,
    alignItems: 'center',
  },
  typePickerText: { fontFamily: Typography.medium, fontSize: 13, color: Colors.text.secondary },
  notifyRow: { gap: Spacing.sm },
  notifyPicker: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.white}15`,
    backgroundColor: Colors.navy.card,
  },
  notifyPickerActive: {
    borderColor: Colors.gold.DEFAULT,
    backgroundColor: `${Colors.gold.DEFAULT}18`,
  },
  notifyPickerText: { fontFamily: Typography.medium, fontSize: 14, color: Colors.text.secondary },
  notifyPickerTextActive: { color: Colors.gold.DEFAULT },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.white}15`,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.navy.light,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: Colors.gold.DEFAULT },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
});
