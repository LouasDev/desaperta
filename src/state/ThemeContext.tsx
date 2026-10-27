import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, useColorScheme } from 'react-native';
import { createTheme } from '../styles/theme';
export type ThemePreference = 'system' | 'light' | 'dark';
const THEME_KEY = '@desaperta/theme/v1';
const ThemeContext = createContext({
  ...createTheme(false),
  preference: 'system' as ThemePreference,
  setPreference: async (_value: ThemePreference) => {},
});
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((value) => {
        if (value === 'light' || value === 'dark' || value === 'system') setPreferenceState(value);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  const dark = preference === 'dark' || (preference === 'system' && system === 'dark');
  const theme = useMemo(() => createTheme(dark), [dark]);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined')
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [dark]);
  const setPreference = async (value: ThemePreference) => {
    await AsyncStorage.setItem(THEME_KEY, value);
    setPreferenceState(value);
  };
  return (
    <ThemeContext.Provider value={{ ...theme, preference, setPreference }}>
      {ready ? children : null}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
