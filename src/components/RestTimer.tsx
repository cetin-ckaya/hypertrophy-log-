import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { mmss } from '../logic/date';
import { colors, font, radius, restGradient, spacing } from '../theme';

export const RestTimer = ({
  endsAt,
  duration,
  onStop,
  onExtend,
}: {
  endsAt: number;
  duration: number;
  onStop: () => void;
  onExtend: (seconds: number) => void;
}) => {
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, (endsAt - now) / 1000);

  useEffect(() => {
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      if (Platform.OS !== 'web') Vibration.vibrate([0, 300, 150, 300]);
    }
    if (remaining > 0) fired.current = false;
  }, [remaining]);

  const pct = duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;
  const done = remaining <= 0;
  const size = 52;
  const r = 22;
  const c = 2 * Math.PI * r;

  return (
    <LinearGradient
      colors={restGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, done ? { borderColor: colors.success } : null]}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#2E3B55" strokeWidth={4.5} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={done ? colors.success : colors.primary}
          strokeWidth={4.5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={{ flex: 1 }}>
        <Text style={[font.label, { color: '#8FA6CC' }]}>
          {done ? 'Dinlenme bitti' : 'Dinlenme'}
        </Text>
        <Text style={[styles.time, done ? { color: colors.success } : null]}>{mmss(remaining)}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pressable style={styles.btn} onPress={() => onExtend(30)}>
          <Text style={styles.btnText}>+30 sn</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.primary]} onPress={onStop}>
          <Text style={[styles.btnText, { color: '#fff' }]}>Bitir</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#2A3A5C',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  time: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  btn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  btnText: { color: '#CBD7EC', fontWeight: '800', fontSize: 13 },
});
