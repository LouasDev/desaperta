import { Platform, StyleSheet } from 'react-native';
const lightColors = {
  background: '#F6F4F9',
  paper: '#FEFDFE',
  ink: '#241F2C',
  muted: '#797180',
  line: '#E3DDEB',
  accent: '#7543B6',
  mint: '#F0E7FA',
  mintDark: '#7543B6',
  lavender: '#F2EDF7',
  peach: '#F2EDF7',
  red: '#A44037',
  green: '#7543B6',
  softRed: '#F8EEEA',
  input: '#F8F5FC',
  iconBackground: '#EEE7F6',
  onAccent: '#FFFFFF',
  selectionBorder: '#BFA6DE',
  placeholder: '#8B8099',
};
export type Palette = typeof lightColors;
const darkColors: Palette = {
  ...lightColors,
  background: '#121016',
  paper: '#1D1923',
  ink: '#F1EBF8',
  muted: '#AEA3BC',
  line: '#39313F',
  accent: '#BA98F2',
  mint: '#332640',
  mintDark: '#BA98F2',
  lavender: '#282030',
  peach: '#282030',
  red: '#F09B8D',
  green: '#C5ACED',
  softRed: '#3B2926',
  input: '#17131D',
  iconBackground: '#30253C',
  onAccent: '#1C102C',
  selectionBorder: '#9470BC',
  placeholder: '#94859F',
};
export function createTheme(dark: boolean) {
  const colors = dark ? darkColors : lightColors;
  const clay = Platform.select({
    web: {
      boxShadow: dark
        ? '0px 2px 4px rgba(0,0,0,0.1), inset 0px 1px 0px #3A2D48'
        : '0px 2px 4px rgba(28,34,29,0.035), inset 0px 1px 0px #FFFFFF',
    },
    default: {
      shadowColor: '#291A3C',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.035,
      shadowRadius: 3,
      elevation: 1,
    },
  });
  const styles = StyleSheet.create({
    page: {
      padding: 22,
      paddingTop: 28,
      gap: 24,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
      paddingBottom: 40,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      backgroundColor: colors.background,
    },
    title: { fontSize: 24, fontWeight: '600', color: colors.ink, letterSpacing: -0.7 },
    subtitle: { fontSize: 16, fontWeight: '600', color: colors.ink, letterSpacing: -0.2 },
    body: { fontSize: 14, lineHeight: 22, color: colors.muted },
    small: { fontSize: 12, lineHeight: 18, color: colors.muted },
    eyebrow: {
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 0,
      color: colors.muted,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    between: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    card: {
      backgroundColor: colors.paper,
      borderRadius: 14,
      padding: 18,
      gap: 16,
      borderWidth: 1,
      borderColor: colors.line,
      ...clay,
    },
    error: {
      color: colors.red,
      fontSize: 14,
      lineHeight: 21,
      padding: 12,
      backgroundColor: colors.softRed,
      borderRadius: 12,
    },
    divider: { height: 1, backgroundColor: colors.line },
  });

  return { colors, clay, styles, dark };
}
export type AppTheme = ReturnType<typeof createTheme>;
