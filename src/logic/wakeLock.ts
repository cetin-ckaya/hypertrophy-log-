import { useEffect } from 'react';
import { Platform } from 'react-native';

type Sentinel = { release: () => Promise<void>; released?: boolean };
type WakeLockApi = { request: (type: 'screen') => Promise<Sentinel> };

/**
 * Antrenman sürerken ekranın kararmasını engeller (Screen Wake Lock API).
 *
 * Ekran kararınca sayfa askıya alınır; dinlenme sayacı ve bitiş bip'i
 * çalışmaz. Kilit, sekme arka plana geçince tarayıcı tarafından bırakılır,
 * bu yüzden sayfa tekrar görünür olduğunda yeniden istenir. API'yi
 * desteklemeyen tarayıcılarda sessizce hiçbir şey yapmaz.
 */
export const useScreenWakeLock = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web' || typeof navigator === 'undefined') return;
    const api = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock;
    if (!api) return;

    let sentinel: Sentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible') return;
      if (sentinel && !sentinel.released) return;
      try {
        const s = await api.request('screen');
        if (cancelled) {
          s.release().catch(() => {});
          return;
        }
        sentinel = s;
      } catch {
        // Düşük pil modu vb. nedenlerle reddedilebilir; sorun değil.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [enabled]);
};
