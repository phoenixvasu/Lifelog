// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

console.log("Service Worker: Starting initialization");

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
firebase.initializeApp({
  apiKey: "AIzaSyDxQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ",
  authDomain: "lifelog-4f8c9.firebaseapp.com",
  projectId: "lifelog-4f8c9",
  storageBucket: "lifelog-4f8c9.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:1234567890123456789012",
});

console.log("Service Worker: Firebase initialized");

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Service Worker: Received background message:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png",
    badge: "/badge.png",
    data: payload.data,
  };

  console.log("Service Worker: Showing notification:", notificationTitle);
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked:", event);

  event.notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        console.log("Service Worker: Found clients:", clientList.length);

        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            console.log("Service Worker: Focusing existing window");
            return client.focus();
          }
        }

        if (clients.openWindow) {
          console.log("Service Worker: Opening new window");
          return clients.openWindow("/");
        }
      })
  );
});

// Handle service worker installation
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(clients.claim());
});

console.log("Service Worker: Setup complete");
