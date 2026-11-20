import { WEEKDAY_NAMES, dayForDate, getProgram } from '../data/program';
import { DayLog, ReminderKey, Reminders, WorkoutSession } from '../types';
import { fromKey } from './date';

export const REMINDER_META: Record<ReminderKey, { title: string; when: string }> = {
  weigh: { title: 'Sabah tartı', when: 'Her gün' },
  workout: { title: 'Antrenman günü', when: 'Antrenman günleri' },
  checkin: { title: 'Haftalık check-in', when: 'Her Cuma' },
  measure: { title: 'Aylık kol ölçümü', when: 'Ayın son Cuması' },
  gainer: { title: 'Gainer', when: 'Her gün' },
};

export const REMINDER_ORDER: ReminderKey[] = ['weigh', 'workout', 'gainer', 'checkin', 'measure'];

/** Ayın son Cuma günü mü? (bir hafta sonrası başka aya düşüyorsa) */
export const isLastFridayOfMonth = (dateKey: string): boolean => {
  const d = fromKey(dateKey);
  if (d.getDay() !== 5) return false;
  const next = new Date(d);
  next.setDate(d.getDate() + 7);
  return next.getMonth() !== d.getMonth();
};

export const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const isValidTime = (hhmm: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm);

/** Gainer'lı öğün bugün "yedim" işaretlendi mi? Plan gainer içermiyorsa null. */
export const gainerEaten = (log: DayLog): boolean | null => {
  const meal = log.meals.find((m) => m.items.some((i) => i.foodId === 'gainer'));
  return meal ? meal.eaten : null;
};

export type DueReminder = { key: ReminderKey; title: string; body: string };

type Input = {
  reminders: Reminders;
  programId: string;
  cycleIndex: number;
  sessions: WorkoutSession[];
  activeDayId: string | null;
  weights: Record<string, number>;
  armMeasurements: Record<string, number>;
  todayLog: DayLog;
  dismissed: Record<string, string>;
};

/** Vakti gelmiş ve koşulu sağlanan hatırlatıcılar (uygulama içi kartlar). */
export const dueReminders = (input: Input, today: string, now: Date): DueReminder[] => {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const weekday = fromKey(today).getDay();
  const out: DueReminder[] = [];
  const ready = (key: ReminderKey) => {
    const r = input.reminders[key];
    return r?.enabled && nowMin >= minutesOf(r.time) && input.dismissed[key] !== today;
  };

  if (ready('weigh') && input.weights[today] === undefined)
    out.push({ key: 'weigh', title: 'Sabah tartı', body: 'Aç karnına, tuvaletten sonra tartıl.' });

  if (ready('workout')) {
    const day = dayForDate(input.programId, input.cycleIndex, today);
    const done = input.sessions.some((s) => s.date === today && s.completedAt);
    if (day.kind === 'workout' && !done && input.activeDayId === null)
      out.push({ key: 'workout', title: 'Antrenman günü', body: `Bugün: ${day.name}` });
  }

  if (ready('gainer') && gainerEaten(input.todayLog) === false)
    out.push({ key: 'gainer', title: 'Gainer', body: "Günlük gainer'ını içtin mi?" });

  if (ready('checkin') && weekday === 5)
    out.push({
      key: 'checkin',
      title: 'Haftalık check-in',
      body: 'Check-in zamanı: haftalık özeti kopyala ve koçuna gönder.',
    });

  if (ready('measure') && isLastFridayOfMonth(today) && input.armMeasurements[today] === undefined)
    out.push({
      key: 'measure',
      title: 'Kol ölçüm günü',
      body: 'Sabah, aç karnına, pompasız, kasılı, en kalın nokta.',
    });

  return out;
};

/** Bildirim sunucusunun (GitHub Actions) bilmesi gereken antrenman takvimi. */
export const scheduleNames = (programId: string): Record<number, string> => {
  const program = getProgram(programId);
  const out: Record<number, string> = {};
  if (!program.schedule) return out;
  program.schedule.forEach((id, wd) => {
    const d = program.days[id];
    if (d && d.kind === 'workout') out[wd] = d.name;
  });
  return out;
};

export const weekdayName = (wd: number) => WEEKDAY_NAMES[wd];
