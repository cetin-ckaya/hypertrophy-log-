import { PREACHER_THRESHOLD, dayById, exerciseById, getProgram } from '../data/program';
import { Settings, WorkoutSession } from '../types';
import { addDays, fromKey } from './date';
import {
  buildSuggestion,
  exerciseHistory,
  formatSetsShort,
  isLogged,
  preacherThresholdHit,
  setE1RM,
  skippedCount,
  weekStart,
} from './progression';

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const dm = (key: string) => {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const num = (n: number, digits = 2) => n.toFixed(digits).replace('.', ',');

const inRange = (key: string, from: string, to: string) => key >= from && key <= to;

/** Haftanın Pazartesi–Cuma aralığı (hafta sonu da o haftaya sayılır). */
export const checkinWeek = (today: string) => {
  const mon = weekStart(today);
  return { mon, fri: addDays(mon, 4), sun: addDays(mon, 6) };
};

export const rangeLabel = (mon: string, fri: string) => {
  const a = fromKey(mon);
  const b = fromKey(fri);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
    : `${dm(mon)} – ${dm(fri)} ${b.getFullYear()}`;
};

const avg = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null);

/** 1. setin Epley 1RM'ine göre %1 eşikli ok. */
export const progressArrow = (now: number, prev: number): '↑' | '=' | '↓' => {
  if (prev <= 0) return '=';
  const change = (now - prev) / prev;
  return change > 0.01 ? '↑' : change < -0.01 ? '↓' : '=';
};

type Input = {
  sessions: WorkoutSession[];
  weights: Record<string, number>;
  armMeasurements: Record<string, number>;
  programId: string;
  settings: Settings;
  extraSets: Record<string, number>;
};

export const buildCheckin = (input: Input, today: string): string => {
  const { mon, fri, sun } = checkinWeek(today);
  const prevMon = addDays(mon, -7);
  const prevFri = addDays(fri, -7);
  const lines: string[] = [];

  lines.push(`HAFTALIK CHECK-IN – ${rangeLabel(mon, fri)}`, '');

  // ---------- Kilo ----------
  const weekWeights = Object.entries(input.weights)
    .filter(([d]) => inRange(d, mon, fri))
    .sort(([a], [b]) => (a < b ? -1 : 1));
  const prevWeights = Object.entries(input.weights)
    .filter(([d]) => inRange(d, prevMon, prevFri))
    .map(([, w]) => w);
  const nowAvg = avg(weekWeights.map(([, w]) => w));
  const prevAvg = avg(prevWeights);
  lines.push('KİLO');
  lines.push(
    `Girilen günler: ${weekWeights.length ? weekWeights.map(([d, w]) => `${dm(d)}: ${num(w)}`).join(', ') : 'yok'}`
  );
  const diff =
    nowAvg !== null && prevAvg !== null ? `${nowAvg - prevAvg >= 0 ? '+' : '-'}${num(Math.abs(nowAvg - prevAvg))} kg` : '—';
  lines.push(
    `Haftalık ortalama: ${nowAvg === null ? '—' : `${num(nowAvg)} kg`} (geçen hafta: ${
      prevAvg === null ? '—' : `${num(prevAvg)} kg`
    }, fark: ${diff})`,
    ''
  );

  // ---------- Antrenman ----------
  lines.push('ANTRENMAN');
  const week = input.sessions
    .filter((s) => s.completedAt && inRange(s.date, mon, fri))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.completedAt ?? 0) - (b.completedAt ?? 0)));
  if (week.length === 0) lines.push('Bu hafta tamamlanan antrenman yok.');
  week.forEach((session) => {
    lines.push(`${dayById(session.dayId)?.name ?? session.dayId} – ${dm(session.date)}`);
    session.exercises.forEach((ex) => {
      const name = exerciseById(ex.exerciseId)?.name ?? ex.exerciseId;
      const current = formatSetsShort(ex.sets) || 'kayıt yok';
      // Geçen hafta: önce aynı gün (Torso A ↔ Torso A), yoksa geçen haftanın herhangi bir seansı.
      const history = exerciseHistory(input.sessions, ex.exerciseId).filter(
        (h) => h.session.date < session.date && inRange(h.session.date, prevMon, addDays(prevMon, 6))
      );
      const prev = history.find((h) => h.session.dayId === session.dayId) ?? history[0];
      const prevText = prev ? formatSetsShort(prev.exercise.sets) : 'kayıt yok';
      const first = ex.sets.find(isLogged);
      const prevFirst = prev?.exercise.sets.find(isLogged);
      const arrow = first && prevFirst ? ` ${progressArrow(setE1RM(first), setE1RM(prevFirst))}` : '';
      lines.push(`- ${name}: ${current} (geçen hafta: ${prevText})${arrow}`);
    });
  });
  lines.push('');

  // ---------- Uyarılar ----------
  lines.push('UYARILAR');
  const warnings: string[] = [];
  const program = getProgram(input.programId);
  const seen = new Set<string>();
  Object.values(program.days).forEach((day) => {
    if (day.kind !== 'workout') return;
    day.exercises.forEach((pe) => {
      const key = `${day.id}:${pe.exerciseId}`;
      if (seen.has(key)) return;
      seen.add(key);
      const sug = buildSuggestion(input.sessions, pe.exerciseId, day.id, pe.repMax, input.settings);
      if (sug.kind === 'stall')
        warnings.push(`${exerciseById(pe.exerciseId)?.name ?? pe.exerciseId} (${day.name}): 3 seanstır ilerleme yok`);
    });
  });
  week.forEach((session) =>
    session.exercises.forEach((ex) => {
      const n = skippedCount(ex);
      if (n > 0)
        warnings.push(
          `${dayById(session.dayId)?.name ?? session.dayId} ${dm(session.date)} · ${
            exerciseById(ex.exerciseId)?.name ?? ex.exerciseId
          }: ${n} set atlandı`
        );
    })
  );
  const preacherKey = `${PREACHER_THRESHOLD.dayId}:${PREACHER_THRESHOLD.exerciseId}`;
  const hit = preacherThresholdHit(input.sessions, PREACHER_THRESHOLD);
  if (hit && !(input.extraSets[preacherKey] > 0))
    warnings.push(
      `Preacher Curl (Limbs B): ${dm(hit.date)} 1. sette ${num(hit.weight, hit.weight % 1 ? 1 : 0)}×${
        hit.reps
      } — 12,5 kg × 9 eşiği geçildi, 3. set eklenecek`
    );
  if (warnings.length === 0) lines.push('- Yok');
  warnings.forEach((w) => lines.push(`- ${w}`));
  lines.push('');

  // ---------- Kol ölçüsü ----------
  lines.push('KOL ÖLÇÜSÜ');
  const arms = Object.entries(input.armMeasurements)
    .filter(([d]) => inRange(d, mon, sun))
    .sort(([a], [b]) => (a < b ? -1 : 1));
  if (arms.length === 0) lines.push('Bu hafta ölçüm yok.');
  arms.forEach(([d, cm]) => lines.push(`${dm(d)}: ${num(cm, 1)} cm`));

  return lines.join('\n');
};
