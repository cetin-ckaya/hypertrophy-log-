import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronLeftIcon, TrashIcon } from '../components/icons';
import {
  Button,
  Card,
  Chip,
  Field,
  Label,
  NumberStepper,
  Row,
  Screen,
  Section,
  Tag,
} from '../components/ui';
import { GROUP_NAMES, allExercises } from '../data/program';
import { useStore } from '../store/store';
import { colors, font, fonts, rules, spacing } from '../theme';
import { Exercise, MuscleGroup, PlannedExercise, Program, TrainingDay } from '../types';

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

type Draft = {
  id: string;
  name: string;
  days: TrainingDay[];
};

const emptyDraft = (): Draft => ({
  id: `own_${uid()}`,
  name: '',
  days: [],
});

const draftFrom = (program: Program): Draft => ({
  id: program.id,
  name: program.name,
  days: program.cycle.map((dayId, i) => ({
    ...program.days[dayId],
    // Aynı gün döngüde birden çok kez geçebilir; kopyalarına ayrı kimlik ver.
    id: program.cycle.indexOf(dayId) === i ? program.days[dayId].id : `${dayId}_${i}`,
  })),
});

const toProgram = (draft: Draft): Program => {
  const days: Record<string, TrainingDay> = {};
  draft.days.forEach((d) => {
    days[d.id] = d;
  });
  const workouts = draft.days.filter((d) => d.kind === 'workout').length;
  return {
    id: draft.id,
    name: draft.name.trim() || 'Adsız program',
    description: `${workouts} antrenman günü · ${draft.days.length} günlük döngü`,
    days,
    cycle: draft.days.map((d) => d.id),
  };
};

export const ProgramEditorScreen = ({
  programId,
  onClose,
}: {
  programId: string | null;
  onClose: () => void;
}) => {
  const customPrograms = useStore((s) => s.customPrograms);
  const saveCustomProgram = useStore((s) => s.saveCustomProgram);
  const setProgram = useStore((s) => s.setProgram);

  const [draft, setDraft] = useState<Draft>(() => {
    const existing = programId ? customPrograms[programId] : null;
    return existing ? draftFrom(existing) : emptyDraft();
  });
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  const patchDay = (index: number, patch: Partial<TrainingDay>) =>
    setDraft((d) => ({
      ...d,
      days: d.days.map((day, i) => (i === index ? { ...day, ...patch } : day)),
    }));

  const move = (index: number, delta: number) =>
    setDraft((d) => {
      const next = [...d.days];
      const to = index + delta;
      if (to < 0 || to >= next.length) return d;
      [next[index], next[to]] = [next[to], next[index]];
      return { ...d, days: next };
    });

  const removeDay = (index: number) =>
    setDraft((d) => ({ ...d, days: d.days.filter((_, i) => i !== index) }));

  const addDay = (kind: 'workout' | 'rest') =>
    setDraft((d) => ({
      ...d,
      days: [
        ...d.days,
        {
          id: `${d.id}_d${uid()}`,
          name: kind === 'rest' ? 'Dinlenme' : `Gün ${d.days.filter((x) => x.kind === 'workout').length + 1}`,
          kind,
          exercises: [],
        },
      ],
    }));

  if (dayIndex !== null && draft.days[dayIndex]) {
    return (
      <DayEditor
        day={draft.days[dayIndex]}
        onChange={(patch) => patchDay(dayIndex, patch)}
        onBack={() => setDayIndex(null)}
      />
    );
  }

  return (
    <Screen
      kicker={programId ? 'Programı düzenle' : 'Yeni program'}
      title={draft.name || 'Adsız program'}
      left={
        <Pressable onPress={onClose} hitSlop={10}>
          <ChevronLeftIcon size={20} color={colors.ink} />
        </Pressable>
      }
    >
      <Section strong={false} style={{ borderTopWidth: 0 }}>
        <Field
          label="Program adı"
          value={draft.name}
          onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
          placeholder="Örn. Üst / Alt bölünmesi"
        />
      </Section>

      <Section>
        <Label>Döngü · {draft.days.length} gün</Label>
        <Text style={font.small}>
          Günler burada yazdığın sırayla ilerler. Dinlenme günlerini de araya ekle.
        </Text>

        {draft.days.length === 0 ? (
          <Text style={font.small}>Henüz gün yok — aşağıdan ekle.</Text>
        ) : (
          draft.days.map((day, i) => (
            <View key={day.id} style={styles.dayRow}>
              <Text style={styles.dayNo}>{i + 1}</Text>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => (day.kind === 'workout' ? setDayIndex(i) : undefined)}
              >
                <Text style={font.bodyStrong}>{day.name}</Text>
                <Text style={font.tiny}>
                  {day.kind === 'rest'
                    ? 'Dinlenme günü'
                    : `${day.exercises.length} hareket · ${day.exercises.reduce((s, e) => s + e.sets, 0)} set`}
                </Text>
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => move(i, -1)} hitSlop={6}>
                <Text style={styles.iconText}>↑</Text>
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => move(i, 1)} hitSlop={6}>
                <Text style={styles.iconText}>↓</Text>
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => removeDay(i)} hitSlop={6}>
                <TrashIcon size={15} color={colors.ink} />
              </Pressable>
            </View>
          ))
        )}

        <Row gap={spacing.sm}>
          <Button title="+ Antrenman günü" variant="ghost" onPress={() => addDay('workout')} style={{ flex: 1 }} />
          <Button title="+ Dinlenme" variant="ghost" onPress={() => addDay('rest')} style={{ flex: 1 }} />
        </Row>
      </Section>

      {error ? (
        <Text style={[font.small, { color: colors.accentInk }]}>{error}</Text>
      ) : null}

      <Section>
        <Button
          title="Kaydet ve bu programa geç"
          onPress={() => {
            if (!draft.name.trim()) {
              setError('Programa bir ad ver.');
              return;
            }
            if (draft.days.filter((d) => d.kind === 'workout').length === 0) {
              setError('En az bir antrenman günü ekle.');
              return;
            }
            if (draft.days.some((d) => d.kind === 'workout' && d.exercises.length === 0)) {
              setError('Her antrenman gününde en az bir hareket olmalı.');
              return;
            }
            const program = toProgram(draft);
            saveCustomProgram(program);
            setProgram(program.id);
            onClose();
          }}
        />
        <Button title="Vazgeç" variant="ghost" onPress={onClose} />
      </Section>
    </Screen>
  );
};

