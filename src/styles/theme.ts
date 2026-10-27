import { Platform, StyleSheet } from 'react-native';
const lightColors = {
  background: '#F4F4F1',
  paper: '#FDFDFC',
  ink: '#262B29',
  muted: '#707671',
  line: '#DFE1DB',
  accent: '#3D5A46',
  mint: '#E8EDE5',
  mintDark: '#3D5A46',
  lavender: '#EFF0EC',
  peach: '#EFF0EC',
  red: '#A44037',
  green: '#3D6A4F',
  softRed: '#F8EEEA',
  input: '#F5F6F2',
  iconBackground: '#EBEDE7',
  onAccent: '#FFFFFF',
  selectionBorder: '#B7C2B0',
  placeholder: '#7B8980',
};
export type Palette = typeof lightColors;
const darkColors: Palette = {
  ...lightColors,
  background: '#171B19',
  paper: '#202622',
  ink: '#E4E9E3',
  muted: '#A3ADA4',
  line: '#394239',
  accent: '#A4BFA1',
  mint: '#334232',
  mintDark: '#A4BFA1',
  lavender: '#252D27',
  peach: '#252D27',
  red: '#F09B8D',
  green: '#9DBEA3',
  softRed: '#3B2926',
  input: '#1B211D',
  iconBackground: '#30382F',
  onAccent: '#182419',
  selectionBorder: '#6F8B6B',
  placeholder: '#839184',
};
export function createTheme(dark: boolean) {
  const colors = dark ? darkColors : lightColors;
  const clay = Platform.select({
    web: {
      boxShadow: dark
        ? '0px 2px 4px rgba(0,0,0,0.1), inset 0px 1px 0px #2C362E'
        : '0px 2px 4px rgba(28,34,29,0.035), inset 0px 1px 0px #FFFFFF',
    },
    default: {
      shadowColor: '#203E36',
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
