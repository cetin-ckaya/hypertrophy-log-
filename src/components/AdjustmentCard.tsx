import React from 'react';
import { Text, View } from 'react-native';

import { trimNum } from '../logic/progression';
import { useStore } from '../store/store';
import { colors, font, spacing } from '../theme';
import { Button, Card, Row } from './ui';

export const AdjustmentCard = () => {
  const adj = useStore((s) => s.pendingAdjustment);
  const apply = useStore((s) => s.applyAdjustment);
  const reject = useStore((s) => s.rejectAdjustment);
  const foods = useStore((s) => s.foods);
  if (!adj) return null;

  const tone = adj.kcalDelta === 0 ? 'success' : adj.kcalDelta > 0 ? 'primary' : 'warning';

  return (
    <Card tone={tone}>
      <Text style={font.tiny}>HAFTALIK KALORİ AYARI · {adj.date}</Text>
      <Text style={font.h3}>{adj.reason}</Text>
      <Text style={[font.body, { lineHeight: 21 }]}>{adj.message}</Text>

      <View style={{ gap: 4, marginTop: spacing.xs }}>
        <Text style={font.tiny}>
          Son 7 gün ort. {adj.avgNow.toFixed(2).replace('.', ',')} kg · önceki 7 gün ort.{' '}
          {adj.avgPrev.toFixed(2).replace('.', ',')} kg
        </Text>
        {adj.changes.length > 0 ? (
          adj.changes.map((c) => (
            <Text key={`${c.mealId}-${c.foodId}`} style={font.small}>
              • {c.mealName} — {c.foodName}: {trimNum(c.from)} g → {trimNum(c.to)} g
            </Text>
          ))
        ) : (
          <Text style={font.small}>• Gramajlarda değişiklik yok.</Text>
        )}
      </View>

      <Row gap={spacing.sm} style={{ marginTop: spacing.sm }}>
        <Button
          title="Onayla"
          variant="success"
          onPress={apply}
          style={{ flex: 1 }}
        />
        <Button title="Reddet" variant="ghost" onPress={reject} style={{ flex: 1 }} />
      </Row>
      <Text style={font.tiny}>
        Onaylarsan hedef ve gramajlar otomatik güncellenir. Protein tabanı{' '}
        {useStore.getState().settings.proteinFloor} g altına düşürülmez.
      </Text>
    </Card>
  );
};
