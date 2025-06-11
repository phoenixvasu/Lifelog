export const registerServiceWorker = async () => {
  try {
    console.log('Starting service worker registration process...');
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Not in browser environment, skipping registration');
      return null;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.error('Service workers are not supported in this browser');
      throw new Error('Service workers are not supported in this browser');
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.error('Notifications are not supported in this browser');
      throw new Error('Notifications are not supported in this browser');
    }

    console.log('Attempting to register service worker...');
    
    // Unregister any existing service workers first
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      console.log('Unregistering existing service worker:', registration.scope);
      await registration.unregister();
    }

    // Register the new service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', {
      scope: registration.scope,
      state: registration.active?.state,
      scriptURL: registration.active?.scriptURL
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service Worker is ready');

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('Service Worker update found!', newWorker);

      newWorker?.addEventListener('statechange', () => {
        console.log('Service Worker state changed:', newWorker.state);
      });
    });

    // Handle updates
    registration.addEventListener('controllerchange', () => {
      console.log('New Service Worker activated!');
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
}; 