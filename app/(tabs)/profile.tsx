import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const displayName = profile?.display_name ?? 'Friend';
  const partnerName = profile?.partner_name ?? null;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Profile</Text>
      </View>
      <View style={s.body}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{displayName}</Text>
        {user?.email ? <Text style={s.email}>{user.email}</Text> : null}

        <Card style={s.card}>
          <Text style={s.rowLabel}>Partner</Text>
          <Text style={s.rowValue}>{partnerName ?? 'Not set yet'}</Text>
        </Card>

        <Button label="Sign Out" onPress={() => signOut?.()} style={{ marginTop: Spacing.xl }} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.md, paddingTop: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  body: { flex: 1, alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  avatar: { width: 72, height: 72, borderRadius: Radius.full, backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.primary, marginBottom: Spacing.sm },
  avatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.textPrimary },
  name: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  email: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, color: Colors.textMuted },
  card: { width: '100%', marginTop: Spacing.xl, gap: Spacing.xs },
  rowLabel: { fontFamily: FontFamily.sansBold, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1 },
  rowValue: { fontFamily: FontFamily.regular, fontSize: FontSize.md, color: Colors.textPrimary },
});
