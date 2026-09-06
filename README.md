# Hipertrofi — Antrenman & Beslenme Takibi

Tek kullanıcılık, Türkçe, koyu temalı bir antrenman ve beslenme takip uygulaması.
Telefonda gerçek bir mobil uygulama olarak (Expo Go / APK), bilgisayarda tarayıcıdan çalışır.
Tüm veriler cihazda saklanır — sunucu, hesap veya internet gerekmez.

## Kurulum

```bash
npm install
npm start
```

- **Telefon:** App Store / Play Store'dan **Expo Go** uygulamasını kur, terminalde çıkan QR kodu okut.
  (Telefon ve bilgisayar aynı Wi-Fi ağında olmalı. Farklı ağdaysan `npx expo start --tunnel` kullan.)
- **Bilgisayar:** terminalde `w` tuşuna bas, tarayıcıda açılır.
- **Android APK (isteğe bağlı, Expo Go'suz kullanım için):**
  `npx eas build -p android --profile preview` (ücretsiz Expo hesabı gerekir).

## Ne yapar

### Antrenman
- **Döngüsel program:** Pull 1 → Push 1 → Legs → Dinlenme → Pull 2 → Push 2 → Dinlenme.
  Antrenmanı tamamlayınca sıradaki güne otomatik geçer; ana ekrandan manuel de seçebilirsin.
- Her hareket için set set **ağırlık (kg)** ve **tekrar** girişi; büyük +/− butonları ve numerik klavye.
- **Geçen sefer aynı antrenmanda ne yaptığın** her hareketin hemen altında görünür
  (örn. `107,5 kg × 6, 107,5 kg × 5`).
- **Progressive overload önerisi** — overload sadece ağırlık artışı değil,
  aynı ağırlıkta tekrar artışı da sayılır:
  - Tüm work-set'lerde hedef aralığın üst sınırına ulaştıysan → ağırlığı artır
    (compound +2,5 kg, izolasyon +1,25 kg — ayarlardan değiştirilebilir).
  - Ağırlık aynı kalıp **set başına ortalama tekrar arttıysa** → "Overload ✓",
    aynı ağırlıkta kalıp üst sınıra taşıman söylenir.
  - Hiçbiri olmadıysa → aynı ağırlıkta kal.
  - Aynı ağırlıkta 3 antrenman boyunca **ne ağırlık ne tekrar** artmadıysa →
    deload / form kontrolü uyarısı.
- Setler arası **dinlenme sayacı** (varsayılan 120 sn, ±30 sn ayarlanabilir, bitince titreşim).
- Yeni antrenman açıldığında setler önerilen ağırlıkla önden doldurulur.

### Beslenme
- Günde 3 öğün, gramajları ile listelenir; öğünü yediğinde işaretlersin.
- Günlük kalori ve makrolar üstte canlı, hedefe göre yüzde barıyla.
- **Antrenman günü / dinlenme günü** ayrımı: dinlenme gününde 1. öğün dışındaki
  öğünlerin pirinci otomatik 35 g düşer (120 g → 85 g).
- Gramajları o güne özel düzenleyebilir, besin ekleyip çıkarabilirsin;
  "Plan" sekmesinden varsayılan planı değiştirirsin (geçmiş günler korunur).
- 18 besinlik veritabanı (100 g / 100 ml, çiğ-kuru ölçü) + kendi besinini ekleme.

### Kilo takibi ve otomatik kalori ayarı
- Her sabah kilo girişi, **7 günlük hareketli ortalama** ve grafik (günlük nokta + ortalama çizgisi).
- Son 7 günün ortalaması ile önceki 7 günün ortalaması karşılaştırılır.
  Hedef artış hızı **haftada 0,25–0,5 kg**:

  | Haftalık değişim | Uygulamanın önerisi |
  |---|---|
  | Kilo düşüyor | +250 kcal |
  | < 0,25 kg | +150 kcal |
  | 0,25–0,5 kg | değişiklik yok |
  | > 0,5 kg | −150 kcal |

- Kalori değişimi **karbonhidrattan** (pirinç) yapılır, Öğün 2 ve Öğün 3'e eşit dağıtılır;
  protein 165 g'ın altına düşerse tavuk gramajı otomatik artırılır.
- Öneri bir **kart olarak gösterilir; onaylayana kadar hiçbir şey değişmez.**
  Onaylarsan hedef ve gramajlar güncellenir, reddedersen kayıt geçmişte kalır.

### İstatistikler
- Hareket bazında ağırlık ve tahmini 1RM grafiği (Epley: `ağırlık × (1 + tekrar / 30)`).
- Kas grubu bazında haftalık hacim (set × tekrar × ağırlık) yığın grafiği.
- Kişisel rekorlar, antrenman geçmişi.
- Haftalık ortalama kalori alımı, kalori hedefinin zaman içindeki değişimi, öğün tutturma oranı.

### Veri
- Veriler cihazda (`AsyncStorage`) tutulur, uygulama kapansa da kalır ve **offline çalışır**.
- Ayarlar → Yedekleme'den **JSON dışa aktarma** (paylaş / indir / panoya kopyala) ve
  dosyadan veya yapıştırarak **geri yükleme**.

## Kalori hedefi ile plan arasındaki fark

Verdiğin öğün planının gerçek toplamı **~2.700 kcal** (P 181 / K 311 / Y 78);
belirttiğin hedef ise 3.300 kcal (P 165 / K 400 / Y 72). İkisi tutmadığı için
uygulama hedefi ayrı ve düzenlenebilir tutuyor, planla hedef arasında 40 kcal'dan
fazla fark varsa Beslenme ekranında uyarı kartı gösteriyor ve tek dokunuşla
**"Planı hedefe göre dengele"** diyebiliyorsun (fark karbonhidrattan kapatılır,
protein tabanı korunur). Hedefi de aynı ekrandan istediğin değere çekebilirsin.

## Teknoloji

React Native + Expo (SDK 57) · TypeScript · zustand + AsyncStorage (kalıcı state) ·
react-native-svg (grafikler, harici chart kütüphanesi yok) · özel sekme navigasyonu.

```
App.tsx                  sekme kabuğu
src/data/program.ts      hareketler, günler, döngü
src/data/foods.ts        besin veritabanı ve varsayılan plan
src/logic/               progression, beslenme, kilo/otomatik ayar, tarih yardımcıları
src/store/store.ts       kalıcı state ve tüm aksiyonlar
src/components/          ortak arayüz bileşenleri ve grafikler
src/screens/             Ana, Antrenman, Beslenme, Kilo, İstatistik, Ayarlar
```

## Komutlar

```bash
npm start        # Expo geliştirme sunucusu (QR kod)
npm run web      # tarayıcıda aç
npm run android  # bağlı Android cihaz/emülatör
npm run ios      # iOS simülatörü (macOS)
npm run typecheck
```
