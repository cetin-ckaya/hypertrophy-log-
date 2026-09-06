import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loading } from './src/components/ui';
import { TABS, TabKey } from './src/navigation';
import { HomeScreen } from './src/screens/HomeScreen';
import { NutritionScreen } from './src/screens/NutritionScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { WeightScreen } from './src/screens/WeightScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { useStore } from './src/store/store';
import { colors, font } from './src/theme';

const Shell = () => {
  const hydrated = useStore((s) => s.hydrated);
  const hasActive = useStore((s) => s.activeSession !== null);
  const [tab, setTab] = useState<TabKey>('home');
  const insets = useSafeAreaInsets();

  if (!hydrated) return <Loading />;

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {tab === 'home' ? <HomeScreen go={setTab} /> : null}
        {tab === 'workout' ? <WorkoutScreen go={setTab} /> : null}
        {tab === 'nutrition' ? <NutritionScreen /> : null}
        {tab === 'weight' ? <WeightScreen /> : null}
        {tab === 'stats' ? <StatsScreen /> : null}
        {tab === 'settings' ? <SettingsScreen /> : null}
      </View>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              style={styles.tab}
              onPress={() => setTab(t.key)}
              accessibilityRole="button"
              accessibilityLabel={t.label}
            >
              <View style={styles.iconWrap}>
                <Text style={[styles.icon, active ? { color: colors.primary } : null]}>{t.icon}</Text>
                {t.key === 'workout' && hasActive ? <View style={styles.dot} /> : null}
              </View>
              <Text style={[styles.tabLabel, active ? { color: colors.primary } : null]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Shell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 2, minHeight: 48 },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20, color: colors.textFaint, lineHeight: 24 },
  dot: {
    position: 'absolute',
    top: 0,
    right: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  tabLabel: { ...font.tiny, fontSize: 10, fontWeight: '600' },
});
