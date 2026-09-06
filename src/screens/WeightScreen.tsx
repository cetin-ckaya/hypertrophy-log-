import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AdjustmentCard } from '../components/AdjustmentCard';
import { LineChart } from '../components/charts';
import { Button, Card, NumberStepper, Row, Screen, SectionTitle, StatTile } from '../components/ui';
import { addDays, formatRelative, formatShort, todayKey } from '../logic/date';
import { latestAverage, sortedWeights, trendArrow, weeklyTrend, weightSeries } from '../logic/weight';
import { useStore } from '../store/store';
import { colors, font, series, spacing } from '../theme';

export const WeightScreen = () => {
  const state = useStore();
  const [date, setDate] = useState(todayKey());
  const [draft, setDraft] = useState<number>(
    state.weights[todayKey()] ?? latestAverage(state.weights) ?? state.profile.startWeightKg
  );

  const points = useMemo(() => weightSeries(state.weights), [state.weights]);
  const trend = weeklyTrend(state.weights);
  const avg = latestAverage(state.weights);
  const entries = sortedWeights(state.weights).slice().reverse();

  const labels = points.map((p) => formatShort(p.date));

  return (
    <Screen title="Kilo takibi">
      {state.pendingAdjustment ? <AdjustmentCard /> : null}

      <Card>
        <Text style={font.h3}>Sabah kilosu gir</Text>
        <Text style={font.small}>Aç karnına, tuvaletten sonra, aynı saatte ölç.</Text>
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
        <NumberStepper
          value={state.weights[date] ?? draft}
          onChange={(v) => {
            setDraft(v);
            if (state.weights[date] !== undefined) state.logWeight(date, v);
          }}
          step={0.1}
          min={30}
          max={250}
          decimals={1}
          suffix="kg"
        />
        <Row gap={spacing.sm}>
          <Button
            title={state.weights[date] !== undefined ? 'Güncelle' : 'Kaydet'}
            style={{ flex: 1 }}
            onPress={() => state.logWeight(date, state.weights[date] ?? draft)}
          />
          {state.weights[date] !== undefined ? (
            <Button
              title="Sil"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={() => state.removeWeight(date)}
            />
          ) : null}
        </Row>
      </Card>

      <Row gap={spacing.sm}>
        <StatTile
          label="7 GÜN ORTALAMA"
          value={avg === null ? '—' : `${avg.toFixed(1).replace('.', ',')} kg`}
          sub={`${entries.length} kayıt`}
        />
        <StatTile
          label="HAFTALIK DEĞİŞİM"
          value={
            trend.changeKg === null
              ? '—'
              : `${trend.changeKg >= 0 ? '+' : '−'}${Math.abs(trend.changeKg)
                  .toFixed(2)
                  .replace('.', ',')} kg`
          }
          sub={`${trendArrow(trend.changeKg)} hedef 0,25–0,50 kg`}
          color={
            trend.changeKg === null
              ? undefined
              : trend.changeKg >= 0.25 && trend.changeKg <= 0.5
              ? colors.success
              : colors.warning
          }
        />
      </Row>

      <Card>
        <Text style={font.h3}>Kilo grafiği</Text>
        <Text style={font.small}>Günlük ölçüm ile 7 günlük hareketli ortalama.</Text>
        <LineChart
          labels={labels}
          unit="kg"
          decimals={1}
          series={[
            {
              name: 'Günlük',
              color: colors.textFaint,
              values: points.map((p) => p.weight),
            },
            {
              name: '7 gün ortalama',
              color: series[0],
              values: points.map((p) => p.average),
              dots: false,
            },
          ]}
        />
      </Card>

      {!trend.ready ? (
        <Card>
          <Text style={font.small}>
            Otomatik kalori ayarı için iki ardışık haftada en az 4'er ölçüm gerekiyor. Şu an:{' '}
            {trend.countNow} / {trend.countPrev}.
          </Text>
        </Card>
      ) : null}

      {state.adjustments.length > 0 ? (
        <>
          <SectionTitle>Kalori ayarı geçmişi</SectionTitle>
          {state.adjustments
            .slice()
            .reverse()
            .map((a) => (
              <Card key={a.id}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={font.h3}>{a.reason}</Text>
                  <Text
                    style={[
                      font.tiny,
                      { color: a.status === 'applied' ? colors.success : colors.textFaint },
                    ]}
                  >
                    {a.status === 'applied' ? 'UYGULANDI' : 'REDDEDİLDİ'}
                  </Text>
                </Row>
                <Text style={font.small}>{a.date} · {a.message}</Text>
              </Card>
            ))}
        </>
      ) : null}

      <SectionTitle>Kayıtlar</SectionTitle>
      {entries.length === 0 ? (
        <Card>
          <Text style={font.small}>Henüz kilo kaydı yok.</Text>
        </Card>
      ) : (
        <Card>
          {entries.slice(0, 30).map((e) => (
            <Row key={e.date} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={font.small}>{formatRelative(e.date)}</Text>
              <Text style={[font.body, { fontWeight: '700' }]}>
                {e.weight.toFixed(1).replace('.', ',')} kg
              </Text>
            </Row>
          ))}
        </Card>
      )}
      <View style={{ height: 8 }} />
    </Screen>
  );
};