const DayEditor = ({
  day,
  onChange,
  onBack,
}: {
  day: TrainingDay;
  onChange: (patch: Partial<TrainingDay>) => void;
  onBack: () => void;
}) => {
  const [picking, setPicking] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const patchExercise = (index: number, patch: Partial<PlannedExercise>) =>
    onChange({
      exercises: day.exercises.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    });

  const move = (index: number, delta: number) => {
    const next = [...day.exercises];
    const to = index + delta;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    onChange({ exercises: next });
  };

  return (
    <Screen
      kicker="Gün"
      title={day.name || 'Adsız gün'}
      left={
        <Pressable onPress={onBack} hitSlop={10}>
          <ChevronLeftIcon size={20} color={colors.ink} />
        </Pressable>
      }
    >
      <Section strong={false} style={{ borderTopWidth: 0 }}>
        <Field
          label="Gün adı"
          value={day.name}
          onChangeText={(v) => onChange({ name: v })}
          placeholder="Örn. Pull · Sırt & Biceps"
        />
        <Field
          label="Gün sonu notu (isteğe bağlı)"
          value={day.cardio ?? ''}
          onChangeText={(v) => onChange({ cardio: v || undefined })}
          placeholder="Örn. Eğim 10 / Hız 5 · 20 dakika yürüyüş"
        />
      </Section>

      <Section>
        <Label>Hareketler · {day.exercises.length}</Label>
        {day.exercises.length === 0 ? (
          <Text style={font.small}>Henüz hareket yok.</Text>
        ) : (
          day.exercises.map((ex, i) => {
            const meta = allExercises()[ex.exerciseId];
            const open = openIndex === i;
            return (
              <View key={`${ex.exerciseId}-${i}`} style={styles.exRow}>
                <Row gap={spacing.sm} style={{ alignItems: 'flex-start' }}>
                  <Text style={styles.dayNo}>{i + 1}</Text>
                  <Pressable style={{ flex: 1 }} onPress={() => setOpenIndex(open ? null : i)}>
                    <Text style={font.bodyStrong}>{meta?.name ?? ex.exerciseId}</Text>
                    <Text style={font.tiny}>
                      {GROUP_NAMES[meta?.group ?? 'sirt']} · {ex.sets}×
                      {ex.repMin === ex.repMax ? ex.repMin : `${ex.repMin}-${ex.repMax}`}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.iconBtn} onPress={() => move(i, -1)} hitSlop={6}>
                    <Text style={styles.iconText}>↑</Text>
                  </Pressable>
                  <Pressable style={styles.iconBtn} onPress={() => move(i, 1)} hitSlop={6}>
                    <Text style={styles.iconText}>↓</Text>
                  </Pressable>
                  <Pressable
                    style={styles.iconBtn}
                    onPress={() => onChange({ exercises: day.exercises.filter((_, j) => j !== i) })}
                    hitSlop={6}
                  >
                    <TrashIcon size={15} color={colors.ink} />
                  </Pressable>
                </Row>

                {open ? (
                  <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                    <Label>Work-set sayısı</Label>
                    <NumberStepper
                      value={ex.sets}
                      onChange={(v) => patchExercise(i, { sets: Math.max(1, Math.round(v)) })}
                      step={1}
                      min={1}
                      max={10}
                      decimals={0}
                      compact
                    />
                    <Row gap={spacing.sm}>
                      <View style={{ flex: 1, gap: 5 }}>
                        <Label>En az tekrar</Label>
                        <NumberStepper
                          value={ex.repMin}
                          onChange={(v) => {
                            const min = Math.max(1, Math.round(v));
                            patchExercise(i, { repMin: min, repMax: Math.max(min, ex.repMax) });
                          }}
                          step={1}
                          min={1}
                          max={50}
                          decimals={0}
                          compact
                        />
                      </View>
                      <View style={{ flex: 1, gap: 5 }}>
                        <Label>En çok tekrar</Label>
                        <NumberStepper
                          value={ex.repMax}
                          onChange={(v) => {
                            const max = Math.max(1, Math.round(v));
                            patchExercise(i, { repMax: max, repMin: Math.min(ex.repMin, max) });
                          }}
                          step={1}
                          min={1}
                          max={50}
                          decimals={0}
                          compact
                        />
                      </View>
                    </Row>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        {picking ? (
          <ExercisePicker
            exclude={day.exercises.map((e) => e.exerciseId)}
            onPick={(ex) => {
              onChange({
                exercises: [
                  ...day.exercises,
                  {
                    exerciseId: ex.id,
                    sets: 3,
                    repMin: 8,
                    repMax: 12,
                    section: GROUP_NAMES[ex.group] ?? '',
                  },
                ],
              });
              setPicking(false);
            }}
            onClose={() => setPicking(false)}
          />
        ) : (
          <Button title="+ Hareket ekle" variant="ghost" onPress={() => setPicking(true)} />
        )}
      </Section>

      <Section>
        <Button title="Güne devam et →" onPress={onBack} />
      </Section>
    </Screen>
  );
};

const GROUPS: MuscleGroup[] = [
  'sirt',
  'gogus',
  'omuz',
  'biceps',
  'triceps',
  'bacak',
  'kalca',
  'onkol',
  'kalf',
  'trapez',
];

const ExercisePicker = ({
  exclude,
  onPick,
  onClose,
}: {
  exclude: string[];
  onPick: (ex: Exercise) => void;
  onClose: () => void;
}) => {
  const addCustomExercise = useStore((s) => s.addCustomExercise);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [group, setGroup] = useState<MuscleGroup>('sirt');
  const [type, setType] = useState<'compound' | 'isolation'>('compound');

  const list = useMemo(
    () =>
      Object.values(allExercises())
        .filter((e) => !exclude.includes(e.id))
        .filter((e) => e.name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')))
        .sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [exclude, query]
  );

  if (creating) {
    return (
      <Card>
        <Label>Yeni hareket</Label>
        <Field label="Ad" value={name} onChangeText={setName} placeholder="Örn. Pendlay Row" />
        <Label>Kas grubu</Label>
        <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
          {GROUPS.map((g) => (
            <Chip key={g} label={GROUP_NAMES[g]} active={group === g} onPress={() => setGroup(g)} />
          ))}
        </Row>
        <Label>Tip</Label>
        <Row gap={spacing.sm}>
          <Chip label="Compound" active={type === 'compound'} onPress={() => setType('compound')} />
          <Chip label="İzolasyon" active={type === 'isolation'} onPress={() => setType('isolation')} />
        </Row>
        <Row gap={spacing.sm}>
          <Button
            title="Ekle"
            style={{ flex: 1 }}
            onPress={() => {
              if (!name.trim()) return;
              const ex: Exercise = {
                id: `ownex_${uid()}`,
                name: name.trim(),
                group,
                type,
              };
              addCustomExercise(ex);
              onPick(ex);
            }}
          />
          <Button title="Vazgeç" variant="ghost" style={{ flex: 1 }} onPress={() => setCreating(false)} />
        </Row>
      </Card>
    );
  }

  return (
    <Card>
      <Field value={query} onChangeText={setQuery} placeholder="Hareket ara…" />
      <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        <View>
          {list.map((e) => (
            <Pressable key={e.id} onPress={() => onPick(e)} style={styles.pickRow}>
              <Text style={[font.body, { flex: 1 }]}>{e.name}</Text>
              <Tag label={GROUP_NAMES[e.group]} />
            </Pressable>
          ))}
          {list.length === 0 ? <Text style={font.small}>Eşleşen hareket yok.</Text> : null}
        </View>
      </ScrollView>
      <Row gap={spacing.sm}>
        <Button title="+ Yeni hareket" style={{ flex: 1 }} onPress={() => setCreating(true)} />
        <Button title="Kapat" variant="ghost" style={{ flex: 1 }} onPress={onClose} />
      </Row>
    </Card>
  );
};

const styles = StyleSheet.create({
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: rules.light,
    borderTopColor: colors.ruleLight,
  },
  dayNo: { width: 20, fontFamily: fonts.bold, fontSize: 12, color: colors.muted },
  exRow: {
    paddingVertical: spacing.md,
    borderTopWidth: rules.light,
    borderTopColor: colors.ruleLight,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderWidth: rules.strong,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontFamily: fonts.extra, fontSize: 15, color: colors.ink },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: rules.light,
    borderTopColor: colors.ruleLight,
  },
});
