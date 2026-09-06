# Hipertrofi — Antrenman & Beslenme Takibi

Tek kullanıcılık, Türkçe, koyu temalı bir antrenman ve beslenme takip uygulaması.
Telefonda gerçek bir mobil uygulama olarak (Expo Go / APK), bilgisayarda tarayıcıdan çalışır.
Tüm veriler cihazda saklanır — sunucu, hesap veya internet gerekmez.

## Telefona kurulum — ana ekranda simge

Uygulama **kurulabilir bir PWA** olarak yayınlanıyor: bir kez kurduktan sonra
telefonun ana ekranında kendi simgesiyle durur, tam ekran açılır (tarayıcı çubuğu
görünmez) ve internet olmadan da çalışır. App Store / Play Store hesabı,
Expo Go, bilgisayar — hiçbiri gerekmez.

### 1. Yayına al (bir kez, ~2 dakika)

1. Bu dalı `main`'e birleştir (Pages iş akışı `main`'den çalışır).
2. GitHub'da depo **Settings → General → Danger Zone → Change visibility → Public**.
   (GitHub Pages ücretsiz hesapta yalnızca public depolarda çalışır. Depoda kişisel
   veri yok — antrenman ve kilo kayıtların yalnızca telefonunda tutulur, buraya
   hiçbir şey gönderilmez.)
3. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Actions** sekmesinde "Deploy PWA to GitHub Pages" yeşile dönünce adresin hazır:

   `https://cetin-ckaya.github.io/hypertrophy-log-/`

Bundan sonra `main`'e her push otomatik yayınlanır.

### 2. Ana ekrana ekle

- **iPhone (Safari ile açman şart):** adresi aç → alttaki **Paylaş** simgesi →
  **Ana Ekrana Ekle** → **Ekle**. Simge ana ekranda belirir, dokununca tam ekran açılır.
- **Android (Chrome):** adresi aç → sağ üst **⋮** → **Uygulamayı yükle**
  (veya çıkan "Ana ekrana ekle" bildirimi).

Veriler o cihazın tarayıcısında saklanır; simgeden açtığında hep aynı verilere
dönersin. Yedek için Ayarlar → Yedekleme'den JSON al.

## Geliştirme (isteğe bağlı)

```bash
npm install
npm start        # Expo Go ile telefonda veya 'w' ile tarayıcıda
npm run build:web  # PWA çıktısı -> dist/
```

## Ne yapar

### Antrenman
- **Döngüsel program:** Pull 1 → Push 1 → Legs → Dinlenme → Pull 2 → Push 2 → Dinlenme.
  Antrenmanı tamamlayınca sıradaki güne otomatik geçer; ana ekrandan manuel de seçebilirsin.
- Her hareket için set set **ağırlık (kg)** ve **tekrar** girişi; büyük +/− butonları ve numerik klavye.
- **Geçen sefer aynı antrenmanda ne yaptığın** her hareketin hemen altında görünür
  (örn. `107,5 kg × 6, 107,5 kg × 5`).
- **Hedef tekrar aralığı: tüm hareketlerde 6–8.**
- **Progressive overload önerisi** — overload sadece ağırlık artışı değil,
  aynı ağırlıkta tekrar artışı da sayılır:
  - Tüm work-set'lerde hedef aralığın üst sınırına ulaştıysan → ağırlığı artır
    (yani iki work-set'te de 8 tekrar → compound +2,5 kg, izolasyon +1,25 kg;
    ayarlardan değiştirilebilir).
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
  öğünlerin pirinci otomatik 60 g düşer (Öğün 2: 190 → 130 g, Öğün 3: 175 → 115 g),
  toplam ~2.860 kcal'a iner.
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

## Varsayılan öğün planı

Toplam **3.293 kcal · P 197 g · K 431 g · Y 83 g** (antrenman günü).

| | Öğün 1 — Sabah | Öğün 2 — Antrenman sonrası | Öğün 3 — Akşam |
|---|---|---|---|
| | Yulaf (kuru) 130 g | Tavuk göğsü (çiğ) 180 g | Tavuk göğsü (çiğ) 165 g |
| | Whey 30 g | Pirinç (kuru) 190 g | Pirinç (kuru) 175 g |
| | Muz 150 g | Zeytinyağı 20 ml | Zeytinyağı 20 ml |
| | Süt 300 ml | | |
| | Fıstık ezmesi 25 g | | |
| **Toplam** | 1.056 kcal · P 64 · K 142 · Y 29 | 1.158 kcal · P 69 · K 150 · Y 28 | 1.079 kcal · P 63 · K 138 · Y 27 |

Dinlenme günü: Öğün 2 ve 3'ün pirinci −60 g → **~2.861 kcal**.

Gramajlar Ayarlar/Beslenme → "Plan" sekmesinden değiştirilebilir; hedef kalori de
oradan ayarlanır. Plan ile hedef arasında 40 kcal'dan fazla fark oluşursa
Beslenme ekranında uyarı kartı ve tek dokunuşluk **"Planı hedefe göre dengele"**
düğmesi çıkar (fark karbonhidrattan kapatılır, protein tabanı korunur).

## Teknoloji

React Native + Expo (SDK 57) · TypeScript · zustand + AsyncStorage (kalıcı state) ·
react-native-svg (grafikler, harici chart kütüphanesi yok) · özel sekme navigasyonu ·
servis çalışanı ile çevrimdışı PWA, GitHub Actions ile Pages'e otomatik yayın.

```
App.tsx                  sekme kabuğu
src/data/program.ts      hareketler, günler, döngü
src/data/foods.ts        besin veritabanı ve varsayılan plan
src/logic/               progression, beslenme, kilo/otomatik ayar, tarih yardımcıları
src/store/store.ts       kalıcı state ve tüm aksiyonlar
src/components/          ortak arayüz bileşenleri ve grafikler
src/screens/             Ana, Antrenman, Beslenme, Kilo, İstatistik, Ayarlar
public/                  PWA manifesti, servis çalışanı, ana ekran simgeleri
scripts/pwa-postbuild.mjs  web çıktısını kurulabilir PWA'ya çevirir
.github/workflows/       GitHub Pages yayın iş akışı
```

## Komutlar

```bash
npm start        # Expo geliştirme sunucusu (QR kod)
npm run web      # tarayıcıda aç
npm run android  # bağlı Android cihaz/emülatör
npm run ios      # iOS simülatörü (macOS)
npm run typecheck
```
