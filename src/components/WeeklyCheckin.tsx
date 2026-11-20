import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { Button, Section } from './ui';
import { addDays, formatShort, todayKey } from '../logic/date';
import { buildCheckin, checkinWeek, rangeLabel } from '../logic/checkin';
import { useStore } from '../store/store';
import { colors, font, fonts, rules, spacing } from '../theme';

/** Seçili haftanın check-in metnini panoya kopyalar. */
export const useCheckinCopy = () => {
  const state = useStore();
  return async (day: string = todayKey()) => {
    const text = buildCheckin(
      {
        sessions: state.sessions,
        weights: state.weights,
        armMeasurements: state.armMeasurements ?? {},
        programId: state.programId,
        settings: state.settings,
        extraSets: state.extraSets ?? {},
      },
      day
    );
    await Clipboard.setStringAsync(text);
    return text;
  };
};

export const WeeklyCheckin = () => {
  const state = useStore();
  const copy = useCheckinCopy();
  const [offset, setOffset] = useState(0); // 0 = bu hafta, -1 = geçen hafta…
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const day = addDays(todayKey(), offset * 7);
  const { mon, fri } = checkinWeek(day);
  const text = preview
    ? buildCheckin(
        {
          sessions: state.sessions,
          weights: state.weights,
          armMeasurements: state.armMeasurements ?? {},
          programId: state.programId,
          settings: state.settings,
          extraSets: state.extraSets ?? {},
        },
        day
      )
    : '';

  return (
    <Section>
      <Text style={font.h3}>Haftalık check-in</Text>
      <View style={styles.weekRow}>
        <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={10}>
          <Text style={styles.nav}>‹ Önceki</Text>
        </Pressable>
        <Text style={[font.bodyStrong, font.num]}>
          {rangeLabel(mon, fri)}
          {offset === 0 ? ' · bu hafta' : ''}
        </Text>
        <Pressable onPress={() => setOffset((o) => Math.min(0, o + 1))} hitSlop={10} disabled={offset === 0}>
          <Text style={[styles.nav, offset === 0 ? { color: colors.ruleLight } : null]}>Sonraki ›</Text>
        </Pressable>
      </View>
      <Button
        title={copied ? 'Kopyalandı ✓' : 'Haftalık özeti kopyala'}
        onPress={async () => {
          await copy(day);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }}
      />
      <Button
        title={preview ? 'Önizlemeyi kapat' : 'Önizle'}
        variant="ghost"
        onPress={() => setPreview((p) => !p)}
      />
      {preview ? (
        <Text selectable style={styles.preview}>
          {text}
        </Text>
      ) : (
        <Text style={font.tiny}>
          Pazartesi–Cuma ({formatShort(mon)} – {formatShort(fri)}): kilo, antrenmanlar ve geçen haftayla
          karşılaştırma (↑ / = / ↓, 1. setin tahmini 1RM'i, %1 eşik), uyarılar ve kol ölçüsü.
        </Text>
      )}
    </Section>
  );
};

const styles = StyleSheet.create({
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  nav: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink, letterSpacing: 0.4 },
  preview: {
    fontFamily: 'ui-monospace, Menlo, monospace',
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.ink,
    borderWidth: rules.light,
    borderColor: colors.ruleLight,
    padding: spacing.sm,
  },
});
