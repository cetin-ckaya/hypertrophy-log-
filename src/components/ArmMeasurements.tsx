import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LineChart } from './charts';
import { TrashIcon } from './icons';
import { Button, NumberStepper, Row, Section } from './ui';
import { addDays, formatRelative, formatShort, todayKey } from '../logic/date';
import { useStore } from '../store/store';
import { colors, font, fonts, spacing } from '../theme';

const cm = (v: number) => `${v.toFixed(1).replace('.', ',')} cm`;

/** Kol ölçüsü: tarih + cm girişi, liste ve grafik. */
export const ArmMeasurements = () => {
  const state = useStore();
  const arms = state.armMeasurements ?? {};
  const entries = Object.entries(arms).sort(([a], [b]) => (a < b ? -1 : 1));
  const last = entries[entries.length - 1];
  const [date, setDate] = useState(todayKey());
  const [draft, setDraft] = useState<number>(last ? last[1] : 36);
  const existing = arms[date];
  const first = entries[0];

  return (
    <Section>
      <Text style={font.h3}>Kol ölçüsü</Text>
      <Text style={[font.small, font.num]}>
        {first && last
          ? `${cm(first[1])} (${formatShort(first[0])}) → ${cm(last[1])} (${formatShort(last[0])})`
          : 'Henüz ölçüm yok'}
      </Text>
      <LineChart
        labels={entries.map(([d]) => formatShort(d))}
        unit="cm"
        decimals={1}
        height={150}
        series={[{ name: 'Kol', color: colors.accent, values: entries.map(([, v]) => v), width: 2.5 }]}
      />

      <View style={styles.dateRow}>
        <Pressable onPress={() => setDate((d) => addDays(d, -1))} hitSlop={10}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Text style={font.bodyStrong}>
          {formatRelative(date)} · {formatShort(date)}
        </Text>
        <Pressable
          onPress={() => setDate((d) => (d < todayKey() ? addDays(d, 1) : d))}
          hitSlop={10}
          disabled={date >= todayKey()}
        >
          <Text style={[styles.nav, date >= todayKey() ? { color: colors.ruleLight } : null]}>›</Text>
        </Pressable>
      </View>
      <Row gap={spacing.sm}>
        <View style={{ flex: 1 }}>
          <NumberStepper
            value={existing ?? draft}
            onChange={(v) => {
              setDraft(v);
              if (existing !== undefined) state.logArm(date, v);
            }}
            step={0.1}
            min={20}
            max={70}
            decimals={1}
            suffix="cm"
          />
        </View>
        <Button
          title={existing !== undefined ? 'Güncelle' : 'Kaydet'}
          variant="ink"
          onPress={() => state.logArm(date, existing ?? draft)}
        />
      </Row>
      <Text style={font.tiny}>Sabah, aç karnına, pompasız, kasılı, en kalın nokta.</Text>

      {entries
        .slice()
        .reverse()
        .slice(0, 8)
        .map(([d, v]) => (
          <Row key={d} style={styles.item} gap={spacing.sm}>
            <Text style={[font.small, { flex: 1 }]}>{formatShort(d)}</Text>
            <Text style={[font.bodyStrong, font.num]}>{cm(v)}</Text>
            <Pressable onPress={() => state.removeArm(d)} hitSlop={8} accessibilityLabel="Ölçümü sil">
              <TrashIcon size={15} color={colors.muted} />
            </Pressable>
          </Row>
        ))}
    </Section>
  );
};

const styles = StyleSheet.create({
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  nav: { fontFamily: fonts.black, fontSize: 20, color: colors.ink, paddingHorizontal: 6 },
  item: { paddingVertical: 6, alignItems: 'center' },
});
