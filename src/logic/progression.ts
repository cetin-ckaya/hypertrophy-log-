import { EXERCISES } from '../data/program';
import { SessionExercise, SetLog, Settings, WorkoutSession } from '../types';
import { fromKey, toKey } from './date';

export const isLogged = (s: SetLog) => s.reps > 0;
export const loggedSets = (e: SessionExercise) => e.sets.filter(isLogged);

/** Epley: 1RM = ağırlık × (1 + tekrar / 30) */
export const epley = (weight: number, reps: number) => weight * (1 + reps / 30);

export const setE1RM = (s: SetLog) => epley(s.weight, s.reps);

export const bestSet = (sets: SetLog[]): SetLog | null => {
  const logged = sets.filter(isLogged);
  if (logged.length === 0) return null;
  return logged.reduce((best, s) => (setE1RM(s) > setE1RM(best) ? s : best));
};

export const topWeight = (sets: SetLog[]): number =>
  sets.filter(isLogged).reduce((max, s) => Math.max(max, s.weight), 0);

export const totalReps = (sets: SetLog[]): number =>
  sets.filter(isLogged).reduce((sum, s) => sum + s.reps, 0);

export const setVolume = (sets: SetLog[]): number =>
  sets.filter(isLogged).reduce((sum, s) => sum + s.weight * s.reps, 0);

export const formatSets = (sets: SetLog[]): string =>
  sets
    .filter(isLogged)
    .map((s) => `${trimNum(s.weight)} kg × ${s.reps}`)
    .join(', ');

export const trimNum = (n: number): string =>
  (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)))).replace('.', ',');

export type PastPerformance = {
  session: WorkoutSession;
  exercise: SessionExercise;
  sameDay: boolean;
};

const completed = (sessions: WorkoutSession[]) =>
  sessions
    .filter((s) => s.completedAt)
    .slice()
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

/** Aynı antrenman gününde bu hareketin geçmişi (en yeni önce). */
export const exerciseHistory = (
  sessions: WorkoutSession[],
  exerciseId: string,
  dayId?: string
): PastPerformance[] =>
  completed(sessions)
    .filter((s) => (dayId ? s.dayId === dayId : true))
    .map((s) => {
      const exercise = s.exercises.find((e) => e.exerciseId === exerciseId);
      return exercise && loggedSets(exercise).length > 0
        ? { session: s, exercise, sameDay: !dayId || s.dayId === dayId }
        : null;
    })
    .filter((x): x is PastPerformance => x !== null);

export const lastPerformance = (
  sessions: WorkoutSession[],
  exerciseId: string,
  dayId: string
): PastPerformance | null => {
  const sameDay = exerciseHistory(sessions, exerciseId, dayId);
  if (sameDay.length > 0) return sameDay[0];
  const any = exerciseHistory(sessions, exerciseId);
  return any.length > 0 ? { ...any[0], sameDay: false } : null;
};

export type SuggestionKind = 'first' | 'increase' | 'hold' | 'stall';

export type Suggestion = {
  kind: SuggestionKind;
  text: string;
  targetWeight?: number;
};

export const increment = (exerciseId: string, settings: Settings): number => {
  const meta = EXERCISES[exerciseId];
  return meta && meta.type === 'compound'
    ? settings.compoundIncrement
    : settings.isolationIncrement;
};

/**
 * Progressive overload önerisi:
 * - Hedef aralığın üst sınırına TÜM work-set'lerde ulaşıldıysa → ağırlığı artır
 * - Altında kalındıysa → aynı ağırlıkta kal
 * - Aynı ağırlıkta 3 antrenman üst üste ilerleme yoksa → deload / form uyarısı
 */
