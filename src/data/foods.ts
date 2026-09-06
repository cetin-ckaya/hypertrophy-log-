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

/** Tüm değerler 100 g / 100 ml başına, çiğ / kuru ölçüdür. */
export const DEFAULT_FOODS: Record<string, Food> = Object.fromEntries(
  [
    f('oats', 'Yulaf ezmesi (kuru)', 'g', 389, 16.9, 66.3, 6.9),
    f('whey', 'Whey protein tozu', 'g', 400, 80.0, 8.0, 5.0),
    f('banana', 'Muz', 'g', 89, 1.1, 22.8, 0.3),
    f('milk', 'Yarım yağlı süt', 'ml', 50, 3.4, 4.8, 1.8),
    f('peanut_butter', 'Fıstık ezmesi', 'g', 588, 25.0, 20.0, 50.0),
    f('chicken', 'Tavuk göğsü (çiğ)', 'g', 165, 31.0, 0, 3.6),
    f('rice', 'Pirinç (kuru)', 'g', 360, 7.0, 79.0, 0.6),
    f('olive_oil', 'Zeytinyağı', 'ml', 884, 0, 0, 100),
    // Alternatifler
    f('ww_pasta', 'Tam buğday makarna (kuru)', 'g', 348, 13.0, 64.0, 2.5),
    f('sweet_potato', 'Tatlı patates (çiğ)', 'g', 86, 1.6, 20.1, 0.1),
    f('potato', 'Haşlanmış patates', 'g', 87, 1.9, 20.1, 0.1),
    f('bulgur', 'Bulgur (kuru)', 'g', 342, 12.3, 75.9, 1.3),
    f('ww_bread', 'Tam buğday ekmek', 'g', 247, 13.0, 41.0, 3.4),
    f('egg', 'Yumurta', 'g', 143, 12.6, 0.7, 9.5),
    f('cottage_cheese', 'Lor peyniri', 'g', 98, 11.1, 3.4, 4.3),
    f('salmon', 'Somon (çiğ)', 'g', 208, 20.4, 0, 13.4),
    f('turkey', 'Hindi göğsü (çiğ)', 'g', 135, 29.0, 0, 1.7),
    f('quinoa', 'Kinoa (kuru)', 'g', 368, 14.1, 64.2, 6.1),
  ].map((x) => [x.id, x])
);

/**
 * Antrenman günü varsayılan planı — toplam ~3.300 kcal.
 * Gramajlar, tablodaki toplamlara gerçekten ulaşacak şekilde ayarlandı;
 * protein kaynakları (tavuk 180/165 g) korundu, fark karbonhidrattan kapatıldı.
 * Dinlenme gününde 2. ve 3. öğünün pirinci otomatik düşer (~2.850 kcal).
 */
export const DEFAULT_PLAN: Meal[] = [
  {
    id: 'meal1',
    name: 'Öğün 1 — Sabah',
    items: [
      { foodId: 'oats', amount: 130 },
      { foodId: 'whey', amount: 30 },
      { foodId: 'banana', amount: 150 },
      { foodId: 'milk', amount: 300 },
      { foodId: 'peanut_butter', amount: 25 },
    ],
  },
  {
    id: 'meal2',
    name: 'Öğün 2 — Antrenman sonrası',
    items: [
      { foodId: 'chicken', amount: 180 },
      { foodId: 'rice', amount: 190 },
      { foodId: 'olive_oil', amount: 20 },
    ],
  },
  {
    id: 'meal3',
    name: 'Öğün 3 — Akşam',
    items: [
      { foodId: 'chicken', amount: 165 },
      { foodId: 'rice', amount: 175 },
      { foodId: 'olive_oil', amount: 20 },
    ],
  },
];

/** Kalori ayarlamalarında gramajı değiştirilecek karbonhidrat kaynağı. */
export const CARB_SOURCE_ID = 'rice';
/** Protein tabanının altına düşülürse artırılacak protein kaynağı. */
export const PROTEIN_SOURCE_ID = 'chicken';
