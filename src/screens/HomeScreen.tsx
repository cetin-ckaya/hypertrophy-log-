import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdjustmentCard } from '../components/AdjustmentCard';
import { GearIcon } from '../components/icons';
import {
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  Label,
  MacroBar,
  NumberStepper,
  Row,
  Screen,
  Section,
  Segmented,
  Sparkline,
} from '../components/ui';
import { cycleDayOf, dayById, getProgram } from '../data/program';
import { formatLong, todayKey } from '../logic/date';
import { eatenMacros } from '../logic/nutrition';
import { sessionSetCount, sessionVolume } from '../logic/progression';
import { latestAverage, sortedWeights, weeklyTrend } from '../logic/weight';
import { dayLogFor, useStore } from '../store/store';
import { colors, font, fonts, macroColors, rules, spacing } from '../theme';
import { TabKey } from '../navigation';

const signed = (n: number, digits = 2) =>
  `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits).replace('.', ',')}`;

export const HomeScreen = ({ go }: { go: (tab: TabKey) => void }) => {
  const state = useStore();
  const today = todayKey();
  const program = getProgram(state.programId);
  const day = cycleDayOf(state.programId, state.cycleIndex);
  const [view, setView] = useState<'cards' | 'cockpit'>('cards');
  const [weightDraft, setWeightDraft] = useState<number>(
    state.weights[today] ?? latestAverage(state.weights) ?? state.profile.startWeightKg
  );

  useEffect(() => {
    state.checkAdjustment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.weights, state.settings.autoAdjustEnabled]);

  const log = useMemo(
    () => dayLogFor(state, today),
    [state.dayLogs, state.plan, state.cycleIndex, today]
  );
  const eaten = eatenMacros(log.meals, state.foods);
  const trend = weeklyTrend(state.weights);
  const avg = latestAverage(state.weights);
  const weighedToday = state.weights[today] !== undefined;
  const lastSession = state.sessions[state.sessions.length - 1];
  const entries = sortedWeights(state.weights);
  const lastEntry = entries[entries.length - 1];
  const sparkValues = entries.slice(-21).map((w) => w.weight);

  const summary =
    day.kind === 'workout'
      ? `${day.exercises.length} hareket · ${day.exercises.reduce((s, e) => s + e.sets, 0)} work-set`
      : 'Toparlanma günü';

  const macros = (
    <>
      <MacroBar label="Kalori" value={eaten.kcal} target={state.calorieTarget} unit="kcal" color={colors.ink} />
      <MacroBar label="Protein" value={eaten.protein} target={state.macroTargets.protein} color={macroColors.protein} />
      <MacroBar label="Karb" value={eaten.carbs} target={state.macroTargets.carbs} color={macroColors.carbs} />
      <MacroBar label="Yağ" value={eaten.fat} target={state.macroTargets.fat} color={macroColors.fat} />
    </>
  );

  return (
    <Screen
      kicker={formatLong(today)}
      title="Genel durum"
      right={
        <IconButton onPress={() => go('settings')} label="Ayarlar">
          <GearIcon size={18} color={colors.ink} />
        </IconButton>
      }
    >
      <Segmented
        options={[
          { key: 'cards', label: 'Kartlar' },
          { key: 'cockpit', label: 'Kokpit' },
        ]}
        value={view}
        onChange={(k) => setView(k as 'cards' | 'cockpit')}
        style={{ borderTopWidth: 0 }}
      />

      {state.pendingAdjustment ? <AdjustmentCard /> : null}

      {state.activeSession ? (
        <Card tone="accent">
          <Label>Devam eden antrenman</Label>
          <Text style={font.h2}>{dayById(state.activeSession.dayId)?.name}</Text>
          <Button title="Antrenmana dön →" onPress={() => go('workout')} />
        </Card>
      ) : null}

      {view === 'cockpit' ? (
        <View style={styles.cockpit}>
          <View style={styles.cockpitHead}>
            <Text style={[font.label, { color: 'rgba(255,255,255,0.9)' }]}>Sıradaki antrenman</Text>
            <Text style={styles.cockpitDay}>{day.name}</Text>
            <Text style={styles.cockpitSummary}>{summary}</Text>
          </View>
          <Grid style={{ borderWidth: 0, borderTopWidth: rules.strong }}>
            {[
              { label: 'Döngü', value: `${state.cycleIndex + 1}/${program.cycle.length}`, note: program.name.split(' · ')[0] },
              { label: 'Kalori', value: `${Math.round(eaten.kcal)}`, note: `/ ${state.calorieTarget} kcal` },
              { label: '7 gün ort.', value: avg === null ? '—' : avg.toFixed(1).replace('.', ','), note: 'kg' },
              {
                label: 'Haftalık',
                value: trend.changeKg === null ? '—' : signed(trend.changeKg),
                note: 'kg / hafta',
              },
            ].map((c) => (
              <View key={c.label} style={styles.cockpitCell}>
                <Text style={font.labelSm}>{c.label}</Text>
                <Text style={[styles.cockpitValue, font.num]}>{c.value}</Text>
                <Text style={font.tiny}>{c.note}</Text>
              </View>
            ))}
          </Grid>
          <View style={styles.cockpitMacros}>{macros}</View>
          <View style={{ borderTopWidth: rules.strong, borderTopColor: colors.rule }}>
            {day.kind === 'workout' ? (
              <Button
                title="Antrenmana başla →"
                size="lg"
                onPress={() => {
                  if (!state.activeSession) state.startWorkout();
                  go('workout');
                }}
              />
            ) : (
              <Button title="Dinlenmeyi tamamla →" size="lg" onPress={state.advanceCycle} />
            )}
            <Button title="Öğünleri işaretle" variant="ghost" size="lg" onPress={() => go('nutrition')} style={{ borderWidth: 0, borderTopWidth: rules.strong }} />
          </View>
        </View>
      ) : (
        <>
          <Section strong={false} style={{ borderTopWidth: 0 }}>
            <Label>Sıradaki antrenman</Label>
            <Text style={styles.bigDay}>{day.name}</Text>
            <Text style={font.small}>{summary}</Text>
            <View style={styles.cycleLine}>
              <Text style={font.tiny}>
                Döngü{' '}
                {program.cycle
                  .map((id, i) => (i === state.cycleIndex ? `[${program.days[id].name}]` : program.days[id].name))
                  .join(' → ')}
              </Text>
            </View>
            {day.kind === 'workout' ? (
              <Button
                title="Antrenmana başla →"
                size="lg"
                onPress={() => {
                  if (!state.activeSession) state.startWorkout();
                  go('workout');
                }}
              />
            ) : (
              <Button title="Dinlenmeyi tamamla →" size="lg" onPress={state.advanceCycle} />
            )}
          </Section>

          <Section>
            <Label>Bugünün beslenmesi</Label>
            <Row style={{ alignItems: 'baseline' }} gap={6}>
              <Text style={[font.display, font.num]}>{Math.round(eaten.kcal).toLocaleString('tr-TR')}</Text>
              <Text style={styles.of}>/ {state.calorieTarget.toLocaleString('tr-TR')} kcal</Text>
            </Row>
            <View style={{ gap: spacing.md }}>{macros}</View>
            <Button title="Öğünleri işaretle" variant="ghost" onPress={() => go('nutrition')} />
          </Section>

          <Section>
            <Label>Kilo · 7 günlük ortalama</Label>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Row gap={8} style={{ alignItems: 'baseline' }}>
                  <Text style={[font.display, font.num]}>
                    {avg === null ? '—' : avg.toFixed(1).replace('.', ',')}
                  </Text>
                  <Text style={styles.trend}>
                    {trend.changeKg === null
                      ? 'trend bekleniyor'
                      : `${trend.changeKg >= 0 ? '↑' : '↓'} ${signed(trend.changeKg)} kg/hafta`}
                  </Text>
                </Row>
                <Text style={font.small}>
                  {lastEntry
                    ? `Son ölçüm ${lastEntry.weight.toFixed(1).replace('.', ',')} kg`
                    : 'Henüz ölçüm yok'}
                </Text>
              </View>
              <Sparkline values={sparkValues} width={130} height={48} />
            </Row>

            {weighedToday ? (
              <Text style={font.bodyStrong}>
                Bugünün kilosu girildi: {state.weights[today].toFixed(1).replace('.', ',')} kg
              </Text>
            ) : (
              <>
                <Text style={font.small}>Bugün kilonu girmedin — aç karnına, tuvaletten sonra.</Text>
                <Row gap={spacing.sm}>
                  <View style={{ flex: 1 }}>
                    <NumberStepper
                      value={weightDraft}
                      onChange={setWeightDraft}
                      step={0.1}
                      min={30}
                      max={250}
                      suffix="kg"
                      decimals={1}
                    />
                  </View>
                  <Button title="Kaydet" variant="ink" onPress={() => state.logWeight(today, weightDraft)} />
                </Row>
              </>
            )}
          </Section>

          {lastSession ? (
            <Section>
              <Label>Son antrenman</Label>
              <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={font.h3}>{dayById(lastSession.dayId)?.name}</Text>
                <Text style={[font.small, font.num]}>{lastSession.date}</Text>
              </Row>
              <Text style={[font.small, font.num]}>
                {sessionSetCount(lastSession)} set ·{' '}
                {Math.round(sessionVolume(lastSession)).toLocaleString('tr-TR')} kg hacim
              </Text>
            </Section>
          ) : null}

          <Section>
            <Label>Günü manuel seç</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Row gap={spacing.sm}>
                {program.cycle.map((id, i) => (
                  <Chip
                    key={`${id}-${i}`}
                    label={`${i + 1}. ${program.days[id].name}`}
                    active={state.cycleIndex === i}
                    onPress={() => state.setCycleIndex(i)}
                  />
                ))}
              </Row>
            </ScrollView>
          </Section>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bigDay: { fontFamily: fonts.black, fontSize: 44, letterSpacing: -1.4, color: colors.ink, lineHeight: 46 },
  cycleLine: { borderTopWidth: rules.light, borderTopColor: colors.ruleLight, paddingTop: 10 },
  of: { fontFamily: fonts.bold, fontSize: 17, color: colors.muted },
  trend: { fontFamily: fonts.bold, fontSize: 15, color: colors.accentInk },
  cockpit: { borderWidth: rules.strong, borderColor: colors.ink, marginTop: spacing.lg },
  cockpitHead: { backgroundColor: colors.accent, padding: spacing.xl },
  cockpitDay: {
    fontFamily: fonts.black,
    fontSize: 54,
    letterSpacing: -2,
    color: colors.onAccent,
    lineHeight: 56,
    marginTop: 6,
  },
  cockpitSummary: { fontFamily: fonts.medium, fontSize: 15, color: colors.onAccent, marginTop: 8 },
  cockpitCell: { backgroundColor: colors.bg, padding: spacing.md, flexGrow: 1, flexBasis: 140, gap: 2 },
  cockpitValue: { fontFamily: fonts.black, fontSize: 24, letterSpacing: -0.5, color: colors.ink },
  cockpitMacros: {
    borderTopWidth: rules.strong,
    borderTopColor: colors.rule,
    padding: spacing.md,
    gap: spacing.md,
  },
});
