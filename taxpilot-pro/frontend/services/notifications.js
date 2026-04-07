import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return { success: false, message: 'Permission not granted' };
    }
    
    return { success: true };
  },

  async getExpoPushToken() {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Push notifications not supported on web' };
    }
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '1e86f2f8-e811-492b-823e-7509e3f528b8',
      });
      await AsyncStorage.setItem('pushToken', token.data);
      return { success: true, token: token.data };
    } catch (error) {
      console.log('Error getting push token:', error);
      return { success: false, error: error.message };
    }
  },

  async scheduleReminder(title, body, date) {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Notifications not supported on web' };
    }
    try {
      const trigger = new Date(date);
      
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger,
      });
      
      return { success: true };
    } catch (error) {
      console.log('Error scheduling notification:', error);
      return { success: false, error: error.message };
    }
  },

  async scheduleITRReminder() {
    const itrDeadline = new Date();
    itrDeadline.setFullYear(itrDeadline.getFullYear(), 6, 31);
    itrDeadline.setHours(10, 0, 0);

    if (itrDeadline > new Date()) {
      await this.scheduleReminder(
        'ITR Filing Reminder',
        'Last date to file ITR is 31st July! Don\'t miss the deadline.',
        itrDeadline
      );
    }
  },

  async scheduleAdvanceTaxReminder() {
    const dates = [
      { month: 5, day: 15, label: '1st installment' },
      { month: 8, day: 15, label: '2nd installment' },
      { month: 11, day: 15, label: '3rd installment' },
      { month: 1, day: 15, label: '4th installment' },
    ];

    const now = new Date();
    
    for (const date of dates) {
      const reminderDate = new Date();
      reminderDate.setMonth(date.month);
      reminderDate.setDate(date.day);
      reminderDate.setHours(10, 0, 0);

      if (reminderDate > now) {
        await this.scheduleReminder(
          'Advance Tax Due',
          `${date.label} advance tax is due on ${date.day}/${date.month + 1}`,
          reminderDate
        );
      }
    }
  },

  async cancelAllNotifications() {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async scheduleDocumentUploadReminder() {
    if (Platform.OS === 'web') return;
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 1);
    reminderDate.setHours(9, 0, 0);

    await this.scheduleReminder(
      'Document Upload Reminder',
      'Remember to upload your tax documents for easy ITR filing!',
      reminderDate
    );
  },

  addNotificationListener(callback) {
    if (Platform.OS === 'web') return () => {};
    return Notifications.addNotificationReceivedListener(callback);
  },

  addResponseListener(callback) {
    if (Platform.OS === 'web') return () => {};
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};

export const TAX_CALENDAR_EVENTS = [
  {
    id: '1',
    title: 'ITR Filing Last Date',
    date: '31 July',
    type: 'deadline',
    description: 'Last date to file Income Tax Return for FY 2023-24',
  },
  {
    id: '2',
    title: 'Advance Tax - 1st Installment',
    date: '15 June',
    type: 'payment',
    description: '15% of advance tax payable',
  },
  {
    id: '3',
    title: 'Advance Tax - 2nd Installment',
    date: '15 September',
    type: 'payment',
    description: '45% of advance tax payable',
  },
  {
    id: '4',
    title: 'Advance Tax - 3rd Installment',
    date: '15 December',
    type: 'payment',
    description: '75% of advance tax payable',
  },
  {
    id: '5',
    title: 'Advance Tax - 4th Installment',
    date: '15 March',
    type: 'payment',
    description: '100% of advance tax payable',
  },
  {
    id: '6',
    title: 'Form 16 Due',
    date: '15 May',
    type: 'document',
    description: 'Last date for employer to provide Form 16',
  },
  {
    id: '7',
    title: 'Tax Saving Investments',
    date: '31 March',
    type: 'reminder',
    description: 'Last date to invest in tax-saving instruments for FY',
  },
  {
    id: '8',
    title: 'TDS Return Due',
    date: '31 July',
    type: 'deadline',
    description: 'Quarterly TDS return filing due date',
  },
];
