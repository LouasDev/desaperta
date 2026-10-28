import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TransactionFormScreen from '../screens/TransactionFormScreen';
import DebtsScreen from '../screens/DebtsScreen';
import DebtFormScreen from '../screens/DebtFormScreen';
import DebtDetailScreen from '../screens/DebtDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../state/ThemeContext';
import { RootParams, TabParams } from './types';
import { Icon, IconName } from '../components/Icon';
import { useFinance } from '../state/FinanceContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import CardsScreen from '../screens/CardsScreen';
import CardFormScreen from '../screens/CardFormScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import GoalsScreen from '../screens/GoalsScreen';
import GoalFormScreen from '../screens/GoalFormScreen';
import RecurrencesScreen from '../screens/RecurrencesScreen';
import RecurrenceFormScreen from '../screens/RecurrenceFormScreen';
import AccountsScreen from '../screens/AccountsScreen';
import AccountFormScreen from '../screens/AccountFormScreen';
import AccountDetailScreen from '../screens/AccountDetailScreen';
import TransferFormScreen from '../screens/TransferFormScreen';
import WalletScreen from '../screens/WalletScreen';
import NewScreen from '../screens/NewScreen';
import MoreScreen from '../screens/MoreScreen';
import ImportStatementScreen from '../screens/ImportStatementScreen';
const Stack = createNativeStackNavigator<RootParams>();
const Tabs = createBottomTabNavigator<TabParams>();
const tabInfo: Record<string, { label: string; icon: IconName }> = {
  Home: { label: 'Início', icon: 'home' },
  Transactions: { label: 'Extrato', icon: 'activity' },
  Wallet: { label: 'Carteira', icon: 'wallet' },
  New: { label: 'Novo', icon: 'plus' },
  More: { label: 'Mais', icon: 'more' },
};
function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: colors.paper,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingTop: 4,
        paddingHorizontal: 12,
      }}
    >
      <View
        style={{ flexDirection: 'row', maxWidth: 520, width: '100%', alignSelf: 'center', gap: 4 }}
      >
        {state.routes
          .filter((route) => tabInfo[route.name])
          .map((route) => {
            const active = state.routes[state.index].name;
            const focused =
                active === route.name ||
                (route.name === 'More' && ['Debts', 'Settings'].includes(active)),
              info = tabInfo[route.name];
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={route.name === 'New' ? 'Novo registro' : info.label}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (active !== route.name && !event.defaultPrevented)
                    navigation.navigate(route.name);
                }}
                style={{
                  flex: 1,
                  gap: 6,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderTopWidth: 2,
                  borderTopColor: focused ? colors.accent : 'transparent',
                }}
              >
                <View
                  style={{
                    width: route.name === 'New' ? 42 : 30,
                    height: 28,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: route.name === 'New' ? colors.accent : 'transparent',
                  }}
                >
                  <Icon
                    name={info.icon}
                    size={21}
                    color={
                      route.name === 'New'
                        ? colors.onAccent
                        : focused
                          ? colors.accent
                          : colors.muted
                    }
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: focused ? '600' : '400',
                    color: focused ? colors.accent : colors.muted,
                  }}
                >
                  {info.label}
                </Text>
              </Pressable>
            );
          })}
      </View>
    </View>
  );
}
function MainTabs() {
  const { colors, dark } = useTheme();
  return (
    <Tabs.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Wallet" component={WalletScreen} />
      <Tabs.Screen name="New" component={NewScreen} />
      <Tabs.Screen name="Transactions" component={TransactionsScreen} />
      <Tabs.Screen name="More" component={MoreScreen} />
      <Tabs.Screen name="Debts" component={DebtsScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}
export default function AppNavigator() {
  const { colors, dark } = useTheme();
  const { data } = useFinance();
  if (!data.settings.completed) return <OnboardingScreen />;
  return (
    <NavigationContainer
      theme={{
        ...(dark ? DarkTheme : DefaultTheme),
        colors: {
          ...(dark ? DarkTheme.colors : DefaultTheme.colors),
          background: colors.background,
          card: colors.paper,
          text: colors.ink,
          border: colors.line,
          primary: colors.accent,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="ImportStatement" component={ImportStatementScreen} />
        <Stack.Screen name="TransactionForm" component={TransactionFormScreen} />
        <Stack.Screen name="DebtForm" component={DebtFormScreen} />
        <Stack.Screen name="DebtDetail" component={DebtDetailScreen} />
        <Stack.Screen name="Cards" component={CardsScreen} />
        <Stack.Screen name="Accounts" component={AccountsScreen} />
        <Stack.Screen name="AccountForm" component={AccountFormScreen} />
        <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
        <Stack.Screen name="TransferForm" component={TransferFormScreen} />
        <Stack.Screen name="CardForm" component={CardFormScreen} />
        <Stack.Screen name="CardDetail" component={CardDetailScreen} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
        <Stack.Screen name="GoalForm" component={GoalFormScreen} />
        <Stack.Screen name="Recurrences" component={RecurrencesScreen} />
        <Stack.Screen name="RecurrenceForm" component={RecurrenceFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
