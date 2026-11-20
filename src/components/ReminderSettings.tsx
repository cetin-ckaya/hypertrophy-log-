import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { Button, Card, Row, SectionTitle } from './ui';
import {
  isStandalone,
  isWeb,
  localTestNotification,
  notificationPermission,
  pushSupported,
  setupPush,
} from '../logic/push';
import { REMINDER_META, REMINDER_ORDER, minutesOf } from '../logic/reminders';
import { useStore } from '../store/store';
import { colors, font, fonts, rules, spacing } from '../theme';
import { ReminderKey } from '../types';

const SECRETS_URL = 'https://github.com/cetin-ckaya/hypertrophy-log-/settings/secrets/actions';
const ACTIONS_URL = 'https://github.com/cetin-ckaya/hypertrophy-log-/actions/workflows/reminders.yml';

const fmt = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const TimeStepper = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Row gap={0}>
    <Pressable style={styles.tBtn} onPress={() => onChange(fmt(minutesOf(value) - 15))} accessibilityLabel="15 dk erken">
      <Text style={styles.tBtnText}>−</Text>
    </Pressable>
    <Text style={styles.tValue}>{value}</Text>
    <Pressable style={styles.tBtn} onPress={() => onChange(fmt(minutesOf(value) + 15))} accessibilityLabel="15 dk geç">
      <Text style={styles.tBtnText}>+</Text>
    </Pressable>
  </Row>
);

const open = (url: string) => {
  if (Platform.OS === 'web') window.open(url, '_blank');
};

