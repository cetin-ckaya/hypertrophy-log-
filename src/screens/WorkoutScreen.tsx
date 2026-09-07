import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RestTimer } from '../components/RestTimer';
import { Button, Card, Chip, NumberStepper, Row, Screen, SectionTitle } from '../components/ui';
import { DAYS, EXERCISES, GROUP_NAMES, cycleDay } from '../data/program';
import { formatRelative } from '../logic/date';
import {
  buildSuggestion,
  formatSets,
  increment,
  lastPerformance,
  loggedSets,
  sessionSetCount,
  sessionVolume,
  trimNum,
} from '../logic/progression';
import { useStore } from '../store/store';
import { colors, font, groupColors, radius, spacing } from '../theme';
import { TabKey } from '../navigation';

const confirm = (title: string, message: string, onOk: () => void) => {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Tamam', onPress: onOk },
  ]);
};

export const WorkoutScreen = ({ go }: { go: (tab: TabKey) => void }) => {
  const state = useStore();
  const active = state.activeSession;
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restDuration, setRestDuration] = useState(state.settings.restSeconds);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const startRest = () => {
    setRestDuration(state.settings.restSeconds);
    setRestEndsAt(Date.now() + state.settings.restSeconds * 1000);
  };

  if (!active) {
    const day = cycleDay(state.cycleIndex);
    return (
      <Screen title="Antrenman">
        <Card>
          <Text style={font.tiny}>SIRADAKİ GÜN</Text>
          <Text style={font.h1}>{day.name}</Text>
          {day.kind === 'workout' ? (
            <Button title="Antrenmana başla" size="lg" onPress={() => state.startWorkout()} />
          ) : (
            <>
              <Text style={font.small}>
                Bugün dinlenme günü. Yine de antrenman yapacaksan aşağıdan bir gün seç.
              </Text>
              <Button
                title="Dinlenmeyi tamamla → sıradaki gün"
                variant="ghost"
                onPress={state.advanceCycle}
              />
            </>
          )}
        </Card>

        <SectionTitle>Başka bir gün çalış</SectionTitle>
        <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
          {['pull1', 'push1', 'legs', 'pull2', 'push2'].map((id) => (
            <Chip key={id} label={DAYS[id].name} onPress={() => state.startWorkout(id)} />
          ))}
        </Row>

        <SectionTitle>Geçmiş antrenmanlar</SectionTitle>
        {state.sessions.length === 0 ? (
          <Card>
            <Text style={font.small}>Henüz kayıtlı antrenman yok.</Text>
          </Card>
        ) : (
          state.sessions
            .slice()
            .reverse()
            .slice(0, 15)
            .map((s) => (
              <Card key={s.id}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={font.h3}>{DAYS[s.dayId]?.name ?? s.dayId}</Text>
                  <Text style={font.tiny}>{formatRelative(s.date)}</Text>
                </Row>
                <Text style={font.small}>
                  {sessionSetCount(s)} set · {Math.round(sessionVolume(s)).toLocaleString('tr-TR')} kg hacim
                </Text>
                {s.exercises
                  .filter((e) => loggedSets(e).length > 0)
                  .map((e) => (
                    <Text key={e.exerciseId} style={font.tiny}>
                      {EXERCISES[e.exerciseId]?.name ?? e.exerciseId}: {formatSets(e.sets)}
                    </Text>
                  ))}
              </Card>
            ))
        )}
      </Screen>
    );
  }

  const day = DAYS[active.dayId];
  const doneSets = active.exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.done).length,
    0
  );
  const totalSets = active.exercises.reduce((sum, e) => sum + e.sets.length, 0);

  return (
    <Screen title={day?.name ?? 'Antrenman'} scroll={false}>
      <View style={styles.progressStrip}>
        <Text style={font.small}>
          {doneSets}/{totalSets} set tamamlandı · {Math.round(sessionVolume(active)).toLocaleString('tr-TR')} kg
        </Text>
      </View>

      {restEndsAt !== null ? (
        <RestTimer
          endsAt={restEndsAt}
          duration={restDuration}
          onStop={() => setRestEndsAt(null)}
          onExtend={(sec) => {
            setRestDuration((d) => Math.max(15, d + sec));
            setRestEndsAt((e) => (e === null ? null : e + sec * 1000));
          }}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, paddingBottom: 48, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {active.exercises.map((ex, exIndex) => {
          const meta = EXERCISES[ex.exerciseId];
          const previous = lastPerformance(state.sessions, ex.exerciseId, active.dayId);
          const suggestion = buildSuggestion(
            state.sessions,
            ex.exerciseId,
            active.dayId,
            ex.repMax,
            state.settings
          );
          const planned = day?.exercises.find((p) => p.exerciseId === ex.exerciseId);
          const allDone = ex.sets.every((s) => s.done);
          const isCollapsed = collapsed[exIndex] ?? false;
          const sugColor =
            suggestion.kind === 'increase' || suggestion.kind === 'rep_progress'
              ? colors.success
              : suggestion.kind === 'stall'
              ? colors.warning
              : colors.textDim;

          return (
            <Card key={`${ex.exerciseId}-${exIndex}`} style={allDone ? { opacity: 0.72 } : undefined}>
              <Pressable onPress={() => setCollapsed((c) => ({ ...c, [exIndex]: !isCollapsed }))}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Row gap={6}>
                      <View
                        style={[
                          styles.groupDot,
                          { backgroundColor: groupColors[meta?.group ?? 'sirt'] },
                        ]}
                      />
                      <Text style={font.tiny}>
                        {planned?.section ?? GROUP_NAMES[meta?.group ?? 'sirt']}
                      </Text>
                    </Row>
                    <Text style={font.h3}>
                      {exIndex + 1}. {meta?.name ?? ex.exerciseId}
                    </Text>
                    <Text style={font.small}>
                      {ex.sets.length} work-set × {ex.repMin === ex.repMax ? ex.repMin : `${ex.repMin}–${ex.repMax}`} tekrar
                    </Text>
                  </View>
                  <Text style={[font.small, { color: colors.textFaint }]}>
                    {allDone ? '✓' : isCollapsed ? '▾' : '▴'}
                  </Text>
                </Row>
              </Pressable>

              <View style={styles.prevBox}>
                <Text style={font.tiny}>
                  {previous
                    ? `GEÇEN SEFER (${formatRelative(previous.session.date)}${
                        previous.sameDay ? '' : ' · farklı gün'
                      })`
                    : 'GEÇEN SEFER'}
                </Text>
                <Text style={[font.body, { fontWeight: '700' }]}>
                  {previous ? formatSets(previous.exercise.sets) : 'Kayıt yok'}
                </Text>
                <Text style={[font.small, { color: sugColor }]}>{suggestion.text}</Text>
              </View>

              {!isCollapsed ? (
                <>
                  {ex.sets.map((set, setIndex) => (
                    <Row key={setIndex} gap={spacing.sm} style={styles.setRow}>
                      <Text style={styles.setNo}>{setIndex + 1}</Text>
                      <View style={{ flex: 1.35 }}>
                        <NumberStepper
                          value={set.weight}
                          onChange={(v) => state.updateSet(exIndex, setIndex, { weight: v })}
                          step={increment(ex.exerciseId, state.settings)}
                          max={500}
                          suffix="kg"
                          compact
                        />
                      </View>
                      <View style={{ flex: 0.95 }}>
                        <NumberStepper
                          value={set.reps}
                          onChange={(v) => state.updateSet(exIndex, setIndex, { reps: Math.round(v) })}
                          step={1}
                          max={100}
                          decimals={0}
                          compact
                        />
                      </View>
                      <Pressable
                        onPress={() => {
                          state.toggleSetDone(exIndex, setIndex);
                          if (!set.done) startRest();
                        }}
                        style={[
                          styles.check,
                          set.done ? { backgroundColor: colors.success, borderColor: colors.success } : null,
                        ]}
                      >
                        <Text style={{ color: set.done ? '#fff' : colors.textFaint, fontSize: 20 }}>✓</Text>
                      </Pressable>
                    </Row>
                  ))}
                  <Row gap={spacing.sm}>
                    <Button
                      title="+ Set"
                      variant="ghost"
                      size="sm"
                      onPress={() => state.addSet(exIndex)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="− Set"
                      variant="ghost"
                      size="sm"
                      onPress={() => state.removeSet(exIndex)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Dinlen"
                      variant="ghost"
                      size="sm"
                      onPress={startRest}
                      style={{ flex: 1 }}
                    />
                  </Row>
                </>
              ) : null}
            </Card>
          );
        })}

        <Button
          title="Antrenmanı tamamla"
          size="lg"
          variant="success"
          onPress={() =>
            confirm(
              'Antrenmanı tamamla',
              'Kayıt edilip döngü bir sonraki güne geçecek.',
              () => {
                state.completeWorkout();
                setRestEndsAt(null);
                go('home');
              }
            )
          }
        />
        <Button
          title="Antrenmanı iptal et"
          variant="ghost"
          onPress={() =>
            confirm('Antrenmanı iptal et', 'Girdiğin setler silinecek.', () => {
              state.discardWorkout();
              setRestEndsAt(null);
            })
          }
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  progressStrip: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  prevBox: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  setRow: { marginTop: spacing.xs },
  setNo: {
    width: 20,
    textAlign: 'center',
    color: colors.textFaint,
    fontWeight: '700',
    fontSize: 13,
  },
  check: {
    width: 46,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
