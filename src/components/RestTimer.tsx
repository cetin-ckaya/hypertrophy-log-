import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';

import { mmss } from '../logic/date';
import { colors, font, radius, spacing } from '../theme';

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

  return (
    <View style={[styles.wrap, done ? { borderColor: colors.success } : null]}>
      <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      <View style={styles.content}>
        <View>
          <Text style={font.tiny}>{done ? 'DİNLENME BİTTİ' : 'DİNLENME'}</Text>
          <Text style={[styles.time, done ? { color: colors.success } : null]}>
            {mmss(remaining)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable style={styles.btn} onPress={() => onExtend(-30)}>
            <Text style={styles.btnText}>−30 sn</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => onExtend(30)}>
            <Text style={styles.btnText}>+30 sn</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.close]} onPress={onStop}>
            <Text style={styles.btnText}>Bitir</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#1E293B' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  time: { fontSize: 24, fontWeight: '800', color: colors.text },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  close: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnText: { color: colors.text, fontWeight: '700', fontSize: 12 },
});
