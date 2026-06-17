import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HeartbeatPulse } from '@/components/HeartbeatPulse';
import { HeartIcon, CalendarIcon, MessageBubbleIcon, GiftIcon } from '@/components/SVGMotifs';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface UpcomingDate {
  id: string;
  label: string;
  date: string;
  daysUntil: number;
  type: 'anniversary' | 'birthday' | 'custom';
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  route: '/(tabs)/dates' | '/(tabs)/messages' | '/(tabs)/gifts';
  accent: string;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  const target = new Date(dateStr);
  target.setFullYear(today.getFullYear());
  if (target < today) target.setFullYear(today.getFullYear() + 1);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getUrgency(daysUntil: number): 'low' | 'medium' | 'high' {
  if (daysUntil <= 3) return 'high';
  if (daysUntil <= 14) return 'medium';
  return 'low';
}

export default function DashboardScreen() {
  const router = useRouter();
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    loadData();
  }, []);

  async function loadData() {
    try {
      const [datesRaw, nameRaw] = await Promise.all([
        AsyncStorage.getItem('important_dates'),
        AsyncStorage.getItem('partner_name'),
      ]);

      if (nameRaw) setPartnerName(nameRaw);

      const dates: UpcomingDate[] = datesRaw ? JSON.parse(datesRaw) : DEMO_DATES;
      const enriched = dates
        .map((d) => ({ ...d, daysUntil: getDaysUntil(d.date) }))
        .sort((a, b) => a.daysUntil - b.daysUntil);

      setUpcomingDates(enriched);

      const nearest = enriched[0]?.daysUntil ?? 999;
      setUrgency(getUrgency(nearest));
    } catch {
      setUpcomingDates(DEMO_DATES.map((d) => ({ ...d, daysUntil: getDaysUntil(d.date) })));
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'dates',
      title: 'Important Dates',
      subtitle: `${upcomingDates.length} tracked`,
      icon: <CalendarIcon size={28} color={Colors.gold.DEFAULT} />,
      route: '/(tabs)/dates',
      accent: Colors.gold.DEFAULT,
    },
    {
      id: 'messages',
      title: 'Message Ideas',
      subtitle: 'Romantic nudges',
      icon: <MessageBubbleIcon size={28} color={Colors.rose.DEFAULT} />,
      route: '/(tabs)/messages',
      accent: Colors.rose.DEFAULT,
    },
    {
      id: 'gifts',
      title: 'Gift Finder',
      subtitle: 'AI-powered picks',
      icon: <GiftIcon size={28} color={Colors.gold.light} />,
      route: '/(tabs)/gifts',
      accent: Colors.gold.light,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.title}>
              {partnerName ? `Be there for ${partnerName}` : 'Be a better partner'}
            </Text>
          </View>
        </View>

        {/* Heartbeat Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroGradient} />
          <HeartbeatPulse urgency={urgency} size={90} />
          <Text style={styles.heroLabel}>
            {upcomingDates.length > 0 && upcomingDates[0].daysUntil <= 7
              ? `${upcomingDates[0].label} in ${upcomingDates[0].daysUntil} day${upcomingDates[0].daysUntil === 1 ? '' : 's'}`
              : 'All caught up — great job!'}
          </Text>
          {urgency === 'high' && (
            <View style={styles.urgencyBadge}>
              <Text style={styles.urgencyText}>Action needed</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickCard}
              onPress={() => router.push(action.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconBg, { backgroundColor: `${action.accent}18` }]}>
                {action.icon}
              </View>
              <Text style={styles.quickTitle}>{action.title}</Text>
              <Text style={styles.quickSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Dates */}
        <Text style={styles.sectionTitle}>Coming Up</Text>
        {upcomingDates.slice(0, 4).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.dateCard}
            onPress={() => router.push('/(tabs)/dates')}
            activeOpacity={0.8}
          >
            <View style={[styles.dateAccent, { backgroundColor: getTypeColor(item.type) }]} />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>{item.label}</Text>
              <Text style={styles.dateSubtext}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.dateBadge}>
              <Text style={[styles.dateDays, item.daysUntil <= 7 && styles.dateDaysUrgent]}>
                {item.daysUntil}
              </Text>
              <Text style={styles.dateDaysLabel}>days</Text>
            </View>
          </TouchableOpacity>
        ))}

        {upcomingDates.length === 0 && (
          <View style={styles.emptyState}>
            <HeartIcon size={40} color={Colors.gold.dark} />
            <Text style={styles.emptyText}>Add your first important date</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/dates')}
            >
              <Text style={styles.emptyButtonText}>Add a Date</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getTypeColor(type: string) {
  if (type === 'anniversary') return Colors.gold.DEFAULT;
  if (type === 'birthday') return Colors.rose.DEFAULT;
  return Colors.gold.light;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

const DEMO_DATES: UpcomingDate[] = [
  {
    id: '1',
    label: 'Anniversary',
    date: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(),
    daysUntil: 12,
    type: 'anniversary',
  },
  {
    id: '2',
    label: "Partner's Birthday",
    date: new Date(new Date().setDate(new Date().getDate() + 34)).toISOString(),
    daysUntil: 34,
    type: 'birthday',
  },
  {
    id: '3',
    label: "Valentine's Day",
    date: new Date(new Date().setDate(new Date().getDate() + 72)).toISOString(),
    daysUntil: 72,
    type: 'custom',
  },
];

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.navy.DEFAULT,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  title: {
    fontFamily: Typography.display,
    fontSize: 24,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  heroCard: {
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.gold.DEFAULT}22`,
    overflow: 'hidden',
    ...Shadow.card,
  },
  heroGradient: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${Colors.gold.DEFAULT}0A`,
  },
  heroLabel: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  urgencyBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.rose.DEFAULT}25`,
    borderWidth: 1,
    borderColor: Colors.rose.DEFAULT,
  },
  urgencyText: {
    fontFamily: Typography.semibold,
    fontSize: 12,
    color: Colors.rose.DEFAULT,
  },
  sectionTitle: {
    fontFamily: Typography.semibold,
    fontSize: 13,
    color: Colors.text.secondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.gold.DEFAULT}18`,
    ...Shadow.card,
  },
  quickIconBg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickTitle: {
    fontFamily: Typography.semibold,
    fontSize: 13,
    color: Colors.white,
    marginBottom: 2,
  },
  quickSubtitle: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navy.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${Colors.gold.DEFAULT}15`,
  },
  dateAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  dateInfo: {
    flex: 1,
    padding: Spacing.md,
  },
  dateLabel: {
    fontFamily: Typography.semibold,
    fontSize: 15,
    color: Colors.white,
    marginBottom: 2,
  },
  dateSubtext: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.text.muted,
  },
  dateBadge: {
    paddingRight: Spacing.md,
    alignItems: 'center',
  },
  dateDays: {
    fontFamily: Typography.bold,
    fontSize: 22,
    color: Colors.gold.DEFAULT,
    lineHeight: 26,
  },
  dateDaysUrgent: {
    color: Colors.rose.DEFAULT,
  },
  dateDaysLabel: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontFamily: Typography.medium,
    fontSize: 15,
    color: Colors.text.secondary,
  },
  emptyButton: {
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
  bottomSpacer: {
    height: 100,
  },
});
