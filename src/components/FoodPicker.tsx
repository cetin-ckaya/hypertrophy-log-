import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Food } from '../types';
import { colors, font, radius, spacing } from '../theme';
import { Field } from './ui';

export const FoodPicker = ({
  foods,
  exclude = [],
  onPick,
}: {
  foods: Record<string, Food>;
  exclude?: string[];
  onPick: (food: Food) => void;
}) => {
  const [query, setQuery] = useState('');
  const list = useMemo(
    () =>
      Object.values(foods)
        .filter((f) => !exclude.includes(f.id))
        .filter((f) => f.name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')))
        .sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [foods, exclude, query]
  );

  return (
    <View style={{ gap: spacing.sm }}>
      <Field value={query} onChangeText={setQuery} placeholder="Besin ara…" />
      <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          {list.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => onPick(f)}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? colors.border : colors.cardAlt,
                  borderRadius: radius.sm,
                  padding: spacing.md,
                },
              ]}
            >
              <Text style={[font.body, { fontWeight: '600' }]}>{f.name}</Text>
              <Text style={font.tiny}>
                100 {f.unit}: {f.kcal} kcal · P {f.protein} · K {f.carbs} · Y {f.fat}
              </Text>
            </Pressable>
          ))}
          {list.length === 0 ? <Text style={font.small}>Eşleşen besin yok.</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
};
