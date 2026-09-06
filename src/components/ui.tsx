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

import { colors, font, radius, spacing } from '../theme';

export const Screen = ({
  children,
  title,
  right,
  scroll = true,
}: {
  children: ReactNode;
  title?: string;
  right?: ReactNode;
  scroll?: boolean;
}) => (
  <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
    {title ? (
      <View style={styles.header}>
        <Text style={font.h1}>{title}</Text>
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
    <View
      style={[
        styles.card,
        toneColor ? { borderColor: toneColor, borderWidth: 1.5 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const SectionTitle = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => (
  <Text style={[styles.sectionTitle, style]}>{children}</Text>
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
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
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
      : 'transparent';
  const height = size === 'lg' ? 56 : size === 'sm' ? 36 : 46;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variant === 'ghost' ? 'transparent' : bg,
          borderColor: variant === 'ghost' ? colors.border : bg,
          height,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: variant === 'ghost' ? colors.text : variant === 'warning' ? '#1A1206' : '#fff',
            fontSize: size === 'lg' ? 17 : size === 'sm' ? 13 : 15,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

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
    <Text style={{ color: active ? '#fff' : colors.textDim, fontWeight: '600', fontSize: 13 }}>
      {label}
    </Text>
  </Pressable>
);

export const ProgressBar = ({
  value,
  target,
  color = colors.primary,
  height = 8,
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

export const MacroBar = ({
  label,
  value,
  target,
  unit = 'g',
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color: string;
}) => (
  <View style={{ flex: 1 }}>
    <View style={styles.row}>
      <Text style={font.tiny}>{label}</Text>
      <Text style={[font.tiny, { color: colors.textDim }]}>
        {Math.round(value)}/{Math.round(target)} {unit}
      </Text>
    </View>
    <ProgressBar value={value} target={target} color={color} height={6} warnOnOver={false} />
  </View>
);

/** Büyük dokunma alanlı sayı girişi: −  [ 62,5 ]  + */
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
    Number.isInteger(n) ? String(n) : String(Number(n.toFixed(decimals)));
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

  return (
    <View style={[styles.stepper, compact ? { height: 44 } : null]}>
      <Pressable
        style={[styles.stepperBtn, compact ? { width: 34 } : null]}
        onPress={() => bump(-step)}
        hitSlop={6}
      >
        <Text style={styles.stepperBtnText}>−</Text>
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
          placeholderTextColor={colors.textFaint}
        />
        {suffix ? <Text style={styles.stepperSuffix}>{suffix}</Text> : null}
      </View>
      <Pressable
        style={[styles.stepperBtn, compact ? { width: 34 } : null]}
        onPress={() => bump(step)}
        hitSlop={6}
      >
        <Text style={styles.stepperBtnText}>+</Text>
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
    <Text style={font.tiny}>{label}</Text>
    <Text style={[styles.tileValue, color ? { color } : null]}>{value}</Text>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: { padding: spacing.lg, paddingTop: 0, paddingBottom: 40, gap: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  buttonText: { fontWeight: '700' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  progressTrack: { backgroundColor: colors.cardAlt, overflow: 'hidden', width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
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
  stepperBtn: { width: 42, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  stepperBtnText: { color: colors.text, fontSize: 24, fontWeight: '700', lineHeight: 28 },
  stepperValue: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 6,
  },
  stepperSuffix: { color: colors.textDim, fontSize: 12, marginLeft: 1 },
  field: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
    minWidth: 90,
  },
  tileValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
});
