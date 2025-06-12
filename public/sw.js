self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push event received:", event); // <-- Add this line

  if (!event.data) return;

  try {
    const data = event.data.json();
    console.log("[Service Worker] Push received:", data);

    const options = {
      body: data.notification.body,
      icon: data.notification.icon || "/icon.png",
      badge: data.notification.badge || "/badge.png",
      data: data.data,
      actions: data.webpush?.notification?.actions || [],
      requireInteraction: true, // Keep notification visible until user interacts
      vibrate: [200, 100, 200], // Vibration pattern
      tag: "daily-reminder", // Group similar notifications
      renotify: true, // Allow multiple notifications with same tag
    };

    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
  } catch (error) {
    console.error("[Service Worker] Error handling push:", error);
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("[Service Worker] Notification click received:", event);

  event.notification.close();

  if (event.action === "open") {
    event.waitUntil(
      clients.openWindow(
        event.notification.data?.click_action || "/journal/new"
      )
    );
  } else {
    // Default action - open the journal
    event.waitUntil(clients.openWindow("/journal/new"));
  }
});
