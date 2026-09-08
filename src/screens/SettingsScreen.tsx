import React, { useState } from 'react';
import { Platform, Switch, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  Badge,
  Button,
  Card,
  Chip,
  Field,
  Label,
  NumberStepper,
  Row,
  Screen,
  SectionTitle,
  StatTile,
} from '../components/ui';
import { PROGRAMS } from '../data/program';
import { todayKey } from '../logic/date';
import { ACTIVITIES, GOALS, SEXES, activityOf, computeTargets, goalOf } from '../logic/energy';
import { latestAverage } from '../logic/weight';
import { useStore } from '../store/store';
import { colors, font, macroColors, spacing } from '../theme';

export const SettingsScreen = () => {
  const state = useStore();
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const avgWeight = latestAverage(state.weights);
  const targets = computeTargets(state.profile, avgWeight ?? state.profile.startWeightKg);
  const applied =
    state.calorieTarget === targets.kcal &&
    state.macroTargets.protein === targets.protein &&
    state.macroTargets.carbs === targets.carbs &&
    state.macroTargets.fat === targets.fat;

  const json = () => JSON.stringify(state.exportPayload(), null, 2);
  const fileName = `hipertrofi-yedek-${todayKey()}.json`;

  const exportFile = async () => {
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([json()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        setStatus({ kind: 'ok', text: 'Yedek indirildi.' });
        return;
      }
      const file = new File(Paths.cache, fileName);
      if (file.exists) file.delete();
      file.create();
      file.write(json());
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Verileri dışa aktar',
        });
        setStatus({ kind: 'ok', text: 'Yedek paylaşıldı.' });
      } else {
        setStatus({ kind: 'ok', text: `Yedek kaydedildi: ${file.uri}` });
      }
    } catch (e) {
      setStatus({ kind: 'error', text: `Dışa aktarma başarısız: ${String(e)}` });
    }
  };

  const copyJson = async () => {
    await Clipboard.setStringAsync(json());
    setStatus({ kind: 'ok', text: 'JSON panoya kopyalandı.' });
  };

  const importFromFile = async () => {
    try {
      const picked = await File.pickFileAsync({ mimeTypes: ['application/json'] } as never);
      const file = Array.isArray(picked) ? picked[0] : picked;
      if (!file) return;
      const text = await (file as File).text();
      const result = state.importPayload(text);
      setStatus(
        result.ok
          ? { kind: 'ok', text: 'Yedek geri yüklendi.' }
          : { kind: 'error', text: result.error ?? 'Bilinmeyen hata.' }
      );
    } catch (e) {
      setStatus({
        kind: 'error',
        text: 'Dosya seçilemedi. JSON metnini yapıştırarak da geri yükleyebilirsin.',
      });
      setShowImport(true);
    }
  };

  return (
    <Screen title="Ayarlar" subtitle="Program, beslenme ve yedekleme">
      <SectionTitle>Program</SectionTitle>
      {Object.values(PROGRAMS).map((program) => {
        const active = state.programId === program.id;
        return (
          <Card key={program.id} tone={active ? 'primary' : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={[font.h3, { flex: 1 }]}>{program.name}</Text>
              {active ? <Badge label="AKTİF" color={colors.primary} /> : null}
            </Row>
            <Text style={font.small}>{program.description}</Text>
            <Text style={font.tiny}>
              {program.cycle
                .map((id) => program.days[id].name.replace(/^Gün \d+ · /, ''))
                .join(' → ')}
            </Text>
            {!active ? (
              <Button
                title="Bu programa geç"
                variant="soft"
                onPress={() => {
                  state.setProgram(program.id);
                  setStatus({
                    kind: 'ok',
                    text: `${program.name} etkin. Döngü başa alındı; geçmiş kayıtların korunuyor.`,
                  });
                }}
              />
            ) : null}
          </Card>
        );
      })}

      <SectionTitle>Antrenman</SectionTitle>
      <Card>
        <Text style={font.small}>Setler arası dinlenme süresi</Text>
        <NumberStepper
          value={state.settings.restSeconds}
          onChange={(v) => state.updateSettings({ restSeconds: Math.round(v) })}
          step={15}
          min={30}
          max={600}
          decimals={0}
          suffix="sn"
        />
        <Text style={font.tiny}>Normal setler için 90–120 sn önerilir.</Text>

        <Text style={[font.small, { marginTop: spacing.sm }]}>
          Compound artış adımı (deadlift, bench, squat, row)
        </Text>
        <NumberStepper
          value={state.settings.compoundIncrement}
          onChange={(v) => state.updateSettings({ compoundIncrement: v })}
          step={1.25}
          min={0.5}
          max={10}
          suffix="kg"
        />

        <Text style={[font.small, { marginTop: spacing.sm }]}>
          İzolasyon artış adımı (curl, extension, lateral raise)
        </Text>
        <NumberStepper
          value={state.settings.isolationIncrement}
          onChange={(v) => state.updateSettings({ isolationIncrement: v })}
          step={1.25}
          min={0.5}
          max={10}
          suffix="kg"
        />
      </Card>

      <SectionTitle>Beslenme</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={font.body}>Otomatik kalori ayarı</Text>
            <Text style={font.tiny}>
              Haftalık kilo değişimine göre öneri kartı çıkarır. Uygulanması için onayın gerekir.
            </Text>
          </View>
          <Switch
            value={state.settings.autoAdjustEnabled}
            onValueChange={(v) => state.updateSettings({ autoAdjustEnabled: v })}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </Row>

        <Text style={[font.small, { marginTop: spacing.sm }]}>Protein tabanı</Text>
        <NumberStepper
          value={state.settings.proteinFloor}
          onChange={(v) => state.updateSettings({ proteinFloor: Math.round(v) })}
          step={5}
          min={50}
          max={400}
          decimals={0}
          suffix="g"
        />
        <Text style={font.tiny}>
          Kalori düşerken protein bu değerin altına inerse tavuk gramajı otomatik artırılır.
        </Text>

        <Text style={[font.small, { marginTop: spacing.sm }]}>
          Dinlenme gününde öğün başına pirinç düşüşü
        </Text>
        <NumberStepper
          value={state.settings.restDayCarbReduction}
          onChange={(v) => state.updateSettings({ restDayCarbReduction: Math.round(v) })}
          step={5}
          min={0}
          max={200}
          decimals={0}
          suffix="g"
        />
      </Card>

      <SectionTitle>Profil</SectionTitle>
      <Card>
        <Label>Cinsiyet</Label>
        <Row gap={spacing.sm}>
          {SEXES.map((o) => (
            <Chip
              key={o.key}
              label={o.label}
              active={state.profile.sex === o.key}
              onPress={() => state.updateProfile({ sex: o.key })}
            />
          ))}
        </Row>

        <Text style={[font.small, { marginTop: spacing.sm }]}>Yaş</Text>
        <NumberStepper
          value={state.profile.age}
          onChange={(v) => state.updateProfile({ age: Math.round(v) })}
          step={1}
          min={10}
          max={100}
          decimals={0}
        />

        <Text style={[font.small, { marginTop: spacing.sm }]}>Boy</Text>
        <NumberStepper
          value={state.profile.heightCm}
          onChange={(v) => state.updateProfile({ heightCm: Math.round(v) })}
          step={1}
          min={120}
          max={230}
          decimals={0}
          suffix="cm"
        />

        <Text style={[font.small, { marginTop: spacing.sm }]}>Başlangıç kilosu</Text>
        <NumberStepper
          value={state.profile.startWeightKg}
          onChange={(v) => state.updateProfile({ startWeightKg: v })}
          step={0.5}
          min={30}
          max={250}
          decimals={1}
          suffix="kg"
        />

        <Label style={{ marginTop: spacing.md }}>Aktivite seviyesi</Label>
        <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
          {ACTIVITIES.map((a) => (
            <Chip
              key={a.key}
              label={a.label}
              active={state.profile.activity === a.key}
              onPress={() => state.updateProfile({ activity: a.key })}
            />
          ))}
        </Row>
        <Text style={font.tiny}>{activityOf(state.profile.activity).hint}</Text>

        <Label style={{ marginTop: spacing.md }}>Hedef</Label>
        <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
          {GOALS.map((g) => (
            <Chip
              key={g.key}
              label={g.label}
              active={state.profile.goal === g.key}
              onPress={() => state.updateProfile({ goal: g.key })}
            />
          ))}
        </Row>
        <Text style={font.tiny}>{goalOf(state.profile.goal).hint}</Text>
      </Card>

      <SectionTitle>Hesaplanan kalori ve makrolar</SectionTitle>
      <Card tone={applied ? 'success' : 'primary'}>
        <Text style={font.small}>
          Mifflin-St Jeor formülüyle bazal metabolizman, aktivite katsayınla günlük harcaman ve
          hedefine göre başlangıç kalorin hesaplanır. Uyguladıktan sonra haftalık kilo ortalamana
          göre otomatik ayar devreye girer.
        </Text>

        <Row gap={spacing.sm}>
          <StatTile label="BMR" value={`${targets.bmr}`} sub="kcal / gün" />
          <StatTile label="Harcama" value={`${targets.tdee}`} sub={`× ${activityOf(state.profile.activity).factor}`} />
          <StatTile
            label="Hedef"
            value={`${targets.kcal}`}
            sub={`${goalOf(state.profile.goal).kcalDelta >= 0 ? '+' : '−'}${Math.abs(goalOf(state.profile.goal).kcalDelta)} kcal`}
            color={colors.primary}
          />
        </Row>

        <Row gap={spacing.sm}>
          <StatTile label="Protein" value={`${targets.protein} g`} color={macroColors.protein} />
          <StatTile label="Karb" value={`${targets.carbs} g`} color={macroColors.carbs} />
          <StatTile label="Yağ" value={`${targets.fat} g`} color={macroColors.fat} />
        </Row>

        <Text style={font.tiny}>
          Hesap {targets.weightKg.toFixed(1).replace('.', ',')} kg üzerinden yapıldı
          {avgWeight === null ? ' (başlangıç kilosu)' : ' (son 7 günün ortalaması)'}.
        </Text>

        {applied ? (
          <Text style={{ color: colors.success, fontSize: 13, fontWeight: '700' }}>
            Şu anki hedeflerin bu hesapla aynı ✓
          </Text>
        ) : (
          <>
            <Text style={font.small}>
              Şu anki hedefin {state.calorieTarget} kcal · P {state.macroTargets.protein} · K{' '}
              {state.macroTargets.carbs} · Y {state.macroTargets.fat}
            </Text>
            <Button
              title="Hesaplanan hedefi uygula"
              onPress={() => {
                state.applyEnergyTargets(targets);
                setStatus({
                  kind: 'ok',
                  text: `Hedef ${targets.kcal} kcal olarak ayarlandı. Beslenme ekranından planı bu hedefe göre dengeleyebilirsin.`,
                });
              }}
            />
          </>
        )}
      </Card>

      <SectionTitle>Yedekleme</SectionTitle>
      <Card>
        <Text style={font.small}>
          Tüm veriler cihazında saklanır. Düzenli olarak JSON yedeği almanı öneririm.
        </Text>
        <Button title="JSON olarak dışa aktar" onPress={exportFile} />
        <Button title="JSON'u panoya kopyala" variant="soft" onPress={copyJson} />
        <Button title="Dosyadan geri yükle" variant="soft" onPress={importFromFile} />
        <Button
          title={showImport ? 'Yapıştırma alanını kapat' : 'JSON yapıştırarak geri yükle'}
          variant="soft"
          onPress={() => setShowImport(!showImport)}
        />
        {showImport ? (
          <>
            <Field
              value={importText}
              onChangeText={setImportText}
              placeholder="Yedek JSON'unu buraya yapıştır"
              multiline
            />
            <Button
              title="Geri yükle"
              variant="warning"
              onPress={() => {
                const result = state.importPayload(importText);
                setStatus(
                  result.ok
                    ? { kind: 'ok', text: 'Yedek geri yüklendi.' }
                    : { kind: 'error', text: result.error ?? 'Bilinmeyen hata.' }
                );
                if (result.ok) {
                  setImportText('');
                  setShowImport(false);
                }
              }}
            />
          </>
        ) : null}
        {status ? (
          <Text
            style={{
              color: status.kind === 'ok' ? colors.success : colors.danger,
              fontSize: 13,
            }}
          >
            {status.text}
          </Text>
        ) : null}
      </Card>

      <SectionTitle>Tehlikeli bölge</SectionTitle>
      <Card tone="danger">
        <Text style={font.small}>
          Tüm antrenman, beslenme ve kilo kayıtları silinir. Önce yedek almayı unutma.
        </Text>
        {confirmReset ? (
          <Row gap={spacing.sm}>
            <Button
              title="Evet, hepsini sil"
              variant="danger"
              style={{ flex: 1 }}
              onPress={() => {
                state.resetAll();
                setConfirmReset(false);
                setStatus({ kind: 'ok', text: 'Tüm veriler sıfırlandı.' });
              }}
            />
            <Button
              title="Vazgeç"
              variant="soft"
              style={{ flex: 1 }}
              onPress={() => setConfirmReset(false)}
            />
          </Row>
        ) : (
          <Button title="Tüm verileri sıfırla" variant="soft" onPress={() => setConfirmReset(true)} />
        )}
      </Card>
      <View style={{ height: 8 }} />
    </Screen>
  );
};
