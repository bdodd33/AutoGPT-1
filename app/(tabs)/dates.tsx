import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { daysUntil, formatCountdown, formatShortDate, getUrgencyLevel } from '../../utils/dateHelpers';
import type { ImportantDate, DateType } from '../../types';

const DATE_TYPES: { label: string; value: DateType; emoji: string }[] = [
  { label: 'Anniversary', value: 'anniversary', emoji: '💍' },
  { label: 'Her Birthday', value: 'birthday', emoji: '🎂' },
  { label: 'First Date', value: 'first_date', emoji: '🌹' },
  { label: "Kid's Birthday", value: 'kids_birthday', emoji: '🎈' },
  { label: 'Custom', value: 'custom', emoji: '📌' },
];

const URGENCY_COLORS = { urgent: Colors.error, soon: Colors.warning, upcoming: Colors.gold, future: Colors.textSecondary };

export default function DatesScreen() {
  const { user } = useAuthStore();
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [dateType, setDateType] = useState<DateType>('anniversary');
  const [personName, setPersonName] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('important_dates').select('*').eq('user_id', user.id).order('date');
    setDates(data ?? []);
    setLoading(false);
  };

  const reset = () => { setTitle(''); setDate(''); setDateType('anniversary'); setPersonName(''); setNotes(''); setIsRecurring(true); };

  const save = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a title.'); return; }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('Invalid Date', 'Use format YYYY-MM-DD'); return; }
    setSaving(true);
    try {
      const { data: newDate, error } = await supabase.from('important_dates').insert({ user_id: user!.id, title: title.trim(), date, date_type: dateType, person_name: personName.trim() || null, notes: notes.trim() || null, is_recurring: isRecurring, reminder_days_before: [30, 7, 3, 1] }).select().single();
      if (error) throw new Error(error.message);
      setDates(d => [...d, newDate].sort((a, b) => a.date.localeCompare(b.date)));
      setShowAdd(false);
      reset();
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  const deleteDate = async (id: string) => {
    Alert.alert('Delete', 'Remove this date?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('important_dates').delete().eq('id', id);
        setDates(d => d.filter(x => x.id !== id));
      }},
    ]);
  };

  const renderDate = useCallback(({ item }: { item: ImportantDate }) => {
    const days = daysUntil(item.date);
    const urgency = getUrgencyLevel(days);
    const typeInfo = DATE_TYPES.find(t => t.value === item.date_type);
    return (
      <Card style={s.dateCard} onPress={() => deleteDate(item.id)}>
        <View style={s.dateRow}>
          <Text style={s.dateEmoji}>{typeInfo?.emoji ?? '📅'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.dateTitle}>{item.title}</Text>
            {item.person_name ? <Text style={s.datePerson}>{item.person_name}</Text> : null}
            <Text style={s.dateWhen}>{formatShortDate(item.date)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={[s.countdown, { color: URGENCY_COLORS[urgency] }]}>{formatCountdown(days)}</Text>
            {urgency === 'urgent' && <Badge label="THIS WEEK" variant="error" />}
            {urgency === 'soon' && <Badge label="SOON" variant="warning" />}
          </View>
        </View>
      </Card>
    );
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Important Dates</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={s.addBtn}><Text style={s.addBtnText}>+ Add</Text></TouchableOpacity>
      </View>
      {loading ? <LoadingSpinner label="Loading..." /> : dates.length === 0
        ? <View style={s.empty}><Text style={{ fontSize: 48, marginBottom: Spacing.md }}>📅</Text><Text style={s.emptyTitle}>No dates saved yet</Text><Text style={s.emptySub}>Add anniversaries, birthdays, and milestones so you never miss what matters.</Text><Button label="Add Your First Date" onPress={() => setShowAdd(true)} style={{ marginTop: Spacing.xl }} /></View>
        : <FlatList data={dates} renderItem={renderDate} keyExtractor={i => i.id} contentContainerStyle={s.list} showsVerticalScrollIndicator={false} removeClippedSubviews />
      }
      <Modal visible={showAdd} onClose={() => { setShowAdd(false); reset(); }}>
        <Text style={s.modalTitle}>Add Important Date</Text>
        <View style={s.typeRow}>
          {DATE_TYPES.map(t => (
            <TouchableOpacity key={t.value} onPress={() => setDateType(t.value)} style={[s.typeChip, dateType === t.value && s.typeChipOn]}>
              <Text style={s.typeEmoji}>{t.emoji}</Text>
              <Text style={[s.typeLabel, dateType === t.value && s.typeLabelOn]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input label="Title (e.g. Our Anniversary)" value={title} onChangeText={setTitle} />
        <Input label="Date — YYYY-MM-DD" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
        {dateType === 'kids_birthday' && <Input label="Child's Name" value={personName} onChangeText={setPersonName} autoCapitalize="words" />}
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline numberOfLines={2} />
        <Button label={saving ? 'Saving...' : 'Save Date'} onPress={save} isLoading={saving} style={{ marginTop: Spacing.md }} />
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingTop: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primaryDark, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary },
  addBtnText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.sm, color: Colors.primary },
  list: { padding: Spacing.md, gap: Spacing.md },
  dateCard: { gap: Spacing.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dateEmoji: { fontSize: 28 },
  dateTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary },
  datePerson: { fontFamily: FontFamily.sans, fontSize: FontSize.xs, color: Colors.textMuted },
  dateWhen: { fontFamily: FontFamily.sans, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  countdown: { fontFamily: FontFamily.sansBold, fontSize: FontSize.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySub: { fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, marginBottom: Spacing.lg },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  typeChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', minWidth: 80 },
  typeChipOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryDark },
  typeEmoji: { fontSize: 20, marginBottom: 2 },
  typeLabel: { fontFamily: FontFamily.sans, fontSize: FontSize.xs, color: Colors.textSecondary },
  typeLabelOn: { color: Colors.textPrimary, fontFamily: FontFamily.sansMedium },
});
