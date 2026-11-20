import { Exercise, PlannedExercise, Program, TrainingDay } from '../types';

const ex = (
  id: string,
  name: string,
  group: Exercise['group'],
  type: Exercise['type']
): Exercise => ({ id, name, group, type });

export const EXERCISES: Record<string, Exercise> = Object.fromEntries(
  [
    // Sırt
    ex('deadlift', 'Deadlift', 'sirt', 'compound'),
    ex('tbar_row', 'T-Bar Row', 'sirt', 'compound'),
    ex('seated_close_row', 'Seated Close Grip Row', 'sirt', 'compound'),
    ex('wide_grip_row_machine', 'Wide Grip Row Machine', 'sirt', 'isolation'),
    ex('low_row', 'Low Row', 'sirt', 'isolation'),
    ex('lat_pulldown', 'Lat Pulldown', 'sirt', 'compound'),
    ex('close_lat_pulldown', 'Close Lat Pulldown', 'sirt', 'compound'),
    ex('single_arm_db_row', 'Single-Arm Dumbbell Row', 'sirt', 'compound'),
    ex('single_arm_supinated_row', 'Single-Arm Supinated Row', 'sirt', 'compound'),
    ex('back_pullover', 'Back Pullover', 'sirt', 'isolation'),
    ex('dumbbell_row', 'Dumbbell Row', 'sirt', 'compound'),
    ex('seated_row', 'Seated Row', 'sirt', 'compound'),
    ex('assisted_pullup', 'Assisted Pull-up', 'sirt', 'compound'),
    // Trapez
    ex('db_shrugs', 'Dumbbell Shrugs', 'trapez', 'isolation'),
    // Biceps
    ex('preacher_curl', 'Preacher Curl', 'biceps', 'isolation'),
    ex('cable_curl', 'Cable Curl', 'biceps', 'isolation'),
    ex('incline_db_curl', 'Incline Dumbbell Curl', 'biceps', 'isolation'),
    ex('db_biceps_curl', 'Dumbbell Biceps Curl', 'biceps', 'isolation'),
    ex('hammer_curl', 'Hammer Curl', 'biceps', 'isolation'),
    // Ön kol
    ex('cable_wrist_curl', 'Cable Wrist Curl', 'onkol', 'isolation'),
    ex('reverse_cable_curl', 'Reverse Cable Curl', 'onkol', 'isolation'),
    ex('rope_hammer_curl', 'Rope Hammer Curl', 'onkol', 'isolation'),
    // Göğüs
    ex('sm_incline_bench', 'SM Incline Bench Press', 'gogus', 'compound'),
    ex('chest_press_machine', 'Chest Press Machine', 'gogus', 'compound'),
    ex('chest_dips', 'Chest Dips', 'gogus', 'compound'),
    ex('cable_crossover', 'Cable Crossover', 'gogus', 'isolation'),
    // Triceps
    ex('overhead_triceps_ext', 'Overhead Triceps Extension', 'triceps', 'isolation'),
    ex('triceps_pushdown', 'Triceps Pushdown', 'triceps', 'isolation'),
    ex('db_triceps_ext', 'Dumbbell Triceps Extension', 'triceps', 'isolation'),
    // Omuz
    ex('shoulder_press_machine', 'Shoulder Press Machine', 'omuz', 'compound'),
    ex('cable_front_raise', 'Cable Front Raises', 'omuz', 'isolation'),
    ex('cable_lateral_raise', 'Cable Lateral Raise', 'omuz', 'isolation'),
    ex('db_lateral_raise', 'Dumbbell Lateral Raise', 'omuz', 'isolation'),
    ex('rear_delt_cable', 'Rear Delt Cable', 'omuz', 'isolation'),
    ex('face_pull', 'Face Pull', 'omuz', 'isolation'),
    // Kalça
    ex('sm_hip_thrust', 'Smith Machine Hip Thrust', 'kalca', 'compound'),
    ex('hip_thrust', 'Hip Thrust', 'kalca', 'compound'),
    ex('cable_glute_kickback', 'Cable Glute Kickback', 'kalca', 'isolation'),
    // Bacak
    ex('hack_squat', 'Hack Squats', 'bacak', 'compound'),
    ex('sumo_squat', 'Sumo Squat', 'bacak', 'compound'),
    ex('romanian_deadlift', 'Romanian Deadlift', 'bacak', 'compound'),
    ex('bulgarian_split_squat', 'Bulgarian Split Squat', 'bacak', 'compound'),
    ex('step_up_db', 'Step-up Dumbbell', 'bacak', 'compound'),
    ex('leg_press', 'Leg Press', 'bacak', 'compound'),
    ex('leg_extension', 'Leg Extension', 'bacak', 'isolation'),
    ex('sm_rdl', 'SM RDL', 'bacak', 'compound'),
    ex('lying_leg_curl', 'Lying Leg Curl', 'bacak', 'isolation'),
    ex('abductor_machine', 'Hip Abduction Machine', 'kalca', 'isolation'),
    ex('adductor_machine', 'Adductor Machine', 'bacak', 'isolation'),
    ex('calf_raise_machine', 'Calf Raises Machine', 'kalf', 'isolation'),
    // Torso / Limbs programı
    ex('machine_chest_fly', 'Machine Chest Fly', 'gogus', 'isolation'),
    ex('incline_db_bench', 'Incline Dumbbell Bench Press', 'gogus', 'compound'),
    ex('one_arm_lat_pulldown', 'One Arm Lat Pulldown', 'sirt', 'compound'),
    ex('cable_crunch', 'Cable Crunch', 'karin', 'isolation'),
    ex('one_arm_db_preacher', 'One Arm Dumbbell Preacher Curl', 'biceps', 'isolation'),
    // Limbs A ve Limbs B'de aynı hareket: geçmişi ortak.
    ex('cable_oh_triceps_ext', 'Cable Overhead Tricep Extension', 'triceps', 'isolation'),
    ex('seated_triceps_pushdown', 'Seated Triceps Pushdown', 'triceps', 'isolation'),
    ex('smith_calf_raise', 'Smith Machine Calf Raise', 'kalf', 'isolation'),
    ex('low_high_cable_fly', 'Low to High Cable Fly', 'gogus', 'isolation'),
    ex('iso_lateral_chest_press', 'Iso-Lateral Chest Press', 'gogus', 'compound'),
    ex('kelso_shrug', 'Kelso Shrug', 'trapez', 'isolation'),
    ex('lengthened_db_curl', 'Lengthened Dumbbell Curl', 'biceps', 'isolation'),
    ex('single_arm_triceps_pushdown', 'Single Arm Tricep Pushdown', 'triceps', 'isolation'),
    ex('squat', 'Squat', 'bacak', 'compound'),
  ].map((e) => [e.id, e])
);

