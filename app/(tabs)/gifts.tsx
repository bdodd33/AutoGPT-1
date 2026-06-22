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
import { formatShortDate } from '../../utils/dateHelpers';
import type { GiftLogEntry } from '../../types';

type Tab = 'history' | 'ideas';

export default function GiftsScreen() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<GiftLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('history');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [occasion, setOccasion] = useState('');
  const [giftDescription, setGiftDescription] = useState('');
  const [givenAt, setGivenAt] = useState('');
  const [ideaNote, setIdeaNote] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('gift_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setEntries(data ?? []);
    setLoading(false);
  };

  const reset = () => { setOccasion(''); setGiftDescription(''); setGivenAt(''); setIdeaNote(''); };

  const saveGiven = async () => {
    if (!occasion.trim() || !giftDescription.trim()) { Alert.alert('Required', 'Please fill in occasion and what you gave.'); return; }
    if (givenAt && !givenAt.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('Invalid Date', 'Use format YYYY-MM-DD or leave blank.'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from('gift_log').insert({ user_id: user!.id, occasion: occasion.trim(), gift_description: giftDescription.trim(), given_at: givenAt || null }).select().single();
      if (error) throw new Error(error.message);
      setEntries(e => [data, ...e]);
      setShowAdd(false);
      reset();
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  const saveIdea = async () => {
    if (!ideaNote.trim()) { Alert.alert('Required', 'Write down the idea first.'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from('gift_log').insert({ user_id: user!.id, occasion: 'Idea', gift_description: 'Idea noted', idea_note: ideaNote.trim() }).select().single();
      if (error) throw new Error(error.message);
      setEntries(e => [data, ...e]);
      setShowAdd(false);
      reset();
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  const deleteEntry = async (id: string) => {
    Alert.alert('Delete', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('gift_log').delete().eq('id', id);
        setEntries(e => e.filter(x => x.id !== id));
      }},
    ]);
  };

  const history = entries.filter(e => !e.idea_note);
  const ideas = entries.filter(e => e.idea_note);
  const list = tab === 'history' ? history : ideas;

  const renderHistory = useCallback(({ item }: { item: GiftLogEntry }) => (
    <Card style={s.card} onPress={() => deleteEntry(item.id)}>
      <View style={s.cardTop}>
        <Badge label={item.occasion} variant="primary" />
        {item.given_at && <Text style={s.dateText}>{formatShortDate(item.given_at)}</Text>}
      </View>
      <Text style={s.giftText}>{item.gift_description}</Text>
    </Card>
  ), []);

  const renderIdea = useCallback(({ item }: { item: GiftLogEntry }) => (
    <Card style={s.card} onPress={() => deleteEntry(item.id)}>
      <Text style={s.giftText}>💡 {item.idea_note}</Text>
    </Card>
  ), []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Gift Ideas</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={s.addBtn}><Text style={s.addBtnText}>+ Add</Text></TouchableOpacity>
      </View>
      <View style={s.tabRow}>
        <TouchableOpacity onPress={() => setTab('history')} style={[s.tabChip, tab === 'history' && s.tabChipOn]}>
          <Text style={[s.tabText, tab === 'history' && s.tabTextOn]}>What I've Given</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('ideas')} style={[s.tabChip, tab === 'ideas' && s.tabChipOn]}>
          <Text style={[s.tabText, tab === 'ideas' && s.tabTextOn]}>Idea Notes</Text>
        </TouchableOpacity>
      </View>
      {loading ? <LoadingSpinner label="Loading..." /> : list.length === 0
        ? <View style={s.empty}>
            <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🎁</Text>
            <Text style={s.emptyTitle}>{tab === 'history' ? 'Nothing logged yet' : 'No ideas saved yet'}</Text>
            <Text style={s.emptySub}>{tab === 'history' ? 'Log what you give her so you never repeat — or forget.' : 'When she mentions wanting something, write it down here.'}</Text>
            <Button label={tab === 'history' ? 'Log a Gift' : 'Add an Idea'} onPress={() => setShowAdd(true)} style={{ marginTop: Spacing.xl }} />
          </View>
        : <FlatList data={list} renderItem={tab === 'history' ? renderHistory : renderIdea} keyExtractor={i => i.id} contentContainerStyle={s.list} showsVerticalScrollIndicator={false} removeClippedSubviews />
      }
      <Modal visible={showAdd} onClose={() => { setShowAdd(false); reset(); }}>
        <Text style={s.modalTitle}>{tab === 'history' ? 'Log a Gift You Gave' : 'Save a Gift Idea'}</Text>
        {tab === 'history' ? (
          <>
            <Input label="Occasion (e.g. Anniversary)" value={occasion} onChangeText={setOccasion} />
            <Input label="What you gave" value={giftDescription} onChangeText={setGiftDescription} multiline numberOfLines={2} />
            <Input label="Date given — YYYY-MM-DD (optional)" value={givenAt} onChangeText={setGivenAt} keyboardType="numbers-and-punctuation" />
            <Button label={saving ? 'Saving...' : 'Save'} onPress={saveGiven} isLoading={saving} style={{ marginTop: Spacing.md }} />
          </>
        ) : (
          <>
            <Input label="Idea (e.g. she mentioned wanting...)" value={ideaNote} onChangeText={setIdeaNote} multiline numberOfLines={3} />
            <Button label={saving ? 'Saving...' : 'Save Idea'} onPress={saveIdea} isLoading={saving} style={{ marginTop: Spacing.md }} />
          </>
        )}
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
  tabRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, paddingBottom: 0 },
  tabChip: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' },
  tabChipOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryDark },
  tabText: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, color: Colors.textSecondary },
  tabTextOn: { color: Colors.textPrimary, fontFamily: FontFamily.sansMedium },
  list: { padding: Spacing.md, gap: Spacing.md },
  card: { gap: Spacing.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontFamily: FontFamily.sans, fontSize: FontSize.xs, color: Colors.textMuted },
  giftText: { fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySub: { fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, marginBottom: Spacing.lg },
});
