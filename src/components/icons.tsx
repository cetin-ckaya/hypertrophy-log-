import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../theme';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

const base = ({ size = 22, color = colors.textFaint, strokeWidth = 2 }: IconProps) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const HomeIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M3.5 10.2L12 3.5l8.5 6.7V20a1 1 0 01-1 1h-4v-6h-7v6h-4a1 1 0 01-1-1z" />
  </Svg>
);

export const DumbbellIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M7 8.5v7M17 8.5v7M4 10.5v3M20 10.5v3M7 12h10" />
  </Svg>
);

export const BowlIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M3.5 11h17a8.5 8.5 0 01-17 0zM12 3.5v3.8M8.6 5.2v2.1M15.4 5.2v2.1" />
  </Svg>
);

export const ScaleIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M12 4.5v15M5 8h14M8.2 8l-3 6.5a3.4 3.4 0 006 0zM15.8 8l3 6.5a3.4 3.4 0 01-6 0z" />
  </Svg>
);

export const ChartIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M4 19V9M9.3 19V5M14.7 19v-7M20 19v-9" />
  </Svg>
);

export const GearIcon = (p: IconProps) => (
  <Svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 1.8 })}>
    <Circle cx="12" cy="12" r="3.2" />
    <Path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1L5.3 5.3" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 2.8 })}>
    <Path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const ArrowUpIcon = (p: IconProps) => (
  <Svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 2.4 })}>
    <Path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);

export const AlertIcon = (p: IconProps) => (
  <Svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 2.2 })}>
    <Path d="M12 8.5v4.5M12 16.4v.1M10.3 4.2L2.9 17a2 2 0 001.7 3h14.8a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z" />
  </Svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 2.2 })}>
    <Path d="M14.5 5.5L8 12l6.5 6.5" />
  </Svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 2.2 })}>
    <Path d="M9.5 5.5L16 12l-6.5 6.5" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 2.4 })}>
    <Path d="M12 5.5v13M5.5 12h13" />
  </Svg>
);

export const MinusIcon = (p: IconProps) => (
  <Svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 2.4 })}>
    <Path d="M5.5 12h13" />
  </Svg>
);

export const TrashIcon = (p: IconProps) => (
  <Svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 1.9 })}>
    <Path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2a1.5 1.5 0 001.5 1.3h6.2a1.5 1.5 0 001.5-1.3L17.5 7" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 2 })}>
    <Circle cx="12" cy="12" r="8.5" />
    <Path d="M12 7.5V12l3 1.8" />
  </Svg>
);
