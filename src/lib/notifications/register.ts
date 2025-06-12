import { getMessaging, getToken } from 'firebase/messaging';
import { app } from '@/lib/firebase/client';

export async function registerForNotifications() {
  try {
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Check if we have permission
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }
    } else if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return null;
    }

    // Always wait for the service worker to be ready (active)
    // Register if not already registered, then wait for ready
    if (!navigator.serviceWorker.controller) {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
    }
    const registration = await navigator.serviceWorker.ready;

    // Get FCM token
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error registering for notifications:', error);
    return null;
  }
}

export async function checkNotificationSupport() {
  return {
    supported: 'Notification' in window,
    permission: Notification.permission,
    serviceWorker: 'serviceWorker' in navigator
  };
}