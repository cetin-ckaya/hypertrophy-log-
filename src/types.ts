export type MuscleGroup =
  | 'sirt' | 'gogus' | 'omuz' | 'biceps' | 'triceps'
  | 'bacak' | 'onkol' | 'kalf' | 'trapez';

export type ExerciseType = 'compound' | 'isolation';

export type Exercise = {
  id: string;
  name: string;
  group: MuscleGroup;
  type: ExerciseType;
};

export type PlannedExercise = {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  section: string;
};

export type DayKind = 'workout' | 'rest';

export type TrainingDay = {
  id: string;          // 'pull1' | 'push1' | 'legs' | 'rest' | 'pull2' | 'push2'
  name: string;
  kind: DayKind;
  exercises: PlannedExercise[];
};

export type SetLog = {
  weight: number;
  reps: number;
  done: boolean;
};

export type SessionExercise = {
  exerciseId: string;
  repMin: number;
  repMax: number;
  sets: SetLog[];
};

export type WorkoutSession = {
  id: string;
  dayId: string;
  date: string;          // YYYY-MM-DD
  startedAt: number;
  completedAt?: number;
  exercises: SessionExercise[];
};

export type FoodUnit = 'g' | 'ml';

export type Food = {
  id: string;
  name: string;
  unit: FoodUnit;
  kcal: number;      // per 100 g / ml
  protein: number;
  carbs: number;
  fat: number;
  custom?: boolean;
};

export type MealItem = { foodId: string; amount: number };

export type Meal = {
  id: string;
  name: string;
  items: MealItem[];
};

export type DayMeal = Meal & { eaten: boolean };

export type DayLog = {
  date: string;
  isTraining: boolean;
  meals: DayMeal[];
};

export type Macros = { kcal: number; protein: number; carbs: number; fat: number };

export type AdjustmentChange = {
  mealId: string;
  mealName: string;
  foodId: string;
  foodName: string;
  from: number;
  to: number;
};

export type Adjustment = {
  id: string;
  date: string;
  weeklyChangeKg: number;
  avgNow: number;
  avgPrev: number;
  kcalDelta: number;
  fromKcal: number;
  toKcal: number;
  reason: string;
  message: string;
  changes: AdjustmentChange[];
  plan?: Meal[];
  status: 'pending' | 'applied' | 'rejected';
};

export type Settings = {
  restSeconds: number;
  compoundIncrement: number;
  isolationIncrement: number;
  restDayCarbReduction: number;   // g of rice removed per meal on rest days
  proteinFloor: number;
  autoAdjustEnabled: boolean;
};

export type Profile = {
  age: number;
  heightCm: number;
  startWeightKg: number;
};
