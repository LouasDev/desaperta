import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../styles/theme';

const paths = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  activity: 'M4 4h16v16H4ZM8 9h8M8 13h8M8 17h4',
  people:
    'M16 21v-3a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v3M17 5a4 4 0 0 1 0 8M21 21v-3a4 4 0 0 0-3-3.9M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  settings: 'M4 6h16M4 12h16M4 18h16M9 3v6M15 9v6M9 15v6',
  in: 'M18 6 6 18M6 8v10h10',
  out: 'M6 18 18 6M8 6h10v10',
  chevron: 'm9 5 7 7-7 7',
  plus: 'M12 5v14M5 12h14',
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 22,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d={paths[name]}
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
