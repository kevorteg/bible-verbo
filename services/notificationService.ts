import { Platform } from 'react-native';

let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {}
}

export async function createNotificationChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Recordatorios',
      importance: Notifications.AndroidImportance?.HIGH || 4,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#449BD1',
    });
  } catch {}
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      return newStatus === 'granted';
    }
    return true;
  } catch {
    return false;
  }
}

function daysUntil(targetDay: number, targetHour: number, targetMinute: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setDate(now.getDate() + ((targetDay + 7 - now.getDay()) % 7));
  target.setHours(targetHour, targetMinute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 7);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function scheduleReadingReminders(): Promise<void> {
  if (!Notifications) return;
  await createNotificationChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Buenos dias!',
      body: 'Hoy es un buen dia para leer la Palabra',
      sound: true,
    },
    trigger: { type: 'daily', hour: 9, minute: 0 },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tu racha esta en riesgo!',
      body: 'Aun no lees hoy. Toma 5 minutos para mantener tu racha.',
      sound: true,
    },
    trigger: { type: 'daily', hour: 20, minute: 0 },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ultima llamada!',
      body: 'Salva tu racha! Lee antes de la medianoche.',
      sound: true,
    },
    trigger: { type: 'daily', hour: 22, minute: 0 },
  });
}

export async function scheduleChurchReminders(): Promise<void> {
  if (!Notifications) return;

  const days: { day: number; name: string; hour: number; minute: number }[] = [
    { day: 0, name: 'domingo', hour: 9, minute: 0 },
    { day: 0, name: 'domingo', hour: 17, minute: 0 },
    { day: 3, name: 'miercoles', hour: 18, minute: 0 },
    { day: 5, name: 'viernes', hour: 18, minute: 0 },
    { day: 6, name: 'sabado', hour: 16, minute: 0 },
    { day: 6, name: 'sabado', hour: 18, minute: 0 },
  ];

  for (const d of days) {
    const daysAhead = daysUntil(d.day, d.hour, d.minute);
    const secondsUntil = daysAhead * 24 * 60 * 60;

    const twoHoursBefore: number = secondsUntil - 2 * 60 * 60;
    if (twoHoursBefore > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Recordatorio de culto`,
          body: `Hoy a las ${d.hour}:${d.minute.toString().padStart(2, '0')} hay culto de ${d.name}! Prepara tu corazon.`,
          sound: true,
        },
        trigger: { type: 'timeInterval', seconds: Math.max(twoHoursBefore, 60) },
      });
    }
  }
}

export async function scheduleStreakAchievementNotification(streakDays: number): Promise<void> {
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Racha conseguida!',
      body: `Llegaste a ${streakDays} dias de racha! Sigue asi.`,
      sound: true,
    },
    trigger: { type: 'timeInterval', seconds: 5 },
  });
}

export async function scheduleLeagueNotification(event: 'promote' | 'demote', league: string): Promise<void> {
  if (!Notifications) return;
  const messages = {
    promote: `Felicidades! Ascendiste a ${league}!`,
    demote: `Cuidado! Bajaste a ${league}. Esta semana lee mas!`,
  };
  await Notifications.scheduleNotificationAsync({
    content: {
      title: event === 'promote' ? 'Ascenso!' : 'Descenso',
      body: messages[event],
      sound: true,
    },
    trigger: { type: 'timeInterval', seconds: 5 },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
