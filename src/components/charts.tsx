import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors, font, grid, series as PALETTE, spacing } from '../theme';

const PAD = { top: 14, right: 12, bottom: 24, left: 40 };

export type LineSeries = {
  name: string;
  color: string;
  values: (number | null)[];
  dots?: boolean;
  dashed?: boolean;
};

const niceTicks = (min: number, max: number, count = 4): number[] => {
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
        <Text style={font.tiny}>{i.name}</Text>
      </View>
    ))}
  </View>
);

export const EmptyChart = ({ text }: { text: string }) => (
  <View style={styles.empty}>
    <Text style={[font.small, { textAlign: 'center' }]}>{text}</Text>
  </View>
);

export const LineChart = ({
  labels,
  series: data,
  height = 190,
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
      <View style={styles.readout}>
        {idx !== null ? (
          <>
            <Text style={[font.small, { color: colors.text, fontWeight: '700' }]}>
              {labels[idx]}
            </Text>
            {data.map((s) =>
              s.values[idx] === null || s.values[idx] === undefined ? null : (
                <View key={s.name} style={styles.legendItem}>
                  <View style={[styles.swatch, { backgroundColor: s.color }]} />
                  <Text style={font.tiny}>
                    {s.name}: {fmt(s.values[idx] as number)}
                  </Text>
                </View>
              )
            )}
          </>
        ) : (
          <Text style={font.tiny}>Değer görmek için grafiğe dokun</Text>
        )}
      </View>

      {width > 0 ? (
        <View>
          <Svg width={width} height={height}>
            {ticks.map((t) => (
              <G key={t}>
                <Line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={grid}
                  strokeWidth={1}
                />
                <SvgText
                  x={PAD.left - 6}
                  y={y(t) + 4}
                  fontSize={10}
                  fill={colors.textFaint}
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
                strokeWidth={2}
                strokeDasharray={s.dashed ? '5 4' : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              />
            ))}

            {data.map((s) =>
              s.dots === false
                ? null
                : s.values.map((v, i) =>
                    v === null ? null : (
                      <Circle
                        key={`${s.name}-${i}`}
                        cx={x(i)}
                        cy={y(v)}
                        r={idx === i ? 5.5 : 3.5}
                        fill={s.color}
                        stroke={colors.card}
                        strokeWidth={2}
                      />
                    )
                  )
            )}

            {idx !== null ? (
              <Line
                x1={x(idx)}
                x2={x(idx)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke={colors.textFaint}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            ) : null}

            <SvgText x={PAD.left} y={height - 6} fontSize={10} fill={colors.textFaint}>
              {labels[0]}
            </SvgText>
            {labels.length > 1 ? (
              <SvgText
                x={width - PAD.right}
                y={height - 6}
                fontSize={10}
                fill={colors.textFaint}
                textAnchor="end"
              >
                {labels[labels.length - 1]}
              </SvgText>
            ) : null}
          </Svg>

          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {labels.map((_, i) => (
                <Pressable
                  key={i}
                  style={{ flex: 1 }}
                  onPress={() => setSelected(selected === i ? null : i)}
                />
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {data.length > 1 ? (
        <Legend items={data.map((s) => ({ name: s.name, color: s.color }))} />
      ) : null}
    </View>
  );
};

export type BarDatum = { label: string; value: number; color?: string };

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
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  if (data.length === 0) return <EmptyChart text="Grafik için henüz yeterli veri yok." />;

  const max = Math.max(...data.map((d) => d.value), 1);
  const innerH = height - PAD.top - PAD.bottom;
  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const slot = innerW / data.length;
  const barW = Math.max(6, Math.min(38, slot - 8));
  const fmt = formatValue ?? ((v: number) => `${Math.round(v)}${unit ? ` ${unit}` : ''}`);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ gap: 6 }}>
      <View style={styles.readout}>
        <Text style={font.tiny}>
          {selected === null
            ? 'Değer görmek için bir çubuğa dokun'
            : `${data[selected].label} · ${fmt(data[selected].value)}`}
        </Text>
      </View>
      {width > 0 ? (
        <View>
          <Svg width={width} height={height}>
            {niceTicks(0, max).map((t) => {
              const yy = PAD.top + innerH - (t / max) * innerH;
              return (
                <G key={t}>
                  <Line
                    x1={PAD.left}
                    x2={width - PAD.right}
                    y1={yy}
                    y2={yy}
                    stroke={grid}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={PAD.left - 6}
                    y={yy + 4}
                    fontSize={10}
                    fill={colors.textFaint}
                    textAnchor="end"
                  >
                    {t >= 1000 ? `${Math.round(t / 1000)}b` : String(Math.round(t))}
                  </SvgText>
                </G>
              );
            })}
            {data.map((d, i) => {
              const h = Math.max(2, (d.value / max) * innerH);
              const cx = PAD.left + slot * i + slot / 2;
              return (
                <Rect
                  key={i}
                  x={cx - barW / 2}
                  y={PAD.top + innerH - h}
                  width={barW}
                  height={h}
                  rx={4}
                  fill={d.color ?? PALETTE[0]}
                  opacity={selected === null || selected === i ? 1 : 0.45}
                />
              );
            })}
            {data.map((d, i) => (
              <SvgText
                key={`l-${i}`}
                x={PAD.left + slot * i + slot / 2}
                y={height - 8}
                fontSize={9}
                fill={colors.textFaint}
                textAnchor="middle"
              >
                {data.length > 8 && i % 2 === 1 ? '' : d.label}
              </SvgText>
            ))}
          </Svg>
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={{ flexDirection: 'row', flex: 1, marginLeft: PAD.left, marginRight: PAD.right }}>
              {data.map((_, i) => (
                <Pressable
                  key={i}
                  style={{ flex: 1 }}
                  onPress={() => setSelected(selected === i ? null : i)}
                />
              ))}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export type StackDatum = { label: string; parts: { key: string; value: number; color: string }[] };

export const StackedBarChart = ({
  data,
  height = 200,
  legend,
  formatValue,
}: {
  data: StackDatum[];
  height?: number;
  legend: { name: string; color: string }[];
  formatValue?: (v: number) => string;
}) => {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  if (data.length === 0) return <EmptyChart text="Grafik için henüz yeterli veri yok." />;

  const totals = data.map((d) => d.parts.reduce((s, p) => s + p.value, 0));
  const max = Math.max(...totals, 1);
  const innerH = height - PAD.top - PAD.bottom;
  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const slot = innerW / data.length;
  const barW = Math.max(8, Math.min(40, slot - 10));
  const fmt = formatValue ?? ((v: number) => `${Math.round(v)}`);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ gap: 6 }}>
      <View style={styles.readout}>
        {selected === null ? (
          <Text style={font.tiny}>Detay için bir haftaya dokun</Text>
        ) : (
          <Text style={font.tiny}>
            {data[selected].label} · toplam {fmt(totals[selected])} ·{' '}
            {data[selected].parts
              .filter((p) => p.value > 0)
              .sort((a, b) => b.value - a.value)
              .slice(0, 3)
              .map((p) => `${p.key} ${fmt(p.value)}`)
              .join(' · ')}
          </Text>
        )}
      </View>
      {width > 0 ? (
        <View>
          <Svg width={width} height={height}>
            {niceTicks(0, max).map((t) => {
              const yy = PAD.top + innerH - (t / max) * innerH;
              return (
                <G key={t}>
                  <Line x1={PAD.left} x2={width - PAD.right} y1={yy} y2={yy} stroke={grid} strokeWidth={1} />
                  <SvgText x={PAD.left - 6} y={yy + 4} fontSize={10} fill={colors.textFaint} textAnchor="end">
                    {t >= 1000 ? `${Math.round(t / 1000)}b` : String(Math.round(t))}
                  </SvgText>
                </G>
              );
            })}
            {data.map((d, i) => {
              const cx = PAD.left + slot * i + slot / 2;
              let acc = 0;
              return (
                <G key={i} opacity={selected === null || selected === i ? 1 : 0.45}>
                  {d.parts.map((p, j) => {
                    if (p.value <= 0) return null;
                    const h = (p.value / max) * innerH;
                    const gap = j === 0 ? 0 : 2; // yığın segmentleri arasında 2px yüzey boşluğu
                    const yTop = PAD.top + innerH - acc - h;
                    acc += h;
                    return (
                      <Rect
                        key={p.key}
                        x={cx - barW / 2}
                        y={yTop + gap}
                        width={barW}
                        height={Math.max(1, h - gap)}
                        rx={j === d.parts.length - 1 ? 4 : 0}
                        fill={p.color}
                      />
                    );
                  })}
                </G>
              );
            })}
            {data.map((d, i) => (
              <SvgText
                key={`l-${i}`}
                x={PAD.left + slot * i + slot / 2}
                y={height - 8}
                fontSize={9}
                fill={colors.textFaint}
                textAnchor="middle"
              >
                {data.length > 8 && i % 2 === 1 ? '' : d.label}
              </SvgText>
            ))}
          </Svg>
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={{ flexDirection: 'row', flex: 1, marginLeft: PAD.left, marginRight: PAD.right }}>
              {data.map((_, i) => (
                <Pressable key={i} style={{ flex: 1 }} onPress={() => setSelected(selected === i ? null : i)} />
              ))}
            </View>
          </View>
        </View>
      ) : null}
      <Legend items={legend} />
    </View>
  );
};

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  readout: { minHeight: 20, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' },
  empty: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: spacing.md,
  },
});
