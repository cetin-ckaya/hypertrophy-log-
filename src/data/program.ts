import { Exercise, TrainingDay } from '../types';

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
    // Trapez
    ex('db_shrugs', 'Dumbbell Shrugs', 'trapez', 'isolation'),
    // Biceps
    ex('preacher_curl', 'Preacher Curl', 'biceps', 'isolation'),
    ex('cable_curl', 'Cable Curl', 'biceps', 'isolation'),
    ex('incline_db_curl', 'Incline Dumbbell Curl', 'biceps', 'isolation'),
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
    ex('cable_lateral_raise', 'Cable Lateral Raises', 'omuz', 'isolation'),
    ex('db_lateral_raise', 'Dumbbell Lateral Raises', 'omuz', 'isolation'),
    ex('rear_delt_cable', 'Rear Delt Cable', 'omuz', 'isolation'),
    // Bacak
    ex('hack_squat', 'Hack Squats', 'bacak', 'compound'),
    ex('leg_extension', 'Leg Extensions', 'bacak', 'isolation'),
    ex('sm_rdl', 'SM RDL', 'bacak', 'compound'),
    ex('lying_leg_curl', 'Lying Leg Curl', 'bacak', 'isolation'),
    ex('abductor_machine', 'Abductor Machine', 'bacak', 'isolation'),
    ex('adductor_machine', 'Adductor Machine', 'bacak', 'isolation'),
    ex('calf_raise_machine', 'Calf Raises Machine', 'kalf', 'isolation'),
  ].map((e) => [e.id, e])
);

const p = (
  exerciseId: string,
  sets: number,
  repMin: number,
  repMax: number,
  section: string
) => ({ exerciseId, sets, repMin, repMax, section });

export const DAYS: Record<string, TrainingDay> = {
  pull1: {
    id: 'pull1',
    name: 'Pull 1',
    kind: 'workout',
    exercises: [
      p('deadlift', 2, 5, 6, 'Sırt — Compound'),
      p('tbar_row', 2, 8, 10, 'Sırt — Compound'),
      p('seated_close_row', 2, 8, 10, 'Sırt — Compound'),
      p('preacher_curl', 2, 8, 10, 'Biceps'),
      p('cable_curl', 2, 10, 12, 'Biceps'),
      p('wide_grip_row_machine', 2, 10, 12, 'Sırt — İzolasyon'),
      p('low_row', 2, 10, 12, 'Sırt — İzolasyon'),
      p('db_shrugs', 1, 12, 15, 'Sırt — İzolasyon'),
      p('cable_wrist_curl', 1, 15, 15, 'Ön Kol'),
      p('reverse_cable_curl', 1, 15, 15, 'Ön Kol'),
    ],
  },
  push1: {
    id: 'push1',
    name: 'Push 1',
    kind: 'workout',
    exercises: [
      p('sm_incline_bench', 2, 8, 10, 'Göğüs — Compound'),
      p('chest_press_machine', 2, 10, 12, 'Göğüs — Compound'),
      p('overhead_triceps_ext', 2, 10, 12, 'Triceps'),
      p('triceps_pushdown', 2, 10, 12, 'Triceps'),
      p('chest_dips', 2, 10, 12, 'Göğüs — İzolasyon'),
      p('cable_crossover', 2, 12, 15, 'Göğüs — İzolasyon'),
      p('cable_lateral_raise', 2, 12, 15, 'Omuz'),
      p('db_lateral_raise', 2, 12, 15, 'Omuz'),
    ],
  },
  legs: {
    id: 'legs',
    name: 'Legs',
    kind: 'workout',
    exercises: [
      p('hack_squat', 2, 8, 10, 'Bacak'),
      p('leg_extension', 2, 12, 15, 'Bacak'),
      p('sm_rdl', 2, 10, 12, 'Bacak'),
      p('lying_leg_curl', 2, 10, 12, 'Bacak'),
      p('abductor_machine', 1, 15, 15, 'Bacak'),
      p('adductor_machine', 1, 15, 15, 'Bacak'),
      p('calf_raise_machine', 2, 15, 20, 'Kalf'),
    ],
  },
  pull2: {
    id: 'pull2',
    name: 'Pull 2',
    kind: 'workout',
    exercises: [
      p('lat_pulldown', 2, 8, 12, 'Sırt — Compound'),
      p('close_lat_pulldown', 1, 10, 12, 'Sırt — Compound'),
      p('single_arm_db_row', 1, 10, 12, 'Sırt — Compound'),
      p('single_arm_supinated_row', 2, 10, 12, 'Sırt — Compound'),
      p('incline_db_curl', 2, 10, 12, 'Biceps'),
      p('cable_curl', 2, 10, 12, 'Biceps'),
      p('back_pullover', 2, 10, 12, 'Sırt — İzolasyon'),
      p('rope_hammer_curl', 1, 12, 15, 'Ön Kol'),
      p('cable_wrist_curl', 1, 15, 15, 'Ön Kol'),
      p('reverse_cable_curl', 1, 15, 15, 'Ön Kol'),
    ],
  },
  push2: {
    id: 'push2',
    name: 'Push 2',
    kind: 'workout',
    exercises: [
      p('shoulder_press_machine', 2, 8, 10, 'Omuz — Compound'),
      p('cable_front_raise', 1, 12, 15, 'Omuz — Compound'),
      p('db_triceps_ext', 2, 10, 12, 'Triceps'),
      p('triceps_pushdown', 2, 10, 12, 'Triceps'),
      p('cable_crossover', 2, 12, 15, 'Göğüs — İzolasyon'),
      p('cable_lateral_raise', 2, 12, 15, 'Omuz — İzolasyon'),
      p('db_lateral_raise', 2, 12, 15, 'Omuz — İzolasyon'),
      p('rear_delt_cable', 2, 15, 15, 'Omuz — İzolasyon'),
    ],
  },
  rest: {
    id: 'rest',
    name: 'Dinlenme',
    kind: 'rest',
    exercises: [],
  },
};

/** Döngü sırası: Pull 1 → Push 1 → Legs → Dinlenme → Pull 2 → Push 2 → Dinlenme */
export const CYCLE: string[] = ['pull1', 'push1', 'legs', 'rest', 'pull2', 'push2', 'rest'];

export const cycleDay = (index: number): TrainingDay => DAYS[CYCLE[index % CYCLE.length]];

export const GROUP_NAMES: Record<string, string> = {
  sirt: 'Sırt',
  gogus: 'Göğüs',
  omuz: 'Omuz',
  biceps: 'Biceps',
  triceps: 'Triceps',
  bacak: 'Bacak',
  onkol: 'Ön Kol',
  kalf: 'Kalf',
  trapez: 'Trapez',
};
