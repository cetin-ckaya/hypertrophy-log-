import React, { ReactNode, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, font, fonts, rules, spacing } from '../theme';

/** Sayfa kabuğu: sticky başlık + 2px alt kural. */
export const Screen = ({
  children,
  title,
  kicker,
  right,
  left,
  scroll = true,
}: {
  children: ReactNode;
  title?: string;
  kicker?: string;
  right?: ReactNode;
  left?: ReactNode;
  scroll?: boolean;
}) => (
  <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
    {title ? (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {left}
          <View style={{ flex: 1 }}>
            {kicker ? <Text style={font.label}>{kicker}</Text> : null}
            <Text style={[font.h1, { marginTop: kicker ? 3 : 0 }]}>{title}</Text>
          </View>
        </View>
        {right}
      </View>
    ) : null}
    {scroll ? (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    ) : (
      <View style={styles.flex}>{children}</View>
    )}
  </SafeAreaView>
);

/** Bölüm: üstünde 2px kural, altında boşluk. Kart yok — kural ayırır. */
export const Section = ({
  children,
  style,
  strong = true,
}: {
  children: ReactNode;
  style?: ViewStyle;
  strong?: boolean;
}) => (
  <View
    style={[
      styles.section,
      { borderTopWidth: strong ? rules.strong : rules.light, borderTopColor: strong ? colors.rule : colors.ruleLight },
      style,
    ]}
  >
    {children}
  </View>
);

/** Çerçeveli blok — uyarılar ve öneri kartları için. */
export const Card = ({
  children,
  style,
  tone,
}: {
  children: ReactNode;
  style?: ViewStyle;
  tone?: 'default' | 'accent' | 'ink';
}) => (
  <View
    style={[
      styles.card,
      styles.cardPad,
      tone === 'accent' ? { borderColor: colors.accent } : null,
      style,
    ]}
  >
    {children}
  </View>
);

/** Kırmızı başlık şeridi olan çerçeveli blok. */
export const BannerCard = ({
  kicker,
  children,
  tone = 'accent',
}: {
  kicker: string;
  children: ReactNode;
  tone?: 'accent' | 'ink';
}) => (
  <View style={[styles.card, { borderColor: tone === 'accent' ? colors.accent : colors.ink }]}>
    <View style={[styles.bannerHead, { backgroundColor: tone === 'accent' ? colors.accent : colors.ink }]}>
      <Text style={styles.bannerHeadText}>{kicker}</Text>
    </View>
    <View style={{ padding: spacing.lg, gap: spacing.md }}>{children}</View>
  </View>
);

export const SectionTitle = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => (
  <Text style={[font.label, style]}>{children}</Text>
);

export const Label = ({ children, style }: { children: ReactNode; style?: object }) => (
  <Text style={[font.label, style]}>{children}</Text>
);

export const Muted = ({ children, style }: { children: ReactNode; style?: object }) => (
  <Text style={[font.small, style]}>{children}</Text>
);

/** Düğme — metin daima sola dayalı, köşe yok. */
export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'ink' | 'soft' | 'light' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: ReactNode;
}) => {
  const solid = variant === 'primary' || variant === 'success' || variant === 'warning' || variant === 'danger';
  const bg = solid ? colors.accent : variant === 'ink' ? colors.ink : 'transparent';
  const fg = solid || variant === 'ink' ? colors.onAccent : colors.ink;
  const height = size === 'lg' ? 56 : size === 'sm' ? 42 : 48;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed && solid ? colors.accentPressed : pressed && !solid ? colors.hover : bg,
          borderWidth: solid || variant === 'ink' ? 0 : rules.strong,
          borderColor: colors.ink,
          height,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[font.button, { color: fg, fontSize: size === 'lg' ? 14 : 13 }]}>{title}</Text>
    </Pressable>
  );
};

export const IconButton = ({
  children,
  onPress,
  size = 42,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  size?: number;
  label?: string;
}) => (
  <Pressable
    onPress={onPress}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={({ pressed }) => [
      styles.iconButton,
      { width: size, height: size, backgroundColor: pressed ? colors.hover : 'transparent' },
    ]}
  >
    {children}
  </Pressable>
);