/** Tüm hareketlerde hedef tekrar aralığı 6–8. */
export const REP_MIN = 6;
export const REP_MAX = 8;

const p = (
  exerciseId: string,
  sets: number,
  repMin: number,
  repMax: number,
  section: string
) => ({ exerciseId, sets, repMin, repMax, section });

const REST: TrainingDay = { id: 'rest', name: 'Dinlenme', kind: 'rest', exercises: [] };

const HYPERTROPHY_DAYS: Record<string, TrainingDay> = {
  pull1: {
    id: 'pull1',
    name: 'Pull 1',
    kind: 'workout',
    exercises: [
      p('deadlift', 2, 6, 8, 'Sırt — Compound'),
      p('tbar_row', 2, 6, 8, 'Sırt — Compound'),
      p('seated_close_row', 2, 6, 8, 'Sırt — Compound'),
      p('preacher_curl', 2, 6, 8, 'Biceps'),
      p('cable_curl', 2, 6, 8, 'Biceps'),
      p('wide_grip_row_machine', 2, 6, 8, 'Sırt — İzolasyon'),
      p('low_row', 2, 6, 8, 'Sırt — İzolasyon'),
      p('db_shrugs', 1, 6, 8, 'Sırt — İzolasyon'),
      p('cable_wrist_curl', 1, 6, 8, 'Ön Kol'),
      p('reverse_cable_curl', 1, 6, 8, 'Ön Kol'),
    ],
  },
  push1: {
    id: 'push1',
    name: 'Push 1',
    kind: 'workout',
    exercises: [
      p('sm_incline_bench', 2, 6, 8, 'Göğüs — Compound'),
      p('chest_press_machine', 2, 6, 8, 'Göğüs — Compound'),
      p('overhead_triceps_ext', 2, 6, 8, 'Triceps'),
      p('triceps_pushdown', 2, 6, 8, 'Triceps'),
      p('chest_dips', 2, 6, 8, 'Göğüs — İzolasyon'),
      p('cable_crossover', 2, 6, 8, 'Göğüs — İzolasyon'),
      p('cable_lateral_raise', 2, 6, 8, 'Omuz'),
      p('db_lateral_raise', 2, 6, 8, 'Omuz'),
    ],
  },
  legs: {
    id: 'legs',
    name: 'Legs',
    kind: 'workout',
    exercises: [
      p('hack_squat', 2, 6, 8, 'Bacak'),
      p('leg_extension', 2, 6, 8, 'Bacak'),
      p('sm_rdl', 2, 6, 8, 'Bacak'),
      p('lying_leg_curl', 2, 6, 8, 'Bacak'),
      p('abductor_machine', 1, 6, 8, 'Bacak'),
      p('adductor_machine', 1, 6, 8, 'Bacak'),
      p('calf_raise_machine', 2, 6, 8, 'Kalf'),
    ],
  },
  pull2: {
    id: 'pull2',
    name: 'Pull 2',
    kind: 'workout',
    exercises: [
      p('lat_pulldown', 2, 6, 8, 'Sırt — Compound'),
      p('close_lat_pulldown', 1, 6, 8, 'Sırt — Compound'),
      p('single_arm_db_row', 1, 6, 8, 'Sırt — Compound'),
      p('single_arm_supinated_row', 2, 6, 8, 'Sırt — Compound'),
      p('incline_db_curl', 2, 6, 8, 'Biceps'),
      p('cable_curl', 2, 6, 8, 'Biceps'),
      p('back_pullover', 2, 6, 8, 'Sırt — İzolasyon'),
      p('rope_hammer_curl', 1, 6, 8, 'Ön Kol'),
      p('cable_wrist_curl', 1, 6, 8, 'Ön Kol'),
      p('reverse_cable_curl', 1, 6, 8, 'Ön Kol'),
    ],
  },
  push2: {
    id: 'push2',
    name: 'Push 2',
    kind: 'workout',
    exercises: [
      p('shoulder_press_machine', 2, 6, 8, 'Omuz — Compound'),
      p('cable_front_raise', 1, 6, 8, 'Omuz — Compound'),
      p('db_triceps_ext', 2, 6, 8, 'Triceps'),
      p('triceps_pushdown', 2, 6, 8, 'Triceps'),
      p('cable_crossover', 2, 6, 8, 'Göğüs — İzolasyon'),
      p('cable_lateral_raise', 2, 6, 8, 'Omuz — İzolasyon'),
      p('db_lateral_raise', 2, 6, 8, 'Omuz — İzolasyon'),
      p('rear_delt_cable', 2, 6, 8, 'Omuz — İzolasyon'),
    ],
  },
  rest: REST,
};

