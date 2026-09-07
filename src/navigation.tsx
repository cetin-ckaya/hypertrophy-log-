import React from 'react';

import { BowlIcon, ChartIcon, DumbbellIcon, HomeIcon, ScaleIcon } from './components/icons';

export type TabKey = 'home' | 'workout' | 'nutrition' | 'weight' | 'stats' | 'settings';

type IconFn = (props: { size?: number; color?: string }) => React.ReactElement;

export const TABS: { key: TabKey; label: string; Icon: IconFn }[] = [
  { key: 'home', label: 'Ana', Icon: HomeIcon },
  { key: 'workout', label: 'Antrenman', Icon: DumbbellIcon },
  { key: 'nutrition', label: 'Beslenme', Icon: BowlIcon },
  { key: 'weight', label: 'Kilo', Icon: ScaleIcon },
  { key: 'stats', label: 'İstatistik', Icon: ChartIcon },
];