export const buildSuggestion = (
  sessions: WorkoutSession[],
  exerciseId: string,
  dayId: string,
  repMax: number,
  settings: Settings
): Suggestion => {
  const history = exerciseHistory(sessions, exerciseId, dayId);
  if (history.length === 0)
    return { kind: 'first', text: 'İlk kayıt — teknikte kalabileceğin bir ağırlıkla başla.' };

  const last = history[0];
  const sets = loggedSets(last.exercise);
  const weight = topWeight(last.exercise.sets);
  const step = increment(exerciseId, settings);

  const stalled =
    history.length >= 3 &&
    history.slice(0, 3).every((h) => topWeight(h.exercise.sets) === weight) &&
    totalReps(history[0].exercise.sets) <= totalReps(history[2].exercise.sets);

  const hitTop = sets.length > 0 && sets.every((s) => s.reps >= repMax);

  if (hitTop) {
    const target = weight + step;
    return {
      kind: 'increase',
      targetWeight: target,
      text: `Tüm setlerde ${repMax} tekrara ulaştın → ${trimNum(target)} kg dene (+${trimNum(step)} kg).`,
    };
  }

  if (stalled)
    return {
      kind: 'stall',
      targetWeight: weight,
      text: `3 antrenmandır ${trimNum(weight)} kg'da ilerleme yok. Deload (%10 düşür) veya form/dinlenme kontrolü yap.`,
    };

  return {
    kind: 'hold',
    targetWeight: weight,
    text: `${trimNum(weight)} kg'da kal, hedef üst sınıra (${repMax} tekrar) ulaşmaya çalış.`,
  };
};

export type PersonalRecord = {
  exerciseId: string;
  name: string;
  group: string;
  maxWeight: number;
  maxWeightReps: number;
  maxWeightDate: string;
  bestE1RM: number;
  bestE1RMDate: string;
};

export const personalRecords = (sessions: WorkoutSession[]): PersonalRecord[] => {
  const map = new Map<string, PersonalRecord>();
  completed(sessions).forEach((session) => {
    session.exercises.forEach((ex) => {
      loggedSets(ex).forEach((set) => {
        const meta = EXERCISES[ex.exerciseId];
        if (!meta) return;
        const current =
          map.get(ex.exerciseId) ||
          {
            exerciseId: ex.exerciseId,
            name: meta.name,
            group: meta.group,
            maxWeight: 0,
            maxWeightReps: 0,
            maxWeightDate: session.date,
            bestE1RM: 0,
            bestE1RMDate: session.date,
          };
        if (set.weight > current.maxWeight) {
          current.maxWeight = set.weight;
          current.maxWeightReps = set.reps;
          current.maxWeightDate = session.date;
        }
        const e1 = setE1RM(set);
        if (e1 > current.bestE1RM) {
          current.bestE1RM = e1;
          current.bestE1RMDate = session.date;
        }
        map.set(ex.exerciseId, current);
      });
    });
  });
  return Array.from(map.values()).sort((a, b) => b.bestE1RM - a.bestE1RM);
};

export type ExercisePoint = { date: string; weight: number; e1rm: number; volume: number };

export const exerciseProgress = (
  sessions: WorkoutSession[],
  exerciseId: string
): ExercisePoint[] =>
  completed(sessions)
    .slice()
    .reverse()
    .map((session) => {
      const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (!ex || loggedSets(ex).length === 0) return null;
      const best = bestSet(ex.sets);
      return {
        date: session.date,
        weight: topWeight(ex.sets),
        e1rm: best ? setE1RM(best) : 0,
        volume: setVolume(ex.sets),
      };
    })
    .filter((x): x is ExercisePoint => x !== null);

export const weekStart = (dateKey: string): string => {
  const d = fromKey(dateKey);
  const day = (d.getDay() + 6) % 7; // Pazartesi = 0
  d.setDate(d.getDate() - day);
  return toKey(d);
};

export type WeeklyVolume = { week: string; total: number; byGroup: Record<string, number> };

export const weeklyVolume = (sessions: WorkoutSession[]): WeeklyVolume[] => {
  const map = new Map<string, WeeklyVolume>();
  completed(sessions).forEach((session) => {
    const week = weekStart(session.date);
    const entry = map.get(week) || { week, total: 0, byGroup: {} };
    session.exercises.forEach((ex) => {
      const meta = EXERCISES[ex.exerciseId];
      if (!meta) return;
      const vol = setVolume(ex.sets);
      entry.total += vol;
      entry.byGroup[meta.group] = (entry.byGroup[meta.group] || 0) + vol;
    });
    map.set(week, entry);
  });
  return Array.from(map.values()).sort((a, b) => (a.week < b.week ? -1 : 1));
};

export const sessionVolume = (session: WorkoutSession): number =>
  session.exercises.reduce((sum, ex) => sum + setVolume(ex.sets), 0);

export const sessionSetCount = (session: WorkoutSession): number =>
  session.exercises.reduce((sum, ex) => sum + loggedSets(ex).length, 0);
