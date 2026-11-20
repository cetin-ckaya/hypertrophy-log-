import { SessionExercise, WorkoutSession } from '../types';
import { PROGRAMS } from './program';

/**
 * Torso / Limbs programına geçişte kullanıcının verdiği son antrenman kayıtları
 * (16–20 Kasım 2026 haftası). Bir sonraki antrenmanda "Geçen sefer" olarak
 * görünürler. Limbs B'de biceps ağrısı nedeniyle biceps hareketleri 20 Kasım'da
 * atlandı; biceps için bir önceki haftanın (13 Kasım) kaydı geçerli.
 */
type Sets = [number, number][]; // [kg, tekrar]

const at = (date: string, hour: number) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, hour, 0, 0).getTime();
};

const session = (
  dayId: string,
  date: string,
  entries: [string, Sets][],
  idSuffix = ''
): WorkoutSession => {
  const day = PROGRAMS.torso_limbs.days[dayId];
  const exercises: SessionExercise[] = entries.map(([exerciseId, sets]) => {
    const pe = day.exercises.find((e) => e.exerciseId === exerciseId);
    return {
      exerciseId,
      repMin: pe?.repMin ?? 6,
      repMax: pe?.repMax ?? 10,
      ranges: pe?.ranges,
      sets: sets.map(([weight, reps]) => ({ weight, reps, done: true })),
    };
  });
  return {
    id: `seed-${dayId}-${date}${idSuffix}`,
    dayId,
    date,
    startedAt: at(date, 18),
    completedAt: at(date, 19),
    exercises,
  };
};

const SKIP: Sets = [
  [0, 0],
  [0, 0],
];

export const SEED_SESSIONS: WorkoutSession[] = [
  // Bir önceki hafta — yalnızca biceps (20 Kasım'da atlandığı için referans bu).
  session(
    'limbs_b',
    '2026-11-13',
    [
      ['one_arm_db_preacher', [[12.5, 8], [10, 9]]],
      ['lengthened_db_curl', [[10, 7], [10, 6]]],
    ],
    '-biceps'
  ),
  session('torso_a', '2026-11-16', [
    ['db_lateral_raise', [[12.5, 9], [7.5, 12]]],
    ['machine_chest_fly', [[60, 8], [45, 9]]],
    ['incline_db_bench', [[20, 10]]],
    ['cable_lateral_raise', [[12, 10]]],
    ['one_arm_lat_pulldown', [[50, 8], [40, 9], [35, 8]]],
    ['tbar_row', [[50, 9], [30, 9]]],
    ['cable_crunch', [[54, 12], [66, 7]]],
  ]),
  session('limbs_a', '2026-11-17', [
    ['one_arm_db_preacher', [[12.5, 8], [7.5, 10]]],
    ['cable_oh_triceps_ext', [[48, 8], [36, 10]]],
    ['hammer_curl', [[20, 6]]],
    ['seated_triceps_pushdown', [[48, 8]]],
    ['bulgarian_split_squat', [[7.5, 7]]],
    ['lying_leg_curl', [[50, 9]]],
    ['leg_extension', [[80, 8]]],
    ['smith_calf_raise', [[20, 6]]],
  ]),
  session('torso_b', '2026-11-19', [
    ['db_lateral_raise', [[12.5, 10], [7.5, 11]]],
    ['low_high_cable_fly', [[18, 7], [12, 9]]],
    ['iso_lateral_chest_press', [[70, 7], [50, 8]]],
    ['cable_lateral_raise', [[12, 11], [6, 14]]],
    ['lat_pulldown', [[70, 10], [65, 9]]],
    ['kelso_shrug', [[40, 6], [30, 9]]],
    ['cable_crunch', [[66, 11], [66, 8]]],
  ]),
  session('limbs_b', '2026-11-20', [
    ['one_arm_db_preacher', SKIP],
    [
      'cable_oh_triceps_ext',
      [
        [48, 9],
        [36, 12],
        [36, 10],
      ],
    ],
    ['lengthened_db_curl', SKIP],
    ['single_arm_triceps_pushdown', [[30, 5], [18, 11]]],
    ['squat', [[50, 8], [50, 7]]],
    ['lying_leg_curl', [[50, 9], [50, 7]]],
    ['leg_extension', [[80, 9], [60, 8]]],
  ]),
];

export const SEED_WEIGHTS: Record<string, number> = {
  '2026-11-17': 78.4,
  '2026-11-18': 78.8,
  '2026-11-19': 78.85,
};

export const SEED_ARM: Record<string, number> = {
  '2026-10-18': 36.2,
};
