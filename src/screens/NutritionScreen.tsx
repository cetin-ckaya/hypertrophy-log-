import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AdjustmentCard } from '../components/AdjustmentCard';
import { FoodPicker } from '../components/FoodPicker';
import {
  Button,
  Card,
  Chip,
  Field,
  MacroBar,
  NumberStepper,
  ProgressBar,
  Row,
  Screen,
  SectionTitle,
} from '../components/ui';
import { addDays, formatRelative, todayKey } from '../logic/date';
import { eatenMacros, itemMacros, mealMacros, planMacros } from '../logic/nutrition';
import { dayLogFor, useStore } from '../store/store';
import { colors, font, series, spacing } from '../theme';
import { Food } from '../types';

type Mode = 'day' | 'plan';

export const NutritionScreen = () => {
  const state = useStore();
  const [date, setDate] = useState(todayKey());
  const [mode, setMode] = useState<Mode>('day');
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [newFood, setNewFood] = useState(false);

  const log = useMemo(
    () => dayLogFor(state, date),
    [state.dayLogs, state.plan, state.settings.restDayCarbReduction, state.cycleIndex, date]
  );
  const eaten = eatenMacros(log.meals, state.foods);
  const dayTotal = planMacros(log.meals, state.foods);
  const planTotal = planMacros(state.plan, state.foods);
  const gap = state.calorieTarget - planTotal.kcal;

  const meals = mode === 'day' ? log.meals : state.plan;

  return (
    <Screen title="Beslenme">
      {state.pendingAdjustment ? <AdjustmentCard /> : null}

      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={font.tiny}>{mode === 'day' ? 'YENİLEN' : 'PLAN TOPLAMI'}</Text>
            <Text style={font.h1}>
              {Math.round(mode === 'day' ? eaten.kcal : planTotal.kcal)}
            </Text>
          </View>
          <Text style={font.small}>hedef {state.calorieTarget} kcal</Text>
        </Row>
        <ProgressBar
          value={mode === 'day' ? eaten.kcal : planTotal.kcal}
          target={state.calorieTarget}
          height={10}
        />
        <Row gap={spacing.md} style={{ marginTop: spacing.xs }}>
          <MacroBar
            label="Protein"
            value={mode === 'day' ? eaten.protein : planTotal.protein}
            target={state.macroTargets.protein}
            color={series[2]}
          />
          <MacroBar
            label="Karb"
            value={mode === 'day' ? eaten.carbs : planTotal.carbs}
            target={state.macroTargets.carbs}
            color={series[6]}
          />
          <MacroBar
            label="Yağ"
            value={mode === 'day' ? eaten.fat : planTotal.fat}
            target={state.macroTargets.fat}
            color={series[3]}
          />
        </Row>
        {mode === 'day' ? (
          <Text style={font.tiny}>
            Günün tam planı: {Math.round(dayTotal.kcal)} kcal · P {Math.round(dayTotal.protein)} ·
            K {Math.round(dayTotal.carbs)} · Y {Math.round(dayTotal.fat)}
          </Text>
        ) : null}
      </Card>

      <Row gap={spacing.sm}>
        <Chip label="Bugünün öğünleri" active={mode === 'day'} onPress={() => setMode('day')} />
        <Chip label="Plan (varsayılan)" active={mode === 'plan'} onPress={() => setMode('plan')} />
      </Row>

      {Math.abs(gap) >= 40 ? (
        <Card tone="warning">
          <Text style={font.h3}>Plan ile hedef arasında fark var</Text>
          <Text style={font.small}>
            Planın {Math.round(planTotal.kcal)} kcal, hedefin {state.calorieTarget} kcal —{' '}
            {gap > 0 ? `${Math.round(gap)} kcal açık` : `${Math.round(-gap)} kcal fazla`} var.
            Gramajları karbonhidrattan (pirinç) dengeleyebilirim; protein {state.settings.proteinFloor} g
            altına düşmez.
          </Text>
          <Button title="Planı hedefe göre dengele" onPress={state.matchPlanToTarget} />
        </Card>
      ) : null}

      {mode === 'day' ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={10}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>‹ Önceki</Text>
            </Pressable>
            <Text style={font.h3}>{formatRelative(date)}</Text>
            <Pressable
              onPress={() => setDate(addDays(date, 1) > todayKey() ? todayKey() : addDays(date, 1))}
              hitSlop={10}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Sonraki ›</Text>
            </Pressable>
          </Row>
          <Row gap={spacing.sm}>
            <Chip
              label="Antrenman günü"
              active={log.isTraining}
              onPress={() => state.setDayTraining(date, true)}
            />
            <Chip
              label="Dinlenme günü"
              active={!log.isTraining}
              onPress={() => state.setDayTraining(date, false)}
            />
          </Row>
          <Text style={font.tiny}>
            Dinlenme gününde 1. öğün dışındaki öğünlerin pirinci{' '}
            {state.settings.restDayCarbReduction} g düşürülür; protein{' '}
            {state.settings.proteinFloor} g'ın altına inerse tavuk gramajı dengelenir.
          </Text>
          <Button
            title="Günü plandan sıfırla"
            variant="ghost"
            size="sm"
            onPress={() => state.resetDayFromPlan(date)}
          />
        </Card>
      ) : (
        <Card>
          <Text style={font.h3}>Varsayılan plan</Text>
          <Text style={font.small}>
            Burada yaptığın değişiklik yeni günlerde geçerli olur. Geçmiş günler korunur.
          </Text>
          <Text style={font.tiny}>Günlük kalori hedefi</Text>
          <NumberStepper
            value={state.calorieTarget}
            onChange={state.setCalorieTarget}
            step={50}
            min={1200}
            max={6000}
            decimals={0}
            suffix="kcal"
          />
        </Card>
      )}

      {meals.map((meal) => {
        const macros = mealMacros(meal, state.foods);
        const eatenFlag = mode === 'day' ? (meal as { eaten?: boolean }).eaten === true : false;
        return (
          <Card key={meal.id} style={eatenFlag ? { opacity: 0.75 } : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={font.h3}>{meal.name}</Text>
              {mode === 'day' ? (
                <Pressable
                  onPress={() => state.toggleMealEaten(date, meal.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: eatenFlag ? colors.success : colors.cardAlt,
                    borderWidth: 1,
                    borderColor: eatenFlag ? colors.success : colors.border,
                  }}
                >
                  <Text style={{ color: eatenFlag ? '#fff' : colors.textDim, fontWeight: '700', fontSize: 12 }}>
                    {eatenFlag ? '✓ Yendi' : 'Yedim'}
                  </Text>
                </Pressable>
              ) : null}
            </Row>
            <Text style={font.tiny}>
              {Math.round(macros.kcal)} kcal · P {Math.round(macros.protein)} · K{' '}
              {Math.round(macros.carbs)} · Y {Math.round(macros.fat)}
            </Text>

            {meal.items.map((item) => {
              const food = state.foods[item.foodId];
              const im = itemMacros(item, state.foods);
              return (
                <View key={item.foodId} style={{ gap: 6, marginTop: spacing.sm }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={[font.body, { flex: 1 }]}>{food?.name ?? item.foodId}</Text>
                    <Pressable
                      onPress={() =>
                        mode === 'day'
                          ? state.removeDayItem(date, meal.id, item.foodId)
                          : state.removePlanItem(meal.id, item.foodId)
                      }
                      hitSlop={8}
                    >
                      <Text style={{ color: colors.danger, fontSize: 18 }}>×</Text>
                    </Pressable>
                  </Row>
                  <Row gap={spacing.sm}>
                    <View style={{ flex: 1 }}>
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
                    <Text style={[font.tiny, { flex: 1 }]}>
                      {Math.round(im.kcal)} kcal · P {im.protein.toFixed(1).replace('.', ',')}
                    </Text>
                  </Row>
                </View>
              );
            })}

            {pickerFor === meal.id ? (
              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
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
              <Button
                title="+ Besin ekle"
                variant="ghost"
                size="sm"
                onPress={() => setPickerFor(meal.id)}
              />
            )}
          </Card>
        );
      })}

      <SectionTitle>Besin veritabanı</SectionTitle>
      {newFood ? (
        <NewFoodForm onDone={() => setNewFood(false)} />
      ) : (
        <Button title="+ Yeni besin ekle" variant="ghost" onPress={() => setNewFood(true)} />
      )}
      <Text style={font.tiny}>
        Toplam {Object.keys(state.foods).length} besin kayıtlı. Tüm değerler 100 g / 100 ml, çiğ ve
        kuru ölçüdür.
      </Text>
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
      <Text style={font.h3}>Yeni besin (100 {unit} başına)</Text>
      <FieldRow label="Ad">
        <Field value={name} onChangeText={setName} placeholder="Örn. Ton balığı" />
      </FieldRow>
      <Row gap={spacing.sm}>
        <Chip label="gram" active={unit === 'g'} onPress={() => setUnit('g')} />
        <Chip label="mililitre" active={unit === 'ml'} onPress={() => setUnit('ml')} />
      </Row>
      <FieldRow label="Kalori (kcal)">
        <NumberStepper value={kcal} onChange={setKcal} step={5} max={1000} decimals={1} compact />
      </FieldRow>
      <FieldRow label="Protein (g)">
        <NumberStepper value={protein} onChange={setProtein} step={0.5} max={100} decimals={1} compact />
      </FieldRow>
      <FieldRow label="Karbonhidrat (g)">
        <NumberStepper value={carbs} onChange={setCarbs} step={0.5} max={100} decimals={1} compact />
      </FieldRow>
      <FieldRow label="Yağ (g)">
        <NumberStepper value={fat} onChange={setFat} step={0.5} max={100} decimals={1} compact />
      </FieldRow>
      {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
      <Row gap={spacing.sm}>
        <Button
          title="Kaydet"
          style={{ flex: 1 }}
          onPress={() => {
            if (!name.trim()) {
              setError('Besin adı gerekli.');
              return;
            }
            const id = `custom_${Date.now().toString(36)}`;
            addFood({ id, name: name.trim(), unit, kcal, protein, carbs, fat });
            onDone();
          }}
        />
        <Button title="Vazgeç" variant="ghost" style={{ flex: 1 }} onPress={onDone} />
      </Row>
    </Card>
  );
};

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={{ gap: 6 }}>
    <Text style={font.small}>{label}</Text>
    {children}
  </View>
);
