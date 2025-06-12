'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { registerForNotifications, checkNotificationSupport } from '@/lib/notifications/register';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NotificationPreferences {
  dailyReminders: boolean;
  fcmToken?: string | null;
}

export default function NotificationPreferences() {
  const { user, loading: authLoading } = useAuthStore();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyReminders: false,
    fcmToken: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [notificationSupport, setNotificationSupport] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    serviceWorker: boolean;
  } | null>(null);

  // Check notification support on mount
  useEffect(() => {
    const checkSupport = async () => {
      const support = await checkNotificationSupport();
      setNotificationSupport(support);
      if (!support.supported) {
        setError('Your browser does not support notifications');
      } else if (support.permission === 'denied') {
        setError('Please enable notifications in your browser settings');
      }
    };
    checkSupport();
  }, []);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setInitialLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPreferences({
            dailyReminders: data.notificationPreferences?.dailyReminders || false,
            fcmToken: data.fcmToken || null
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setError('Failed to load notification preferences');
      } finally {
        setInitialLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const updateNotificationPreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationPreferences: {
          dailyReminders: newPreferences.dailyReminders
        },
        fcmToken: newPreferences.fcmToken,
        updatedAt: serverTimestamp()
      });
      setPreferences(newPreferences);
      setSuccess(newPreferences.dailyReminders ? 
        'Daily reminders enabled successfully' : 
        'Daily reminders disabled successfully'
      );
      setError(null);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Failed to update notification settings');
      setSuccess(null);
      throw error;
    }
  }, [user]);

  const handleDailyRemindersToggle = async (checked: boolean) => {
    if (!user) {
      setError('Please sign in to enable notifications');
      return;
    }

    if (!notificationSupport?.supported) {
      setError('Your browser does not support notifications');
      return;
    }

    if (notificationSupport.permission === 'denied') {
      setError('Please enable notifications in your browser settings');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      let token = preferences.fcmToken;

      if (checked) {
        // Only get a new token if we don't have one
        if (!token) {
          token = await registerForNotifications();
          if (!token) {
            throw new Error('Failed to register for notifications. Please check your browser settings.');
          }
        }
      } else {
        // When disabling, we keep the token but update preferences
        token = preferences.fcmToken;
      }

      await updateNotificationPreferences({
        dailyReminders: checked,
        fcmToken: token
      });

    } catch (error) {
      console.error('Error toggling notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to update notification settings');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || initialLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-6 bg-white dark:bg-gray-800 border-l-4 border-indigo-500 dark:border-indigo-400 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-200 via-purple-200 to-blue-200 dark:from-indigo-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
            <Bell className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300">
              Notification Preferences
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please sign in to manage your notification settings
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border-l-4 border-indigo-500 dark:border-indigo-400 shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-200 via-purple-200 to-blue-200 dark:from-indigo-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
          <Bell className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300">
            Notification Preferences
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your notification settings
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-indigo-700 dark:text-indigo-300">Daily Reminders</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get reminded to write in your journal every day
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.dailyReminders}
            onCheckedChange={handleDailyRemindersToggle}
            disabled={loading || !user || !notificationSupport?.supported || notificationSupport?.permission === 'denied'}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200 mt-4">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
    </Card>
  );
}