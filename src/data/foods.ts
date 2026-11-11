import { Food, Meal } from '../types';

const f = (
  id: string,
  name: string,
  unit: Food['unit'],
  kcal: number,
  protein: number,
  carbs: number,
  fat: number
): Food => ({ id, name, unit, kcal, protein, carbs, fat });

/**
 * Tüm değerler 100 g / 100 ml başına (USDA referans değerleri).
 * Adında "pişmiş" yazmayanlar çiğ / kuru ölçüdür.
 */
export const DEFAULT_FOODS: Record<string, Food> = Object.fromEntries(
  [
    f('oats', 'Yulaf ezmesi (kuru)', 'g', 389, 16.9, 66.3, 6.9),
    f('whey', 'Whey protein tozu', 'g', 400, 80.0, 8.0, 5.0),
    f('banana', 'Muz', 'g', 89, 1.1, 22.8, 0.3),
    f('milk', 'Yarım yağlı süt', 'ml', 50, 3.4, 4.8, 1.8),
    f('peanut_butter', 'Fıstık ezmesi', 'g', 588, 25.0, 20.0, 50.0),
    f('chicken', 'Tavuk göğsü (çiğ)', 'g', 120, 22.5, 0, 2.6),
    f('chicken_cooked', 'Tavuk göğsü (pişmiş)', 'g', 165, 31.0, 0, 3.6),
    f('rice', 'Pirinç (kuru)', 'g', 360, 7.0, 79.0, 0.6),
    f('rice_cooked', 'Pirinç (pişmiş)', 'g', 130, 2.7, 28.2, 0.3),
    f('olive_oil', 'Zeytinyağı', 'ml', 884, 0, 0, 100),
    // Etiket: 200 g için 744 kcal · P 20 · K 162 · Y 1,4 · 2500 mg Creapure.
    f('gainer', 'Gainer (Creapure kreatinli)', 'g', 372, 10.0, 81.0, 0.7),
    // Yurt kahvaltısı tahmini: içerik her gün değişiyor, kesin olan 1 haşlanmış
    // yumurta (~6,3 g protein). 1 g = 1 kcal kurgulandı, yani gramajı doğrudan
    // tahmini kaloridir: 250 g = 250 kcal · P 10 · K 34 · Y 8.
    f('dorm_breakfast', 'Yurt kahvaltısı (tahmini)', 'g', 100, 4.0, 13.6, 3.2),
    // Alternatifler
    f('ww_pasta', 'Tam buğday makarna (kuru)', 'g', 348, 13.0, 64.0, 2.5),
    f('sweet_potato', 'Tatlı patates (çiğ)', 'g', 86, 1.6, 20.1, 0.1),
    f('potato', 'Haşlanmış patates', 'g', 87, 1.9, 20.1, 0.1),
    f('bulgur', 'Bulgur (kuru)', 'g', 342, 12.3, 75.9, 1.3),
    f('ww_bread', 'Tam buğday ekmek', 'g', 247, 13.0, 41.0, 3.4),
    f('egg', 'Yumurta', 'g', 143, 12.6, 0.7, 9.5),
    f('cottage_cheese', 'Lor peyniri', 'g', 98, 11.1, 3.4, 4.3),
    f('salmon', 'Somon (çiğ)', 'g', 208, 20.4, 0, 13.4),
    f('turkey', 'Hindi göğsü (çiğ)', 'g', 114, 23.7, 0, 1.5),
    f('quinoa', 'Kinoa (kuru)', 'g', 368, 14.1, 64.2, 6.1),
  ].map((x) => [x.id, x])
);

/**
 * Varsayılan plan — 3.470 kcal · P 160 · K 524 · Y 74 (hedef 3.400–3.500).
 * Tavuk göğsü ve pirinç gramajları çiğ / kuru ağırlıktır.
 * Yurt kahvaltısı 250 kcal'lık tahminle sayılır (kesin olan 1 haşlanmış yumurta
 * protein makrosuna dahil). Kalori her gün aynıdır.
 */
export const DEFAULT_PLAN: Meal[] = [
  {
    id: 'meal1',
    name: 'Öğün 1 — Yurt Kahvaltısı',
    items: [{ foodId: 'dorm_breakfast', amount: 250 }],
  },
  {
    id: 'snack1',
    name: 'Ara Öğün — Gainer',
    items: [{ foodId: 'gainer', amount: 200 }],
  },
  {
    id: 'meal2',
    name: 'Öğün 2 — Antrenman sonrası',
    items: [
      { foodId: 'chicken', amount: 225 },
      { foodId: 'rice', amount: 210 },
      { foodId: 'olive_oil', amount: 25 },
    ],
  },
  {
    id: 'meal3',
    name: 'Öğün 3 — Akşam',
    items: [
      { foodId: 'chicken', amount: 225 },
      { foodId: 'rice', amount: 205 },
      { foodId: 'olive_oil', amount: 25 },
    ],
  },
];

export const CARB_SOURCE_ID = 'rice';
/** Protein tabanının altına düşülürse artırılacak protein kaynağı. */
export const PROTEIN_SOURCE_ID = 'chicken';
