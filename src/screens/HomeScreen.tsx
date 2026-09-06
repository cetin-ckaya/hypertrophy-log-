import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AdjustmentCard } from '../components/AdjustmentCard';
import {
  Button,
  Card,
  Chip,
  MacroBar,
  ProgressBar,
  Row,
  Screen,
  SectionTitle,
  StatTile,
  NumberStepper,
} from '../components/ui';
import { CYCLE, DAYS, cycleDay } from '../data/program';
import { formatLong, todayKey } from '../logic/date';
import { eatenMacros } from '../logic/nutrition';
import { sessionSetCount, sessionVolume, trimNum } from '../logic/progression';
import { latestAverage, trendArrow, weeklyTrend } from '../logic/weight';
import { dayLogFor, useStore } from '../store/store';
import { colors, font, series, spacing } from '../theme';
import { TabKey } from '../navigation';

export const HomeScreen = ({ go }: { go: (tab: TabKey) => void }) => {
  const state = useStore();
  const today = todayKey();
  const day = cycleDay(state.cycleIndex);
  const [weightDraft, setWeightDraft] = useState<number>(
    state.weights[today] ?? latestAverage(state.weights) ?? state.profile.startWeightKg
  );

  useEffect(() => {
    state.checkAdjustment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.weights, state.settings.autoAdjustEnabled]);

  const log = useMemo(() => dayLogFor(state, today), [state.dayLogs, state.plan, state.cycleIndex, today]);
  const eaten = eatenMacros(log.meals, state.foods);
  const trend = weeklyTrend(state.weights);
  const avg = latestAverage(state.weights);
  const weighedToday = state.weights[today] !== undefined;
  const lastSession = state.sessions[state.sessions.length - 1];

  return (
    <Screen
      title="Hipertrofi"
      right={
        <Pressable onPress={() => go('settings')} hitSlop={12} style={{ padding: 6 }}>
          <Text style={{ color: colors.textDim, fontSize: 22 }}>⚙</Text>
        </Pressable>
      }
    >
      <Text style={[font.small, { marginTop: 0 }]}>{formatLong(today)}</Text>

      {state.pendingAdjustment ? <AdjustmentCard /> : null}

      {state.activeSession ? (
        <Card tone="primary">
          <Text style={font.h3}>Devam eden antrenman: {DAYS[state.activeSession.dayId]?.name}</Text>
          <Text style={font.small}>Kaldığın yerden devam edebilirsin.</Text>
          <Button title="Antrenmana dön" onPress={() => go('workout')} size="lg" />
        </Card>
      ) : null}

      <Card>
        <Text style={font.tiny}>BUGÜNÜN GÜNÜ</Text>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={[font.h1, { color: day.kind === 'rest' ? colors.textDim : colors.text }]}>
            {day.name}
          </Text>
          <Text style={font.small}>
            Döngü {state.cycleIndex + 1}/{CYCLE.length}
          </Text>
        </Row>
        {day.kind === 'workout' ? (
          <>
            <Text style={font.small}>{day.exercises.length} hareket planlandı</Text>
            <Button
              title={state.activeSession ? 'Antrenmana dön' : 'Antrenmana başla'}
              size="lg"
              onPress={() => {
                if (!state.activeSession) state.startWorkout();
                go('workout');
              }}
            />
          </>
        ) : (
          <>
            <Text style={font.small}>
              Bugün dinlenme günü. Beslenmede pirinç gramajı otomatik düşürüldü.
            </Text>
            <Button
              title="Dinlenme gününü tamamla → sıradaki güne geç"
              variant="ghost"
              onPress={state.advanceCycle}
            />
          </>
        )}

        <SectionTitle>Günü manuel seç</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row gap={spacing.sm}>
            {CYCLE.map((id, i) => (
              <Chip
                key={`${id}-${i}`}
                label={`${i + 1}. ${DAYS[id].name}`}
                active={state.cycleIndex === i}
                onPress={() => state.setCycleIndex(i)}
              />
            ))}
          </Row>
        </ScrollView>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={font.h3}>Bugünün beslenmesi</Text>
          <Pressable onPress={() => go('nutrition')}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Detay ›</Text>
          </Pressable>
        </Row>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Text style={font.h1}>{Math.round(eaten.kcal)}</Text>
          <Text style={font.small}>/ {state.calorieTarget} kcal</Text>
        </Row>
        <ProgressBar value={eaten.kcal} target={state.calorieTarget} height={10} />
        <Row gap={spacing.md} style={{ marginTop: spacing.sm }}>
          <MacroBar label="Protein" value={eaten.protein} target={state.macroTargets.protein} color={series[2]} />
          <MacroBar label="Karb" value={eaten.carbs} target={state.macroTargets.carbs} color={series[6]} />
          <MacroBar label="Yağ" value={eaten.fat} target={state.macroTargets.fat} color={series[3]} />
        </Row>
        <Text style={font.tiny}>
          {log.meals.filter((m) => m.eaten).length}/{log.meals.length} öğün işaretlendi ·{' '}
          {log.isTraining ? 'antrenman günü' : 'dinlenme günü'}
        </Text>
      </Card>

      <Card tone={weighedToday ? undefined : 'warning'}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={font.h3}>Sabah kilosu</Text>
          <Text style={font.tiny}>{weighedToday ? 'Bugün girildi ✓' : 'Bugün girilmedi'}</Text>
        </Row>
        <NumberStepper
          value={weightDraft}
          onChange={setWeightDraft}
          step={0.1}
          min={30}
          max={250}
          suffix="kg"
          decimals={1}
        />
        <Button
          title={weighedToday ? 'Kiloyu güncelle' : 'Kiloyu kaydet'}
          onPress={() => state.logWeight(today, weightDraft)}
        />
        <Row gap={spacing.sm} style={{ marginTop: spacing.xs }}>
          <StatTile
            label="7 GÜN ORTALAMA"
            value={avg === null ? '—' : `${avg.toFixed(1).replace('.', ',')} kg`}
            sub={`${trendArrow(trend.changeKg)} ${
              trend.changeKg === null
                ? 'trend için veri topluyor'
                : `${trend.changeKg >= 0 ? '+' : '−'}${Math.abs(trend.changeKg)
                    .toFixed(2)
                    .replace('.', ',')} kg/hafta`
            }`}
          />
          <StatTile
            label="BAŞLANGIÇTAN"
            value={
              avg === null
                ? '—'
                : `${avg - state.profile.startWeightKg >= 0 ? '+' : '−'}${Math.abs(
                    avg - state.profile.startWeightKg
                  )
                    .toFixed(1)
                    .replace('.', ',')} kg`
            }
            sub={`${trimNum(state.profile.startWeightKg)} kg → bugün`}
          />
        </Row>
      </Card>

      {lastSession ? (
        <Card>
          <Text style={font.h3}>Son antrenman</Text>
          <Text style={font.small}>
            {DAYS[lastSession.dayId]?.name} · {lastSession.date}
          </Text>
          <Row gap={spacing.sm}>
            <StatTile label="SET" value={String(sessionSetCount(lastSession))} />
            <StatTile
              label="HACİM"
              value={`${Math.round(sessionVolume(lastSession)).toLocaleString('tr-TR')} kg`}
            />
          </Row>
        </Card>
      ) : null}
    </Screen>
  );
};
