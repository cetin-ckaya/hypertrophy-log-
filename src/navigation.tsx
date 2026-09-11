export type TabKey = 'home' | 'workout' | 'nutrition' | 'stats' | 'settings';

/** Alt gezinme — tasarımda dört sekme, metin etiketli, sola dayalı. */
export const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: 'Bugün' },
  { key: 'workout', label: 'Antrenman' },
  { key: 'nutrition', label: 'Beslenme' },
  { key: 'stats', label: 'İstatistik' },
];
