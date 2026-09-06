import { CARB_SOURCE_ID, PROTEIN_SOURCE_ID } from '../data/foods';
import { DayMeal, Food, Macros, Meal, MealItem } from '../types';

export const emptyMacros = (): Macros => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

export const itemMacros = (item: MealItem, foods: Record<string, Food>): Macros => {
  const food = foods[item.foodId];
  if (!food) return emptyMacros();
  const k = item.amount / 100;
  return {
    kcal: food.kcal * k,
    protein: food.protein * k,
    carbs: food.carbs * k,
    fat: food.fat * k,
  };
};

export const sumMacros = (list: Macros[]): Macros =>
  list.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    emptyMacros()
  );

export const mealMacros = (meal: Meal, foods: Record<string, Food>): Macros =>
  sumMacros(meal.items.map((i) => itemMacros(i, foods)));

export const planMacros = (meals: Meal[], foods: Record<string, Food>): Macros =>
  sumMacros(meals.map((m) => mealMacros(m, foods)));

export const eatenMacros = (meals: DayMeal[], foods: Record<string, Food>): Macros =>
  sumMacros(meals.filter((m) => m.eaten).map((m) => mealMacros(m, foods)));

/**
 * Dinlenme gününde ilk öğün dışındaki öğünlerin karbonhidrat kaynağı düşürülür
 * (varsayılan: pirinç 120 g → 85 g).
 */
export const applyRestDay = (meals: Meal[], reduction: number): Meal[] =>
  meals.map((meal, index) => {
    if (index === 0) return meal;
    return {
      ...meal,
      items: meal.items.map((item) =>
        item.foodId === CARB_SOURCE_ID
          ? { ...item, amount: Math.max(0, Math.round(item.amount - reduction)) }
          : item
      ),
    };
  });

export const buildDayMeals = (
  plan: Meal[],
  isTraining: boolean,
  reduction: number
): DayMeal[] => {
  const base = isTraining ? plan : applyRestDay(plan, reduction);
  return base.map((m) => ({
    ...m,
    items: m.items.map((i) => ({ ...i })),
    eaten: false,
  }));
};

/** Kalori değişimini karbonhidrat (pirinç) gramajına çevirir: 1 g pirinç ≈ 3,6 kcal. */
export const kcalToCarbGrams = (kcalDelta: number, foods: Record<string, Food>): number => {
  const food = foods[CARB_SOURCE_ID];
  const per100 = food ? food.kcal : 360;
  const grams = (kcalDelta / per100) * 100;
  // 10 g'ın katına yuvarla; iki öğüne bölündüğünde 5 g'lık adımlar çıkar.
  return Math.round(grams / 10) * 10;
};

/** Karbonhidrat kaynağı bulunan öğünlerin indeksleri (ilk öğün hariç tutulur). */
const carbMealIndexes = (meals: Meal[]): number[] => {
  const idx = meals
    .map((m, i) => (m.items.some((it) => it.foodId === CARB_SOURCE_ID) ? i : -1))
    .filter((i) => i > 0);
  return idx.length > 0 ? idx : meals.map((_, i) => (i > 0 ? i : -1)).filter((i) => i >= 0);
};

export type PlanDiff = {
  mealId: string;
  mealName: string;
  foodId: string;
  from: number;
  to: number;
};

/** Toplam `grams` kadar karbonhidratı öğünlere eşit dağıtır. */
export const distributeCarbs = (meals: Meal[], grams: number): Meal[] => {
  const targets = carbMealIndexes(meals);
  if (targets.length === 0 || grams === 0) return meals;
  const per = Math.round(grams / targets.length / 5) * 5;
  if (per === 0) return meals;
  return meals.map((meal, index) => {
    if (!targets.includes(index)) return meal;
    const hasCarb = meal.items.some((i) => i.foodId === CARB_SOURCE_ID);
    const items = hasCarb
      ? meal.items.map((i) =>
          i.foodId === CARB_SOURCE_ID ? { ...i, amount: Math.max(0, i.amount + per) } : i
        )
      : [...meal.items, { foodId: CARB_SOURCE_ID, amount: Math.max(0, per) }];
    return { ...meal, items };
  });
};

/** Protein tabanının altına düşülmüşse protein kaynağını artırarak dengeler. */
export const enforceProteinFloor = (
  meals: Meal[],
  foods: Record<string, Food>,
  floor: number
): Meal[] => {
  let current = meals;
  let guard = 0;
  while (planMacros(current, foods).protein < floor && guard < 40) {
    const targets = current
      .map((m, i) => (m.items.some((it) => it.foodId === PROTEIN_SOURCE_ID) ? i : -1))
      .filter((i) => i >= 0);
    if (targets.length === 0) break;
    const bump = targets[guard % targets.length];
    current = current.map((meal, index) =>
      index === bump
        ? {
            ...meal,
            items: meal.items.map((i) =>
              i.foodId === PROTEIN_SOURCE_ID ? { ...i, amount: i.amount + 10 } : i
            ),
          }
        : meal
    );
    guard += 1;
  }
  return current;
};

export const diffPlans = (before: Meal[], after: Meal[]): PlanDiff[] => {
  const out: PlanDiff[] = [];
  after.forEach((meal, index) => {
    const prev = before[index];
    if (!prev) return;
    meal.items.forEach((item) => {
      const prevItem = prev.items.find((i) => i.foodId === item.foodId);
      const from = prevItem ? prevItem.amount : 0;
      if (Math.round(from) !== Math.round(item.amount)) {
        out.push({
          mealId: meal.id,
          mealName: meal.name,
          foodId: item.foodId,
          from,
          to: item.amount,
        });
      }
    });
  });
  return out;
};

export const macroPct = (value: number, target: number): number =>
  target > 0 ? Math.min(1.5, value / target) : 0;
