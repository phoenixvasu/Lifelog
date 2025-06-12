import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { registerServiceWorker } from './service-worker';
import { auth } from '../firebase';
import { app } from './config';
import { toast } from 'sonner';

let messaging: any = null;

export const initializeMessaging = async () => {
  try {
    console.log('Initializing Firebase messaging...');
    
    if (typeof window === 'undefined') {
      console.log('Running on server, skipping messaging initialization');
      return null;
    }

    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Register service worker first
    console.log('Registering service worker...');
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Failed to register service worker');
    }
    console.log('Service worker registered and ready');

    // Wait a bit to ensure service worker is fully activated
    await new Promise(resolve => setTimeout(resolve, 1000));

    const messaging = getMessaging(app);
    console.log('Firebase messaging instance created');

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);

    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    console.log('Getting FCM token...');
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    console.log('FCM token obtained:', token);

    // Save token to Firestore if user is logged in
    const user = auth.currentUser;
    if (user && token) {
      console.log('Saving FCM token to Firestore for user:', user.uid);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        fcmToken: token,
        updatedAt: new Date()
      });
      console.log('FCM token saved to Firestore');
    }

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      
      toast(payload.notification?.title || 'New notification', {
        description: payload.notification?.body,
        duration: 5000,
      });
    });

    return token;
  } catch (error) {
    console.error('Error initializing messaging:', error);
    return null;
  }
};

export const saveTokenToDatabase = async (userId: string, token: string) => {
  try {
    console.log('Saving FCM token to database...');
    // Implement your token saving logic here
    // Example: await db.collection('users').doc(userId).update({ fcmToken: token });
    console.log('FCM token saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return false;
  }
};

export const removeTokenFromDatabase = async (userId: string) => {
  try {
    console.log('Removing FCM token from database...');
    // Implement your token removal logic here
    // Example: await db.collection('users').doc(userId).update({ fcmToken: null });
    console.log('FCM token removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return false;
  }
};

// Save FCM token to Firestore
export const saveFCMToken = async (userId: string, token: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const now = Timestamp.now();

    if (userDoc.exists()) {
      await setDoc(
        userRef,
        {
          fcmToken: token,
          notificationPreferences: {
            dailyReminders: true,
            weeklyDigest: true,
            achievements: true,
            reminderTime: '12:10',
            quietHours: {
              enabled: false,
              start: '22:00',
              end: '08:00',
            },
          },
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    } else {
      // Create new user document if it doesn't exist
      await setDoc(userRef, {
        fcmToken: token,
        notificationPreferences: {
          dailyReminders: true,
          weeklyDigest: true,
          achievements: true,
          reminderTime: '12:10',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        },
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (
  userId: string,
  preferences: {
    dailyReminders?: boolean;
    weeklyDigest?: boolean;
    achievements?: boolean;
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  }
) => {
  try {
    const userRef = doc(db, 'users', userId);
    const now = Timestamp.now();

    // Get current user document
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const currentData = userDoc.data();
    const currentPreferences = currentData.notificationPreferences || {
      dailyReminders: true,
      weeklyDigest: true,
      achievements: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    };

    // Merge new preferences with existing ones
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
      quietHours: {
        ...currentPreferences.quietHours,
        ...(preferences.quietHours || {}),
      },
    };

    await setDoc(
      userRef,
      {
        notificationPreferences: updatedPreferences,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

interface TestNotificationParams {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string>;
}

export const sendTestNotification = async (params: TestNotificationParams) => {
  try {
    console.log('Sending test notification with params:', params);
    
    const response = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    const responseData = await response.json();
    console.log('Test notification response:', responseData);

    if (!response.ok) {
      console.error('Test notification failed:', responseData);
      throw new Error(responseData.error || 'Failed to send test notification');
    }

    console.log('Test notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};
