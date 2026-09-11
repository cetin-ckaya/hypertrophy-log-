/**
 * "Modernist" tasarım sistemi — düz, mimari, tek kırmızı vurgu.
 * Açık zemin, mürekkep siyahı kurallar, sıfır köşe yarıçapı, sola dayalı metin.
 */
export const colors = {
  bg: '#F3F2F2',
  surface: '#F8F4F4',
  ink: '#201E1D',
  muted: '#605D5D',
  rule: '#201E1D',
  ruleLight: '#D7D3D3',
  hover: '#EAE7E7',
  tint: '#EAE9E9',
  accent: '#EC3013',
  accentPressed: '#DD2B0F',
  accentInk: '#AE1800',
  accentTint: '#FFE0D9',
  accentDeep: '#7C1405',
  onAccent: '#FFFFFF',
  faintInk: '#BAB6B6',

  // Geriye dönük adlar (bileşenler bunları kullanıyor)
  text: '#201E1D',
  textDim: '#605D5D',
  textFaint: '#605D5D',
  card: '#F3F2F2',
  cardAlt: '#F8F4F4',
  border: '#201E1D',
  primary: '#EC3013',
  success: '#201E1D',
  successInk: '#FFFFFF',
  warning: '#EC3013',
  danger: '#EC3013',
};

export const fonts = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  bold: 'Archivo_700Bold',
  extra: 'Archivo_800ExtraBold',
  black: 'Archivo_900Black',
};

/** Sıfır yarıçap sistemin kuralı — tek istisna yok. */
export const radius = { sm: 0, md: 0, lg: 0, xl: 0, pill: 0 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const rules = { strong: 2, light: 1 };

export const font = {
  /** Bölüm üstü küçük etiket. */
  label: {
    fontFamily: fonts.extra,
    fontSize: 11,
    letterSpacing: 1.7,
    textTransform: 'uppercase' as const,
    color: colors.muted,
  },
  labelSm: {
    fontFamily: fonts.extra,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    color: colors.muted,
  },
  h1: { fontFamily: fonts.black, fontSize: 32, letterSpacing: -0.7, color: colors.ink },
  h2: { fontFamily: fonts.black, fontSize: 22, letterSpacing: -0.3, color: colors.ink },
  h3: { fontFamily: fonts.extra, fontSize: 18, letterSpacing: -0.2, color: colors.ink },
  /** Kartlardaki büyük sayı. */
  display: { fontFamily: fonts.black, fontSize: 42, letterSpacing: -1.3, color: colors.ink },
  displayXl: { fontFamily: fonts.black, fontSize: 58, letterSpacing: -2.3, color: colors.onAccent },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  small: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  tiny: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  button: {
    fontFamily: fonts.extra,
    fontSize: 13,
    letterSpacing: 1.3,
    textTransform: 'uppercase' as const,
  },
  num: { fontVariant: ['tabular-nums'] } as { fontVariant: 'tabular-nums'[] },
};

/** Grafikler: mürekkep, gri ve tek vurgu — sistem mono. */
export const chart = {
  ink: colors.ink,
  accent: colors.accent,
  faint: colors.faintInk,
  grid: colors.ruleLight,
};

/** Makro çubukları — sistemin mono paletinde ton farkıyla ayrışır. */
export const macroColors = {
  protein: colors.ink,
  carbs: colors.accent,
  fat: colors.muted,
};

/** Grafiklerde trapez sırtla, kalf bacakla birlikte sayılır. */
export const chartGroup = (group: string): string =>
  group === 'trapez' ? 'sirt' : group === 'kalf' ? 'bacak' : group;

export const CHART_GROUP_ORDER = [
  'sirt',
  'gogus',
  'bacak',
  'omuz',
  'biceps',
  'triceps',
  'kalca',
  'onkol',
];

/** Mono sistemde kas grupları renkle değil, etiketle ayrışır. */
export const groupColors: Record<string, string> = Object.fromEntries(
  [...CHART_GROUP_ORDER, 'trapez', 'kalf'].map((g) => [g, colors.ink])
);

export const grid = colors.ruleLight;
export const series = [colors.ink, colors.accent, colors.muted, colors.faintInk];
