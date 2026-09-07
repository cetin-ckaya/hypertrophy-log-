import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RestTimer } from '../components/RestTimer';
import {
  AlertIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  MinusIcon,
  PlusIcon,
} from '../components/icons';
import {
  Button,
  Card,
  Chip,
  Label,
  NumberStepper,
  Row,
  Screen,
  SectionTitle,
} from '../components/ui';
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
  /** Kullanıcının elle açıp kapattığı hareketler; biten hareketler kendiliğinden kapanır. */
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const startRest = () => {
    setRestDuration(state.settings.restSeconds);
    setRestEndsAt(Date.now() + state.settings.restSeconds * 1000);
  };

  if (!active) {
    const day = cycleDay(state.cycleIndex);
    return (
      <Screen title="Antrenman" subtitle={`Sıradaki gün · ${day.name}`}>
        <Card>
          <Label>Sıradaki gün</Label>
          <Text style={styles.bigDay}>{day.name}</Text>
          {day.kind === 'workout' ? (
            <Button title="Antrenmana başla" size="lg" onPress={() => state.startWorkout()} />
          ) : (
            <>
              <Text style={font.small}>
                Bugün dinlenme günü. Yine de çalışacaksan aşağıdan bir gün seç.
              </Text>
              <Button
                title="Dinlenmeyi tamamla → sıradaki gün"
                variant="soft"
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
                <Text style={[font.small, font.num]}>
                  {sessionSetCount(s)} set · {Math.round(sessionVolume(s)).toLocaleString('tr-TR')} kg
                </Text>
                {s.exercises
                  .filter((e) => loggedSets(e).length > 0)
                  .map((e) => (
                    <Text key={e.exerciseId} style={[font.tiny, font.num]}>
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
  const doneSets = active.exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.done).length, 0);
  const totalSets = active.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const pct = totalSets > 0 ? doneSets / totalSets : 0;

  return (
    <Screen
      title={day?.name ?? 'Antrenman'}
      subtitle={`${doneSets}/${totalSets} set · ${Math.round(sessionVolume(active)).toLocaleString('tr-TR')} kg hacim`}
      left={
        <Pressable onPress={() => go('home')} hitSlop={10}>
          <ChevronLeftIcon size={20} color={colors.textDim} />
        </Pressable>
      }
      right={<Text style={[styles.pct, font.num]}>%{Math.round(pct * 100)}</Text>}
      scroll={false}
    >
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${Math.max(2, pct * 100)}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {active.exercises.map((ex, exIndex) => {
          const meta = EXERCISES[ex.exerciseId];
          const rail = groupColors[meta?.group ?? 'sirt'];
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
          const open = expanded[exIndex] ?? !allDone;
          const good = suggestion.kind === 'increase' || suggestion.kind === 'rep_progress';
          const warn = suggestion.kind === 'stall';
          const tipColor = good ? colors.success : warn ? colors.warning : colors.textDim;

          return (
            <View
              key={`${ex.exerciseId}-${exIndex}`}
              style={[styles.exercise, allDone ? { opacity: 0.45 } : null]}
            >
              <View style={[styles.rail, { backgroundColor: rail }]} />

              <Pressable onPress={() => setExpanded((c) => ({ ...c, [exIndex]: !open }))}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.group, { color: rail }]}>
                      {planned?.section ?? GROUP_NAMES[meta?.group ?? 'sirt']}
                    </Text>
                    <Text style={styles.name}>{meta?.name ?? ex.exerciseId}</Text>
                    <Text style={[font.small, font.num]}>
                      {open
                        ? `${ex.sets.length} work-set × ${ex.repMin === ex.repMax ? ex.repMin : `${ex.repMin}–${ex.repMax}`} tekrar`
                        : formatSets(ex.sets) ||
                          `${ex.sets.length} work-set × ${ex.repMin}–${ex.repMax} tekrar`}
                    </Text>
                  </View>
                  {allDone ? (
                    <View style={styles.doneBadge}>
                      <CheckIcon size={16} color={colors.success} />
                    </View>
                  ) : null}
                </Row>
              </Pressable>

              {!open ? null : (
              <>
              <View style={styles.prev}>
                <Text style={font.label}>
                  {previous
                    ? `Geçen sefer · ${formatRelative(previous.session.date)}${previous.sameDay ? '' : ' · farklı gün'}`
                    : 'Geçen sefer'}
                </Text>
                <Text style={[styles.prevValue, font.num]}>
                  {previous ? formatSets(previous.exercise.sets) : 'Kayıt yok'}
                </Text>
              </View>

              <View style={[styles.tip, { backgroundColor: `${tipColor}1A` }]}>
                {good ? (
                  <ArrowUpIcon size={15} color={tipColor} />
                ) : warn ? (
                  <AlertIcon size={15} color={tipColor} />
                ) : (
                  <ClockIcon size={15} color={tipColor} />
                )}
                <Text style={[styles.tipText, { color: tipColor }]}>{suggestion.text}</Text>
              </View>

              <Row gap={spacing.sm} style={{ marginTop: spacing.md }}>
                <View style={{ width: 22 }} />
                <Text style={[font.label, { flex: 1.3 }]}>Ağırlık (kg)</Text>
                <Text style={[font.label, { flex: 1 }]}>Tekrar</Text>
                <View style={{ width: 48 }} />
              </Row>

              {ex.sets.map((set, setIndex) => (
                <Row key={setIndex} gap={spacing.sm} style={{ marginTop: spacing.sm }}>
                  <View style={styles.setNo}>
                    <Text style={[styles.setNoText, font.num]}>{setIndex + 1}</Text>
                  </View>
                  <View style={{ flex: 1.3 }}>
                    <NumberStepper
                      value={set.weight}
                      onChange={(v) => state.updateSet(exIndex, setIndex, { weight: v })}
                      step={increment(ex.exerciseId, state.settings)}
                      max={500}
                      compact
                    />
                  </View>
                  <View style={{ flex: 1 }}>
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
                    style={[styles.check, set.done ? styles.checkOn : null]}
                  >
                    <CheckIcon size={19} color={set.done ? colors.successInk : '#333A48'} />
                  </Pressable>
                </Row>
              ))}

              <Row gap={spacing.sm} style={{ marginTop: spacing.md }}>
                <Pressable style={styles.miniBtn} onPress={() => state.addSet(exIndex)}>
                  <PlusIcon size={14} color={colors.textDim} />
                  <Text style={styles.miniText}>Set</Text>
                </Pressable>
                <Pressable style={styles.miniBtn} onPress={() => state.removeSet(exIndex)}>
                  <MinusIcon size={14} color={colors.textDim} />
                  <Text style={styles.miniText}>Set</Text>
                </Pressable>
                <Pressable style={[styles.miniBtn, { flex: 1.4 }]} onPress={startRest}>
                  <ClockIcon size={14} color={colors.textDim} />
                  <Text style={styles.miniText}>Dinlen</Text>
                </Pressable>
              </Row>
              </>
              )}
            </View>
          );
        })}

        <Button
          title="Antrenmanı tamamla"
          size="lg"
          variant="success"
          icon={<CheckIcon size={18} color={colors.successInk} />}
          onPress={() =>
            confirm('Antrenmanı tamamla', 'Kayıt edilip döngü bir sonraki güne geçecek.', () => {
              state.completeWorkout();
              setRestEndsAt(null);
              go('home');
            })
          }
        />
        <Button
          title="Antrenmanı iptal et"
          variant="soft"
          onPress={() =>
            confirm('Antrenmanı iptal et', 'Girdiğin setler silinecek.', () => {
              state.discardWorkout();
              setRestEndsAt(null);
            })
          }
        />
      </ScrollView>

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
    </Screen>
  );
};

const styles = StyleSheet.create({
  bigDay: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  pct: { fontSize: 18, fontWeight: '800', color: colors.text },
  track: {
    height: 4,
    backgroundColor: '#1A1E27',
    marginHorizontal: spacing.lg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  list: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  exercise: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingLeft: spacing.lg + 4,
    overflow: 'hidden',
  },
  rail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  group: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  name: { fontSize: 19, fontWeight: '700', color: colors.text, letterSpacing: -0.4, marginTop: 4 },
  doneBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(163,230,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prev: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: 5,
  },
  prevValue: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  tip: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    borderRadius: radius.sm,
    padding: spacing.md - 2,
    marginTop: spacing.md - 2,
  },
  tipText: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 17 },
  setNo: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#242936',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNoText: { fontSize: 11, fontWeight: '800', color: colors.textFaint },
  check: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.success, borderColor: colors.success },
  miniBtn: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  miniText: { fontSize: 12.5, fontWeight: '700', color: colors.textDim },
});
