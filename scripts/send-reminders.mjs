/**
 * Hatırlatıcı bildirimlerini gönderir (GitHub Actions, 15 dakikada bir).
 *
 * Yapılandırma: PUSH_CONFIG gizli değişkeni — uygulamadaki Ayarlar →
 * "Telefona bildirim" bölümünün ürettiği tek satırlık kod. İçinde push
 * aboneliği, VAPID anahtarları, saat dilimi, hatırlatıcı saatleri ve
 * antrenman takvimi bulunur.
 *
 * Sunucu telefondaki veriyi göremez: "kilo girildiyse / gainer içildiyse
 * gönderme" koşulları yalnızca uygulama içi kartlarda uygulanır.
 *
 * Gönderilenler STATE_DIR/sent.json'da tutulur (actions/cache ile taşınır),
 * böylece gecikmeli ya da üst üste çalışan işler aynı hatırlatıcıyı iki kez
 * göndermez. Vakti 3 saatten fazla geçmiş hatırlatıcı gönderilmez.
 *
 * Ortam: PUSH_CONFIG, WEBPUSH_DIR (web-push'un kurulu olduğu klasör),
 * STATE_DIR, TEST=1 (deneme bildirimi), DRY_RUN=1 (göndermeden yazdır),
 * NOW (ISO, test için saati sabitler).
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const APP_URL = 'https://cetin-ckaya.github.io/hypertrophy-log-/';
const GRACE_MIN = 180;

const raw = (process.env.PUSH_CONFIG || '').trim();
if (!raw) {
  console.log('PUSH_CONFIG tanımlı değil — bildirim kurulmamış, atlanıyor.');
  process.exit(0);
}

let config;
try {
  config = JSON.parse(raw);
} catch {
  console.log('::warning::PUSH_CONFIG okunamadı. Uygulamadaki bildirim kodunu yeniden kopyala.');
  process.exit(0);
}

const tz = config.tz || 'Europe/Istanbul';
const now = process.env.NOW ? new Date(process.env.NOW) : new Date();

/** Saat dilimindeki yerel tarih/saat. */
const local = (d) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value])
  );
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  const hour = Number(parts.hour) % 24;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday,
    minutes: hour * 60 + Number(parts.minute),
  };
};

const today = local(now);

const isLastFriday = () => {
  if (today.weekday !== 5) return false;
  const later = local(new Date(now.getTime() + 7 * 86400000));
  return later.date.slice(0, 7) !== today.date.slice(0, 7);
};

const minutesOf = (hhmm) => {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Bugün geçerli hatırlatıcılar: [anahtar, saat, başlık, metin] */
const candidates = () => {
  const r = config.reminders || {};
  const list = [];
  const add = (key, title, body, applies = true) => {
    if (r[key]?.enabled && applies) list.push({ key, time: r[key].time, title, body });
  };
  add('weigh', 'Sabah tartı', 'Aç karnına, tuvaletten sonra tartıl.');
  const workout = (config.schedule || {})[today.weekday];
  add('workout', 'Antrenman günü', `Bugün: ${workout}`, Boolean(workout));
  add('gainer', 'Gainer', "Günlük gainer'ını içtin mi?");
  add(
    'checkin',
    'Haftalık check-in',
    'Check-in zamanı: haftalık özeti kopyala ve koçuna gönder.',
    today.weekday === 5
  );
  add(
    'measure',
    'Kol ölçüm günü',
    'Sabah, aç karnına, pompasız, kasılı, en kalın nokta.',
    isLastFriday()
  );
  return list;
};

// ---------- Durum (gönderilenler) ----------
const stateDir = process.env.STATE_DIR || '.reminders-state';
const stateFile = path.join(stateDir, 'sent.json');
let sent = {};
try {
  sent = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
} catch {
  sent = {};
}
// 3 günden eski kayıtları at.
for (const d of Object.keys(sent)) if (d < local(new Date(now.getTime() - 3 * 86400000)).date) delete sent[d];
sent[today.date] = sent[today.date] || [];

const due = process.env.TEST
  ? [{ key: 'test', title: 'Hipertrofi', body: 'Deneme bildirimi — kurulum tamam ✓' }]
  : candidates().filter((c) => {
      const t = minutesOf(c.time);
      return today.minutes >= t && today.minutes - t <= GRACE_MIN && !sent[today.date].includes(c.key);
    });

console.log(`Yerel saat ${today.date} ${Math.floor(today.minutes / 60)}:${String(today.minutes % 60).padStart(2, '0')} (${tz}) · gönderilecek: ${due.map((d) => d.key).join(', ') || 'yok'}`);

if (due.length === 0) process.exit(0);

let webpush = null;
if (!process.env.DRY_RUN) {
  const require = createRequire(path.join(process.env.WEBPUSH_DIR || process.cwd(), 'index.js'));
  webpush = require('web-push');
  webpush.setVapidDetails(APP_URL, config.vapid.publicKey, config.vapid.privateKey);
}

let failed = false;
for (const item of due) {
  const payload = JSON.stringify({ title: item.title, body: item.body, tag: item.key });
  if (process.env.DRY_RUN) {
    console.log(`[DRY_RUN] ${payload}`);
  } else {
    try {
      await webpush.sendNotification(config.subscription, payload, { TTL: 3 * 3600, urgency: 'high' });
      console.log(`Gönderildi: ${item.key}`);
    } catch (e) {
      failed = true;
      const code = e && e.statusCode;
      const hint =
        code === 404 || code === 410
          ? 'Abonelik geçersiz — uygulamada bildirim kodunu yeniden oluşturup PUSH_CONFIG değerini güncelle.'
          : String(e && (e.body || e.message));
      console.log(`::warning::${item.key} gönderilemedi (${code ?? 'hata'}): ${hint}`);
      continue;
    }
  }
  if (item.key !== 'test') sent[today.date].push(item.key);
}

fs.mkdirSync(stateDir, { recursive: true });
fs.writeFileSync(stateFile, JSON.stringify(sent));
// Yalnızca bir şey gönderildiyse önbelleğe yaz (actions/cache/save adımı).
if (process.env.GITHUB_OUTPUT && !process.env.TEST)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changed=true\n');
if (failed) console.log('Bazı bildirimler gönderilemedi (yukarıdaki uyarılara bak).');
