import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdjustmentCard } from '../components/AdjustmentCard';
import { FoodPicker } from '../components/FoodPicker';
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from '../components/icons';
import {
  Button,
  Card,
  Chip,
  Field,
  Label,
  MacroBar,
  NumberStepper,
  Row,
  Screen,
  Section,
  Segmented,
} from '../components/ui';
import { addDays, formatRelative, todayKey } from '../logic/date';
import { eatenMacros, itemMacros, mealMacros, planMacros } from '../logic/nutrition';
import { dayLogFor, useStore } from '../store/store';
import { colors, font, fonts, macroColors, rules, spacing } from '../theme';
import { Food } from '../types';

type Sub = 'diary' | 'foods';

export const NutritionScreen = () => {
  const state = useStore();
  const [date, setDate] = useState(todayKey());
  const [sub, setSub] = useState<Sub>('diary');
  const [mode, setMode] = useState<'day' | 'plan'>('day');
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [newFood, setNewFood] = useState(false);

  const log = useMemo(
    () => dayLogFor(state, date),
    [state.dayLogs, state.plan, state.settings.restDayCarbReduction, state.cycleIndex, date]
  );
  const eaten = eatenMacros(log.meals, state.foods);
  const planTotal = planMacros(state.plan, state.foods);
  const dayTotal = planMacros(log.meals, state.foods);
  const gap = state.calorieTarget - planTotal.kcal;

  const shown = mode === 'day' ? eaten : planTotal;
  const meals = mode === 'day' ? log.meals : state.plan;
  const foods = Object.values(state.foods).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  return (
    <Screen
      kicker={`Beslenme · ${log.isTraining ? 'antrenman günü' : 'dinlenme günü'}`}
      title={`${Math.round(shown.kcal).toLocaleString('tr-TR')} / ${state.calorieTarget.toLocaleString('tr-TR')} kcal`}
    >
      <View style={styles.macroStrip}>
        <MacroBar label="Protein" value={shown.protein} target={state.macroTargets.protein} color={macroColors.protein} />
        <MacroBar label="Karb" value={shown.carbs} target={state.macroTargets.carbs} color={macroColors.carbs} />
        <MacroBar label="Yağ" value={shown.fat} target={state.macroTargets.fat} color={macroColors.fat} />
      </View>

      <Segmented
        options={[
          { key: 'diary', label: 'Günlük' },
          { key: 'foods', label: 'Besin veritabanı' },
        ]}
        value={sub}
        onChange={(k) => setSub(k as Sub)}
        style={{ borderTopWidth: 0 }}
      />

      {state.pendingAdjustment ? <AdjustmentCard /> : null}

      {sub === 'diary' ? (
        <>
          {Math.abs(gap) >= 40 ? (
            <Card tone="accent">
                <Label style={{ color: colors.accentInk }}>Plan ile hedef arasında fark var</Label>
                <Text style={font.body}>
                  Planın {Math.round(planTotal.kcal)} kcal, hedefin {state.calorieTarget} kcal —{' '}
                  {gap > 0 ? `${Math.round(gap)} kcal açık` : `${Math.round(-gap)} kcal fazla`} var. Farkı
                  karbonhidrattan dengeleyebilirim; protein {state.settings.proteinFloor} g altına düşmez.
                </Text>
                <Button title="Planı hedefe göre dengele" onPress={state.matchPlanToTarget} />
            </Card>
          ) : null}

          <Section strong={false} style={{ borderTopWidth: 0 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={10} disabled={mode === 'plan'}>
                <Row gap={4}>
                  <ChevronLeftIcon size={15} color={mode === 'plan' ? colors.ruleLight : colors.ink} />
                  <Text style={[font.labelSm, { color: mode === 'plan' ? colors.ruleLight : colors.ink }]}>
                    Önceki
                  </Text>
                </Row>
              </Pressable>
              <Text style={font.h3}>{mode === 'day' ? formatRelative(date) : 'Varsayılan plan'}</Text>
              <Pressable
                onPress={() => setDate(addDays(date, 1) > todayKey() ? todayKey() : addDays(date, 1))}
                hitSlop={10}
                disabled={mode === 'plan'}
              >
                <Row gap={4}>
                  <Text style={[font.labelSm, { color: mode === 'plan' ? colors.ruleLight : colors.ink }]}>
                    Sonraki
                  </Text>
                  <ChevronRightIcon size={15} color={mode === 'plan' ? colors.ruleLight : colors.ink} />
                </Row>
              </Pressable>
            </Row>

            <Segmented
              options={[
                { key: 'day', label: 'Bu gün' },
                { key: 'plan', label: 'Plan' },
              ]}
              value={mode}
              onChange={(k) => setMode(k as 'day' | 'plan')}
            />

            {mode === 'day' ? (
              <Segmented
                options={[
                  { key: 'training', label: 'Antrenman günü' },
                  { key: 'rest', label: 'Dinlenme günü' },
                ]}
                value={log.isTraining ? 'training' : 'rest'}
                onChange={(k) => state.setDayTraining(date, k === 'training')}
                style={{ borderTopWidth: 0 }}
              />
            ) : (
              <>
                <Label>Günlük kalori hedefi</Label>
                <NumberStepper
                  value={state.calorieTarget}
                  onChange={state.setCalorieTarget}
                  step={50}
                  min={1200}
                  max={6000}
                  decimals={0}
                  suffix="kcal"
                />
              </>
            )}

            <Text style={[font.tiny, font.num]}>
              {mode === 'day'
                ? `Günün tam planı: ${Math.round(dayTotal.kcal)} kcal · P ${Math.round(dayTotal.protein)} · K ${Math.round(dayTotal.carbs)} · Y ${Math.round(dayTotal.fat)}`
                : `Plan toplamı: ${Math.round(planTotal.kcal)} kcal · P ${Math.round(planTotal.protein)} · K ${Math.round(planTotal.carbs)} · Y ${Math.round(planTotal.fat)}`}
            </Text>
          </Section>

          {meals.map((meal) => {
            const macros = mealMacros(meal, state.foods);
            const eatenFlag = mode === 'day' ? (meal as { eaten?: boolean }).eaten === true : false;
            return (
              <View key={meal.id} style={styles.meal}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }} gap={spacing.md}>
                  <View style={{ flex: 1 }}>
                    <Text style={font.labelSm}>{meal.name.split(' — ')[0]}</Text>
                    <Text style={styles.mealTitle}>{meal.name.split(' — ')[1] ?? meal.name}</Text>
                  </View>
                  <Text style={[font.tiny, font.num, { textAlign: 'right' }]}>
                    {Math.round(macros.kcal)} kcal{'\n'}P {Math.round(macros.protein)} · K{' '}
                    {Math.round(macros.carbs)} · Y {Math.round(macros.fat)}
                  </Text>
                </Row>

                {meal.items.map((item) => {
                  const food = state.foods[item.foodId];
                  const im = itemMacros(item, state.foods);
                  return (
                    <View key={item.foodId} style={styles.item}>
                      <Row style={{ justifyContent: 'space-between' }} gap={spacing.sm}>
                        <Text style={[font.body, { flex: 1 }]}>{food?.name ?? item.foodId}</Text>
                        <Text style={[font.tiny, font.num]}>{Math.round(im.kcal)} kcal</Text>
                        <Pressable
                          onPress={() =>
                            mode === 'day'
                              ? state.removeDayItem(date, meal.id, item.foodId)
                              : state.removePlanItem(meal.id, item.foodId)
                          }
                          hitSlop={10}
                        >
                          <TrashIcon size={16} color={colors.muted} />
                        </Pressable>
                      </Row>
                      <NumberStepper
                        value={item.amount}
                        onChange={(v) =>
                          mode === 'day'
                            ? state.setDayItemAmount(date, meal.id, item.foodId, v)
                            : state.setPlanItemAmount(meal.id, item.foodId, v)
                        }
                        step={5}
                        max={2000}
                        decimals={0}
                        suffix={food?.unit ?? 'g'}
                        compact
                      />
                    </View>
                  );
                })}

                {pickerFor === meal.id ? (
                  <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                    <FoodPicker
                      foods={state.foods}
                      exclude={meal.items.map((i) => i.foodId)}
                      onPick={(f: Food) => {
                        if (mode === 'day') state.addDayItem(date, meal.id, f.id, 100);
                        else state.addPlanItem(meal.id, f.id, 100);
                        setPickerFor(null);
                      }}
                    />
                    <Button title="Kapat" variant="ghost" size="sm" onPress={() => setPickerFor(null)} />
                  </View>
                ) : (
                  <Row gap={spacing.sm} style={{ marginTop: spacing.md }}>
                    {mode === 'day' ? (
                      <Button
                        title={eatenFlag ? '✓ Yendi' : 'Yedim'}
                        variant={eatenFlag ? 'ink' : 'ghost'}
                        onPress={() => state.toggleMealEaten(date, meal.id)}
                        style={{ flex: 1 }}
                      />
                    ) : null}
                    <Button
                      title="+ Besin"
                      variant="ghost"
                      onPress={() => setPickerFor(meal.id)}
                      style={{ flex: 1 }}
                    />
                  </Row>
                )}
              </View>
            );
          })}

          <Section>
            <Text style={font.small}>
              Tüm gramajlar çiğ / kuru ölçüdür. Dinlenme gününde 1. öğün dışındaki öğünlerin pirinci{' '}
              {state.settings.restDayCarbReduction} g düşer; protein {state.settings.proteinFloor} g'ın
              altına inerse tavuk gramajı dengelenir.
            </Text>
            {mode === 'day' ? (
              <Button title="Günü plandan sıfırla" variant="ghost" onPress={() => state.resetDayFromPlan(date)} />
            ) : null}
          </Section>
        </>
      ) : (
        <>
          <Section strong={false} style={{ borderTopWidth: 0 }}>
            <Row style={{ justifyContent: 'space-between' }} gap={spacing.md}>
              <Text style={[font.small, { flex: 1 }]}>100 g / 100 ml başına, çiğ veya kuru ölçü</Text>
              <Button title="+ Yeni besin" onPress={() => setNewFood(true)} size="sm" />
            </Row>
          </Section>

          {newFood ? <NewFoodForm onDone={() => setNewFood(false)} /> : null}

          <View style={styles.foodHead}>
            <Text style={[font.labelSm, { flex: 1 }]}>Besin</Text>
            <Text style={[font.labelSm, styles.fcol]}>Kcal</Text>
            <Text style={[font.labelSm, styles.fcolSm]}>Prot</Text>
            <Text style={[font.labelSm, styles.fcolSm]}>Karb</Text>
            <Text style={[font.labelSm, styles.fcolSm]}>Yağ</Text>
          </View>
          {foods.map((f) => (
            <View key={f.id} style={styles.foodRow}>
              <Text style={[font.body, { flex: 1 }]} numberOfLines={2}>
                {f.name}
                {f.custom ? <Text style={styles.custom}>  ÖZEL</Text> : null}
              </Text>
              <Text style={[font.bodyStrong, font.num, styles.fcol]}>{f.kcal}</Text>
              <Text style={[font.body, font.num, styles.fcolSm]}>{f.protein}</Text>
              <Text style={[font.body, font.num, styles.fcolSm]}>{f.carbs}</Text>
              <Text style={[font.body, font.num, styles.fcolSm]}>{f.fat}</Text>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
};

const NewFoodForm = ({ onDone }: { onDone: () => void }) => {
  const addFood = useStore((s) => s.addFood);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'g' | 'ml'>('g');
  const [kcal, setKcal] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [error, setError] = useState('');

  return (
    <Card>
        <Label>Yeni besin · 100 {unit} başına</Label>
        <Field label="Ad" value={name} onChangeText={setName} placeholder="Örn. Ton balığı" />
        <Row gap={spacing.sm}>
          <Chip label="gram" active={unit === 'g'} onPress={() => setUnit('g')} />
          <Chip label="mililitre" active={unit === 'ml'} onPress={() => setUnit('ml')} />
        </Row>
        <Label>Kalori</Label>
        <NumberStepper value={kcal} onChange={setKcal} step={5} max={1000} decimals={1} compact />
        <Label>Protein (g)</Label>
        <NumberStepper value={protein} onChange={setProtein} step={0.5} max={100} decimals={1} compact />
        <Label>Karbonhidrat (g)</Label>
        <NumberStepper value={carbs} onChange={setCarbs} step={0.5} max={100} decimals={1} compact />
        <Label>Yağ (g)</Label>
        <NumberStepper value={fat} onChange={setFat} step={0.5} max={100} decimals={1} compact />
        {error ? <Text style={[font.small, { color: colors.accentInk }]}>{error}</Text> : null}
        <Row gap={spacing.sm}>
          <Button
            title="Kaydet"
            style={{ flex: 1 }}
            onPress={() => {
              if (!name.trim()) {
                setError('Besin adı gerekli.');
                return;
              }
              addFood({ id: `custom_${Date.now().toString(36)}`, name: name.trim(), unit, kcal, protein, carbs, fat });
              onDone();
            }}
          />
          <Button title="Vazgeç" variant="ghost" style={{ flex: 1 }} onPress={onDone} />
        </Row>
    </Card>
  );
};

const styles = StyleSheet.create({
  macroStrip: {
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: rules.strong,
    borderBottomColor: colors.rule,
  },
  meal: { borderBottomWidth: rules.strong, borderBottomColor: colors.rule, paddingVertical: spacing.lg },
  mealTitle: { fontFamily: fonts.black, fontSize: 22, letterSpacing: -0.3, color: colors.ink, marginTop: 2 },
  item: {
    gap: 7,
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: rules.light,
    borderTopColor: colors.ruleLight,
  },
  foodHead: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: rules.strong,
    borderBottomWidth: rules.strong,
    borderColor: colors.rule,
  },
  foodRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'baseline',
    paddingVertical: 11,
    borderBottomWidth: rules.light,
    borderBottomColor: colors.ruleLight,
  },
  fcol: { width: 56, textAlign: 'right' },
  fcolSm: { width: 48, textAlign: 'right' },
  custom: {
    fontFamily: fonts.extra,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.accentInk,
  },
});
