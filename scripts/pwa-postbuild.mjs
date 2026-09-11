/**
 * `expo export --platform web` çıktısını kurulabilir bir PWA'ya çevirir:
 *  - index.html'e manifest, iOS ana ekran ikonu ve tema meta etiketlerini ekler
 *  - servis çalışanını gerçek dosya listesiyle yazar ve kaydeder
 *  - GitHub Pages alt dizini (baseUrl) için tüm yolları düzeltir
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';

const DIST = process.argv[2] ?? 'dist';
const appJson = JSON.parse(readFileSync('app.json', 'utf8'));
const rawBase = appJson.expo?.experiments?.baseUrl ?? '';
const base = rawBase ? `${rawBase.replace(/\/$/, '')}/` : '/';

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const files = walk(DIST).map((f) => posix.join(...relative(DIST, f).split(sep)));

// Uygulama kabuğu: HTML + JS + CSS + ikonlar + manifest. (Kaynak haritaları hariç.)
const precache = [
  'index.html',
  ...files.filter(
    (f) =>
      f !== 'index.html' &&
      f !== 'sw.js' &&
      !f.endsWith('.map') &&
      /\.(js|css|png|ico|webmanifest|json|ttf|woff2?)$/.test(f)
  ),
].map((f) => base + f);

const version = createHash('sha1').update(precache.join('|')).digest('hex').slice(0, 12);

const swPath = join(DIST, 'sw.js');
const sw = readFileSync(swPath, 'utf8')
  .replace('__VERSION__', version)
  .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
writeFileSync(swPath, sw);

const head = `
    <meta name="theme-color" content="#F3F2F2" />
    <meta name="color-scheme" content="light" />
    <meta name="description" content="Kişisel antrenman ve beslenme takibi." />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Hipertrofi" />
    <link rel="manifest" href="${base}manifest.webmanifest" />
    <link rel="apple-touch-icon" href="${base}icons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="${base}icons/favicon-32.png" />
    <style>
      html,
      body {
        background-color: #F3F2F2;
      }
    </style>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('${base}sw.js', { scope: '${base}' });
        });
      }
    </script>
`;

const htmlPath = join(DIST, 'index.html');
let html = readFileSync(htmlPath, 'utf8');
if (html.includes('manifest.webmanifest')) {
  console.log('PWA etiketleri zaten var, atlanıyor.');
} else {
  // iOS'ta çentik altındaki güvenli alanların çalışması için viewport-fit gerekir.
  html = html.replace(
    /<meta name="viewport"[^>]*>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />'
  );
  html = html.replace('</head>', `${head}  </head>`);
  html = html.replace(/<title>[^<]*<\/title>/, '<title>Hipertrofi</title>');
  html = html.replace('<html lang="en">', '<html lang="tr">');
  writeFileSync(htmlPath, html);
}

console.log(`PWA hazır · base "${base}" · sürüm ${version} · ${precache.length} dosya önbelleğe alındı`);
