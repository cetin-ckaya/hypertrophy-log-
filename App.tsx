import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
  useFonts,
} from '@expo-google-fonts/archivo';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loading } from './src/components/ui';
import { TABS, TabKey } from './src/navigation';
import { HomeScreen } from './src/screens/HomeScreen';
import { NutritionScreen } from './src/screens/NutritionScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { useStore } from './src/store/store';
import { colors, font, rules } from './src/theme';

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
        {tab === 'stats' ? <StatsScreen go={setTab} /> : null}
        {tab === 'settings' ? <SettingsScreen go={setTab} /> : null}
      </View>

      <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
        {TABS.map(({ key, label }, i) => {
          const active = tab === key || (key === 'stats' && tab === 'settings');
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.tab,
                i < TABS.length - 1 ? styles.tabDivider : null,
                active ? { backgroundColor: colors.ink } : null,
                pressed && !active ? { backgroundColor: colors.hover } : null,
              ]}
            >
              <Text
                style={[
                  font.button,
                  { fontSize: 10.5, letterSpacing: 0.6, color: active ? colors.onAccent : colors.ink },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              {key === 'workout' && hasActive ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default function App() {
  const [loaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {loaded ? <Shell /> : <Loading />}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: rules.strong,
    borderTopColor: colors.rule,
  },
  tab: { flex: 1, minHeight: 58, justifyContent: 'center', paddingHorizontal: 7 },
  tabDivider: { borderRightWidth: rules.strong, borderRightColor: colors.rule },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
  },
});
