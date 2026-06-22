import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { getGreeting, daysUntil, formatCountdown, getUrgencyLevel } from '../../utils/dateHelpers';
import type { ImportantDate } from '../../types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { partnerProfile, refreshPartnerProfile } = useUserStore();
  const [upcomingDates, setUpcomingDates] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDates();
      refreshPartnerProfile(user.id);
    }
  }, [user]);

  const loadDates = async () => {
    if (!user) return;
    const { data } = await supabase.from('important_dates').select('*').eq('user_id', user.id).order('date');
    const sorted = (data ?? []).sort((a, b) => daysUntil(a.date) - daysUntil(b.date)).slice(0, 3);
    setUpcomingDates(sorted);
    setLoading(false);
  };

  const partnerName = profile?.partner_name ?? partnerProfile?.partner_name ?? 'her';
  const displayName = profile?.display_name ?? 'Friend';
  const greeting = getGreeting();

  const FEATURES = [
    { label: 'Important Dates', emoji: '📅', route: '/(tabs)/dates', desc: 'Never miss a moment' },
    { label: 'Message Her', emoji: '💌', route: '/(tabs)/messages', desc: 'Daily prompts to reach out' },
    { label: 'Gift Ideas', emoji: '🎁', route: '/(tabs)/gifts', desc: 'Log gifts and ideas' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting}, {displayName}</Text>
            <Text style={s.sub}>How are you loving {partnerName} today?</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={s.avatar}>
            <Text style={s.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {upcomingDates.length > 0 && (
          <>
            <Text style={s.sectionLabel}>COMING UP</Text>
            {upcomingDates.map(d => {
              const days = daysUntil(d.date);
              const urgency = getUrgencyLevel(days);
              return (
                <Card key={d.id} style={s.dateCard} onPress={() => router.push('/(tabs)/dates')} elevated={urgency === 'urgent'}>
                  <View style={s.dateRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.dateTitle}>{d.title}</Text>
                      <Text style={s.dateCountdown}>{formatCountdown(days)}</Text>
                    </View>
                    {urgency === 'urgent' && <Badge label="THIS WEEK" variant="error" />}
                    {urgency === 'soon' && <Badge label="SOON" variant="warning" />}
                  </View>
                </Card>
              );
            })}
          </>
        )}

        <Text style={s.sectionLabel}>WHAT WOULD YOU LIKE TO DO?</Text>
        <View style={s.grid}>
          {FEATURES.map(f => (
            <TouchableOpacity key={f.label} onPress={() => router.push(f.route as any)} style={s.featureCard} activeOpacity={0.8}>
              <Text style={s.featureEmoji}>{f.emoji}</Text>
              <Text style={s.featureLabel}>{f.label}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={s.quoteCard} elevated>
          <Text style={s.quoteText}>"The greatest thing a father can do for his children is to love their mother."</Text>
          <Text style={s.quoteAttr}>— Theodore Hesburgh</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl, paddingTop: Spacing.md },
  greeting: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textPrimary },
  sub: { fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textSecondary, fontStyle: 'italic', marginTop: Spacing.xs },
  avatar: { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.primary },
  avatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  sectionLabel: { fontFamily: FontFamily.sansBold, fontSize: FontSize.xs, color: Colors.gold, letterSpacing: 2, marginBottom: Spacing.md, marginTop: Spacing.sm },
  dateCard: { marginBottom: Spacing.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary },
  dateCountdown: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  featureCard: { width: '48%', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs },
  featureEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  featureLabel: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary },
  featureDesc: { fontFamily: FontFamily.sans, fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },
  quoteCard: { marginTop: Spacing.md },
  quoteText: { fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 26, textAlign: 'center' },
  quoteAttr: { fontFamily: FontFamily.sans, fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
});
