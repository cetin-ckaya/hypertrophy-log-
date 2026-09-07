import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AdjustmentCard } from '../components/AdjustmentCard';
import { FoodPicker } from '../components/FoodPicker';
import { AlertIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '../components/icons';
import {
  Button,
  Card,
  Chip,
  Field,
  Label,
  MacroTile,
  NumberStepper,
  Ring,
  Row,
  Screen,
  SectionTitle,
  Toggle,
} from '../components/ui';
import { addDays, formatRelative, todayKey } from '../logic/date';
import { eatenMacros, itemMacros, mealMacros, planMacros } from '../logic/nutrition';
import { dayLogFor, useStore } from '../store/store';
import { colors, font, macroColors, radius, spacing } from '../theme';
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

  const shown = mode === 'day' ? eaten : planTotal;
  const meals = mode === 'day' ? log.meals : state.plan;

  return (
    <Screen title="Beslenme" subtitle={mode === 'day' ? formatRelative(date) : 'Varsayılan plan'}>
      {state.pendingAdjustment ? <AdjustmentCard /> : null}

      <Card>
        <Row gap={spacing.lg}>
          <Ring progress={state.calorieTarget > 0 ? shown.kcal / state.calorieTarget : 0} size={86} />
          <View style={{ flex: 1 }}>
            <Text style={font.label}>{mode === 'day' ? 'Yenilen' : 'Plan toplamı'}</Text>
            <Text style={[styles.kcal, font.num]}>
              {Math.round(shown.kcal).toLocaleString('tr-TR')}
              <Text style={styles.kcalOf}> / {state.calorieTarget.toLocaleString('tr-TR')}</Text>
            </Text>
            <Text style={[font.small, { marginTop: 5 }]}>
              {Math.round(Math.max(0, state.calorieTarget - shown.kcal)).toLocaleString('tr-TR')} kcal kaldı
            </Text>
          </View>
        </Row>

        <Row gap={spacing.sm} style={{ marginTop: spacing.sm }}>
          <MacroTile label="Protein" value={shown.protein} target={state.macroTargets.protein} color={macroColors.protein} />
          <MacroTile label="Karb" value={shown.carbs} target={state.macroTargets.carbs} color={macroColors.carbs} />
          <MacroTile label="Yağ" value={shown.fat} target={state.macroTargets.fat} color={macroColors.fat} />
        </Row>

        {mode === 'day' ? (
          <>
            <Toggle
              options={[
                { key: 'training', label: 'Antrenman günü' },
                { key: 'rest', label: 'Dinlenme günü' },
              ]}
              value={log.isTraining ? 'training' : 'rest'}
              onChange={(k) => state.setDayTraining(date, k === 'training')}
            />
            <Text style={font.tiny}>
              Günün tam planı: {Math.round(dayTotal.kcal)} kcal · P {Math.round(dayTotal.protein)} · K{' '}
              {Math.round(dayTotal.carbs)} · Y {Math.round(dayTotal.fat)}
            </Text>
          </>
        ) : null}
      </Card>

      <Row gap={spacing.sm}>
        <Chip label="Bugünün öğünleri" active={mode === 'day'} onPress={() => setMode('day')} />
        <Chip label="Plan (varsayılan)" active={mode === 'plan'} onPress={() => setMode('plan')} />
      </Row>

      {Math.abs(gap) >= 40 ? (
        <Card tone="warning">
          <Row gap={spacing.sm}>
            <AlertIcon size={17} color={colors.warning} />
            <Text style={font.h3}>Plan ile hedef arasında fark var</Text>
          </Row>
          <Text style={font.small}>
            Planın {Math.round(planTotal.kcal)} kcal, hedefin {state.calorieTarget} kcal —{' '}
            {gap > 0 ? `${Math.round(gap)} kcal açık` : `${Math.round(-gap)} kcal fazla`} var. Farkı
            karbonhidrattan (pirinç) dengeleyebilirim; protein {state.settings.proteinFloor} g altına düşmez.
          </Text>
          <Button title="Planı hedefe göre dengele" variant="warning" onPress={state.matchPlanToTarget} />
        </Card>
      ) : null}

      {mode === 'day' ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={10}>
              <Row gap={4}>
                <ChevronLeftIcon size={15} color={colors.primary} />
                <Text style={styles.nav}>Önceki</Text>
              </Row>
            </Pressable>
            <Text style={font.h3}>{formatRelative(date)}</Text>
            <Pressable
              onPress={() => setDate(addDays(date, 1) > todayKey() ? todayKey() : addDays(date, 1))}
              hitSlop={10}
            >
              <Row gap={4}>
                <Text style={styles.nav}>Sonraki</Text>
                <ChevronRightIcon size={15} color={colors.primary} />
              </Row>
            </Pressable>
          </Row>
          <Text style={font.tiny}>
            Dinlenme gününde 1. öğün dışındaki öğünlerin pirinci {state.settings.restDayCarbReduction} g
            düşürülür; protein {state.settings.proteinFloor} g'ın altına inerse tavuk gramajı dengelenir.
          </Text>
          <Button title="Günü plandan sıfırla" variant="soft" size="sm" onPress={() => state.resetDayFromPlan(date)} />
        </Card>
      ) : (
        <Card>
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
          <Text style={font.tiny}>
            Plandaki değişiklikler yeni günlerde geçerli olur; geçmiş günler korunur.
          </Text>
        </Card>
      )}

      {meals.map((meal) => {
        const macros = mealMacros(meal, state.foods);
        const eatenFlag = mode === 'day' ? (meal as { eaten?: boolean }).eaten === true : false;
        return (
          <Card key={meal.id} style={eatenFlag ? { borderColor: 'rgba(163,230,53,0.35)' } : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={font.h3}>{meal.name}</Text>
                <Text style={[font.tiny, { marginTop: 4 }]}>
                  {Math.round(macros.kcal)} kcal · P {Math.round(macros.protein)} · K{' '}
                  {Math.round(macros.carbs)} · Y {Math.round(macros.fat)}
                </Text>
              </View>
              {mode === 'day' ? (
                <Pressable
                  onPress={() => state.toggleMealEaten(date, meal.id)}
                  style={[styles.pill, eatenFlag ? styles.pillOn : null]}
                >
                  {eatenFlag ? <CheckIcon size={13} color={colors.successInk} /> : null}
                  <Text
                    style={{
                      color: eatenFlag ? colors.successInk : colors.textDim,
                      fontWeight: '800',
                      fontSize: 11.5,
                    }}
                  >
                    {eatenFlag ? 'Yendi' : 'Yedim'}
                  </Text>
                </Pressable>
              ) : null}
            </Row>

            {meal.items.map((item) => {
              const food = state.foods[item.foodId];
              const im = itemMacros(item, state.foods);
              return (
                <View key={item.foodId} style={{ gap: 7, marginTop: spacing.sm }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={[font.body, { flex: 1, color: '#C3CBD8' }]}>
                      {food?.name ?? item.foodId}
                    </Text>
                    <Pressable
                      onPress={() =>
                        mode === 'day'
                          ? state.removeDayItem(date, meal.id, item.foodId)
                          : state.removePlanItem(meal.id, item.foodId)
                      }
                      hitSlop={10}
                    >
                      <TrashIcon size={16} color={colors.textFaint} />
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
                <Button title="Kapat" variant="soft" size="sm" onPress={() => setPickerFor(null)} />
              </View>
            ) : (
              <Button
                title="Besin ekle"
                variant="soft"
                size="sm"
                icon={<PlusIcon size={14} color={colors.textDim} />}
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
        <Button
          title="Yeni besin ekle"
          variant="soft"
          icon={<PlusIcon size={15} color={colors.textDim} />}
          onPress={() => setNewFood(true)}
        />
      )}
      <Text style={font.tiny}>
        Toplam {Object.keys(state.foods).length} besin kayıtlı. Tüm değerler 100 g / 100 ml, çiğ ve kuru
        ölçüdür.
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
        <Button title="Vazgeç" variant="soft" style={{ flex: 1 }} onPress={onDone} />
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

const styles = {
  kcal: { fontSize: 30, fontWeight: '800' as const, color: colors.text, letterSpacing: -1, marginTop: 3 },
  kcalOf: { fontSize: 13, color: colors.textDim, fontWeight: '600' as const, letterSpacing: 0 },
  nav: { fontSize: 12.5, fontWeight: '700' as const, color: colors.primary },
  pill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  pillOn: { backgroundColor: colors.success, borderColor: colors.success },
};
