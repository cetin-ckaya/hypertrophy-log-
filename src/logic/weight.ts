import { addDays, daysBetween, toKey } from './date';

export type WeightPoint = { date: string; weight: number; average: number | null };

const inRange = (key: string, from: string, to: string) =>
  daysBetween(from, key) >= 0 && daysBetween(key, to) >= 0;

export const sortedWeights = (weights: Record<string, number>) =>
  Object.entries(weights)
    .filter(([, v]) => typeof v === 'number' && !Number.isNaN(v))
    .map(([date, weight]) => ({ date, weight }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

/** [date-6, date] penceresindeki girişlerin ortalaması. */
export const windowAverage = (
  weights: Record<string, number>,
  endDate: string,
  days = 7
): { avg: number | null; count: number } => {
  const start = addDays(endDate, -(days - 1));
  const values = sortedWeights(weights)
    .filter((e) => inRange(e.date, start, endDate))
    .map((e) => e.weight);
  if (values.length === 0) return { avg: null, count: 0 };
  return { avg: values.reduce((a, b) => a + b, 0) / values.length, count: values.length };
};

/** Grafik için günlük noktalar + 7 günlük hareketli ortalama. */
export const weightSeries = (weights: Record<string, number>): WeightPoint[] =>
  sortedWeights(weights).map((e) => ({
    date: e.date,
    weight: e.weight,
    average: windowAverage(weights, e.date).avg,
  }));

export const latestAverage = (weights: Record<string, number>): number | null => {
  const list = sortedWeights(weights);
  if (list.length === 0) return null;
  return windowAverage(weights, list[list.length - 1].date).avg;
};

export type WeeklyTrend = {
  ready: boolean;
  avgNow: number | null;
  avgPrev: number | null;
  changeKg: number | null;
  countNow: number;
  countPrev: number;
  endDate: string | null;
};

/** Son 7 gün ile ondan önceki 7 günün ortalamalarını karşılaştırır. */
export const weeklyTrend = (weights: Record<string, number>): WeeklyTrend => {
  const list = sortedWeights(weights);
  if (list.length === 0)
    return { ready: false, avgNow: null, avgPrev: null, changeKg: null, countNow: 0, countPrev: 0, endDate: null };

  const endDate = list[list.length - 1].date;
  const now = windowAverage(weights, endDate);
  const prev = windowAverage(weights, addDays(endDate, -7));
  const ready = now.count >= 4 && prev.count >= 4 && now.avg !== null && prev.avg !== null;
  return {
    ready,
    avgNow: now.avg,
    avgPrev: prev.avg,
    changeKg: ready ? (now.avg as number) - (prev.avg as number) : null,
    countNow: now.count,
    countPrev: prev.count,
    endDate,
  };
};

export type AdjustDecision = {
  kcalDelta: number;
  reason: string;
  headline: string;
};

/**
 * Hedef artış hızı: haftada 0,25–0,5 kg (naturel sporcu için ideal aralık).
 */
export const decideAdjustment = (changeKg: number): AdjustDecision => {
  if (changeKg < 0)
    return {
      kcalDelta: 250,
      reason: 'Kilo düşüyor — hacim döneminde olmaman gereken yerdesin.',
      headline: 'Kilo kaybı var',
    };
  if (changeKg < 0.25)
    return {
      kcalDelta: 150,
      reason: 'Artış hedef aralığın (0,25–0,5 kg) altında.',
      headline: 'Hedefin altında',
    };
  if (changeKg <= 0.5)
    return {
      kcalDelta: 0,
      reason: 'Artış hedef aralığında (0,25–0,5 kg). Doğru gidiyorsun.',
      headline: 'Hedef aralıkta',
    };
  return {
    kcalDelta: -150,
    reason: 'Artış 0,5 kg üzerinde — fazla yağlanma riski var.',
    headline: 'Hedefin üstünde',
  };
};

export const trendArrow = (changeKg: number | null): string => {
  if (changeKg === null) return '–';
  if (changeKg > 0.05) return '▲';
  if (changeKg < -0.05) return '▼';
  return '▬';
};

export const todayIso = () => toKey(new Date());
