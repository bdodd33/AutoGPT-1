import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';

function Icon({ e, f }: { e: string; f: boolean }) {
  return <Text style={{ fontSize: 22, opacity: f ? 1 : 0.5 }}>{e}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused: f }) => <Icon e="🏠" f={f} /> }} />
      <Tabs.Screen name="dates" options={{ title: 'Dates', tabBarIcon: ({ focused: f }) => <Icon e="📅" f={f} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Message', tabBarIcon: ({ focused: f }) => <Icon e="💌" f={f} /> }} />
      <Tabs.Screen name="gifts" options={{ title: 'Gift Ideas', tabBarIcon: ({ focused: f }) => <Icon e="🎁" f={f} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused: f }) => <Icon e="👤" f={f} /> }} />
    </Tabs>
  );
}
