import React from 'react';
import { Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../state/ThemeContext';

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
  wallet: 'M3 6h17v15H3ZM3 6V3h14v3M15 11h6v5h-6Z',
  card: 'M3 5h18v14H3ZM3 10h18M7 15h3',
  transfer: 'M3 7h17l-4-4M21 17H4l4 4',
  target: 'M21 12a9 9 0 1 1-9-9M17 12a5 5 0 1 1-5-5M12 12 21 3M17 3h4v4',
  repeat: 'M3 7h16l-4-4M21 17H5l4 4M21 7v5M3 17v-5',
  more: 'M4 5h6v6H4ZM14 5h6v6h-6ZM4 15h6v6H4ZM14 15h6v6h-6Z',
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...(Platform.OS === 'web'
        ? { 'aria-hidden': true }
        : {
            accessibilityElementsHidden: true,
            importantForAccessibility: 'no-hide-descendants' as const,
          })}
    >
      <Path
        d={paths[name]}
        stroke={color ?? colors.ink}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
