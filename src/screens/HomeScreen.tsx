import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AdjustmentCard } from '../components/AdjustmentCard';
import { ChevronRightIcon, DumbbellIcon, GearIcon } from '../components/icons';
import {
  Badge,
  Button,
  Card,
  Chip,
  HeroCard,
  IconButton,
  Label,
  MacroTile,
  Ring,
  Row,
  Screen,
  SectionTitle,
  Sparkline,
  NumberStepper,
} from '../components/ui';
import { CYCLE, DAYS, cycleDay } from '../data/program';
import { formatLong, todayKey } from '../logic/date';
import { eatenMacros } from '../logic/nutrition';
import { sessionSetCount, sessionVolume } from '../logic/progression';
import { latestAverage, sortedWeights, weeklyTrend } from '../logic/weight';
import { dayLogFor, useStore } from '../store/store';
import { colors, font, macroColors, spacing } from '../theme';
import { TabKey } from '../navigation';

const signed = (n: number, digits = 2) =>
  `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits).replace('.', ',')}`;

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

  const log = useMemo(
    () => dayLogFor(state, today),
    [state.dayLogs, state.plan, state.cycleIndex, today]
  );
  const eaten = eatenMacros(log.meals, state.foods);
  const trend = weeklyTrend(state.weights);
  const avg = latestAverage(state.weights);
  const weighedToday = state.weights[today] !== undefined;
  const lastSession = state.sessions[state.sessions.length - 1];
  const eatenCount = log.meals.filter((m) => m.eaten).length;
  const remaining = Math.max(0, state.calorieTarget - eaten.kcal);
  const nextMeal = log.meals.find((m) => !m.eaten);
  const sparkValues = useMemo(
    () => sortedWeights(state.weights).slice(-21).map((w) => w.weight),
    [state.weights]
  );

  const inRange = trend.changeKg !== null && trend.changeKg >= 0.25 && trend.changeKg <= 0.5;

  return (
    <Screen
      title="Hipertrofi"
      subtitle={formatLong(today)}
      right={
        <IconButton onPress={() => go('settings')}>
          <GearIcon size={18} color={colors.textDim} />
        </IconButton>
      }
    >
      {state.pendingAdjustment ? <AdjustmentCard /> : null}

      {state.activeSession ? (
        <Card tone="primary">
          <Label>Devam eden antrenman</Label>
          <Text style={font.h2}>{DAYS[state.activeSession.dayId]?.name}</Text>
          <Button title="Antrenmana dön" onPress={() => go('workout')} size="lg" />
        </Card>
      ) : null}

      <HeroCard>
        <Text style={[font.label, { color: 'rgba(255,255,255,0.72)' }]}>Bugünün günü</Text>
        <Text style={styles.heroTitle}>{day.name}</Text>
        <Text style={styles.heroSub}>
          {day.kind === 'workout'
            ? `${day.exercises.length} hareket · ${day.exercises.reduce((s, e) => s + e.sets, 0)} work-set · Döngü ${state.cycleIndex + 1}/${CYCLE.length}`
            : `Toparlanma günü · Döngü ${state.cycleIndex + 1}/${CYCLE.length}`}
        </Text>
        <Row gap={5} style={{ marginTop: spacing.lg }}>
          {CYCLE.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === state.cycleIndex ? styles.dotOn : null]}
            />
          ))}
        </Row>
        {day.kind === 'workout' ? (
          <Button
            title={state.activeSession ? 'Antrenmana dön' : 'Antrenmana başla'}
            variant="light"
            size="lg"
            style={{ marginTop: spacing.lg }}
            icon={<DumbbellIcon size={19} color="#112233" strokeWidth={2.2} />}
            onPress={() => {
              if (!state.activeSession) state.startWorkout();
              go('workout');
            }}
          />
        ) : (
          <Button
            title="Dinlenmeyi tamamla → sıradaki gün"
            variant="light"
            size="lg"
            style={{ marginTop: spacing.lg }}
            onPress={state.advanceCycle}
          />
        )}
      </HeroCard>

      <Card>
        <Pressable onPress={() => go('nutrition')}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Label>Bugünün beslenmesi</Label>
            <Row gap={3}>
              <Text style={styles.link}>
                {eatenCount}/{log.meals.length} öğün
              </Text>
              <ChevronRightIcon size={13} color={colors.textDim} />
            </Row>
          </Row>
        </Pressable>

        <Row gap={spacing.lg} style={{ marginTop: spacing.md }}>
          <Ring progress={state.calorieTarget > 0 ? eaten.kcal / state.calorieTarget : 0} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.kcal, font.num]}>
              {Math.round(eaten.kcal).toLocaleString('tr-TR')}
              <Text style={styles.kcalOf}> / {state.calorieTarget.toLocaleString('tr-TR')} kcal</Text>
            </Text>
            <Text style={[font.small, { marginTop: 8, lineHeight: 18 }]}>
              {Math.round(remaining).toLocaleString('tr-TR')} kcal kaldı
              {nextMeal ? `\n${nextMeal.name} bekliyor` : '\nTüm öğünler tamam ✓'}
            </Text>
          </View>
        </Row>

        <Row gap={spacing.sm} style={{ marginTop: spacing.md }}>
          <MacroTile
            label="Protein"
            value={eaten.protein}
            target={state.macroTargets.protein}
            color={macroColors.protein}
          />
          <MacroTile
            label="Karb"
            value={eaten.carbs}
            target={state.macroTargets.carbs}
            color={macroColors.carbs}
          />
          <MacroTile
            label="Yağ"
            value={eaten.fat}
            target={state.macroTargets.fat}
            color={macroColors.fat}
          />
        </Row>
      </Card>

      <Card tone={weighedToday ? undefined : 'warning'}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>Kilo · 7 gün ortalama</Label>
          {trend.changeKg === null ? (
            <Text style={font.tiny}>{weighedToday ? 'Bugün girildi ✓' : 'Bugün girilmedi'}</Text>
          ) : (
            <Badge
              label={inRange ? 'HEDEF ARALIKTA' : trend.changeKg < 0.25 ? 'HEDEFİN ALTINDA' : 'HEDEFİN ÜSTÜNDE'}
              color={inRange ? colors.success : colors.warning}
            />
          )}
        </Row>

        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={[styles.kcal, font.num, { fontSize: 34 }]}>
              {avg === null ? '—' : avg.toFixed(1).replace('.', ',')}
              <Text style={[styles.kcalOf, { fontSize: 15 }]}> kg</Text>
            </Text>
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: '700',
                marginTop: 6,
                color:
                  trend.changeKg === null
                    ? colors.textDim
                    : inRange
                    ? colors.success
                    : colors.warning,
              }}
            >
              {trend.changeKg === null
                ? 'Trend için veri topluyor'
                : `${trend.changeKg >= 0 ? '▲' : '▼'} ${signed(trend.changeKg)} kg / hafta`}
            </Text>
          </View>
          <Sparkline values={sparkValues} width={140} height={50} />
        </Row>

        {!weighedToday ? (
          <>
            <NumberStepper
              value={weightDraft}
              onChange={setWeightDraft}
              step={0.1}
              min={30}
              max={250}
              suffix="kg"
              decimals={1}
            />
            <Button title="Sabah kilosunu kaydet" onPress={() => state.logWeight(today, weightDraft)} />
          </>
        ) : null}
      </Card>

      {lastSession ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Label>Son antrenman</Label>
            <Text style={font.tiny}>{lastSession.date}</Text>
          </Row>
          <Text style={font.h3}>{DAYS[lastSession.dayId]?.name}</Text>
          <Row gap={spacing.md}>
            <Text style={[font.small, font.num]}>{sessionSetCount(lastSession)} set</Text>
            <Text style={[font.small, font.num]}>
              {Math.round(sessionVolume(lastSession)).toLocaleString('tr-TR')} kg hacim
            </Text>
          </Row>
        </Card>
      ) : null}

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
    </Screen>
  );
};

const styles = {
  heroTitle: { fontSize: 38, fontWeight: '800' as const, color: '#fff', letterSpacing: -1.3, marginTop: 5 },
  heroSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.86)', marginTop: 5, fontWeight: '500' as const },
  dot: { height: 5, flex: 1, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotOn: { backgroundColor: '#fff' },
  link: { fontSize: 11.5, fontWeight: '700' as const, color: colors.textDim },
  kcal: { fontSize: 32, fontWeight: '800' as const, color: colors.text, letterSpacing: -1.1 },
  kcalOf: { fontSize: 13, color: colors.textDim, fontWeight: '600' as const, letterSpacing: 0 },
};
