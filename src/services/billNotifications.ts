import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { FinanceData } from '../domain/finance';
import { reminderPlan } from '../domain/reminders';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
export async function requestBillPermission() {
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync('bills', {
      name: 'Faturas e vencimentos',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      'As notificações não foram autorizadas. Você pode liberar o Desaperta nas configurações do Android.',
    );
}
export async function syncBillNotifications(data: FinanceData) {
  const old = (await Notifications.getAllScheduledNotificationsAsync()).filter(
    (n) => n.content.data?.owner === 'desaperta-bills',
  );
  if (!data.settings.billReminders) {
    for (const n of old) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    return 0;
  }
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      'Lembretes sem permissão no sistema. Ative as notificações do Desaperta no Android.',
    );
  const plan = reminderPlan(data);
  // Only this app feature's reminders are managed; no unrelated notification is cancelled.
  for (const n of old) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  for (const item of plan)
    await Notifications.scheduleNotificationAsync({
      identifier: item.key,
      content: {
        title: item.title,
        body: item.body,
        sound: 'default',
        data: { owner: 'desaperta-bills', cardId: item.cardId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.at,
        channelId: 'bills',
      },
    });
  return plan.length;
}