const CARDIO = 'Eğim 10 / Hız 5 · 20 dakika yürüyüş';

const g = (
  id: string,
  name: string,
  exercises: PlannedExercise[],
  cardio?: string
): TrainingDay => ({ id, name, kind: 'workout', exercises, cardio });

/** Kalça ağırlıklı 5 günlük alternatif program. */
const GLUTE_DAYS: Record<string, TrainingDay> = {
  g_glute1: g(
    'g_glute1',
    'Gün 1 · Kalça & Bacak',
    [
      p('sm_hip_thrust', 4, 8, 10, 'Kalça — Compound'),
      p('sumo_squat', 4, 8, 10, 'Bacak — Compound'),
      p('romanian_deadlift', 3, 10, 12, 'Bacak — Compound'),
      p('cable_glute_kickback', 3, 12, 12, 'Kalça — İzolasyon'),
      p('bulgarian_split_squat', 3, 10, 10, 'Bacak'),
    ],
    CARDIO
  ),
  g_back_shoulder: g(
    'g_back_shoulder',
    'Gün 2 · Sırt & Omuz',
    [
      p('lat_pulldown', 3, 12, 12, 'Sırt'),
      p('dumbbell_row', 3, 10, 10, 'Sırt'),
      p('face_pull', 3, 15, 15, 'Omuz'),
      p('db_lateral_raise', 3, 15, 15, 'Omuz'),
      p('seated_row', 3, 15, 15, 'Sırt'),
      p('assisted_pullup', 4, 6, 10, 'Sırt — Compound'),
    ],
    CARDIO
  ),
  g_glute2: g(
    'g_glute2',
    'Gün 3 · Kalça & Bacak (izolasyon)',
    [
      p('hip_thrust', 4, 10, 10, 'Kalça — Compound'),
      p('step_up_db', 3, 12, 12, 'Bacak'),
      p('leg_press', 3, 8, 10, 'Bacak — Compound'),
      p('bulgarian_split_squat', 3, 10, 10, 'Bacak'),
      p('abductor_machine', 3, 12, 12, 'Kalça — İzolasyon'),
    ],
    CARDIO
  ),
  g_arms: g(
    'g_arms',
    'Gün 4 · Kol & Sırt',
    [
      p('db_biceps_curl', 3, 12, 12, 'Biceps'),
      p('hammer_curl', 3, 12, 12, 'Biceps'),
      p('triceps_pushdown', 3, 12, 12, 'Triceps'),
      p('overhead_triceps_ext', 3, 12, 12, 'Triceps'),
      p('single_arm_db_row', 3, 12, 12, 'Sırt'),
      p('face_pull', 3, 15, 15, 'Omuz'),
    ],
    CARDIO
  ),
  g_glute3: g('g_glute3', 'Gün 5 · Kalça & Bacak', [
    p('hip_thrust', 3, 10, 12, 'Kalça — Compound'),
    p('abductor_machine', 3, 12, 12, 'Kalça — İzolasyon'),
    p('romanian_deadlift', 4, 8, 10, 'Bacak — Compound'),
    p('cable_glute_kickback', 3, 12, 12, 'Kalça — İzolasyon'),
    p('sumo_squat', 3, 15, 15, 'Bacak'),
  ]),
  rest: REST,
};

