export const colors = {
  bg: '#0B0E14',
  card: '#151A23',
  cardAlt: '#1C2230',
  border: '#252C3A',
  text: '#EEF2F8',
  textDim: '#93A0B4',
  textFaint: '#5E6B7E',
  primary: '#3B82F6',
  primaryDim: '#1D4ED8',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#A855F7',
  cyan: '#06B6D4',
};

/**
 * Kategorik seri paleti (koyu yüzey için doğrulanmış sıra).
 * Renkler sabit sırayla atanır; seri sayısı değişse de renk kaymaz.
 */
export const series = [
  '#3987e5', // 1 mavi
  '#d95926', // 2 turuncu
  '#199e70', // 3 turkuaz
  '#c98500', // 4 sarı
  '#d55181', // 5 magenta
  '#008300', // 6 yeşil
  '#9085e9', // 7 mor
  '#e66767', // 8 kırmızı
];

/** Grafiklerde trapez, kullanıcının programındaki gibi sırt altında toplanır. */
export const chartGroup = (group: string): string => (group === 'trapez' ? 'sirt' : group);

/** Kas grubu → sabit renk slotu (yığın sırası da budur). */
export const CHART_GROUP_ORDER = [
  'sirt',
  'gogus',
  'bacak',
  'omuz',
  'biceps',
  'triceps',
  'kalf',
  'onkol',
];

export const groupColors: Record<string, string> = {
  sirt: series[0],
  gogus: series[1],
  bacak: series[2],
  omuz: series[3],
  biceps: series[4],
  triceps: series[5],
  kalf: series[6],
  onkol: series[7],
  trapez: series[0],
};

export const grid = '#252C3A';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 22 };

export const font = {
  h1: { fontSize: 26, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 19, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.textDim },
  tiny: { fontSize: 11, color: colors.textFaint },
};
