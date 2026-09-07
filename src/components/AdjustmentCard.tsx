import React from 'react';
import { Text, View } from 'react-native';

import { trimNum } from '../logic/progression';
import { useStore } from '../store/store';
import { colors, font, spacing } from '../theme';
import { AlertIcon, ArrowUpIcon, CheckIcon } from './icons';
import { Button, Card, Label, Row } from './ui';

export const AdjustmentCard = () => {
  const adj = useStore((s) => s.pendingAdjustment);
  const apply = useStore((s) => s.applyAdjustment);
  const reject = useStore((s) => s.rejectAdjustment);
  const proteinFloor = useStore((s) => s.settings.proteinFloor);
  if (!adj) return null;

  const tone = adj.kcalDelta === 0 ? 'success' : adj.kcalDelta > 0 ? 'primary' : 'warning';
  const accent =
    adj.kcalDelta === 0 ? colors.success : adj.kcalDelta > 0 ? colors.primary : colors.warning;

  return (
    <Card tone={tone}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label>Haftalık kalori ayarı</Label>
        <Text style={font.tiny}>{adj.date}</Text>
      </Row>

      <Row gap={spacing.sm}>
        <View style={[styles.icon, { backgroundColor: `${accent}22` }]}>
          {adj.kcalDelta === 0 ? (
            <CheckIcon size={16} color={accent} />
          ) : adj.kcalDelta > 0 ? (
            <ArrowUpIcon size={16} color={accent} />
          ) : (
            <AlertIcon size={16} color={accent} />
          )}
        </View>
        <Text style={[font.h3, { flex: 1 }]}>{adj.reason}</Text>
      </Row>

      <Text style={[font.body, { lineHeight: 20, color: colors.textDim }]}>{adj.message}</Text>

      <View style={styles.detail}>
        <Text style={[font.tiny, font.num]}>
          Son 7 gün ort. {adj.avgNow.toFixed(2).replace('.', ',')} kg · önceki 7 gün ort.{' '}
          {adj.avgPrev.toFixed(2).replace('.', ',')} kg
        </Text>
        {adj.changes.length > 0 ? (
          adj.changes.map((c) => (
            <Row key={`${c.mealId}-${c.foodId}`} style={{ justifyContent: 'space-between' }}>
              <Text style={[font.small, { flex: 1 }]} numberOfLines={1}>
                {c.mealName.replace(/ —.*/, '')} · {c.foodName}
              </Text>
              <Text style={[font.small, font.num, { color: colors.text, fontWeight: '700' }]}>
                {trimNum(c.from)} → {trimNum(c.to)} g
              </Text>
            </Row>
          ))
        ) : (
          <Text style={font.small}>Gramajlarda değişiklik yok.</Text>
        )}
      </View>

      <Row gap={spacing.sm}>
        <Button title="Onayla" variant="success" onPress={apply} style={{ flex: 1 }} />
        <Button title="Reddet" variant="soft" onPress={reject} style={{ flex: 1 }} />
      </Row>
      <Text style={font.tiny}>
        Onaylarsan hedef ve gramajlar otomatik güncellenir. Protein {proteinFloor} g altına düşürülmez.
      </Text>
    </Card>
  );
};

const styles = {
  icon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  detail: {
    backgroundColor: colors.cardAlt,
    borderRadius: 14,
    padding: spacing.md,
    gap: 7,
  },
};
