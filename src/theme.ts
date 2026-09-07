export const colors = {
  bg: '#07080B',
  card: '#13161D',
  cardAlt: '#191D26',
  border: '#232733',
  text: '#F2F5FA',
  textDim: '#96A0B2',
  textFaint: '#5A6474',
  primary: '#4C8DFF',
  primaryDeep: '#2563EB',
  cyan: '#22D3EE',
  success: '#A3E635',
  successInk: '#16250A',
  warning: '#FBBF24',
  danger: '#FB7185',
  violet: '#A78BFA',
};

/** Ana ekran hero kartının gradyanı. */
export const heroGradient: [string, string, string] = ['#2563EB', '#4C8DFF', '#22D3EE'];
export const restGradient: [string, string] = ['#1B2A4A', '#15202F'];

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

/** Makro renkleri — her biri metinle de etiketlendiği için renk tek başına taşıyıcı değil. */
export const macroColors = {
  protein: '#A3E635',
  carbs: '#A78BFA',
  fat: '#FBBF24',
};

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

export const grid = '#212633';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 18, xl: 24 };
export const radius = { sm: 10, md: 14, lg: 20, xl: 22, pill: 999 };

export const font = {
  h1: { fontSize: 22, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.6 },
  h2: { fontSize: 19, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.4 },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.3 },
  body: { fontSize: 14.5, color: colors.text },
  small: { fontSize: 12.5, color: colors.textDim },
  tiny: { fontSize: 11, color: colors.textFaint },
  label: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    color: colors.textFaint,
  },
  /** Rakamlar set girerken zıplamasın diye tabular. */
  num: { fontVariant: ['tabular-nums'] } as { fontVariant: 'tabular-nums'[] },
};
