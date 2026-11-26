import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RestBar } from '../components/RestTimer';
import { unlockAlert } from '../logic/alert';
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
import {
  GROUP_NAMES,
  PREACHER_THRESHOLD,
  WEEKDAY_NAMES,
  dayById,
  dayForDate,
  exerciseById,
  exerciseNote,
  extraSetKey,
  getProgram,
  nextScheduledWorkout,
  plannedSetCount,
  programOfDay,
  rangeLabel,
  setRange,
} from '../data/program';
import { formatRelative, formatShort, todayKey } from '../logic/date';
import {
  buildSuggestion,
  formatSets,
  formatSetsShort,
  increment,
  isSkipped,
  lastPerformance,
  loggedSets,
  preacherThresholdHit,
  personalRecords,
  sessionSetCount,
  sessionVolume,
  trimNum,
} from '../logic/progression';
import { useStore } from '../store/store';
import { colors, font, fonts, rules, spacing } from '../theme';
import { TabKey } from '../navigation';
import { WorkoutSession } from '../types';

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

/** "Geçen sefer" kaydının ne zaman (ve farklı günse hangi günde) yapıldığı: "19 Kas · Torso B". */
const whenLabel = (prev: { session: { date: string; dayId: string } }, currentDayId: string) =>
  prev.session.dayId === currentDayId
    ? formatShort(prev.session.date)
    : `${formatShort(prev.session.date)} · ${dayById(prev.session.dayId)?.name ?? prev.session.dayId}`;

