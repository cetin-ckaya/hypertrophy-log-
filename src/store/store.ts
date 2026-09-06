import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CARB_SOURCE_ID, DEFAULT_FOODS, DEFAULT_PLAN } from '../data/foods';
import { CYCLE, DAYS, cycleDay } from '../data/program';
import { addDays, daysBetween, todayKey } from '../logic/date';
import {
  buildDayMeals,
  diffPlans,
  distributeCarbs,
  enforceProteinFloor,
  kcalToCarbGrams,
  planMacros,
} from '../logic/nutrition';
import { buildSuggestion } from '../logic/progression';
import { decideAdjustment, weeklyTrend } from '../logic/weight';
import {
  Adjustment,
  DayLog,
  Food,
  Meal,
  Profile,
  Settings,
  SetLog,
  WorkoutSession,
} from '../types';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_SETTINGS: Settings = {
  restSeconds: 120,
  compoundIncrement: 2.5,
  isolationIncrement: 1.25,
  restDayCarbReduction: 60,
  proteinFloor: 165,
  autoAdjustEnabled: true,
};

const DEFAULT_PROFILE: Profile = { age: 22, heightCm: 188, startWeightKg: 78 };

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export type ExportPayload = {
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
};

type State = {
  hydrated: boolean;
  profile: Profile;
  settings: Settings;

  cycleIndex: number;
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;

  foods: Record<string, Food>;
  plan: Meal[];
  calorieTarget: number;
  macroTargets: { protein: number; carbs: number; fat: number };
  targetHistory: { date: string; kcal: number }[];
  dayLogs: Record<string, DayLog>;

  weights: Record<string, number>;
  pendingAdjustment: Adjustment | null;
  adjustments: Adjustment[];
};

