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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { colors, font, heroGradient, radius, spacing } from '../theme';
import { MinusIcon, PlusIcon } from './icons';

export const Screen = ({
  children,
  title,
  subtitle,
  right,
  left,
  scroll = true,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  left?: ReactNode;
  scroll?: boolean;
}) => (
  <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
    {title ? (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {left}
          <View>
            <Text style={font.h1}>{title}</Text>
            {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
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

export const Card = ({
  children,
  style,
  tone,
}: {
  children: ReactNode;
  style?: ViewStyle;
  tone?: 'default' | 'warning' | 'success' | 'primary' | 'danger';
}) => {
  const toneColor =
    tone === 'warning'
      ? colors.warning
      : tone === 'success'
      ? colors.success
      : tone === 'primary'
      ? colors.primary
      : tone === 'danger'
      ? colors.danger
      : undefined;
  return (
    <View style={[styles.card, toneColor ? { borderColor: toneColor } : null, style]}>
      {children}
    </View>
  );
};

/** Ana ekranın gradyanlı üst kartı. */
export const HeroCard = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => (
  <LinearGradient
    colors={heroGradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[styles.hero, style]}
  >
    <View style={styles.heroBlob} pointerEvents="none" />
    {children}
  </LinearGradient>
);

export const SectionTitle = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => (
  <Text style={[font.label, styles.sectionTitle, style]}>{children}</Text>
);

export const Label = ({ children, style }: { children: ReactNode; style?: object }) => (
  <Text style={[font.label, style]}>{children}</Text>
);

export const Muted = ({ children, style }: { children: ReactNode; style?: object }) => (
  <Text style={[font.small, style]}>{children}</Text>
);

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
  variant?: 'primary' | 'ghost' | 'success' | 'danger' | 'warning' | 'light' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: ReactNode;
}) => {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'success'
      ? colors.success
      : variant === 'danger'
      ? colors.danger
      : variant === 'warning'
      ? colors.warning
      : variant === 'light'
      ? '#FFFFFF'
      : variant === 'soft'
      ? colors.cardAlt
      : 'transparent';
  const fg =
    variant === 'ghost'
      ? colors.text
      : variant === 'soft'
      ? colors.text
      : variant === 'light'
      ? '#112233'
      : variant === 'success' || variant === 'warning'
      ? '#16250A'
      : '#fff';
  const height = size === 'lg' ? 54 : size === 'sm' ? 38 : 46;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor:
            variant === 'ghost' || variant === 'soft' ? colors.border : bg,
          height,
          borderRadius: size === 'lg' ? radius.md + 1 : radius.md,
          opacity: disabled ? 0.4 : pressed ? 0.78 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.buttonText,
          { color: fg, fontSize: size === 'lg' ? 15.5 : size === 'sm' ? 13 : 14.5 },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

export const IconButton = ({
  children,
  onPress,
  size = 38,
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
      { width: size, height: size, opacity: pressed ? 0.7 : 1 },
    ]}
  >
    {children}
  </Pressable>
);

export const Chip = ({
  label,
  active,
  onPress,
  color,
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
        backgroundColor: active ? color ?? colors.primary : colors.cardAlt,
        borderColor: active ? color ?? colors.primary : colors.border,
        opacity: pressed ? 0.75 : 1,
      },
    ]}
  >
    <Text style={{ color: active ? '#fff' : colors.textDim, fontWeight: '700', fontSize: 12.5 }}>
      {label}
    </Text>
  </Pressable>
);

