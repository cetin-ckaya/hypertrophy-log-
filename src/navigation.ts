export type TabKey = 'home' | 'workout' | 'nutrition' | 'weight' | 'stats' | 'settings';

export const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'home', label: 'Ana', icon: '⌂' },
  { key: 'workout', label: 'Antrenman', icon: '⧗' },
  { key: 'nutrition', label: 'Beslenme', icon: '◍' },
  { key: 'weight', label: 'Kilo', icon: '⚖' },
  { key: 'stats', label: 'İstatistik', icon: '⌁' },
];
