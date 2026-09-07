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
import { colors, radius } from './src/theme';

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

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              style={styles.tab}
              onPress={() => setTab(key)}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.pip, active ? styles.pipOn : null]}>
                <Icon size={21} color={active ? colors.primary : colors.textFaint} />
                {key === 'workout' && hasActive ? <View style={styles.dot} /> : null}
              </View>
              <Text style={[styles.tabLabel, active ? { color: colors.primary } : null]}>
                {label}
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
    backgroundColor: '#0A0C11',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 2 },
  pip: {
    width: 30,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipOn: { backgroundColor: 'rgba(76,141,255,0.16)' },
  dot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  tabLabel: { fontSize: 9.5, fontWeight: '700', color: colors.textFaint },
});