export const ReminderSettings = () => {
  const state = useStore();
  const reminders = state.settings.reminders;
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const snapshot = JSON.stringify({ reminders, programId: state.programId });
  const outdated = state.pushSnapshot !== null && state.pushSnapshot !== snapshot;

  const update = (key: ReminderKey, patch: Partial<{ enabled: boolean; time: string }>) =>
    state.updateSettings({ reminders: { ...reminders, [key]: { ...reminders[key], ...patch } } });

  const generate = async () => {
    setBusy(true);
    setStatus(null);
    const res = await setupPush(reminders, state.programId);
    setBusy(false);
    if (res.ok) {
      setCode(res.code);
      state.setPushSnapshot(snapshot);
      setStatus({ ok: true, text: 'Bildirim izni verildi, kod hazır. Aşağıdaki adımlarla GitHub\'a ekle.' });
    } else {
      setStatus({ ok: false, text: res.error });
    }
  };

  const copy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setStatus({ ok: true, text: 'Kod panoya kopyalandı.' });
  };

  const permission = notificationPermission();

  return (
    <>
      <SectionTitle>Hatırlatıcılar</SectionTitle>
      <Card>
        <Text style={font.small}>
          Vakti gelen hatırlatıcılar "Bugün" ekranının üstünde kart olarak çıkar. Bildirim kurulduysa telefonuna da
          gelir.
        </Text>
        {REMINDER_ORDER.map((key) => (
          <View key={key} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={font.bodyStrong}>{REMINDER_META[key].title}</Text>
              <Text style={font.tiny}>{REMINDER_META[key].when}</Text>
            </View>
            <TimeStepper value={reminders[key].time} onChange={(time) => update(key, { time })} />
            <Switch
              value={reminders[key].enabled}
              onValueChange={(enabled) => update(key, { enabled })}
              trackColor={{ true: colors.accent, false: colors.ruleLight }}
            />
          </View>
        ))}
        <Text style={font.tiny}>
          Tartı ve gainer kartları; o gün kilo girildiyse ya da gainer "yedim" işaretlendiyse çıkmaz.
        </Text>
      </Card>

      <SectionTitle>Telefona bildirim</SectionTitle>
      <Card>
        {!isWeb ? (
          <Text style={font.small}>Bildirimler ana ekrana eklenen web uygulamasında kurulur.</Text>
        ) : (
          <>
            <Text style={font.small}>
              Bildirimleri GitHub'daki zamanlanmış bir iş gönderir (15 dakikada bir kontrol; 5–20 dk gecikebilir).
              Sunucu telefondaki veriyi göremediği için tartı ve gainer bildirimleri, kilo girmiş ya da gainer'ı
              işaretlemiş olsan da gelir — bu koşullar yalnızca uygulama içi kartlarda uygulanır.
            </Text>

            {!isStandalone() ? (
              <View style={styles.steps}>
                <Text style={font.bodyStrong}>1 · Önce ana ekrana ekle</Text>
                <Text style={font.small}>
                  iPhone'da bildirim yalnızca ana ekrandan açılan uygulamaya gelir (iOS 16.4+). Safari'de bu sayfayı
                  aç → alttaki Paylaş düğmesi → "Ana Ekrana Ekle" → uygulamayı ana ekrandaki simgeden aç → bu bölüme
                  geri gel.
                </Text>
              </View>
            ) : null}

            {pushSupported() || !isStandalone() ? null : (
              <Text style={font.small}>Bu cihaz web bildirimlerini desteklemiyor (iOS 16.4 veya üstü gerekir).</Text>
            )}

            <Text style={font.tiny}>
              İzin durumu:{' '}
              {permission === 'granted'
                ? 'verildi ✓'
                : permission === 'denied'
                  ? 'reddedildi — iPhone Ayarlar → Bildirimler → Hipertrofi'
                  : permission === 'unsupported'
                    ? 'desteklenmiyor'
                    : 'henüz sorulmadı'}
            </Text>

            {outdated ? (
              <Text style={[font.small, { color: colors.accentDeep, fontFamily: fonts.bold }]}>
                Hatırlatıcı saatlerini ya da programı değiştirdin. Bildirimlerin de değişmesi için kodu yeniden oluşturup
                GitHub'daki PUSH_CONFIG değerini güncelle.
              </Text>
            ) : null}

            <Button
              title={busy ? 'Hazırlanıyor…' : code || state.pushSnapshot ? 'Kodu yeniden oluştur' : 'Bildirim izni ver ve kodu oluştur'}
              onPress={generate}
            />

            {status ? (
              <Text style={[font.small, { color: status.ok ? colors.success : colors.accentDeep }]}>{status.text}</Text>
            ) : null}

            {code ? (
              <>
                <Text selectable numberOfLines={3} style={styles.code}>
                  {code}
                </Text>
                <Button title="Kodu kopyala" variant="ink" onPress={copy} />
                <View style={styles.steps}>
                  <Text style={font.bodyStrong}>GitHub'a ekle (bir kez)</Text>
                  <Text style={font.small}>1. Aşağıdaki düğmeyle deponun gizli değişkenler sayfasını aç.</Text>
                  <Text style={font.small}>2. "New repository secret"a bas.</Text>
                  <Text style={font.small}>3. Name: PUSH_CONFIG · Secret: kopyaladığın kodu yapıştır → "Add secret".</Text>
                  <Text style={font.small}>
                    4. Zaten varsa PUSH_CONFIG'in yanındaki kaleme basıp yeni kodu yapıştır → "Update secret".
                  </Text>
                  <Text style={font.small}>
                    5. Deneme: Actions sayfasında "Hatırlatıcı bildirimleri" → "Run workflow" → yeşil düğme. Birkaç
                    saniye içinde telefona deneme bildirimi gelir.
                  </Text>
                </View>
                <Button title="Gizli değişkenler sayfasını aç →" variant="ghost" onPress={() => open(SECRETS_URL)} />
                <Button title="Actions sayfasını aç →" variant="ghost" onPress={() => open(ACTIONS_URL)} />
              </>
            ) : null}

            {permission === 'granted' ? (
              <Button
                title="Telefonda hemen deneme bildirimi göster"
                variant="ghost"
                onPress={async () => {
                  const ok = await localTestNotification();
                  setStatus(ok ? { ok: true, text: 'Deneme bildirimi gönderildi.' } : { ok: false, text: 'Gösterilemedi.' });
                }}
              />
            ) : null}
          </>
        )}
      </Card>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    borderTopWidth: rules.light,
    borderTopColor: colors.ruleLight,
  },
  tBtn: {
    width: 32,
    height: 34,
    borderWidth: rules.strong,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tBtnText: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
  tValue: {
    width: 54,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  steps: {
    gap: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.ink,
    backgroundColor: colors.tint,
    padding: 10,
  },
  code: {
    fontFamily: Platform.OS === 'web' ? 'ui-monospace, Menlo, monospace' : undefined,
    fontSize: 11,
    color: colors.muted,
    borderWidth: rules.light,
    borderColor: colors.ruleLight,
    padding: 8,
  },
});
