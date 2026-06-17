import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import {
  DashboardIcon,
  CalendarIcon,
  MessageBubbleIcon,
  GiftIcon,
} from '@/components/SVGMotifs';

interface TabIconProps {
  color: string;
  focused: boolean;
  children: React.ReactNode;
}

function TabIcon({ color, focused, children }: TabIconProps) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
      {children}
      {focused && <View style={styles.dot} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.gold.DEFAULT,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused}>
              <DashboardIcon size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="dates"
        options={{
          title: 'Dates',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused}>
              <CalendarIcon size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused}>
              <MessageBubbleIcon size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="gifts"
        options={{
          title: 'Gifts',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused}>
              <GiftIcon size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: Colors.navy.dark,
    borderTopWidth: 1,
    borderTopColor: `${Colors.gold.DEFAULT}22`,
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  iconWrapperFocused: {
    backgroundColor: `${Colors.gold.DEFAULT}18`,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold.DEFAULT,
    marginTop: 3,
  },
});
