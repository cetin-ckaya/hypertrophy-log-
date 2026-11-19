import { useEffect } from 'react';
import { Platform, Vibration } from 'react-native';

/**
 * Dinlenme bitiş uyarısı.
 *
 * Yerel uygulamada titreşim yeterli. Web'de (ana ekrana eklenen PWA)
 * React Native'in Vibration'ı çalışmaz; burada Web Audio ile kısa bip
 * çalınır ve tarayıcı destekliyorsa (Android) titreşim de verilir.
 * iOS sesi yalnızca kullanıcı dokunuşu sırasında açılmış bir
 * AudioContext'ten çalar; bu yüzden sayaç başlatılırken unlockAlert()
 * çağrılır.
 */

type AudioCtx = AudioContext;
let ctx: AudioCtx | null = null;

const getCtx = (): AudioCtx | null => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
  return ctx;
};

/** Bir dokunuş işleyicisinin içinden çağrılmalı (iOS ses kilidi). */
export const unlockAlert = () => {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  // Sessiz, çok kısa bir ton: bazı iOS sürümleri kilidi ancak bir ses çalınınca açar.
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.01);
  } catch {
    /* yok say */
  }
};

const beep = (c: AudioCtx, at: number, freq: number, dur: number) => {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
};

/** Dinlenme bitti: üç kısa bip + titreşim. */
export const restDoneAlert = () => {
  if (Platform.OS !== 'web') {
    Vibration.vibrate([0, 300, 150, 300]);
    return;
  }
  try {
    navigator.vibrate?.([300, 150, 300]);
  } catch {
    /* yok say */
  }
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  try {
    const t = c.currentTime + 0.05;
    beep(c, t, 880, 0.18);
    beep(c, t + 0.28, 880, 0.18);
    beep(c, t + 0.56, 1175, 0.3);
  } catch {
    /* yok say */
  }
};

/**
 * Dinlenme sayacının bitişini uygulama genelinde izler: kullanıcı hangi
 * sekmede olursa olsun süre dolunca bir kez uyarı çalar. Zaten geçmiş bir
 * bitiş anı (ör. uygulama sonradan açıldıysa) için uyarı çalmaz.
 */
export const useRestAlarm = (endsAt: number | null) => {
  useEffect(() => {
    if (endsAt === null) return;
    const ms = endsAt - Date.now();
    if (ms <= 0) return;
    const t = setTimeout(restDoneAlert, ms);
    return () => clearTimeout(t);
  }, [endsAt]);
};