/** Yan yana dizilen, 2px kuralla ayrılmış seçim düğmeleri. */
export const Segmented = ({
  options,
  value,
  onChange,
  style,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}) => (
  <View style={[styles.segmented, style]}>
    {options.map((o, i) => {
      const active = o.key === value;
      return (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          accessibilityRole="button"
          accessibilityLabel={o.label}
          style={[
            styles.segment,
            i < options.length - 1 ? styles.segmentDivider : null,
            active ? { backgroundColor: colors.ink } : null,
          ]}
        >
          <Text
            style={[
              font.button,
              { fontSize: 12, color: active ? colors.onAccent : colors.ink },
            ]}
            numberOfLines={1}
          >
            {o.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export const Chip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      {
        backgroundColor: active ? colors.ink : pressed ? colors.hover : 'transparent',
      },
    ]}
  >
    <Text
      style={[font.button, { fontSize: 11.5, color: active ? colors.onAccent : colors.ink }]}
    >
      {label}
    </Text>
  </Pressable>
);

export const Tag = ({ label, tone = 'ink' }: { label: string; tone?: 'ink' | 'accent' }) => (
  <View style={[styles.tag, tone === 'accent' ? { borderColor: colors.accent } : null]}>
    <Text
      style={[
        font.button,
        { fontSize: 11, color: tone === 'accent' ? colors.accentInk : colors.ink },
      ]}
    >
      {label}
    </Text>
  </View>
);

export const Badge = ({ label, color = colors.accent }: { label: string; color?: string }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={[font.button, { fontSize: 10.5, color: colors.onAccent }]}>{label}</Text>
  </View>
);

export const ProgressBar = ({
  value,
  target,
  color = colors.ink,
  height = 8,
}: {
  value: number;
  target: number;
  color?: string;
  height?: number;
  warnOnOver?: boolean;
}) => {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
};

/** Makro satırı: ETIKET — çubuk — değer. */
export const MacroBar = ({
  label,
  value,
  target,
  color,
  unit = 'g',
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}) => (
  <View style={{ gap: 5 }}>
    <View style={styles.rowBetween}>
      <Text style={[font.labelSm, { color: colors.ink }]}>{label}</Text>
      <Text style={[font.tiny, font.num]}>
        {Math.round(value)} / {Math.round(target)} {unit}
      </Text>
    </View>
    <ProgressBar value={value} target={target} color={color} height={8} />
  </View>
);

export const MacroTile = MacroBar;

/** İnce kilo eğrisi. */
export const Sparkline = ({
  values,
  width = 150,
  height = 52,
  color = colors.accent,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) => {
  const points = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (points.length < 2) return <View style={{ width, height }} />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const x = (i: number) => (i / (points.length - 1)) * (width - 4) + 2;
  const y = (v: number) => height - 8 - ((v - min) / span) * (height - 16);
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return (
    <Svg width={width} height={height}>
      <Path d={`M0 ${height - 1} L${width} ${height - 1}`} stroke={colors.ink} strokeWidth={2} />
      <Path d={d} stroke={color} strokeWidth={2.5} fill="none" />
      <Circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r={3} fill={color} />
    </Svg>
  );
};

/** Sayı girişi: [−] değer [+] — 2px çerçeve, köşe yok. */
export const NumberStepper = ({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 1000,
  suffix,
  decimals = 2,
  compact,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  decimals?: number;
  compact?: boolean;
}) => {
  const format = (n: number) =>
    (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(decimals)))).replace('.', ',');
  const [text, setText] = useState(format(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(format(value));
  }, [value, editing]);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw.replace(',', '.'));
    if (Number.isNaN(parsed)) {
      setText(format(value));
      return;
    }
    onChange(Math.min(max, Math.max(min, parsed)));
  };

  const bump = (delta: number) => {
    const next = Math.min(max, Math.max(min, Math.round((value + delta) * 100) / 100));
    onChange(next);
    setText(format(next));
  };

  const btnW = compact ? 32 : 44;

  return (
    <View style={[styles.stepper, compact ? { height: 46 } : null]}>
      <Pressable
        style={({ pressed }) => [
          styles.stepperBtn,
          { width: btnW, borderRightWidth: rules.strong, backgroundColor: pressed ? colors.hover : 'transparent' },
        ]}
        onPress={() => bump(-step)}
        hitSlop={6}
      >
        <Text style={styles.stepperSign}>−</Text>
      </Pressable>
      <View style={styles.stepperValue}>
        <TextInput
          value={text}
          onChangeText={setText}
          onFocus={() => setEditing(true)}
          onBlur={() => {
            setEditing(false);
            commit(text);
          }}
          onSubmitEditing={() => commit(text)}
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={[styles.stepperInput, compact ? { fontSize: 16 } : null]}
          placeholderTextColor={colors.muted}
        />
        {suffix ? <Text style={styles.stepperSuffix}>{suffix.toUpperCase()}</Text> : null}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.stepperBtn,
          { width: btnW, borderLeftWidth: rules.strong, backgroundColor: pressed ? colors.hover : 'transparent' },
        ]}
        onPress={() => bump(step)}
        hitSlop={6}
      >
        <Text style={styles.stepperSign}>+</Text>
      </Pressable>
    </View>
  );
};

