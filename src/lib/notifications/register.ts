import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { app } from '../firebase/client';

let messagingInstance: ReturnType<typeof getMessaging> | null = null;
let fcmTokenPromise: Promise<string | null> | null = null;

export async function checkNotificationSupport(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  serviceWorker: boolean;
}> {
  if (typeof window === 'undefined') {
    return { supported: false, permission: 'denied', serviceWorker: false };
  }

  const supported = 'Notification' in window && 'serviceWorker' in navigator;
  const permission = supported ? Notification.permission : 'denied';
  const serviceWorker = supported && 'serviceWorker' in navigator;

  return { supported, permission, serviceWorker };
}

async function getMessagingInstance() {
  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
    } catch (error) {
      console.error('Error initializing Firebase Messaging:', error);
      throw new Error('Failed to initialize notifications');
    }
  }
  return messagingInstance;
}

async function ensureServiceWorkerRegistered(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported');
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return registration;
    }

    const newRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', newRegistration);
    return newRegistration;
  } catch (error) {
    console.error('Error registering service worker:', error);
    throw new Error('Failed to register service worker');
  }
}

export async function registerForNotifications(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Check browser support first
    const { supported, permission } = await checkNotificationSupport();
    if (!supported) {
      throw new Error('Notifications are not supported in this browser');
    }

    // Request permission if needed
    if (permission !== 'granted') {
      const newPermission = await Notification.requestPermission();
      if (newPermission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    // Ensure service worker is registered
    await ensureServiceWorkerRegistered();

    // Get or create FCM token
    if (!fcmTokenPromise) {
      fcmTokenPromise = (async () => {
        try {
          const messaging = await getMessagingInstance();
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
          });

          if (!token) {
            throw new Error('Failed to get FCM token');
          }

          // Set up message listener
          onMessage(messaging, (payload) => {
            console.log('Message received:', payload);
            // Handle foreground messages here
            if (payload.notification) {
              new Notification(payload.notification.title || 'New Notification', {
                body: payload.notification.body,
                icon: payload.notification.icon || '/icon-192x192.png'
              });
            }
          });

          return token;
        } catch (error) {
          console.error('Error getting FCM token:', error);
          fcmTokenPromise = null; // Reset promise on error
          throw error;
        }
      })();
    }

    return await fcmTokenPromise;
  } catch (error) {
    console.error('Error registering for notifications:', error);
    fcmTokenPromise = null; // Reset promise on error
    throw error;
  }
}

export async function unregisterNotifications(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const messaging = await getMessagingInstance();
    const token = await getToken(messaging);
    if (token) {
      await deleteToken(messaging);
    }
    fcmTokenPromise = null;
  } catch (error) {
    console.error('Error unregistering notifications:', error);
    throw error;
  }
}