import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackProvider } from './src/components/ui';
import { FinanceProvider } from './src/state/FinanceContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <FeedbackProvider>
        <FinanceProvider>
          <AppNavigator />
        </FinanceProvider>
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}