/** "5-9 / 8-12" → [[5, 9], [8, 12]] · "6-10" → [[6, 10]] */
const parseRanges = (text: string): [number, number][] =>
  text.split('/').map((part) => {
    const [a, b] = part.trim().split('-').map(Number);
    return [a, b ?? a];
  });

/** Aralık + RIR tanımlı hareket. */
const r = (
  exerciseId: string,
  sets: number,
  ranges: string,
  rir: string,
  section: string
): PlannedExercise => {
  const parsed = parseRanges(ranges);
  return {
    exerciseId,
    sets,
    repMin: Math.min(...parsed.map((x) => x[0])),
    repMax: Math.max(...parsed.map((x) => x[1])),
    section,
    ranges: parsed,
    rir,
  };
};

const HEAVY = '5-9 / 8-12';

/**
 * Torso / Limbs — haftanın sabit günlerine bağlı 4 günlük program.
 * Biceps ve torso günlerindeki sırt hareketleri RIR 1-2, diğer her şey RIR 0-1.
 * Limbs günlerinde biceps ve triceps dönüşümlü sıralanmıştır.
 */
const TORSO_LIMBS_DAYS: Record<string, TrainingDay> = {
  torso_a: g('torso_a', 'Torso A', [
    r('db_lateral_raise', 2, HEAVY, '0-1', 'Yan omuz'),
    r('machine_chest_fly', 2, HEAVY, '0-1', 'Göğüs'),
    r('incline_db_bench', 1, '6-10', '0-1', 'Göğüs'),
    r('cable_lateral_raise', 1, '6-10', '0-1', 'Yan omuz'),
    r('one_arm_lat_pulldown', 3, HEAVY, '1-2', 'Sırt'),
    r('tbar_row', 2, HEAVY, '1-2', 'Sırt'),
    r('cable_crunch', 2, '8-12', '0-1', 'Karın'),
  ]),
  limbs_a: g('limbs_a', 'Limbs A', [
    r('one_arm_db_preacher', 2, HEAVY, '1-2', 'Biceps'),
    r('cable_oh_triceps_ext', 2, HEAVY, '0-1', 'Triceps'),
    r('hammer_curl', 1, '6-10', '1-2', 'Biceps'),
    r('seated_triceps_pushdown', 1, '6-10', '0-1', 'Triceps'),
    r('bulgarian_split_squat', 1, '6-10', '0-1', 'Quadriceps'),
    r('lying_leg_curl', 1, '6-10', '0-1', 'Hamstring'),
    r('leg_extension', 1, '6-10', '0-1', 'Quadriceps'),
    r('smith_calf_raise', 1, '6-10', '0-1', 'Kalf'),
  ]),
  torso_b: g('torso_b', 'Torso B', [
    r('db_lateral_raise', 2, HEAVY, '0-1', 'Yan omuz'),
    r('low_high_cable_fly', 2, HEAVY, '0-1', 'Göğüs'),
    r('iso_lateral_chest_press', 2, HEAVY, '0-1', 'Göğüs'),
    r('cable_lateral_raise', 2, HEAVY, '0-1', 'Yan omuz'),
    r('lat_pulldown', 3, HEAVY, '1-2', 'Sırt'),
    r('kelso_shrug', 3, HEAVY, '1-2', 'Üst sırt'),
    r('cable_crunch', 2, '8-12', '0-1', 'Karın'),
  ]),
  limbs_b: g('limbs_b', 'Limbs B', [
    r('one_arm_db_preacher', 2, HEAVY, '1-2', 'Biceps'),
    r('cable_oh_triceps_ext', 3, HEAVY, '0-1', 'Triceps'),
    r('lengthened_db_curl', 2, HEAVY, '1-2', 'Biceps'),
    r('single_arm_triceps_pushdown', 2, HEAVY, '0-1', 'Triceps'),
    r('squat', 2, HEAVY, '0-1', 'Quadriceps'),
    r('lying_leg_curl', 2, HEAVY, '0-1', 'Hamstring'),
    r('leg_extension', 2, HEAVY, '0-1', 'Quadriceps'),
  ]),
  rest: REST,
};

