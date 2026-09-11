import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RestBar } from '../components/RestTimer';
import { CheckIcon, ChevronLeftIcon } from '../components/icons';
import {
  Button,
  Chip,
  Label,
  NumberStepper,
  Row,
  Screen,
  Section,
  Segmented,
  Tag,
} from '../components/ui';
import { EXERCISES, GROUP_NAMES, cycleDayOf, dayById, getProgram } from '../data/program';
import { formatRelative, formatShort } from '../logic/date';
import {
  buildSuggestion,
  formatSets,
  increment,
  lastPerformance,
  loggedSets,
  personalRecords,
  sessionSetCount,
  sessionVolume,
  trimNum,
} from '../logic/progression';
import { useStore } from '../store/store';
import { colors, font, fonts, rules, spacing } from '../theme';
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

type Sub = 'session' | 'history' | 'pr';

export const WorkoutScreen = ({ go }: { go: (tab: TabKey) => void }) => {
  const state = useStore();
  const program = getProgram(state.programId);
  const active = state.activeSession;
  const [sub, setSub] = useState<Sub>('session');
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const startRest = () => setRestEndsAt(Date.now() + state.settings.restSeconds * 1000);
  const nextDay = cycleDayOf(state.programId, state.cycleIndex);
  const day = active ? dayById(active.dayId) : nextDay;
  const prs = personalRecords(state.sessions);

  const subTabs = (
    <Segmented
      options={[
        { key: 'session', label: 'Oturum' },
        { key: 'history', label: 'Geçmiş' },
        { key: 'pr', label: 'Rekorlar' },
      ]}
      value={sub}
      onChange={(k) => setSub(k as Sub)}
      style={{ borderTopWidth: 0 }}
    />
  );

  return (
    <Screen
      kicker="Antrenman"
      title={day?.name ?? 'Antrenman'}
      left={
        active ? (
          <Pressable onPress={() => go('home')} hitSlop={10}>
            <ChevronLeftIcon size={20} color={colors.ink} />
          </Pressable>
        ) : undefined
      }
      right={
        active ? (
          <Text style={[styles.pct, font.num]}>
            {Math.round(
              (active.exercises.reduce((s, e) => s + e.sets.filter((x) => x.done).length, 0) /
                Math.max(1, active.exercises.reduce((s, e) => s + e.sets.length, 0))) *
                100
            )}
            %
          </Text>
        ) : undefined
      }
    >
      {subTabs}

      {sub === 'session' ? (
        active ? (
          <>
            <Row style={{ justifyContent: 'space-between' }} gap={spacing.md}>
              <Text style={[font.small, font.num, { flex: 1 }]}>
                {sessionSetCount(active)}/{active.exercises.reduce((s, e) => s + e.sets.length, 0)} set ·{' '}
                {Math.round(sessionVolume(active)).toLocaleString('tr-TR')} kg hacim
              </Text>
            </Row>
            <RestBar
              endsAt={restEndsAt}
              onStart={startRest}
              onStop={() => setRestEndsAt(null)}
              onExtend={(sec) => setRestEndsAt((e) => (e === null ? null : e + sec * 1000))}
            />

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
              const allDone = ex.sets.every((s) => s.done);
              const open = expanded[exIndex] ?? !allDone;
              const showTip = suggestion.kind !== 'hold' && suggestion.kind !== 'first';

              return (
                <View key={`${ex.exerciseId}-${exIndex}`} style={styles.exercise}>
                  <Pressable onPress={() => setExpanded((c) => ({ ...c, [exIndex]: !open }))}>
                    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }} gap={spacing.md}>
                      <View style={{ flex: 1 }}>
                        <Text style={font.labelSm}>{GROUP_NAMES[meta?.group ?? 'sirt']}</Text>
                        <Text style={styles.exName}>
                          {exIndex + 1}. {meta?.name ?? ex.exerciseId}
                        </Text>
                      </View>
                      <Tag
                        label={`${ex.sets.length}×${ex.repMin === ex.repMax ? ex.repMin : `${ex.repMin}-${ex.repMax}`}`}
                      />
                    </Row>
                  </Pressable>

                  <View style={styles.noteRow}>
                    <View style={styles.note}>
                      <Text style={font.small}>
                        Geçen sefer:{' '}
                        <Text style={[font.bodyStrong, font.num, { fontSize: 13 }]}>
                          {previous ? formatSets(previous.exercise.sets) : 'kayıt yok'}
                        </Text>
                      </Text>
                    </View>
                    {showTip ? (
                      <View style={styles.tip}>
                        <Text style={styles.tipText}>{suggestion.text}</Text>
                      </View>
                    ) : null}
                  </View>

                  {!open ? null : (
                    <View style={{ marginTop: spacing.md, gap: 6 }}>
                      {ex.sets.map((set, setIndex) => (
                        <Row key={setIndex} gap={6}>
                          <Text style={styles.setNo}>S{setIndex + 1}</Text>
                          <View style={{ flex: 1 }}>
                            <NumberStepper
                              value={set.weight}
                              onChange={(v) => state.updateSet(exIndex, setIndex, { weight: v })}
                              step={increment(ex.exerciseId, state.settings)}
                              max={500}
                              suffix="kg"
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
                              suffix="tek"
                              compact
                            />
                          </View>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Set ${setIndex + 1} tamam`}
                            onPress={() => {
                              state.toggleSetDone(exIndex, setIndex);
                              if (!set.done) startRest();
                            }}
                            style={[styles.check, set.done ? styles.checkOn : null]}
                          >
                            <CheckIcon size={19} color={set.done ? colors.onAccent : colors.ruleLight} />
                          </Pressable>
                        </Row>
                      ))}

                      <Row gap={6} style={{ marginTop: 4 }}>
                        <Pressable style={styles.mini} onPress={() => state.addSet(exIndex)}>
                          <Text style={styles.miniText}>+ Set</Text>
                        </Pressable>
                        <Pressable style={styles.mini} onPress={() => state.removeSet(exIndex)}>
                          <Text style={styles.miniText}>− Set</Text>
                        </Pressable>
                        <Pressable style={styles.mini} onPress={startRest}>
                          <Text style={styles.miniText}>Dinlen</Text>
                        </Pressable>
                      </Row>
                    </View>
                  )}
                </View>
              );
            })}

            {day?.cardio ? (
              <Section>
                <Label>Gün sonu kardiyo</Label>
                <Text style={font.body}>{day.cardio}</Text>
              </Section>
            ) : null}

            <Button
              title="Antrenmanı tamamla →"
              size="lg"
              style={{ marginTop: spacing.lg }}
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
              variant="ghost"
              style={{ marginTop: spacing.sm }}
              onPress={() =>
                confirm('Antrenmanı iptal et', 'Girdiğin setler silinecek.', () => {
                  state.discardWorkout();
                  setRestEndsAt(null);
                })
              }
            />
          </>
        ) : (
          <>
            <Section strong={false} style={{ borderTopWidth: 0 }}>
              <Label>Sıradaki gün</Label>
              <Text style={styles.bigDay}>{nextDay.name}</Text>
              {nextDay.kind === 'workout' ? (
                <Button title="Antrenmana başla →" size="lg" onPress={() => state.startWorkout()} />
              ) : (
                <>
                  <Text style={font.small}>
                    Bugün dinlenme günü. Yine de çalışacaksan aşağıdan bir gün seç.
                  </Text>
                  <Button title="Dinlenmeyi tamamla →" variant="ghost" onPress={state.advanceCycle} />
                </>
              )}
            </Section>
            <Section>
              <Label>Başka bir gün çalış</Label>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Row gap={spacing.sm}>
                  {program.cycle
                    .filter((id, i) => program.days[id].kind === 'workout' && program.cycle.indexOf(id) === i)
                    .map((id) => (
                      <Chip key={id} label={program.days[id].name} onPress={() => state.startWorkout(id)} />
                    ))}
                </Row>
              </ScrollView>
            </Section>
          </>
        )
      ) : null}

      {sub === 'history' ? (
        state.sessions.length === 0 ? (
          <Section strong={false} style={{ borderTopWidth: 0 }}>
            <Text style={font.small}>Henüz kayıtlı antrenman yok.</Text>
          </Section>
        ) : (
          state.sessions
            .slice()
            .reverse()
            .map((s) => (
              <View key={s.id} style={styles.historyRow}>
                <Text style={[font.labelSm, { width: 74 }]}>{formatShort(s.date)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>{dayById(s.dayId)?.name ?? s.dayId}</Text>
                  <Text style={[font.tiny, font.num]}>
                    {sessionSetCount(s)} set · {formatRelative(s.date)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[font.h3, font.num]}>
                    {Math.round(sessionVolume(s)).toLocaleString('tr-TR')}
                  </Text>
                  <Text style={font.labelSm}>kg hacim</Text>
                </View>
              </View>
            ))
        )
      ) : null}

      {sub === 'pr' ? (
        prs.length === 0 ? (
          <Section strong={false} style={{ borderTopWidth: 0 }}>
            <Text style={font.small}>Henüz rekor yok.</Text>
          </Section>
        ) : (
          <>
            <View style={styles.prHead}>
              <Text style={[font.labelSm, { flex: 1 }]}>Hareket</Text>
              <Text style={[font.labelSm, styles.prCol]}>Rekor</Text>
              <Text style={[font.labelSm, styles.prCol]}>Tah. 1RM</Text>
            </View>
            {prs.map((pr) => (
              <View key={pr.exerciseId} style={styles.prRow}>
                <View style={{ flex: 1 }}>
                  <Text style={font.bodyStrong}>{pr.name}</Text>
                  <Text style={font.tiny}>{formatShort(pr.bestE1RMDate)}</Text>
                </View>
                <Text style={[font.bodyStrong, font.num, styles.prCol]}>
                  {trimNum(pr.maxWeight)}×{pr.maxWeightReps}
                </Text>
                <Text style={[font.bodyStrong, font.num, styles.prCol, { color: colors.accentInk }]}>
                  {pr.bestE1RM.toFixed(1).replace('.', ',')}
                </Text>
              </View>
            ))}
            <Text style={[font.tiny, { marginTop: spacing.md }]}>
              1RM = ağırlık × (1 + tekrar / 30) · Epley
            </Text>
          </>
        )
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  pct: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  bigDay: { fontFamily: fonts.black, fontSize: 40, letterSpacing: -1.3, color: colors.ink, lineHeight: 42 },
  exercise: {
    borderBottomWidth: rules.strong,
    borderBottomColor: colors.rule,
    paddingVertical: spacing.lg,
  },
  exName: { fontFamily: fonts.extra, fontSize: 20, letterSpacing: -0.3, color: colors.ink, marginTop: 2 },
  noteRow: { gap: 6, marginTop: 10 },
  note: {
    backgroundColor: colors.tint,
    borderLeftWidth: 4,
    borderLeftColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tip: {
    backgroundColor: colors.accentTint,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.accentDeep, lineHeight: 18 },
  setNo: { width: 26, fontFamily: fonts.bold, fontSize: 12, color: colors.muted },
  check: {
    width: 46,
    height: 46,
    borderWidth: rules.strong,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.ink },
  mini: {
    flex: 1,
    minHeight: 40,
    borderWidth: rules.strong,
    borderColor: colors.ink,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  miniText: {
    fontFamily: fonts.extra,
    fontSize: 11.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: rules.light,
    borderBottomColor: colors.ruleLight,
  },
  prHead: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: rules.strong,
    borderBottomColor: colors.rule,
  },
  prRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'baseline',
    paddingVertical: 11,
    borderBottomWidth: rules.light,
    borderBottomColor: colors.ruleLight,
  },
  prCol: { width: 86, textAlign: 'right' },
});
