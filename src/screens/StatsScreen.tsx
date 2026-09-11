import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdjustmentCard } from '../components/AdjustmentCard';
import { BarChart, LineChart } from '../components/charts';
import {
  Button,
  Chip,
  DataRow,
  Grid,
  Label,
  NumberStepper,
  Row,
  Screen,
  Section,
  StatTile,
} from '../components/ui';
import { EXERCISES, GROUP_NAMES } from '../data/program';
import { formatRelative, formatShort, todayKey } from '../logic/date';
import { eatenMacros } from '../logic/nutrition';
import { exerciseProgress, sessionVolume, weekStart, weeklyVolume } from '../logic/progression';
import { latestAverage, sortedWeights, weeklyTrend, weightSeries } from '../logic/weight';
import { useStore } from '../store/store';
import { CHART_GROUP_ORDER, chartGroup, colors, font, fonts, rules, spacing } from '../theme';
import { TabKey } from '../navigation';

const signed = (n: number, d = 2) =>
  `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(d).replace('.', ',')}`;

export const StatsScreen = ({ go }: { go: (tab: TabKey) => void }) => {
  const state = useStore();
  const today = todayKey();
  const completed = state.sessions.filter((s) => s.completedAt);
  const [weightDraft, setWeightDraft] = useState<number>(
    state.weights[today] ?? latestAverage(state.weights) ?? state.profile.startWeightKg
  );

  const loggedExerciseIds = useMemo(() => {
    const ids = new Set<string>();
    completed.forEach((s) =>
      s.exercises.forEach((e) => {
        if (e.sets.some((x) => x.reps > 0)) ids.add(e.exerciseId);
      })
    );
    return Array.from(ids);
  }, [state.sessions]);

  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const activeExercise = exerciseId ?? loggedExerciseIds[0] ?? null;
  const progress = useMemo(
    () => (activeExercise ? exerciseProgress(state.sessions, activeExercise) : []),
    [state.sessions, activeExercise]
  );

  const volumes = useMemo(() => weeklyVolume(state.sessions), [state.sessions]);
  const lastWeek = volumes[volumes.length - 1];
  const groupBars = useMemo(() => {
    if (!lastWeek) return [];
    const totals = new Map<string, number>();
    Object.entries(lastWeek.byGroup).forEach(([g, v]) => {
      const key = chartGroup(g);
      totals.set(key, (totals.get(key) ?? 0) + v);
    });
    return CHART_GROUP_ORDER.filter((g) => (totals.get(g) ?? 0) > 0).map((g) => ({
      label: GROUP_NAMES[g],
      value: totals.get(g) ?? 0,
    }));
  }, [lastWeek]);

  const weights = weightSeries(state.weights);
  const entries = sortedWeights(state.weights);
  const avg = latestAverage(state.weights);
  const trend = weeklyTrend(state.weights);
  const totalVolume = completed.reduce((sum, s) => sum + sessionVolume(s), 0);

  const nutritionWeeks = useMemo(() => {
    const map = new Map<string, { total: number; days: number; full: number }>();
    Object.values(state.dayLogs).forEach((log) => {
      const kcal = eatenMacros(log.meals, state.foods).kcal;
      if (kcal <= 0) return;
      const key = weekStart(log.date);
      const entry = map.get(key) ?? { total: 0, days: 0, full: 0 };
      entry.total += kcal;
      entry.days += 1;
      if (log.meals.length > 0 && log.meals.every((m) => m.eaten)) entry.full += 1;
      map.set(key, entry);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([week, v]) => ({ week, avg: v.total / v.days, days: v.days, full: v.full }));
  }, [state.dayLogs, state.foods]);

  const loggedDays = Object.values(state.dayLogs).filter((l) => l.meals.some((m) => m.eaten));
  const fullDays = loggedDays.filter((l) => l.meals.every((m) => m.eaten));
  const adherence = loggedDays.length > 0 ? (fullDays.length / loggedDays.length) * 100 : 0;
  const weighedToday = state.weights[today] !== undefined;

  return (
    <Screen kicker="İstatistik" title={`${completed.length} antrenman · ${entries.length} ölçüm`}>
      {state.pendingAdjustment ? <AdjustmentCard /> : null}

      <Section strong={false} style={{ borderTopWidth: 0 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }} gap={spacing.md}>
          <Text style={font.h3}>Kilo · günlük ve 7 günlük ortalama</Text>
        </Row>
        <Text style={[font.small, font.num]}>
          {state.profile.startWeightKg.toFixed(1).replace('.', ',')} →{' '}
          {entries.length ? entries[entries.length - 1].weight.toFixed(1).replace('.', ',') : '—'} kg · ort.{' '}
          {avg === null ? '—' : avg.toFixed(1).replace('.', ',')} kg
        </Text>
        <LineChart
          labels={weights.map((w) => formatShort(w.date))}
          unit="kg"
          decimals={1}
          height={200}
          series={[
            { name: 'Günlük', color: colors.faintInk, values: weights.map((w) => w.weight) },
            { name: '7 günlük ortalama', color: colors.accent, values: weights.map((w) => w.average) },
          ]}
        />
      </Section>

      <Section>
        <Text style={font.h3}>Sabah kilosu</Text>
        <Row gap={spacing.sm}>
          <View style={{ flex: 1 }}>
            <NumberStepper
              value={state.weights[today] ?? weightDraft}
              onChange={(v) => {
                setWeightDraft(v);
                if (weighedToday) state.logWeight(today, v);
              }}
              step={0.1}
              min={30}
              max={250}
              decimals={1}
              suffix="kg"
            />
          </View>
          <Button
            title={weighedToday ? 'Güncelle' : 'Kaydet'}
            variant="ink"
            onPress={() => state.logWeight(today, state.weights[today] ?? weightDraft)}
          />
        </Row>
        <Text style={font.small}>
          {weighedToday
            ? `Bugün girildi · ${state.weights[today].toFixed(1).replace('.', ',')} kg`
            : 'Bugün girilmedi — aç karnına, tuvaletten sonra ölç.'}
          {trend.changeKg !== null ? ` · haftalık ${signed(trend.changeKg)} kg` : ''}
        </Text>
        {entries.length > 0 ? (
          <View style={{ marginTop: spacing.sm }}>
            {entries
              .slice()
              .reverse()
              .slice(0, 10)
              .map((e) => (
                <DataRow
                  key={e.date}
                  label={formatRelative(e.date)}
                  value={`${e.weight.toFixed(1).replace('.', ',')} kg`}
                  strong
                />
              ))}
          </View>
        ) : null}
      </Section>

      <Section>
        <Text style={font.h3}>Haftalık hacim · kas grubu</Text>
        <Text style={font.small}>
          {lastWeek ? `${formatShort(lastWeek.week)} haftası` : 'Veri yok'} · hacim = set × tekrar × ağırlık
        </Text>
        <BarChart data={groupBars} formatValue={(v) => `${Math.round(v / 1000)}b`} height={170} />
      </Section>

      <Section>
        <Text style={font.h3}>Tah. 1RM · hareket</Text>
        {loggedExerciseIds.length === 0 ? (
          <Text style={font.small}>Antrenman kaydettikçe hareket grafikleri burada oluşur.</Text>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Row gap={spacing.sm}>
                {loggedExerciseIds.map((id) => (
                  <Chip
                    key={id}
                    label={EXERCISES[id]?.name ?? id}
                    active={activeExercise === id}
                    onPress={() => setExerciseId(id)}
                  />
                ))}
              </Row>
            </ScrollView>
            <LineChart
              labels={progress.map((p) => formatShort(p.date))}
              unit="kg"
              decimals={1}
              height={170}
              series={[
                { name: 'Ağırlık', color: colors.faintInk, values: progress.map((p) => p.weight) },
                { name: 'Tah. 1RM', color: colors.accent, values: progress.map((p) => p.e1rm) },
              ]}
            />
          </>
        )}
      </Section>

      <Section>
        <Text style={font.h3}>Kalori hedefi · zaman içinde</Text>
        <Text style={font.small}>Uygulamanın yaptığı ayarlar dahil</Text>
        <LineChart
          labels={state.targetHistory.map((t) => formatShort(t.date))}
          unit="kcal"
          decimals={0}
          height={150}
          series={[{ name: 'Hedef', color: colors.ink, values: state.targetHistory.map((t) => t.kcal), width: 2.5 }]}
        />
      </Section>

      {nutritionWeeks.length > 0 ? (
        <Section>
          <Text style={font.h3}>Haftalık ortalama kalori alımı</Text>
          <BarChart
            data={nutritionWeeks.slice(-8).map((w) => ({ label: formatShort(w.week), value: Math.round(w.avg) }))}
            height={150}
          />
        </Section>
      ) : null}

      <Section>
        <Grid>
          {[
            { label: 'Antrenman', value: String(completed.length), note: 'tamamlanan' },
            {
              label: 'Toplam hacim',
              value:
                totalVolume >= 10000
                  ? `${Math.round(totalVolume / 1000)}b`
                  : Math.round(totalVolume).toLocaleString('tr-TR'),
              note: 'kg',
            },
            {
              label: 'Öğün tutturma',
              value: loggedDays.length === 0 ? '—' : `%${Math.round(adherence)}`,
              note: `${fullDays.length}/${loggedDays.length} gün tam`,
            },
            { label: 'Kalori hedefi', value: String(state.calorieTarget), note: 'kcal / gün' },
          ].map((t) => (
            <StatTile key={t.label} label={t.label} value={t.value} sub={t.note} />
          ))}
        </Grid>
      </Section>

      <Section>
        <Text style={font.h3}>Ayarlar ve yedek</Text>
        <View>
          <DataRow label="Program" value={state.programId === 'kalca' ? 'Kalça ağırlıklı' : 'Hipertrofi PPL'} strong />
          <DataRow label="Dinlenme sayacı" value={`${state.settings.restSeconds} sn`} strong />
          <DataRow label="Günlük kalori hedefi" value={`${state.calorieTarget} kcal`} strong />
          <DataRow
            label="Protein tabanı"
            value={`${state.settings.proteinFloor} g · asla altına inmez`}
            strong
          />
          <DataRow label="Veri" value="Cihazda kalıcı · offline" strong />
        </View>
        <Button title="Ayarları aç →" variant="ghost" onPress={() => go('settings')} />
      </Section>
    </Screen>
  );
};

const styles = StyleSheet.create({
  placeholder: { fontFamily: fonts.regular, color: colors.muted },
});
