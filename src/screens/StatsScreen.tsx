import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { BarChart, LineChart, StackedBarChart } from '../components/charts';
import { Card, Chip, Row, Screen, SectionTitle, StatTile } from '../components/ui';
import { EXERCISES, GROUP_NAMES } from '../data/program';
import { formatShort } from '../logic/date';
import { eatenMacros } from '../logic/nutrition';
import {
  exerciseProgress,
  personalRecords,
  sessionVolume,
  trimNum,
  weekStart,
  weeklyVolume,
} from '../logic/progression';
import { latestAverage, weightSeries } from '../logic/weight';
import { useStore } from '../store/store';
import { CHART_GROUP_ORDER, chartGroup, colors, font, groupColors, series, spacing } from '../theme';

export const StatsScreen = () => {
  const state = useStore();
  const completed = state.sessions.filter((s) => s.completedAt);

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
  const recentVolumes = volumes.slice(-10);
  const usedGroups = useMemo(() => {
    const set = new Set<string>();
    volumes.forEach((v) => Object.keys(v.byGroup).forEach((g) => set.add(chartGroup(g))));
    return CHART_GROUP_ORDER.filter((g) => set.has(g));
  }, [volumes]);

  const prs = useMemo(() => personalRecords(state.sessions), [state.sessions]);

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

  const weights = weightSeries(state.weights);
  const totalVolume = completed.reduce((sum, s) => sum + sessionVolume(s), 0);

  return (
    <Screen title="İstatistikler">
      <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
        <StatTile label="ANTRENMAN" value={String(completed.length)} sub="tamamlanan" />
        <StatTile
          label="TOPLAM HACİM"
          value={
            totalVolume >= 10000
              ? `${Math.round(totalVolume / 1000)}b kg`
              : `${Math.round(totalVolume).toLocaleString('tr-TR')} kg`
          }
          sub="set × tekrar × kg"
        />
        <StatTile
          label="GÜNCEL KİLO"
          value={
            latestAverage(state.weights) === null
              ? '—'
              : `${(latestAverage(state.weights) as number).toFixed(1).replace('.', ',')} kg`
          }
          sub="7 gün ort."
        />
      </Row>

      <SectionTitle>Hareket ilerlemesi</SectionTitle>
      {loggedExerciseIds.length === 0 ? (
        <Card>
          <Text style={font.small}>
            Antrenman kaydettikçe her hareketin ağırlık ve tahmini 1RM grafiği burada oluşur.
          </Text>
        </Card>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row gap={spacing.sm}>
              {loggedExerciseIds.map((id) => (
                <Chip
                  key={id}
                  label={EXERCISES[id]?.name ?? id}
                  active={activeExercise === id}
                  color={groupColors[EXERCISES[id]?.group ?? 'sirt']}
                  onPress={() => setExerciseId(id)}
                />
              ))}
            </Row>
          </ScrollView>
          <Card>
            <Text style={font.h3}>{EXERCISES[activeExercise ?? '']?.name ?? '—'}</Text>
            <Text style={font.small}>
              En ağır work-set ve Epley tahmini 1RM (ağırlık × (1 + tekrar / 30)) — ikisi de kg.
            </Text>
            <LineChart
              labels={progress.map((p) => formatShort(p.date))}
              unit="kg"
              decimals={1}
              series={[
                { name: 'Ağırlık', color: series[0], values: progress.map((p) => p.weight) },
                { name: 'Tahmini 1RM', color: series[1], values: progress.map((p) => p.e1rm) },
              ]}
            />
          </Card>
        </>
      )}

      <SectionTitle>Haftalık hacim — kas grubu bazında</SectionTitle>
      <Card>
        <Text style={font.small}>
          Hafta başlangıcı pazartesi. Hacim = set × tekrar × ağırlık. Trapez, programındaki gibi
          sırt altında toplanır.
        </Text>
        <StackedBarChart
          data={recentVolumes.map((v) => ({
            label: formatShort(v.week),
            parts: usedGroups.map((g) => ({
              key: GROUP_NAMES[g],
              value: Object.entries(v.byGroup)
                .filter(([k]) => chartGroup(k) === g)
                .reduce((sum, [, val]) => sum + val, 0),
              color: groupColors[g],
            })),
          }))}
          legend={usedGroups.map((g) => ({ name: GROUP_NAMES[g], color: groupColors[g] }))}
          formatValue={(v) => `${Math.round(v).toLocaleString('tr-TR')} kg`}
        />
      </Card>

      <SectionTitle>Kişisel rekorlar</SectionTitle>
      {prs.length === 0 ? (
        <Card>
          <Text style={font.small}>Henüz rekor yok.</Text>
        </Card>
      ) : (
        <Card>
          {prs.map((pr) => (
            <View key={pr.exerciseId} style={{ paddingVertical: 8 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={6} style={{ flex: 1 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: groupColors[pr.group],
                    }}
                  />
                  <Text style={[font.body, { flex: 1 }]}>{pr.name}</Text>
                </Row>
                <Text style={[font.body, { fontWeight: '800' }]}>
                  {trimNum(pr.maxWeight)} kg × {pr.maxWeightReps}
                </Text>
              </Row>
              <Text style={font.tiny}>
                Tahmini 1RM {pr.bestE1RM.toFixed(1).replace('.', ',')} kg · {pr.bestE1RMDate}
              </Text>
            </View>
          ))}
        </Card>
      )}

      <SectionTitle>Beslenme</SectionTitle>
      <Row gap={spacing.sm}>
        <StatTile
          label="ÖĞÜN TUTTURMA"
          value={loggedDays.length === 0 ? '—' : `%${Math.round(adherence)}`}
          sub={`${fullDays.length}/${loggedDays.length} gün tam`}
          color={
            loggedDays.length === 0 ? undefined : adherence >= 80 ? colors.success : colors.warning
          }
        />
        <StatTile label="KALORİ HEDEFİ" value={`${state.calorieTarget}`} sub="kcal / gün" />
      </Row>

      <Card>
        <Text style={font.h3}>Haftalık ortalama kalori alımı</Text>
        <Text style={font.small}>Sadece öğün işaretlediğin günler sayılır.</Text>
        <BarChart
          data={nutritionWeeks.slice(-10).map((w) => ({
            label: formatShort(w.week),
            value: Math.round(w.avg),
          }))}
          unit="kcal"
        />
      </Card>

      <Card>
        <Text style={font.h3}>Kalori hedefinin değişimi</Text>
        <Text style={font.small}>Uygulamanın yaptığı otomatik ayarlamalar dahil.</Text>
        <LineChart
          labels={state.targetHistory.map((t) => formatShort(t.date))}
          unit="kcal"
          decimals={0}
          series={[
            {
              name: 'Hedef',
              color: series[3],
              values: state.targetHistory.map((t) => t.kcal),
            },
          ]}
        />
      </Card>

      {weights.length > 1 ? (
        <Card>
          <Text style={font.h3}>Kilo eğrisi</Text>
          <LineChart
            labels={weights.map((w) => formatShort(w.date))}
            unit="kg"
            decimals={1}
            series={[
              { name: 'Günlük', color: colors.textFaint, values: weights.map((w) => w.weight) },
              {
                name: '7 gün ortalama',
                color: series[0],
                values: weights.map((w) => w.average),
                dots: false,
              },
            ]}
          />
        </Card>
      ) : null}
      <View style={{ height: 8 }} />
    </Screen>
  );
};
