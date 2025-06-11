import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { registerServiceWorker } from './service-worker';
import { auth } from '../firebase';

let messaging: any = null;

export const initializeMessaging = async () => {
  try {
    console.log('Initializing Firebase Messaging...');
    
    if (typeof window === 'undefined') {
      console.log('Not in browser environment, skipping initialization');
      return null;
    }

    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return null;
    }

    // Register service worker first
    console.log('Registering service worker...');
    await registerServiceWorker();
    console.log('Service worker registered successfully');

    // Initialize Firebase Messaging
    messaging = getMessaging();
    console.log('Firebase Messaging initialized');

    // Request permission and get token
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Notification permission status:', permission);

    if (permission === 'granted') {
      console.log('Getting FCM token...');
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      
      if (currentToken) {
        console.log('FCM Token generated:', currentToken);
        
        // Save token to Firestore
        if (auth.currentUser) {
          console.log('Saving FCM token to Firestore...');
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            fcmToken: currentToken,
            updatedAt: new Date()
          });
          console.log('FCM token saved to Firestore');
        }
        
        return currentToken;
      } else {
        console.log('No FCM token available');
      }
    } else {
      console.log('Notification permission denied');
    }
  } catch (error) {
    console.error('Error initializing messaging:', error);
    throw error;
  }
};

// Handle foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Received foreground message:', payload);
        resolve(payload);
      });
    }
  });

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

// Test function to send a notification
export const sendTestNotification = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's FCM token from Firestore
    console.log('Getting user document from Firestore...');
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    if (!userData?.fcmToken) {
      console.log('No FCM token found, initializing messaging...');
      const token = await initializeMessaging();
      if (!token) {
        throw new Error('Failed to get FCM token');
      }
      console.log('New FCM token generated:', token);
    } else {
      console.log('Using existing FCM token:', userData.fcmToken);
    }

    console.log('Sending test notification...');
    const response = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: userData?.fcmToken,
        title: 'Test Notification',
        body: 'This is a test notification from Lifelog',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Test notification failed:', errorData);
      throw new Error(errorData.error || 'Failed to send test notification');
    }

    const data = await response.json();
    console.log('Test notification sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}; 