import React from 'react';
import { Text, View } from 'react-native';

import { trimNum } from '../logic/progression';
import { useStore } from '../store/store';
import { colors, font, spacing } from '../theme';
import { BannerCard, Button, DataRow, Row } from './ui';

/** Haftalık kalori ayarı önerisi — kırmızı şeritli, onay/ret düğmeli. */
export const AdjustmentCard = () => {
  const adj = useStore((s) => s.pendingAdjustment);
  const apply = useStore((s) => s.applyAdjustment);
  const reject = useStore((s) => s.rejectAdjustment);
  const proteinFloor = useStore((s) => s.settings.proteinFloor);
  if (!adj) return null;

  return (
    <BannerCard kicker={`Haftalık kalori ayarı · ${adj.reason}`}>
      <Text style={[font.body, { fontSize: 17, lineHeight: 24 }]}>{adj.message}</Text>

      <View>
        <DataRow
          label="Son 7 gün ortalaması"
          value={`${adj.avgNow.toFixed(2).replace('.', ',')} kg`}
          strong
        />
        <DataRow
          label="Önceki 7 gün ortalaması"
          value={`${adj.avgPrev.toFixed(2).replace('.', ',')} kg`}
          strong
        />
        {adj.changes.map((c) => (
          <DataRow
            key={`${c.mealId}-${c.foodId}`}
            label={`${c.mealName.replace(/ —.*/, '')} · ${c.foodName}`}
            value={`${trimNum(c.from)} g → ${trimNum(c.to)} g`}
            strong
          />
        ))}
        <DataRow label="Protein" value={`${proteinFloor} g · sabit`} strong />
      </View>

      <Row gap={spacing.sm}>
        <Button title="Onayla" onPress={apply} style={{ flex: 1 }} />
        <Button title="Reddet" variant="ghost" onPress={reject} style={{ flex: 1 }} />
      </Row>
    </BannerCard>
  );
};
