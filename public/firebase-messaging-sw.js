// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.

const firebaseConfig = {
  "NEXT_PUBLIC_FIREBASE_API_KEY": "AIzaSyAR60P1Z5gyvOj3NecrE7H4TMrjXY8O7DY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": "lifelog-6a977.firebaseapp.com",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "lifelog-6a977",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET": "lifelog-6a977.firebasestorage.app",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "932332411614",
  "NEXT_PUBLIC_FIREBASE_APP_ID": "1:932332411614:web:aeb85a20f32219ceaf804f"
};


try {
  firebase.initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/badge-96x96.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});