export const WorkoutScreen = ({ go }: { go: (tab: TabKey) => void }) => {
  const state = useStore();
  const program = getProgram(state.programId);
  const active = state.activeSession;
  const [sub, setSub] = useState<Sub>('session');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [openSession, setOpenSession] = useState<string | null>(null);
  /** Son silinen seans — "Geri al" için. */
  const [deleted, setDeleted] = useState<WorkoutSession | null>(null);

  const startRest = () => {
    // Dokunuş anında ses kilidini aç; sayaç bitince bip çalabilsin (iOS).
    unlockAlert();
    state.startRest();
  };
  const today = todayKey();
  const nextDay = dayForDate(state.programId, state.cycleIndex, today);
  const day = active ? dayById(active.dayId) : nextDay;
  const scheduled = Boolean(program.schedule);
  const upcoming = scheduled && nextDay.kind !== 'workout' ? nextScheduledWorkout(state.programId, today) : null;
  const activeProgram = active ? programOfDay(active.dayId) : program;
  // Preacher 3. set eşiği: son Limbs B seansında yakalandıysa ve set henüz eklenmediyse.
  const preacherKey = extraSetKey(PREACHER_THRESHOLD.dayId, PREACHER_THRESHOLD.exerciseId);
  const preacherHit =
    (state.extraSets?.[preacherKey] ?? 0) > 0 ? null : preacherThresholdHit(state.sessions, PREACHER_THRESHOLD);
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
              endsAt={state.restEndsAt ?? null}
              onStart={startRest}
              onStop={state.stopRest}
              onExtend={state.extendRest}
            />

            {active.exercises.map((ex, exIndex) => {
              const meta = exerciseById(ex.exerciseId);
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
                      <Tag label={`${ex.sets.length}×${rangeLabel(ex)}`} />
                    </Row>
                    {(() => {
                      const note = exerciseNote(
                        activeProgram?.tempo,
                        day?.exercises.find((p) => p.exerciseId === ex.exerciseId)
                      );
                      return note ? <Text style={[font.tiny, { marginTop: 4 }]}>{note}</Text> : null;
                    })()}
                  </Pressable>

                  <View style={styles.noteRow}>
                    <View style={styles.note}>
                      <Text style={font.small}>
                        Geçen sefer{previous ? ` (${whenLabel(previous, active.dayId)})` : ''}:{' '}
                        <Text style={[font.bodyStrong, font.num, { fontSize: 13 }]}>
                          {previous ? formatSetsShort(previous.exercise.sets) : 'kayıt yok'}
                        </Text>
                      </Text>
                    </View>
                    {showTip ? (
                      <View style={styles.tip}>
                        <Text style={styles.tipText}>{suggestion.text}</Text>
                      </View>
                    ) : null}
                    {(() => {
                      // Bu seansta Preacher 1. set eşiği yakalandıysa hemen hatırlat.
                      if (
                        active.dayId !== PREACHER_THRESHOLD.dayId ||
                        ex.exerciseId !== PREACHER_THRESHOLD.exerciseId ||
                        (state.extraSets?.[preacherKey] ?? 0) > 0
                      )
                        return null;
                      const first = ex.sets[0];
                      const liveHit =
                        first && first.weight >= PREACHER_THRESHOLD.weight && first.reps >= PREACHER_THRESHOLD.reps;
                      if (!liveHit && !preacherHit) return null;
                      return (
                        <View style={styles.tip}>
                          <Text style={styles.tipText}>
                            1. sette 12,5 kg × 9 eşiği geçildi → 3. set eklenecek.
                          </Text>
                          <Pressable
                            style={[styles.mini, { marginTop: 6, borderColor: colors.accent }]}
                            onPress={() => {
                              state.addExtraSet(PREACHER_THRESHOLD.dayId, PREACHER_THRESHOLD.exerciseId);
                              if (ex.sets.length < 3) state.addSet(exIndex);
                            }}
                          >
                            <Text style={[styles.miniText, { color: colors.accentDeep }]}>3. seti kalıcı ekle</Text>
                          </Pressable>
                        </View>
                      );
                    })()}
                  </View>

                  {!open ? null : (
                    <View style={{ marginTop: spacing.md, gap: 6 }}>
                      {ex.sets.map((set, setIndex) => (
                        <View key={setIndex}>
                        <Row gap={6}>
                          <View style={styles.setNoWrap}>
                            <Text style={styles.setNo}>S{setIndex + 1}</Text>
                            {ex.ranges ? (
                              <Text style={styles.setRange}>{setRange(ex, setIndex).join('-')}</Text>
                            ) : null}
                          </View>
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
                        {set.done && isSkipped(set) ? (
                          <Text style={styles.skipped}>Atlandı · ilerleme hesabına katılmaz</Text>
                        ) : null}
                        </View>
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
                })
              }
            />
          </>
        ) : (
          <>
            <Section strong={false} style={{ borderTopWidth: 0 }}>
              <Label>{scheduled ? `Bugün · ${WEEKDAY_NAMES[new Date().getDay()]}` : 'Sıradaki gün'}</Label>
              <Text style={styles.bigDay}>{nextDay.name}</Text>
              {nextDay.kind === 'workout' ? (
                <Button title="Antrenmana başla →" size="lg" onPress={() => state.startWorkout()} />
              ) : (
                <>
                  <Text style={font.small}>
                    Bugün dinlenme günü
                    {upcoming
                      ? ` · sıradaki ${upcoming.day.name} (${upcoming.inDays === 1 ? 'yarın' : WEEKDAY_NAMES[upcoming.weekday]})`
                      : ''}
                    . Bir antrenmanı kaçırdıysan aşağıdan o günü seç.
                  </Text>
                  {scheduled ? null : (
                    <Button title="Dinlenmeyi tamamla →" variant="ghost" onPress={state.advanceCycle} />
                  )}
                </>
              )}
            </Section>
            {preacherHit ? (
              <Section>
                <View style={styles.tip}>
                  <Text style={styles.tipText}>
                    Preacher Curl (Limbs B): {formatShort(preacherHit.date)} günü 1. sette {trimNum(preacherHit.weight)} kg ×{' '}
                    {preacherHit.reps} yaptın — 12,5 kg × 9 eşiği geçildi, 3. set eklenecek.
                  </Text>
                  <Pressable
                    style={[styles.mini, { marginTop: 6, borderColor: colors.accent }]}
                    onPress={() => state.addExtraSet(PREACHER_THRESHOLD.dayId, PREACHER_THRESHOLD.exerciseId)}
                  >
                    <Text style={[styles.miniText, { color: colors.accentDeep }]}>3. seti kalıcı ekle</Text>
                  </Pressable>
                </View>
              </Section>
            ) : null}
            {nextDay.kind === 'workout' ? (
              <Section>
                <Label>Bugünün hareketleri · geçen sefer</Label>
                {program.tempo ? (
                  <Text style={[font.tiny, { marginTop: 2 }]}>
                    Tempo {program.tempo}: 3 sn indir, 1 sn gerilmiş pozisyonda bekle, kaldır. "5-9 / 8-12": 1. set ağır,
                    sonraki set(ler) ~%15-20 hafif.
                  </Text>
                ) : null}
                {nextDay.exercises.map((ex, i) => {
                  const meta = exerciseById(ex.exerciseId);
                  const previous = lastPerformance(state.sessions, ex.exerciseId, nextDay.id);
                  const suggestion = buildSuggestion(
                    state.sessions,
                    ex.exerciseId,
                    nextDay.id,
                    ex.repMax,
                    state.settings
                  );
                  const flag =
                    suggestion.kind === 'increase'
                      ? 'Ağırlığı artır'
                      : suggestion.kind === 'stall'
                        ? 'Takıldın'
                        : null;
                  return (
                    <View key={`${ex.exerciseId}-${i}`} style={styles.previewRow}>
                      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }} gap={spacing.sm}>
                        <Text style={[font.bodyStrong, { flex: 1 }]}>
                          {i + 1}. {meta?.name ?? ex.exerciseId}
                        </Text>
                        <Text style={[font.labelSm, font.num]}>
                          {plannedSetCount(nextDay.id, ex)}×{rangeLabel(ex)}
                          {ex.rir ? ` · RIR ${ex.rir}` : ''}
                        </Text>
                      </Row>
                      <Row gap={spacing.sm} style={{ marginTop: 2, flexWrap: 'wrap' }}>
                        <Text style={[font.small, font.num, { color: colors.muted }]}>
                          {previous
                            ? `${formatSetsShort(previous.exercise.sets)} — ${whenLabel(previous, nextDay.id)}`
                            : 'Kayıt yok'}
                        </Text>
                        {flag ? <Text style={styles.previewFlag}>{flag}</Text> : null}
                      </Row>
                    </View>
                  );
                })}
                {nextDay.cardio ? (
                  <Text style={[font.small, { marginTop: spacing.sm }]}>Kardiyo: {nextDay.cardio}</Text>
                ) : null}
              </Section>
            ) : null}
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

      {sub === 'history' && deleted ? (
        <View style={styles.undo}>
          <Text style={[font.small, { flex: 1, color: colors.ink }]}>
            {dayById(deleted.dayId)?.name ?? deleted.dayId} · {formatShort(deleted.date)} silindi.
          </Text>
          <Pressable
            onPress={() => {
              state.restoreSession(deleted);
              setDeleted(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Silinen seansı geri al"
            hitSlop={8}
          >
            <Text style={[styles.miniText, { color: colors.accentDeep }]}>Geri al</Text>
          </Pressable>
          <Pressable onPress={() => setDeleted(null)} hitSlop={8} accessibilityLabel="Kapat">
            <Text style={[styles.miniText, { color: colors.muted }]}>✕</Text>
          </Pressable>
        </View>
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
              <View key={s.id}>
                <Pressable
                  style={styles.historyRow}
                  onPress={() => setOpenSession((cur) => (cur === s.id ? null : s.id))}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayById(s.dayId)?.name ?? s.dayId} detayı`}
                >
                  <Text style={[font.labelSm, { width: 74 }]}>{formatShort(s.date)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={font.h3}>{dayById(s.dayId)?.name ?? s.dayId}</Text>
                    <Text style={[font.tiny, font.num]}>
                      {sessionSetCount(s)} set · {formatRelative(s.date)} · {openSession === s.id ? 'kapat ▴' : 'detay ▾'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[font.h3, font.num]}>
                      {Math.round(sessionVolume(s)).toLocaleString('tr-TR')}
                    </Text>
                    <Text style={font.labelSm}>kg hacim</Text>
                  </View>
                </Pressable>
                {openSession === s.id ? (
                  <View style={styles.historyDetail}>
                    {s.exercises.map((ex, i) => (
                      <Row key={`${ex.exerciseId}-${i}`} style={{ alignItems: 'flex-start' }} gap={spacing.sm}>
                        <Text style={[font.small, { flex: 1 }]}>{exerciseById(ex.exerciseId)?.name ?? ex.exerciseId}</Text>
                        <Text style={[font.small, font.num, { color: colors.ink, textAlign: 'right', flexShrink: 1 }]}>
                          {formatSetsShort(ex.sets) || 'kayıt yok'}
                        </Text>
                      </Row>
                    ))}
                    <Pressable
                      style={[styles.mini, { marginTop: spacing.sm, borderColor: colors.accent, flex: 0 }]}
                      accessibilityRole="button"
                      accessibilityLabel="Bu seansı sil"
                      onPress={() =>
                        confirm(
                          'Seansı sil',
                          `${dayById(s.dayId)?.name ?? s.dayId} · ${formatShort(s.date)} kaydı silinecek. Hemen ardından çıkan "Geri al" ile geri getirebilirsin.`,
                          () => {
                            state.deleteSession(s.id);
                            setDeleted(s);
                            setOpenSession(null);
                          }
                        )
                      }
                    >
                      <Text style={[styles.miniText, { color: colors.accentDeep }]}>Bu seansı sil</Text>
                    </Pressable>
                  </View>
                ) : null}
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
  previewRow: {
    borderBottomWidth: rules.light,
    borderBottomColor: colors.ruleLight,
    paddingVertical: 10,
  },
  previewFlag: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  setNoWrap: { width: 32 },
  setNo: { fontFamily: fonts.bold, fontSize: 12, color: colors.muted },
  setRange: { fontFamily: fonts.medium, fontSize: 10, color: colors.muted, fontVariant: ['tabular-nums'] },
  skipped: { fontFamily: fonts.bold, fontSize: 11, color: colors.accent, marginTop: 2, marginLeft: 38 },
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
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.accentTint,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  historyDetail: {
    gap: 6,
    paddingVertical: spacing.sm,
    paddingLeft: 74 + spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleLight,
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
