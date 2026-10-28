import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackProvider } from './src/components/ui';
import { FinanceProvider } from './src/state/FinanceContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/state/ThemeContext';
import { ReminderProvider } from './src/state/ReminderContext';

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
function ThemedApp() {
  const { dark } = useTheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <FeedbackProvider>
        <FinanceProvider>
          <ReminderProvider>
            <AppNavigator />
          </ReminderProvider>
        </FinanceProvider>
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}