/** İki seçenekli segment düğmesi (antrenman / dinlenme günü gibi). */
export const Toggle = ({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) => (
  <View style={styles.toggle}>
    {options.map((o) => {
      const active = o.key === value;
      return (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[styles.toggleItem, active ? styles.toggleItemOn : null]}
        >
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: '700',
              color: active ? '#fff' : colors.textDim,
            }}
          >
            {o.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export const Badge = ({
  label,
  color = colors.success,
}: {
  label: string;
  color?: string;
}) => (
  <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
    <Text style={{ color, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4 }}>{label}</Text>
  </View>
);

export const ProgressBar = ({
  value,
  target,
  color = colors.primary,
  height = 4,
  warnOnOver = true,
}: {
  value: number;
  target: number;
  color?: string;
  height?: number;
  warnOnOver?: boolean;
}) => {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const over = warnOnOver && target > 0 && value / target > 1.08;
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: over ? colors.warning : color,
        }}
      />
    </View>
  );
};

/** Makro kutucuğu: başlık, değer/hedef ve ince bir çubuk. */
export const MacroTile = ({
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
  <View style={styles.macroTile}>
    <Text style={styles.macroLabel}>{label}</Text>
    <Text style={[styles.macroValue, font.num]}>
      {Math.round(value)}
      <Text style={styles.macroTarget}>
        /{Math.round(target)} {unit}
      </Text>
    </Text>
    <ProgressBar value={value} target={target} color={color} height={3} warnOnOver={false} />
  </View>
);

/** Kalori halkası — ortada yüzde, kenarda gradyanlı yay. */
export const Ring = ({
  progress,
  size = 92,
  stroke = 9,
  caption = 'HEDEF',
}: {
  progress: number;
  size?: number;
  stroke?: number;
  caption?: string;
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor={colors.cyan} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.cardAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.ringCenter}>
          <Text style={[styles.ringPct, font.num]}>%{Math.round(pct * 100)}</Text>
          <Text style={styles.ringCaption}>{caption}</Text>
        </View>
      </View>
    </View>
  );
};

/** Kartların içindeki küçük kilo/eğri çizimi. */
export const Sparkline = ({
  values,
  width = 150,
  height = 52,
  color = colors.primary,
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
  const x = (i: number) => (i / (points.length - 1)) * (width - 6) + 3;
  const y = (v: number) => height - 6 - ((v - min) / span) * (height - 12);
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${d} L${x(points.length - 1).toFixed(1)} ${height} L${x(0).toFixed(1)} ${height} Z`;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Path d={area} fill="url(#sparkGrad)" />
      <Path d={d} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r={3.4} fill={colors.text} />
    </Svg>
  );
};

/** Büyük dokunma alanlı sayı girişi: −  [ 62,5 kg ]  + */
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
  // Ondalık ayracı Türkçe virgül; commit() hem virgülü hem noktayı kabul eder.
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

  const btnW = compact ? 34 : 44;

  return (
    <View style={[styles.stepper, compact ? { height: 48 } : null]}>
      <Pressable style={[styles.stepperBtn, { width: btnW }]} onPress={() => bump(-step)} hitSlop={6}>
        <MinusIcon size={compact ? 15 : 17} color={colors.textDim} />
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
          style={[styles.stepperInput, compact ? { fontSize: 17 } : null]}
          placeholderTextColor={colors.textFaint}
        />
        {suffix ? <Text style={styles.stepperSuffix}>{suffix}</Text> : null}
      </View>
      <Pressable style={[styles.stepperBtn, { width: btnW }]} onPress={() => bump(step)} hitSlop={6}>
        <PlusIcon size={compact ? 15 : 17} color={colors.textDim} />
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
  <View style={{ gap: 6 }}>
    {label ? <Text style={font.small}>{label}</Text> : null}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[styles.field, multiline ? { height: 120, textAlignVertical: 'top' } : null]}
    />
  </View>
);

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
    <Text style={font.label}>{label}</Text>
    <Text style={[styles.tileValue, font.num, color ? { color } : null]}>{value}</Text>
    {sub ? <Text style={font.tiny}>{sub}</Text> : null}
  </View>
);

export const Divider = () => <View style={styles.divider} />;

export const Loading = () => (
  <View style={[styles.flex, styles.center, { backgroundColor: colors.bg }]}>
    <ActivityIndicator color={colors.primary} size="large" />
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  headerSub: { fontSize: 12.5, color: colors.textDim, marginTop: 2 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: 0, paddingBottom: 40, gap: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  hero: { borderRadius: radius.xl, padding: spacing.lg, overflow: 'hidden' },
  heroBlob: {
    position: 'absolute',
    right: -46,
    top: -46,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  sectionTitle: { marginTop: spacing.sm },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  buttonText: { fontWeight: '800' },
  iconButton: {
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  toggleItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.sm },
  toggleItemOn: { backgroundColor: colors.primary },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm },
  progressTrack: { backgroundColor: colors.cardAlt, overflow: 'hidden', width: '100%' },
  macroTile: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 5,
  },
  macroLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  macroValue: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  macroTarget: { fontSize: 11.5, color: colors.textFaint, fontWeight: '600' },
  ringCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  ringCaption: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textFaint,
    marginTop: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stepperBtn: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  stepperValue: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 6,
    fontVariant: ['tabular-nums'],
  },
  stepperSuffix: { color: colors.textFaint, fontSize: 11, marginLeft: 2, fontWeight: '600' },
  field: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14.5,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 3,
    minWidth: 96,
  },
  tileValue: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
});