export const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'numeric';
  multiline?: boolean;
}) => (
  <View style={{ gap: 5 }}>
    {label ? <Text style={font.label}>{label}</Text> : null}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[styles.field, multiline ? { height: 130, textAlignVertical: 'top' } : null]}
    />
  </View>
);

/** 2px kuralla ayrılmış hücre — istatistik ızgarası. */
export const StatTile = ({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) => (
  <View style={styles.tile}>
    <Text style={font.labelSm}>{label}</Text>
    <Text style={[styles.tileValue, font.num, color ? { color } : null]}>{value}</Text>
    {sub ? <Text style={font.tiny}>{sub}</Text> : null}
  </View>
);

/** Hücreleri 2px mürekkep boşlukla ayıran ızgara. */
export const Grid = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => (
  <View style={[styles.grid, style]}>{children}</View>
);

/** Etiket — değer satırı. */
export const DataRow = ({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) => (
  <View style={styles.dataRow}>
    <Text style={[font.body, { flex: 1 }]}>{label}</Text>
    <Text style={[strong ? font.bodyStrong : font.body, font.num]}>{value}</Text>
  </View>
);

export const Divider = ({ strong }: { strong?: boolean }) => (
  <View
    style={{
      height: strong ? rules.strong : rules.light,
      backgroundColor: strong ? colors.rule : colors.ruleLight,
    }}
  />
);

export const Loading = () => (
  <View style={[styles.flex, styles.center, { backgroundColor: colors.bg }]}>
    <ActivityIndicator color={colors.accent} size="large" />
  </View>
);

export const Row = ({
  children,
  gap = spacing.sm,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: ViewStyle;
}) => <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: rules.strong,
    borderBottomColor: colors.rule,
    gap: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  section: { paddingVertical: spacing.lg, gap: spacing.md },
  card: { borderWidth: rules.strong, borderColor: colors.ink, marginVertical: spacing.md },
  cardPad: { padding: spacing.lg, gap: spacing.md },
  bannerHead: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bannerHeadText: {
    fontFamily: fonts.extra,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.onAccent,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  iconButton: {
    borderWidth: rules.strong,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    flexDirection: 'row',
    borderTopWidth: rules.strong,
    borderBottomWidth: rules.strong,
    borderColor: colors.rule,
  },
  segment: {
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  segmentDivider: { borderRightWidth: rules.strong, borderRightColor: colors.rule },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: rules.strong,
    borderColor: colors.ink,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: rules.strong,
    borderColor: colors.ink,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4 },
  progressTrack: { backgroundColor: colors.ruleLight, overflow: 'hidden', width: '100%' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    height: 50,
    borderWidth: rules.strong,
    borderColor: colors.ink,
  },
  stepperBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderColor: colors.ruleLight,
  },
  stepperSign: { fontFamily: fonts.extra, fontSize: 19, color: colors.ink, lineHeight: 24 },
  stepperValue: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    color: colors.ink,
    fontFamily: fonts.extra,
    fontSize: 17,
    textAlign: 'center',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 6,
    fontVariant: ['tabular-nums'],
  },
  stepperSuffix: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 9.5,
    marginLeft: 5,
    letterSpacing: 0.4,
  },
  field: {
    backgroundColor: colors.surface,
    borderWidth: rules.strong,
    borderColor: colors.ink,
    color: colors.ink,
    fontFamily: fonts.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  tile: { flex: 1, minWidth: 96, backgroundColor: colors.bg, padding: spacing.md, gap: 3 },
  tileValue: { fontFamily: fonts.black, fontSize: 26, letterSpacing: -0.6, color: colors.ink },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rules.strong,
    backgroundColor: colors.ink,
    borderWidth: rules.strong,
    borderColor: colors.ink,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 10,
    borderTopWidth: rules.light,
    borderTopColor: colors.ruleLight,
  },
});
