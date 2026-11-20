import { Platform } from 'react-native';

import { Reminders } from '../types';
import { scheduleNames } from './reminders';

/**
 * Web Push kurulumu (ana ekrana eklenmiş PWA).
 *
 * Sunucu yok: bildirimleri GitHub Actions'taki zamanlanmış iş gönderir.
 * Uygulama burada telefonda bir VAPID anahtar çifti üretir, push aboneliği
 * açar ve bunları hatırlatıcı saatleriyle birlikte tek satırlık bir "bildirim
 * kodu"na koyar. Kullanıcı bu kodu deponun PUSH_CONFIG gizli değişkenine
 * yapıştırır. Gizli anahtar hiçbir yere gönderilmez; yalnızca telefonda ve
 * GitHub gizli değişkeninde durur.
 */

const KEY_STORE = 'hipertrofi-push-keys';

type VapidKeys = { publicKey: string; privateKey: string };

const b64url = (bytes: ArrayBuffer | Uint8Array): string => {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  arr.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64url = (s: string): Uint8Array<ArrayBuffer> => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

export const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

/** Ana ekrandan açılmış mı? iOS'ta web bildirimleri yalnızca bu durumda çalışır. */
export const isStandalone = (): boolean => {
  if (!isWeb) return false;
  const nav = navigator as unknown as { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
};

export const pushSupported = (): boolean =>
  isWeb && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const notificationPermission = (): string =>
  isWeb && 'Notification' in window ? Notification.permission : 'unsupported';

const loadKeys = (): VapidKeys | null => {
  try {
    const raw = localStorage.getItem(KEY_STORE);
    return raw ? (JSON.parse(raw) as VapidKeys) : null;
  } catch {
    return null;
  }
};

const generateKeys = async (): Promise<VapidKeys> => {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]);
  const raw = await crypto.subtle.exportKey('raw', pair.publicKey);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const keys = { publicKey: b64url(raw), privateKey: jwk.d as string };
  try {
    localStorage.setItem(KEY_STORE, JSON.stringify(keys));
  } catch {
    /* depolama kapalıysa her seferinde yeni anahtar üretilir */
  }
  return keys;
};

const registration = async (): Promise<ServiceWorkerRegistration> => {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) return reg;
  return navigator.serviceWorker.ready;
};

export type PushSetupResult = { ok: true; code: string } | { ok: false; error: string };

/** İzin ister, aboneliği açar (ya da mevcut olanı kullanır) ve bildirim kodunu üretir. */
export const setupPush = async (reminders: Reminders, programId: string): Promise<PushSetupResult> => {
  if (!pushSupported()) return { ok: false, error: 'Bu tarayıcı web bildirimlerini desteklemiyor.' };
  if (!isStandalone())
    return { ok: false, error: 'Önce uygulamayı ana ekrana ekle ve oradan aç (adımlar aşağıda).' };
  // İzin isteği bir dokunuşun içinden çağrılmalı (iOS).
  const permission = await Notification.requestPermission();
  if (permission !== 'granted')
    return { ok: false, error: 'Bildirim izni verilmedi. Ayarlar → Bildirimler → Hipertrofi kısmından açabilirsin.' };
  try {
    const reg = await registration();
    let keys = loadKeys();
    let sub = await reg.pushManager.getSubscription();
    // Abonelik başka bir anahtarla açılmışsa ya da anahtar yoksa baştan kur.
    if (!keys || !sub) {
      if (sub) await sub.unsubscribe();
      keys = keys ?? (await generateKeys());
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: fromB64url(keys.publicKey) as Uint8Array<ArrayBuffer>,
      });
    }
    return { ok: true, code: buildCode(keys, sub, reminders, programId) };
  } catch (e) {
    return { ok: false, error: `Abonelik açılamadı: ${(e as Error).message}` };
  }
};

const buildCode = (
  keys: VapidKeys,
  sub: PushSubscription,
  reminders: Reminders,
  programId: string
): string =>
  JSON.stringify({
    v: 1,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul',
    vapid: keys,
    subscription: sub.toJSON(),
    reminders,
    schedule: scheduleNames(programId),
  });

/** Telefonda hemen bir deneme bildirimi gösterir (izin ve servis çalışanı kontrolü). */
export const localTestNotification = async (): Promise<boolean> => {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  const reg = await registration();
  await reg.showNotification('Hipertrofi', {
    body: 'Bildirimler çalışıyor ✓',
    tag: 'test',
    icon: 'icons/icon-192.png',
  });
  return true;
};