type Actions = {
  setHydrated: (v: boolean) => void;

  // Antrenman
  setCycleIndex: (i: number) => void;
  advanceCycle: () => void;
  startWorkout: (dayId?: string) => void;
  updateSet: (exIndex: number, setIndex: number, patch: Partial<SetLog>) => void;
  toggleSetDone: (exIndex: number, setIndex: number) => void;
  addSet: (exIndex: number) => void;
  removeSet: (exIndex: number) => void;
  completeWorkout: () => void;
  discardWorkout: () => void;
  deleteSession: (id: string) => void;

  // Beslenme
  ensureDay: (date: string) => void;
  setDayTraining: (date: string, isTraining: boolean) => void;
  toggleMealEaten: (date: string, mealId: string) => void;
  setDayItemAmount: (date: string, mealId: string, foodId: string, amount: number) => void;
  addDayItem: (date: string, mealId: string, foodId: string, amount: number) => void;
  removeDayItem: (date: string, mealId: string, foodId: string) => void;
  resetDayFromPlan: (date: string) => void;
  setPlanItemAmount: (mealId: string, foodId: string, amount: number) => void;
  addPlanItem: (mealId: string, foodId: string, amount: number) => void;
  removePlanItem: (mealId: string, foodId: string) => void;
  addFood: (food: Omit<Food, 'custom'>) => void;
  removeFood: (foodId: string) => void;
  setCalorieTarget: (kcal: number) => void;
  matchPlanToTarget: () => void;

  // Kilo & otomatik ayar
  logWeight: (date: string, kg: number) => void;
  removeWeight: (date: string) => void;
  checkAdjustment: () => void;
  applyAdjustment: () => void;
  rejectAdjustment: () => void;

  // Genel
  updateSettings: (patch: Partial<Settings>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  exportPayload: () => ExportPayload;
  importPayload: (raw: string) => { ok: boolean; error?: string };
  resetAll: () => void;
};

export type Store = State & Actions;

const initialState = (): State => ({
  hydrated: false,
  profile: DEFAULT_PROFILE,
  settings: DEFAULT_SETTINGS,
  cycleIndex: 0,
  sessions: [],
  activeSession: null,
  foods: clone(DEFAULT_FOODS),
  plan: clone(DEFAULT_PLAN),
  calorieTarget: 3300,
  macroTargets: { protein: 165, carbs: 488, fat: 72 },
  targetHistory: [{ date: todayKey(), kcal: 3300 }],
  dayLogs: {},
  weights: {},
  pendingAdjustment: null,
  adjustments: [],
});

/** Var olan günlüğü döndürür; yoksa plandan türetilmiş (henüz kaydedilmemiş) bir taslak üretir. */
export const dayLogFor = (state: State, date: string): DayLog => {
  const existing = state.dayLogs[date];
  if (existing) return existing;
  const isTraining =
    date === todayKey() ? cycleDay(state.cycleIndex).kind === 'workout' : true;
  return {
    date,
    isTraining,
    meals: buildDayMeals(
      state.plan,
      isTraining,
      state.settings.restDayCarbReduction,
      state.foods,
      state.settings.proteinFloor
    ),
  };
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState(),

      setHydrated: (v) => set({ hydrated: v }),

      // ---------- Antrenman ----------
      setCycleIndex: (i) => set({ cycleIndex: ((i % CYCLE.length) + CYCLE.length) % CYCLE.length }),

      advanceCycle: () => set((s) => ({ cycleIndex: (s.cycleIndex + 1) % CYCLE.length })),

      startWorkout: (dayId) => {
        const s = get();
        const day = dayId ? DAYS[dayId] : cycleDay(s.cycleIndex);
        if (!day || day.kind !== 'workout') return;
        const session: WorkoutSession = {
          id: uid(),
          dayId: day.id,
          date: todayKey(),
          startedAt: Date.now(),
          exercises: day.exercises.map((p) => {
            const sug = buildSuggestion(s.sessions, p.exerciseId, day.id, p.repMax, s.settings);
            const weight = sug.targetWeight ?? 0;
            return {
              exerciseId: p.exerciseId,
              repMin: p.repMin,
              repMax: p.repMax,
              sets: Array.from({ length: p.sets }, () => ({ weight, reps: 0, done: false })),
            };
          }),
        };
        set({ activeSession: session });
      },

      updateSet: (exIndex, setIndex, patch) =>
        set((s) => {
          if (!s.activeSession) return s;
          const active = clone(s.activeSession);
          const target = active.exercises[exIndex]?.sets[setIndex];
          if (!target) return s;
          active.exercises[exIndex].sets[setIndex] = { ...target, ...patch };
          return { activeSession: active };
        }),

      toggleSetDone: (exIndex, setIndex) =>
        set((s) => {
          if (!s.activeSession) return s;
          const active = clone(s.activeSession);
          const target = active.exercises[exIndex]?.sets[setIndex];
          if (!target) return s;
          target.done = !target.done;
          return { activeSession: active };
        }),

      addSet: (exIndex) =>
        set((s) => {
          if (!s.activeSession) return s;
          const active = clone(s.activeSession);
          const ex = active.exercises[exIndex];
          if (!ex) return s;
          const last = ex.sets[ex.sets.length - 1];
          ex.sets.push({ weight: last ? last.weight : 0, reps: 0, done: false });
          return { activeSession: active };
        }),

      removeSet: (exIndex) =>
        set((s) => {
          if (!s.activeSession) return s;
          const active = clone(s.activeSession);
          const ex = active.exercises[exIndex];
          if (!ex || ex.sets.length <= 1) return s;
          ex.sets.pop();
          return { activeSession: active };
        }),

      completeWorkout: () =>
        set((s) => {
          if (!s.activeSession) return s;
          const finished: WorkoutSession = { ...clone(s.activeSession), completedAt: Date.now() };
          const date = finished.date;
          const dayLogs = { ...s.dayLogs };
          const log = dayLogFor(s, date);
          if (!log.isTraining) {
            dayLogs[date] = {
              ...log,
              isTraining: true,
              meals: log.meals.map((m, i) => {
                if (m.eaten) return m;
                const planned = s.plan[i];
                return planned
                  ? { ...m, items: planned.items.map((it) => ({ ...it })) }
                  : m;
              }),
            };
          } else {
            dayLogs[date] = log;
          }
          return {
            sessions: [...s.sessions, finished],
            activeSession: null,
            cycleIndex: (CYCLE.indexOf(finished.dayId) + 1) % CYCLE.length,
            dayLogs,
          };
        }),

      discardWorkout: () => set({ activeSession: null }),

      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      // ---------- Beslenme ----------
      ensureDay: (date) =>
        set((s) => (s.dayLogs[date] ? s : { dayLogs: { ...s.dayLogs, [date]: dayLogFor(s, date) } })),

      setDayTraining: (date, isTraining) =>
        set((s) => {
          const log = dayLogFor(s, date);
          const rebuilt = buildDayMeals(
            s.plan,
            isTraining,
            s.settings.restDayCarbReduction,
            s.foods,
            s.settings.proteinFloor
          );
          return {
            dayLogs: {
              ...s.dayLogs,
              [date]: {
                ...log,
                isTraining,
                meals: log.meals.map((m, i) =>
                  m.eaten ? m : { ...m, items: rebuilt[i] ? rebuilt[i].items : m.items }
                ),
              },
            },
          };
        }),

      toggleMealEaten: (date, mealId) =>
        set((s) => {
          const log = dayLogFor(s, date);
          return {
            dayLogs: {
              ...s.dayLogs,
              [date]: {
                ...log,
                meals: log.meals.map((m) => (m.id === mealId ? { ...m, eaten: !m.eaten } : m)),
              },
            },
          };
        }),

      setDayItemAmount: (date, mealId, foodId, amount) =>
        set((s) => {
          const log = dayLogFor(s, date);
          return {
            dayLogs: {
              ...s.dayLogs,
              [date]: {
                ...log,
                meals: log.meals.map((m) =>
                  m.id === mealId
                    ? {
                        ...m,
                        items: m.items.map((i) =>
                          i.foodId === foodId ? { ...i, amount: Math.max(0, amount) } : i
                        ),
                      }
                    : m
                ),
              },
            },
          };
        }),

      addDayItem: (date, mealId, foodId, amount) =>
        set((s) => {
          const log = dayLogFor(s, date);
          return {
            dayLogs: {
              ...s.dayLogs,
              [date]: {
                ...log,
                meals: log.meals.map((m) =>
                  m.id === mealId && !m.items.some((i) => i.foodId === foodId)
                    ? { ...m, items: [...m.items, { foodId, amount: Math.max(0, amount) }] }
                    : m
                ),
              },
            },
          };
        }),

      removeDayItem: (date, mealId, foodId) =>
        set((s) => {
          const log = dayLogFor(s, date);
          return {
            dayLogs: {
              ...s.dayLogs,
              [date]: {
                ...log,
                meals: log.meals.map((m) =>
                  m.id === mealId ? { ...m, items: m.items.filter((i) => i.foodId !== foodId) } : m
                ),
              },
            },
          };
        }),

      resetDayFromPlan: (date) =>
        set((s) => {
          const log = dayLogFor(s, date);
          return {
            dayLogs: {
              ...s.dayLogs,
              [date]: {
                ...log,
                meals: buildDayMeals(
                  s.plan,
                  log.isTraining,
                  s.settings.restDayCarbReduction,
                  s.foods,
                  s.settings.proteinFloor
                ),
              },
            },
          };
        }),

      setPlanItemAmount: (mealId, foodId, amount) =>
        set((s) => ({
          plan: s.plan.map((m) =>
            m.id === mealId
              ? {
                  ...m,
                  items: m.items.map((i) =>
                    i.foodId === foodId ? { ...i, amount: Math.max(0, amount) } : i
                  ),
                }
              : m
          ),
        })),

      addPlanItem: (mealId, foodId, amount) =>
        set((s) => ({
          plan: s.plan.map((m) =>
            m.id === mealId && !m.items.some((i) => i.foodId === foodId)
              ? { ...m, items: [...m.items, { foodId, amount: Math.max(0, amount) }] }
              : m
          ),
        })),

      removePlanItem: (mealId, foodId) =>
        set((s) => ({
          plan: s.plan.map((m) =>
            m.id === mealId ? { ...m, items: m.items.filter((i) => i.foodId !== foodId) } : m
          ),
        })),

      addFood: (food) =>
        set((s) => ({ foods: { ...s.foods, [food.id]: { ...food, custom: true } } })),

      removeFood: (foodId) =>
        set((s) => {
          const foods = { ...s.foods };
          if (foods[foodId]?.custom) delete foods[foodId];
          return { foods };
        }),

      setCalorieTarget: (kcal) =>
        set((s) => ({
          calorieTarget: Math.max(0, Math.round(kcal)),
          targetHistory: [...s.targetHistory, { date: todayKey(), kcal: Math.round(kcal) }],
        })),

      matchPlanToTarget: () =>
        set((s) => {
          const current = planMacros(s.plan, s.foods).kcal;
          const delta = s.calorieTarget - current;
          if (Math.abs(delta) < 40) return s;
          const grams = kcalToCarbGrams(delta, s.foods);
          const next = enforceProteinFloor(
            distributeCarbs(s.plan, grams),
            s.foods,
            s.settings.proteinFloor
          );
          return { plan: next };
        }),

      // ---------- Kilo ----------
      logWeight: (date, kg) =>
        set((s) => ({ weights: { ...s.weights, [date]: Math.round(kg * 10) / 10 } })),

      removeWeight: (date) =>
        set((s) => {
          const weights = { ...s.weights };
          delete weights[date];
          return { weights };
        }),

      checkAdjustment: () => {
        const s = get();
        if (!s.settings.autoAdjustEnabled || s.pendingAdjustment) return;
        const trend = weeklyTrend(s.weights);
        if (!trend.ready || trend.changeKg === null || !trend.endDate) return;

        const last = s.adjustments[s.adjustments.length - 1];
        if (last && daysBetween(last.date, trend.endDate) < 7) return;

        const decision = decideAdjustment(trend.changeKg);
        const grams = decision.kcalDelta === 0 ? 0 : kcalToCarbGrams(decision.kcalDelta, s.foods);
        const nextPlan =
          grams === 0
            ? s.plan
            : enforceProteinFloor(
                distributeCarbs(s.plan, grams),
                s.foods,
                s.settings.proteinFloor
              );
        const diffs = diffPlans(s.plan, nextPlan);
        const toKcal = s.calorieTarget + decision.kcalDelta;

        const changeText = `${trend.changeKg >= 0 ? '' : '−'}${Math.abs(trend.changeKg).toFixed(2).replace('.', ',')} kg`;
        const head = `Bu hafta ortalama ${changeText} değiştin. ${decision.reason}`;
        const body =
          decision.kcalDelta === 0
            ? 'Kalori hedefinde değişiklik yapmıyorum.'
            : `Günlük kalorini ${s.calorieTarget} → ${toKcal} kcal'a ${decision.kcalDelta > 0 ? 'çıkarıyorum' : 'düşürüyorum'}.`;

        const adjustment: Adjustment = {
          id: uid(),
          date: trend.endDate,
          weeklyChangeKg: trend.changeKg,
          avgNow: trend.avgNow as number,
          avgPrev: trend.avgPrev as number,
          kcalDelta: decision.kcalDelta,
          fromKcal: s.calorieTarget,
          toKcal,
          reason: decision.headline,
          message: `${head} ${body}`,
          changes: diffs.map((d) => ({
            mealId: d.mealId,
            mealName: d.mealName,
            foodId: d.foodId,
            foodName: s.foods[d.foodId]?.name ?? d.foodId,
            from: d.from,
            to: d.to,
          })),
          plan: nextPlan,
          status: 'pending',
        };
        set({ pendingAdjustment: adjustment });
      },

      applyAdjustment: () =>
        set((s) => {
          const adj = s.pendingAdjustment;
          if (!adj) return s;
          const applied: Adjustment = { ...adj, status: 'applied', plan: undefined };
          const carbFood = s.foods[CARB_SOURCE_ID];
          const carbPer = carbFood ? carbFood.carbs / 100 : 0.79;
          const gramDelta = adj.changes
            .filter((c) => c.foodId === CARB_SOURCE_ID)
            .reduce((sum, c) => sum + (c.to - c.from), 0);
          return {
            plan: adj.plan ? adj.plan : s.plan,
            calorieTarget: adj.toKcal,
            macroTargets: {
              ...s.macroTargets,
              carbs: Math.round(s.macroTargets.carbs + gramDelta * carbPer),
            },
            targetHistory: [...s.targetHistory, { date: adj.date, kcal: adj.toKcal }],
            adjustments: [...s.adjustments, applied],
            pendingAdjustment: null,
          };
        }),

      rejectAdjustment: () =>
        set((s) => {
          const adj = s.pendingAdjustment;
          if (!adj) return s;
          return {
            adjustments: [...s.adjustments, { ...adj, status: 'rejected', plan: undefined }],
            pendingAdjustment: null,
          };
        }),

      // ---------- Genel ----------
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      exportPayload: () => {
        const s = get();
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          data: {
            profile: s.profile,
            settings: s.settings,
            cycleIndex: s.cycleIndex,
            sessions: s.sessions,
            foods: s.foods,
            plan: s.plan,
            calorieTarget: s.calorieTarget,
            macroTargets: s.macroTargets,
            targetHistory: s.targetHistory,
            dayLogs: s.dayLogs,
            weights: s.weights,
            adjustments: s.adjustments,
          },
        };
      },

      importPayload: (raw) => {
        try {
          const parsed = JSON.parse(raw);
          const data = parsed?.data ?? parsed;
          if (!data || typeof data !== 'object') return { ok: false, error: 'Geçersiz JSON yapısı.' };
          const base = initialState();
          set({
            profile: data.profile ?? base.profile,
            settings: { ...base.settings, ...(data.settings ?? {}) },
            cycleIndex: typeof data.cycleIndex === 'number' ? data.cycleIndex : 0,
            sessions: Array.isArray(data.sessions) ? data.sessions : [],
            foods: { ...base.foods, ...(data.foods ?? {}) },
            plan: Array.isArray(data.plan) ? data.plan : base.plan,
            calorieTarget: data.calorieTarget ?? base.calorieTarget,
            macroTargets: data.macroTargets ?? base.macroTargets,
            targetHistory: Array.isArray(data.targetHistory) ? data.targetHistory : base.targetHistory,
            dayLogs: data.dayLogs ?? {},
            weights: data.weights ?? {},
            adjustments: Array.isArray(data.adjustments) ? data.adjustments : [],
            pendingAdjustment: null,
            activeSession: null,
          });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: 'JSON okunamadı. Dosyanın tamamını yapıştırdığından emin ol.' };
        }
      },

      resetAll: () => set({ ...initialState(), hydrated: true }),
    }),
    {
      name: 'hipertrofi-store-v1',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * v3: öğün planı protein 165 g / yağ 72 g hedefine göre yeniden kuruldu,
       * kalan kalori pirinçten tamamlandı. Kullanıcı beslenme tarafına hiç dokunmadıysa
       * (günlük kaydı ve kalori ayarı yoksa) yeni varsayılanlar uygulanır;
       * dokunduysa mevcut planı bozmamak için olduğu gibi bırakılır.
       */
      migrate: (persisted, version) => {
        const state = persisted as Partial<State> | undefined;
        if (!state) return persisted as Store;
        if (version < 3) {
          const untouched =
            Object.keys(state.dayLogs ?? {}).length === 0 &&
            (state.adjustments ?? []).length === 0;
          if (untouched) {
            const base = initialState();
            return {
              ...state,
              plan: base.plan,
              macroTargets: base.macroTargets,
              calorieTarget: base.calorieTarget,
              targetHistory: base.targetHistory,
              settings: {
                ...base.settings,
                ...(state.settings ?? {}),
                restDayCarbReduction: base.settings.restDayCarbReduction,
              },
            } as Store;
          }
        }
        return persisted as Store;
      },
      partialize: (s) => {
        const { hydrated, ...rest } = s;
        return rest as Store;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

export const yesterday = () => addDays(todayKey(), -1);
