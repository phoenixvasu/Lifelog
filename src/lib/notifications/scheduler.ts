import { adminDb } from '@/lib/firebase/admin';
import { getMessaging } from 'firebase-admin/messaging';

interface NotificationSchedule {
  userId: string;
  fcmToken: string;
  preferences: {
    dailyReminders: boolean;
    reminderTime: string; // HH:mm format
  };
}

export const scheduleDailyReminders = async () => {
  try {
    console.log('[Scheduler] Starting daily reminder scheduling...');
    console.log('[Scheduler] Current timestamp:', new Date().toISOString());
    
    // Get all users with notifications enabled
    console.log('[Scheduler] Querying Firestore for users with FCM tokens...');
    const usersSnapshot = await adminDb
      .collection('users')
      .where('fcmToken', '!=', null)
      .get();

    console.log(`[Scheduler] Found ${usersSnapshot.size} users with FCM tokens`);

    const schedules: NotificationSchedule[] = [];
    
    // Process each user
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      console.log(`[Scheduler] Processing user ${doc.id}:`, {
        hasFcmToken: !!userData.fcmToken,
        hasPreferences: !!userData.notificationPreferences,
        dailyReminders: userData.notificationPreferences?.dailyReminders,
        reminderTime: userData.notificationPreferences?.reminderTime
      });
      
      if (userData.notificationPreferences?.dailyReminders) {
        schedules.push({
          userId: doc.id,
          fcmToken: userData.fcmToken,
          preferences: {
            dailyReminders: true,
            reminderTime: '12:10'
          }
        });
        console.log(`[Scheduler] Added user ${doc.id} to schedule with reminder time: ${userData.notificationPreferences.reminderTime || '12:03'}`);
      }
    }

    console.log(`[Scheduler] Found ${schedules.length} users with daily reminders enabled`);
    console.log('[Scheduler] Schedule details:', schedules.map(s => ({
      userId: s.userId,
      reminderTime: s.preferences.reminderTime
    })));
    
    return schedules;
  } catch (error) {
    console.error('[Scheduler] Error scheduling daily reminders:', error);
    throw error;
  }
};

export const sendDailyReminder = async (schedule: NotificationSchedule) => {
  try {
    console.log(`[Scheduler] Sending daily reminder to user ${schedule.userId}`);
    console.log(`[Scheduler] User preferences:`, schedule.preferences);

    const message = {
      notification: {
        title: 'Daily Journal Reminder',
        body: 'Time to write in your journal! Take a moment to reflect on your day.',
      },
      webpush: {
        notification: {
          icon: '/icon.png',
          badge: '/badge.png',
          actions: [
            {
              action: 'open',
              title: 'Write Now'
            }
          ]
        },
        fcmOptions: {
          link: '/journal/new'
        }
      },
      data: {
        type: 'daily_reminder',
        timestamp: new Date().toISOString(),
        click_action: '/journal/new'
      },
      token: schedule.fcmToken,
    };

    console.log(`[Scheduler] Sending FCM message:`, {
      userId: schedule.userId,
      token: schedule.fcmToken.substring(0, 10) + '...', // Log partial token for security
      messageType: 'daily_reminder'
    });

    const response = await getMessaging().send(message);
    console.log(`[Scheduler] Successfully sent daily reminder to user ${schedule.userId}:`, response);
    return response;
  } catch (error) {
    console.error(`[Scheduler] Error sending daily reminder to user ${schedule.userId}:`, error);
    if (error instanceof Error) {
      console.error(`[Scheduler] Error details:`, {
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      });
    }
    throw error;
  }
}; 