import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { getDayOfYear } from '../../utils/dateHelpers';
import promptsData from '../../assets/data/message_prompts.json';
import type { MessagePrompt } from '../../types';

const TYPES = ['all', 'romantic', 'encouraging', 'appreciation', 'fun', 'spiritual'] as const;
type FilterType = typeof TYPES[number];

const TYPE_BADGES: Record<string, any> = {
  romantic: 'primary', encouraging: 'success', appreciation: 'gold', fun: 'warning', spiritual: 'muted',
};

const TYPE_LABELS: Record<string, string> = {
  all: 'All', romantic: '♥ Romantic', encouraging: '💪 Encouraging', appreciation: '🙏 Appreciate', fun: '😄 Fun', spiritual: '✝️ Spiritual',
};

export default function MessagesScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const prompts = promptsData as MessagePrompt[];

  const dayIndex = getDayOfYear() - 1;
  const todayPrompt = prompts[dayIndex % prompts.length];

  const filtered = useMemo(() =>
    filter === 'all' ? prompts : prompts.filter(p => p.type === filter),
    [filter]
  );

  const sendPrompt = async (p: MessagePrompt) => {
    await Share.share({ message: `${p.starter}\n\n[Your message here]\n\n(Hubby Helper tip: ${p.hint})` });
  };

  const PromptCard = ({ p, featured = false }: { p: MessagePrompt; featured?: boolean }) => {
    const isOpen = expanded === p.id;
    return (
      <Card style={[s.card, featured && s.featuredCard]} onPress={() => setExpanded(isOpen ? null : p.id)} elevated={featured}>
        {featured && <Text style={s.featuredLabel}>TODAY'S PROMPT</Text>}
        <View style={s.cardTop}>
          <Badge label={p.type.charAt(0).toUpperCase() + p.type.slice(1)} variant={TYPE_BADGES[p.type] ?? 'muted'} />
          <Text style={s.chevron}>{isOpen ? '▲' : '▼'}</Text>
        </View>
        <Text style={s.prompt}>{p.prompt}</Text>
        {isOpen && (
          <View style={s.expanded}>
            <View style={s.hintBox}>
              <Text style={s.hintLabel}>💡 TIP</Text>
              <Text style={s.hintText}>{p.hint}</Text>
            </View>
            <View style={s.starterBox}>
              <Text style={s.starterLabel}>STARTER</Text>
              <Text style={s.starterText}>"{p.starter}"</Text>
            </View>
            <Button label="Open Messages 💌" onPress={() => sendPrompt(p)} style={{ marginTop: Spacing.md }} />
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Message Her</Text>
        <Text style={s.sub}>A prompt to help you reach out and make her day.</Text>
        {todayPrompt && <PromptCard p={todayPrompt} featured />}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
          {TYPES.map(t => (
            <TouchableOpacity key={t} onPress={() => setFilter(t)} style={[s.filterChip, filter === t && s.filterChipOn]}>
              <Text style={[s.filterText, filter === t && s.filterTextOn]}>{TYPE_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={s.list}>
          {filtered.map(p => <PromptCard key={p.id} p={p} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textPrimary, marginBottom: Spacing.xs },
  sub: { fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: Spacing.xl },
  card: { marginBottom: Spacing.md, gap: Spacing.sm },
  featuredCard: { borderColor: Colors.gold, borderWidth: 1.5 },
  featuredLabel: { fontFamily: FontFamily.sansBold, fontSize: FontSize.xs, color: Colors.gold, letterSpacing: 2, marginBottom: Spacing.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chevron: { color: Colors.textMuted, fontSize: FontSize.xs },
  prompt: { fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 26, fontStyle: 'italic' },
  expanded: { marginTop: Spacing.sm, gap: Spacing.sm },
  hintBox: { backgroundColor: Colors.background, borderRadius: Radius.sm, padding: Spacing.md, gap: Spacing.xs },
  hintLabel: { fontFamily: FontFamily.sansBold, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1 },
  hintText: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  starterBox: { backgroundColor: Colors.primaryDark, borderRadius: Radius.sm, padding: Spacing.md, gap: Spacing.xs, borderWidth: 1, borderColor: Colors.primary },
  starterLabel: { fontFamily: FontFamily.sansBold, fontSize: FontSize.xs, color: Colors.primaryLight, letterSpacing: 1 },
  starterText: { fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textPrimary, fontStyle: 'italic' },
  filterRow: { marginBottom: Spacing.lg },
  filterChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, marginRight: Spacing.sm },
  filterChipOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryDark },
  filterText: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, color: Colors.textSecondary },
  filterTextOn: { color: Colors.textPrimary, fontFamily: FontFamily.sansMedium },
  list: { gap: Spacing.sm },
});
