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
3. **Actions** sekmesinde "Deploy PWA to GitHub Pages" yeşile dönünce adresin hazır
   (Pages ayarını iş akışı kendisi açar; açmazsa Settings → Pages → Source:
   GitHub Actions seçip işi yeniden çalıştır):

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
- **İki program, Ayarlar'dan seçilir:**
  - *Hipertrofi · Push/Pull/Legs* — Pull 1 → Push 1 → Legs → Dinlenme → Pull 2 → Push 2 → Dinlenme,
    tüm hareketlerde 6–8 tekrar.
  - *Kalça ağırlıklı · 5 gün* — Kalça&Bacak → Sırt&Omuz → Kalça&Bacak (izolasyon) → Dinlenme →
    Kol&Sırt → Kalça&Bacak → Dinlenme; her günün sonunda "Eğim 10 / Hız 5 · 20 dakika yürüyüş"
    kartı çıkar. Kendi tekrar aralıklarıyla gelir (4×8-10, 3×12 gibi).
  - Program değiştirmek döngüyü başa alır; geçmiş kayıtlar ve rekorlar korunur.
- **Döngü:** antrenmanı tamamlayınca sıradaki güne otomatik geçer; ana ekrandan manuel de seçebilirsin.
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
  öğünlerin pirinci otomatik 60 g düşer (Öğün 2: 240 → 180 g, Öğün 3: 225 → 165 g);
  protein 165 g'ın altına inmesin diye tavuk dengelenir → ~2.912 kcal.
- Gramajları o güne özel düzenleyebilir, besin ekleyip çıkarabilirsin;
  "Plan" sekmesinden varsayılan planı değiştirirsin (geçmiş günler korunur).
- 18 besinlik veritabanı (100 g / 100 ml, çiğ-kuru ölçü) + kendi besinini ekleme.

### Profilden otomatik kalori ve makro hesabı

Ayarlar → Profil'de **cinsiyet, yaş, boy, kilo, aktivite seviyesi ve hedef** (hacim / koruma /
kesim) seçilir. Uygulama **Mifflin-St Jeor** ile bazal metabolizmayı, aktivite katsayısıyla
günlük harcamayı ve hedefe göre başlangıç kalorisini hesaplar:

| | Formül |
|---|---|
| BMR (erkek) | 10 × kg + 6,25 × cm − 5 × yaş + 5 |
| BMR (kadın) | 10 × kg + 6,25 × cm − 5 × yaş − 161 |
| Harcama | BMR × 1,2 / 1,375 / 1,55 / 1,725 (hareketsiz → çok aktif) |
| Hedef kalori | Harcama + 350 (hacim) · 0 (koruma) · −400 (kesim) |
| Protein | 2,0 g/kg (hacim, koruma) · 2,2 g/kg (kesim) |
| Yağ | Kalorinin %25–28'i, en az 0,6 g/kg |
| Karbonhidrat | Kalan kalori |

Hesap, kilo girişin varsa **son 7 günün ortalaması** üzerinden yapılır. Sonuç bir kart olarak
gösterilir ve **"Hesaplanan hedefi uygula"** dediğinde geçerli olur — mevcut hedefin sessizce
değişmez. Uyguladıktan sonra aşağıdaki haftalık otomatik ayar bu başlangıç değeri üzerinden
çalışmaya devam eder.

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

Hedefler: **3.300 kcal · protein 165 g · yağ 72 g**. Protein ve yağ sabit
tutulup kalan kalori pirinçten tamamlandığı için karbonhidrat **488 g**'a çıkar.

Antrenman günü toplamı: **3.303 kcal · P 167 g · K 488 g · Y 72 g**

| | Öğün 1 — Sabah | Öğün 2 — Antrenman sonrası | Öğün 3 — Akşam |
|---|---|---|---|
| | Yulaf (kuru) 100 g | Tavuk göğsü (çiğ) 130 g | Tavuk göğsü (çiğ) 120 g |
| | Whey 30 g | Pirinç (kuru) 240 g | Pirinç (kuru) 225 g |
| | Muz 150 g | Zeytinyağı 19 ml | Zeytinyağı 19 ml |
| | Süt 300 ml | | |
| | Fıstık ezmesi 15 g | | |
| **Toplam** | 881 kcal · P 57 · K 120 · Y 22 | 1.246 kcal · P 57 · K 190 · Y 25 | 1.176 kcal · P 53 · K 178 · Y 25 |

**Dinlenme günü:** Öğün 2 ve 3'ün pirinci −60 g. Pirinç azalınca protein 158 g'a
düşeceği için tavuk otomatik dengelenir (130 → 145 g, 120 → 130 g) ve toplam
**2.912 kcal · P 166 g · K 393 g · Y 72 g** olur — protein tabanı hiçbir günde
165 g'ın altına inmez.

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
src/data/program.ts      hareket kataloğu, programlar ve döngüleri
src/data/foods.ts        besin veritabanı ve varsayılan plan
src/logic/               progression, beslenme, kilo/otomatik ayar, enerji hesabı, tarih
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
