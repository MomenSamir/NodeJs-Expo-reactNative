import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestPermissions = async () => {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('activity-reminders', {
      name: 'Activity Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C3CE1',
      sound: 'default',
    });
  }

  return finalStatus === 'granted';
};

export const triggerAlert = async (activityType, title, body) => {
  // Haptic feedback based on type
  switch (activityType) {
    case 'alarm':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'exercise':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    default:
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Show notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null, // immediate
  });
};
