export const registerServiceWorker = async () => {
  try {
    console.log('Registering service worker...');
    
    if ('serviceWorker' in navigator) {
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
      
      console.log('Service Worker registered, waiting for activation...');

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
    } else {
      console.log('Service workers are not supported in this browser');
      return null;
    }
  } catch (error) {
    console.error('Error registering service worker:', error);
    throw error;
  }
}; 