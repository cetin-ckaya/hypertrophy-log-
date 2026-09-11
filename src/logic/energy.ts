import { ActivityKey, EnergyTargets, GoalKey, Profile, Sex } from '../types';

export const SEXES: { key: Sex; label: string }[] = [
  { key: 'erkek', label: 'Erkek' },
  { key: 'kadin', label: 'Kadın' },
];

export const ACTIVITIES: { key: ActivityKey; label: string; hint: string; factor: number }[] = [
  { key: 'sedanter', label: 'Hareketsiz', hint: 'Antrenman yok, masa başı', factor: 1.2 },
  { key: 'hafif', label: 'Hafif aktif', hint: 'Haftada 1–3 antrenman', factor: 1.375 },
  { key: 'orta', label: 'Orta aktif', hint: 'Haftada 3–5 antrenman', factor: 1.55 },
  { key: 'cok', label: 'Çok aktif', hint: 'Haftada 6–7 antrenman', factor: 1.725 },
];

export const GOALS: {
  key: GoalKey;
  label: string;
  hint: string;
  kcalDelta: number;
  proteinPerKg: number;
  fatRatio: number;
}[] = [
  {
    key: 'hacim',
    label: 'Hacim',
    hint: 'Haftada 0,25–0,50 kg artış',
    kcalDelta: 350,
    proteinPerKg: 2.0,
    fatRatio: 0.25,
  },
  {
    key: 'koruma',
    label: 'Koruma',
    hint: 'Kiloyu sabit tut',
    kcalDelta: 0,
    proteinPerKg: 2.0,
    fatRatio: 0.28,
  },
  {
    key: 'kesim',
    label: 'Kesim',
    hint: 'Haftada 0,4–0,5 kg kayıp',
    kcalDelta: -400,
    proteinPerKg: 2.2,
    fatRatio: 0.28,
  },
];

export const activityOf = (key: ActivityKey) =>
  ACTIVITIES.find((a) => a.key === key) ?? ACTIVITIES[2];
export const goalOf = (key: GoalKey) => GOALS.find((g) => g.key === key) ?? GOALS[0];

/**
 * Mifflin-St Jeor bazal metabolizma hızı.
 * Erkek: 10×kg + 6,25×cm − 5×yaş + 5
 * Kadın: 10×kg + 6,25×cm − 5×yaş − 161
 */
export const bmr = (sex: Sex, weightKg: number, heightCm: number, age: number): number =>
  10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'erkek' ? 5 : -161);

/**
 * Profil + güncel kilodan günlük kalori ve makro hedeflerini üretir.
 * Protein g/kg üzerinden, yağ kalorinin yüzdesi olarak; kalan karbonhidrat.
 */
export const computeTargets = (profile: Profile, weightKg: number): EnergyTargets => {
  const activity = activityOf(profile.activity);
  const goal = goalOf(profile.goal);

  const base = bmr(profile.sex, weightKg, profile.heightCm, profile.age);
  const tdee = base * activity.factor;
  const kcal = Math.max(1200, tdee + goal.kcalDelta);

  const protein = Math.round(goal.proteinPerKg * weightKg);
  const fat = Math.max(Math.round(0.6 * weightKg), Math.round((kcal * goal.fatRatio) / 9));
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

  return {
    bmr: Math.round(base),
    tdee: Math.round(tdee),
    kcal: Math.round(kcal / 10) * 10,
    protein,
    carbs,
    fat,
    weightKg,
  };
};
