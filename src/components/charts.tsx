import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors, font, fonts, rules, spacing } from '../theme';

const PAD = { top: 10, right: 2, bottom: 22, left: 34 };

export type LineSeries = {
  name: string;
  color: string;
  values: (number | null)[];
  dots?: boolean;
  dashed?: boolean;
  width?: number;
};

const niceTicks = (min: number, max: number, count = 3): number[] => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) {
    const pad = Math.abs(min) * 0.05 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
};

export const Legend = ({ items }: { items: { name: string; color: string }[] }) => (
  <View style={styles.legend}>
    {items.map((i) => (
      <View key={i.name} style={styles.legendItem}>
        <View style={[styles.swatch, { backgroundColor: i.color }]} />
        <Text style={font.labelSm}>{i.name}</Text>
      </View>
    ))}
  </View>
);

export const EmptyChart = ({ text }: { text: string }) => (
  <View style={styles.empty}>
    <Text style={font.small}>{text}</Text>
  </View>
);

/** Düz çizgi grafiği — nokta yok, 2px taban kuralı, tek vurgu rengi. */
export const LineChart = ({
  labels,
  series: data,
  height = 180,
  unit = '',
  decimals = 1,
}: {
  labels: string[];
  series: LineSeries[];
  height?: number;
  unit?: string;
  decimals?: number;
}) => {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const all = data.flatMap((s) => s.values.filter((v): v is number => v !== null));
  if (labels.length === 0 || all.length === 0)
    return <EmptyChart text="Grafik için henüz yeterli veri yok." />;

  const ticks = niceTicks(Math.min(...all), Math.max(...all));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left + (labels.length === 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  const pathFor = (values: (number | null)[]) => {
    let d = '';
    let pen = false;
    values.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(2)} ${y(v).toFixed(2)} `;
      pen = true;
    });
    return d.trim();
  };

  const fmt = (v: number) => `${v.toFixed(decimals).replace('.', ',')}${unit ? ` ${unit}` : ''}`;
  const idx = selected === null ? null : Math.min(labels.length - 1, Math.max(0, selected));

  return (
    <View onLayout={onLayout} style={{ gap: 6 }}>
      {width > 0 ? (
        <View>
          <Svg width={width} height={height}>
            {ticks.map((t, i) => (
              <G key={t}>
                <Line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={i === 0 ? colors.ink : colors.ruleLight}
                  strokeWidth={i === 0 ? rules.strong : rules.light}
                />
                <SvgText
                  x={PAD.left - 6}
                  y={y(t) + 4}
                  fontSize={10}
                  fontFamily={fonts.bold}
                  fill={colors.muted}
                  textAnchor="end"
                >
                  {String(Number(t.toFixed(2))).replace('.', ',')}
                </SvgText>
              </G>
            ))}

            {data.map((s) => (
              <Path
                key={s.name}
                d={pathFor(s.values)}
                stroke={s.color}
                strokeWidth={s.width ?? (s.color === colors.accent ? 2.5 : 1.5)}
                strokeDasharray={s.dashed ? '5 4' : undefined}
                fill="none"
              />
            ))}

            {idx !== null ? (
              <Line
                x1={x(idx)}
                x2={x(idx)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke={colors.ink}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            ) : null}

            <SvgText x={PAD.left} y={height - 6} fontSize={10} fontFamily={fonts.bold} fill={colors.muted}>
              {labels[0]}
            </SvgText>
            {labels.length > 1 ? (
              <SvgText
                x={width - PAD.right}
                y={height - 6}
                fontSize={10}
                fontFamily={fonts.bold}
                fill={colors.muted}
                textAnchor="end"
              >
                {labels[labels.length - 1]}
              </SvgText>
            ) : null}
          </Svg>

          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {labels.map((_, i) => (
                <Pressable key={i} style={{ flex: 1 }} onPress={() => setSelected(selected === i ? null : i)} />
              ))}
            </View>
          </View>
        </View>
      ) : null}

      <Text style={font.tiny}>
        {idx === null
          ? 'Değer görmek için grafiğe dokun'
          : `${labels[idx]} · ${data
              .filter((s) => s.values[idx] !== null && s.values[idx] !== undefined)
              .map((s) => `${s.name} ${fmt(s.values[idx] as number)}`)
              .join(' · ')}`}
      </Text>

      {data.length > 1 ? <Legend items={data.map((s) => ({ name: s.name, color: s.color }))} /> : null}
    </View>
  );
};

export type BarDatum = { label: string; value: number; color?: string };

/** Düz mürekkep çubuklar — değer üstte, etiket altta. */
export const BarChart = ({
  data,
  height = 170,
  unit = '',
  formatValue,
}: {
  data: BarDatum[];
  height?: number;
  unit?: string;
  formatValue?: (v: number) => string;
}) => {
  if (data.length === 0) return <EmptyChart text="Grafik için henüz yeterli veri yok." />;
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = formatValue ?? ((v: number) => `${Math.round(v)}${unit ? ` ${unit}` : ''}`);

  return (
    <View>
      <View style={[styles.bars, { height }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.barCol}>
            <Text style={[font.labelSm, { color: colors.ink }]} numberOfLines={1}>
              {fmt(d.value)}
            </Text>
            <View
              style={{
                width: '100%',
                height: Math.max(2, (d.value / max) * (height - 26)),
                backgroundColor: d.color ?? colors.ink,
              }}
            />
          </View>
        ))}
      </View>
      <View style={styles.barLabels}>
        {data.map((d, i) => (
          <Text key={i} style={[font.labelSm, styles.barLabel]} numberOfLines={2}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

export type StackDatum = { label: string; parts: { key: string; value: number; color: string }[] };

/** Mono sistemde yığın yerine toplam çubuk — ayrıntı okunur listede verilir. */
export const StackedBarChart = ({
  data,
  height = 190,
  formatValue,
}: {
  data: StackDatum[];
  height?: number;
  legend?: { name: string; color: string }[];
  formatValue?: (v: number) => string;
}) => (
  <BarChart
    data={data.map((d) => ({ label: d.label, value: d.parts.reduce((s, p) => s + p.value, 0) }))}
    height={height}
    formatValue={formatValue}
  />
);

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 18, height: 3 },
  empty: {
    height: 90,
    justifyContent: 'center',
    borderTopWidth: rules.light,
    borderTopColor: colors.ruleLight,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderBottomWidth: rules.strong,
    borderBottomColor: colors.rule,
  },
  barCol: { flex: 1, alignItems: 'flex-start', justifyContent: 'flex-end', gap: 6, height: '100%' },
  barLabels: { flexDirection: 'row', gap: 8, marginTop: 8 },
  barLabel: { flex: 1 },
});