/**
 * Limbs B Preacher Curl: 1. sette bu eşik (ağırlık ve tekrar) yakalanınca
 * 3. set eklenmesi önerilir.
 */
export const PREACHER_THRESHOLD = {
  dayId: 'limbs_b',
  exerciseId: 'one_arm_db_preacher',
  weight: 12.5,
  reps: 9,
} as const;

export const PROGRAMS: Record<string, Program> = {
  hipertrofi: {
    id: 'hipertrofi',
    name: 'Hipertrofi · Push/Pull/Legs',
    description: '5 antrenman günü · tüm hareketlerde 6–8 tekrar · hacim odaklı',
    days: HYPERTROPHY_DAYS,
    // Pull 1 → Push 1 → Legs → Dinlenme → Pull 2 → Push 2 → Dinlenme
    cycle: ['pull1', 'push1', 'legs', 'rest', 'pull2', 'push2', 'rest'],
  },
  kalca: {
    id: 'kalca',
    name: 'Kalça ağırlıklı · 5 gün',
    description: '5 antrenman günü · glute odaklı · her gün sonunda 20 dk yürüyüş',
    days: GLUTE_DAYS,
    // Gün 1 → Gün 2 → Gün 3 → Dinlenme → Gün 4 → Gün 5 → Dinlenme
    cycle: ['g_glute1', 'g_back_shoulder', 'g_glute2', 'rest', 'g_arms', 'g_glute3', 'rest'],
  },
  torso_limbs: {
    id: 'torso_limbs',
    name: 'Torso / Limbs · 4 gün',
    description:
      'Pzt Torso A · Sal Limbs A · Per Torso B · Cum Limbs B · tempo 3-1-0-1 · limbs günlerinde biceps/triceps dönüşümlü',
    days: TORSO_LIMBS_DAYS,
    // Pazartesiden başlayan hafta; gün seçimi schedule üzerinden yapılır.
    cycle: ['torso_a', 'limbs_a', 'rest', 'torso_b', 'limbs_b', 'rest', 'rest'],
    // Date.getDay(): 0 Pazar, 1 Pazartesi … 6 Cumartesi
    schedule: ['rest', 'torso_a', 'limbs_a', 'rest', 'torso_b', 'limbs_b', 'rest'],
    tempo: '3-1-0-1',
  },
};

export const DEFAULT_PROGRAM_ID = 'torso_limbs';

/**
 * Kullanıcının kendi yazdığı program ve hareketler.
 * Tek yazar store'dur (hydrate ve her değişiklikte senkronlar); buradaki
 * kayıt defteri sayesinde çağrı noktalarının imzası değişmeden hem hazır
 * hem özel içerik aynı yerden çözülür.
 */
let customPrograms: Record<string, Program> = {};
let customExercises: Record<string, Exercise> = {};
/** `${dayId}:${exerciseId}` → plana kalıcı eklenen set sayısı (ör. Preacher 3. set). */
let extraSets: Record<string, number> = {};

export const syncExtraSets = (map: Record<string, number>) => {
  extraSets = map ?? {};
};

export const extraSetKey = (dayId: string, exerciseId: string) => `${dayId}:${exerciseId}`;

/** Planlanan set sayısı (kalıcı eklenen setler dahil). */
export const plannedSetCount = (dayId: string, pe: PlannedExercise): number =>
  pe.sets + (extraSets[extraSetKey(dayId, pe.exerciseId)] ?? 0);

export const syncCustomContent = (
  programs: Record<string, Program>,
  exercises: Record<string, Exercise>
) => {
  customPrograms = programs ?? {};
  customExercises = exercises ?? {};
};

