import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';

import { mmss } from '../logic/date';
import { colors, font, fonts, rules, spacing } from '../theme';

export const RestBar = ({
  endsAt,
  onStart,
  onStop,
  onExtend,
}: {
  endsAt: number | null;
  onStart: () => void;
  onStop: () => void;
  onExtend: (seconds: number) => void;
}) => {
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);

  useEffect(() => {
    if (endsAt === null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [endsAt]);

  const remaining = endsAt === null ? 0 : Math.max(0, (endsAt - now) / 1000);

  useEffect(() => {
    if (endsAt === null) return;
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      if (Platform.OS !== 'web') Vibration.vibrate([0, 300, 150, 300]);
    }
    if (remaining > 0) fired.current = false;
  }, [remaining, endsAt]);

  const running = endsAt !== null && remaining > 0;
  const done = endsAt !== null && remaining <= 0;

  return (
    <View style={styles.wrap}>
      <Text style={font.label}>Dinlenme</Text>
      <Text style={[styles.time, done ? { color: colors.accent } : null]}>
        {endsAt === null ? '—:—' : mmss(remaining)}
      </Text>
      {running || done ? (
        <>
          <Pressable style={styles.btn} onPress={() => onExtend(30)}>
            <Text style={styles.btnText}>+30 sn</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnInk]} onPress={onStop}>
            <Text style={[styles.btnText, { color: colors.onAccent }]}>Bitir</Text>
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.btn} onPress={onStart}>
          <Text style={styles.btnText}>Başlat</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: rules.light,
    borderBottomColor: colors.ruleLight,
  },
  time: {
    flex: 1,
    fontFamily: fonts.black,
    fontSize: 22,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  btn: {
    minHeight: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: rules.strong,
    borderColor: colors.ink,
  },
  btnInk: { backgroundColor: colors.ink },
  btnText: {
    fontFamily: fonts.extra,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.ink,
  },
});
