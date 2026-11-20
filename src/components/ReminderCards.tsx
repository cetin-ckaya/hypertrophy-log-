import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Label, Row } from './ui';
import { useCheckinCopy } from './WeeklyCheckin';
import { todayKey } from '../logic/date';
import { DueReminder, dueReminders } from '../logic/reminders';
import { dayLogFor, useStore } from '../store/store';
import { colors, font, spacing } from '../theme';
import { TabKey } from '../navigation';

/** "Bugün" ekranının üstündeki uygulama içi hatırlatıcı kartları. */
export const ReminderCards = ({ go }: { go: (tab: TabKey) => void }) => {
  const state = useStore();
  const copyCheckin = useCheckinCopy();
  const [now, setNow] = useState(() => new Date());
  const [copied, setCopied] = useState(false);

  // Saat ilerledikçe yeni kartlar görünsün.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const today = todayKey();
  const due = dueReminders(
    {
      reminders: state.settings.reminders,
      programId: state.programId,
      cycleIndex: state.cycleIndex,
      sessions: state.sessions,
      activeDayId: state.activeSession?.dayId ?? null,
      weights: state.weights,
      armMeasurements: state.armMeasurements ?? {},
      todayLog: dayLogFor(state, today),
      dismissed: state.dismissedReminders ?? {},
    },
    today,
    now
  );
  if (due.length === 0) return null;

  const action = (r: DueReminder) => {
    switch (r.key) {
      case 'weigh':
        return <Button title="Kiloyu gir →" variant="ink" onPress={() => go('stats')} />;
      case 'workout':
        return (
          <Button
            title="Antrenmana başla →"
            variant="ink"
            onPress={() => {
              if (!state.activeSession) state.startWorkout();
              go('workout');
            }}
          />
        );
      case 'gainer': {
        const meal = dayLogFor(state, today).meals.find((m) => m.items.some((i) => i.foodId === 'gainer'));
        return meal ? (
          <Button title="İçtim ✓" variant="ink" onPress={() => state.toggleMealEaten(today, meal.id)} />
        ) : null;
      }
      case 'checkin':
        return (
          <Button
            title={copied ? 'Kopyalandı ✓' : 'Haftalık özeti kopyala'}
            variant="ink"
            onPress={async () => {
              await copyCheckin();
              setCopied(true);
            }}
          />
        );
      case 'measure':
        return <Button title="Ölçümü gir →" variant="ink" onPress={() => go('stats')} />;
    }
  };

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
      {due.map((r) => (
        <Card key={r.key} tone="accent">
          <Label style={{ color: colors.accentInk }}>Hatırlatıcı · {r.title}</Label>
          <Text style={font.body}>{r.body}</Text>
          <Row gap={spacing.sm}>
            <View style={{ flex: 1 }}>{action(r)}</View>
            <Button title="Kapat" variant="ghost" onPress={() => state.dismissReminder(r.key, today)} />
          </Row>
        </Card>
      ))}
    </View>
  );
};