export const allPrograms = (): Record<string, Program> => ({ ...PROGRAMS, ...customPrograms });

export const isCustomProgram = (id: string): boolean => Boolean(customPrograms[id]);

/** Hareket kataloğu: hazır hareketler + kullanıcının eklediği hareketler. */
export const exerciseById = (id: string): Exercise | undefined =>
  customExercises[id] ?? EXERCISES[id];

export const allExercises = (): Record<string, Exercise> => ({ ...EXERCISES, ...customExercises });

export const getProgram = (id: string): Program =>
  allPrograms()[id] ?? PROGRAMS[DEFAULT_PROGRAM_ID];

/** Gün id'si hangi programa aitse oradan çözülür (geçmiş kayıtlar için). */
export const dayById = (dayId: string): TrainingDay | undefined => {
  for (const program of Object.values(allPrograms())) {
    if (program.days[dayId]) return program.days[dayId];
  }
  return undefined;
};

export const cycleDayOf = (programId: string, index: number): TrainingDay => {
  const program = getProgram(programId);
  return program.days[program.cycle[index % program.cycle.length]] ?? REST;
};

const weekdayOf = (dateKey: string): number => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

/**
 * Belirli bir tarihte yapılacak gün. Haftalık programda takvimden,
 * döngüsel programda döngü indeksinden çözülür.
 */
export const dayForDate = (programId: string, cycleIndex: number, dateKey: string): TrainingDay => {
  const program = getProgram(programId);
  if (program.schedule) return program.days[program.schedule[weekdayOf(dateKey)]] ?? REST;
  return cycleDayOf(programId, cycleIndex);
};

export const isScheduled = (programId: string): boolean => Boolean(getProgram(programId).schedule);

export const WEEKDAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const WEEKDAY_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/** Haftalık programda bugünden sonraki ilk antrenman günü (bugün hariç). */
export const nextScheduledWorkout = (
  programId: string,
  dateKey: string
): { day: TrainingDay; weekday: number; inDays: number } | null => {
  const program = getProgram(programId);
  if (!program.schedule) return null;
  const today = weekdayOf(dateKey);
  for (let i = 1; i <= 7; i++) {
    const wd = (today + i) % 7;
    const day = program.days[program.schedule[wd]];
    if (day && day.kind === 'workout') return { day, weekday: wd, inDays: i };
  }
  return null;
};

/** i. setin hedef tekrar aralığı. */
export const setRange = (
  ex: { repMin: number; repMax: number; ranges?: [number, number][] },
  i: number
): [number, number] => {
  const ranges = ex.ranges;
  if (!ranges || ranges.length === 0) return [ex.repMin, ex.repMax];
  return ranges[Math.min(i, ranges.length - 1)];
};

/** "5-9 / 8-12" ya da "6-10" biçiminde aralık etiketi. */
export const rangeLabel = (ex: { repMin: number; repMax: number; ranges?: [number, number][] }) => {
  const ranges = ex.ranges && ex.ranges.length > 0 ? ex.ranges : [[ex.repMin, ex.repMax]];
  return ranges.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(' / ');
};

/** Hareketin altında gösterilen kısa not: tempo, RIR, ağır/hafif set açıklaması. */
export const exerciseNote = (programTempo: string | undefined, pe: PlannedExercise | undefined) => {
  if (!pe) return null;
  const parts: string[] = [];
  if (programTempo) parts.push(`Tempo ${programTempo}`);
  if (pe.rir) parts.push(`RIR ${pe.rir}`);
  if (pe.ranges && pe.ranges.length > 1)
    parts.push(
      `1. set ağır (${pe.ranges[0].join('-')}), sonraki set(ler) ~%15-20 hafif (${pe.ranges[
        pe.ranges.length - 1
      ].join('-')})`
    );
  return parts.length > 0 ? parts.join(' · ') : null;
};

/** Seans kaydının ait olduğu programın tempo notu. */
export const programOfDay = (dayId: string): Program | undefined =>
  Object.values(allPrograms()).find((p) => Boolean(p.days[dayId]));

export const GROUP_NAMES: Record<string, string> = {
  sirt: 'Sırt',
  gogus: 'Göğüs',
  omuz: 'Omuz',
  biceps: 'Biceps',
  triceps: 'Triceps',
  bacak: 'Bacak',
  kalca: 'Kalça',
  onkol: 'Ön Kol',
  kalf: 'Kalf',
  trapez: 'Trapez',
  karin: 'Karın',
};
