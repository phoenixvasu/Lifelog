'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, CheckCircle2, AlertCircle, Calendar, Zap, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { registerForNotifications, checkNotificationSupport } from '@/lib/notifications/register';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotificationPreferences {
  dailyReminders: boolean;
  weeklyDigest: boolean;
  reminderTime: string;
}

export default function NotificationPreferences() {
  const { user, loading: authLoading } = useAuthStore();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyReminders: false,
    weeklyDigest: false,
    reminderTime: '12:10'
  });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Generate time options in 15-minute intervals
  const timeOptions = Array.from({ length: 96 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const checkNotifications = async () => {
      console.log('[NotificationPreferences] useEffect: checking notifications for user', user?.uid);
      if (!user) {
        setInitialLoading(false);
        return;
      }

      try {
        // Check browser support
        const support = await checkNotificationSupport();
        console.log('[NotificationPreferences] Notification support:', support);
        if (!support.supported) {
          console.log('[NotificationPreferences] Browser does not support notifications');
          setInitialLoading(false);
          return;
        }

        // Get user preferences
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        console.log('[NotificationPreferences] Firestore userDoc.exists:', userDoc.exists());
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('[NotificationPreferences] Firestore userData:', userData);
          if (userData.notificationPreferences) {
            setPreferences(userData.notificationPreferences);
            console.log('[NotificationPreferences] Set preferences from Firestore:', userData.notificationPreferences);
          }
        }
      } catch (error) {
        console.error('[NotificationPreferences] Error checking notifications:', error);
      } finally {
        setInitialLoading(false);
        console.log('[NotificationPreferences] Initial loading set to false');
      }
    };

    checkNotifications();
  }, [user]);

  const handleDailyRemindersToggle = async (checked: boolean) => {
    console.log('[NotificationPreferences] handleDailyRemindersToggle called. checked:', checked, 'user:', user?.uid);
    
    if (!user) {
      toast.error('Please sign in to enable notifications');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[NotificationPreferences] Loading set to true');

      if (checked) {
        // Register for notifications
        console.log('[NotificationPreferences] Registering for notifications...');
        const token = await registerForNotifications();
        console.log('[NotificationPreferences] registerForNotifications returned token:', token);
        if (!token) {
          throw new Error('Failed to register for notifications');
        }

        // Update Firestore with FCM token and preferences
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          fcmToken: token,
          notificationPreferences: {
            ...preferences,
            dailyReminders: true,
            reminderTime: '12:06' // Set default reminder time
          },
          updatedAt: new Date()
        });
        console.log('[NotificationPreferences] Firestore updated with FCM token and dailyReminders: true');

        setPreferences(prev => ({ ...prev, dailyReminders: true }));
        toast.success('Daily reminders enabled successfully');
      } else {
        // Unregister notifications
        console.log('[NotificationPreferences] Unregistering notifications...');
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          fcmToken: null,
          notificationPreferences: {
            ...preferences,
            dailyReminders: false
          },
          updatedAt: new Date()
        });
        console.log('[NotificationPreferences] Firestore updated with fcmToken: null and dailyReminders: false');

        setPreferences(prev => ({ ...prev, dailyReminders: false }));
        toast.success('Daily reminders disabled successfully');
      }
    } catch (error) {
      console.error('[NotificationPreferences] Error toggling daily reminders:', error);
      setError('Failed to update notification settings');
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
      console.log('[NotificationPreferences] Loading set to false');
    }
  };

  const handleTestNotification = async () => {
    if (!user) {
      toast.error('Please sign in to test notifications');
      return;
    }

    try {
      setTestLoading(true);
      setError(null);

      const response = await fetch('/api/notifications/test');
      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      setSuccess('Test notification sent successfully');
      toast.success('Test notification sent successfully');
    } catch (error) {
      console.error('Error sending test notification:', error);
      setError(error instanceof Error ? error.message : 'Failed to send test notification');
      toast.error('Failed to send test notification');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestDailyReminder = async () => {
    if (!user) {
      toast.error('Please sign in to test daily reminders');
      return;
    }

    try {
      setTestLoading(true);
      setError(null);

      const response = await fetch('/api/notifications/test-daily');
      if (!response.ok) {
        throw new Error('Failed to send test daily reminder');
      }

      const data = await response.json();
      console.log('[NotificationPreferences] Test daily reminder response:', data);

      setSuccess('Test daily reminder sent successfully');
      toast.success('Test daily reminder sent successfully');
    } catch (error) {
      console.error('[NotificationPreferences] Error sending test daily reminder:', error);
      setError(error instanceof Error ? error.message : 'Failed to send test daily reminder');
      toast.error('Failed to send test daily reminder');
    } finally {
      setTestLoading(false);
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: any) => {
    if (!user) {
      toast.error('Please sign in to update preferences');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newPreferences = {
        ...preferences,
        [key]: value
      };

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationPreferences: newPreferences,
        updatedAt: new Date()
      });

      setPreferences(newPreferences);
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Failed to update preferences');
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = async (time: string) => {
    if (!user) {
      toast.error('Please sign in to update reminder time');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[NotificationPreferences] Updating reminder time to:', time);

      const newPreferences = {
        ...preferences,
        reminderTime: time
      };

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationPreferences: newPreferences,
        updatedAt: new Date()
      });

      console.log('[NotificationPreferences] Successfully updated reminder time in Firestore');
      setPreferences(newPreferences);
      toast.success('Reminder time updated successfully');
    } catch (error) {
      console.error('[NotificationPreferences] Error updating reminder time:', error);
      setError('Failed to update reminder time');
      toast.error('Failed to update reminder time');
    } finally {
      setLoading(false);
    }
  };

  const getPreferenceButton = (key: keyof NotificationPreferences, icon: React.ReactNode, label: string) => {
    const isEnabled = Boolean(preferences[key]);
    console.log(`[NotificationPreferences] Rendering preference button for ${key}, isEnabled:`, isEnabled);
    
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-indigo-700 dark:text-indigo-300">{label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {label === 'Daily Reminders' && 'Get reminded to write in your journal'}
              {label === 'Weekly Summary' && 'Receive a weekly summary of your mood trends'}
            </p>
          </div>
        </div>
        {key === 'reminderTime' ? (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <input
                type="time"
                value={preferences.reminderTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={loading || !user}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">IST</span>
            </div>
            <Switch
              checked={preferences.dailyReminders}
              onCheckedChange={(checked) => {
                console.log('[NotificationPreferences] Daily reminder switch clicked, new value:', checked);
                handleDailyRemindersToggle(checked);
              }}
              disabled={loading || !user}
            />
          </div>
        ) : (
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => {
              console.log(`[NotificationPreferences] ${key} switch clicked, new value:`, checked);
              if (key === 'dailyReminders') {
                handleDailyRemindersToggle(checked);
              } else {
                handlePreferenceChange(key, checked);
              }
            }}
            disabled={loading || initialLoading || !user}
          />
        )}
      </div>
    );
  };

  // Add logging to the render method
  console.log('[NotificationPreferences] Rendering component, current preferences:', preferences);
  console.log('[NotificationPreferences] Loading state:', loading);
  console.log('[NotificationPreferences] Initial loading state:', initialLoading);
  console.log('[NotificationPreferences] Auth state:', { user: user?.uid, authLoading });

  if (authLoading || initialLoading) {
    console.log('[NotificationPreferences] Showing loading state');
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
                Get reminded to write in your journal
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.dailyReminders}
            onCheckedChange={(checked) => {
              console.log('[NotificationPreferences] Daily reminder switch clicked, new value:', checked);
              handleDailyRemindersToggle(checked);
            }}
            disabled={loading || !user}
          />
        </div>

        {preferences.dailyReminders && (
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <p className="font-medium text-indigo-700 dark:text-indigo-300">Reminder Time</p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={preferences.reminderTime}
                onValueChange={handleTimeChange}
                disabled={loading || !user}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time} IST
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500 dark:text-gray-400">IST</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-indigo-700 dark:text-indigo-300">Weekly Summary</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive a weekly summary of your mood trends
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.weeklyDigest}
            onCheckedChange={(checked) => {
              console.log('[NotificationPreferences] Weekly digest switch clicked, new value:', checked);
              handlePreferenceChange('weeklyDigest', checked);
            }}
            disabled={loading || initialLoading || !user}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-4">
        <Button
          onClick={handleTestNotification}
          disabled={testLoading || loading || initialLoading || !user}
          variant="outline"
          className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          {testLoading ? 'Sending...' : 'Send Test Notification'}
        </Button>

        <Button
          onClick={handleTestDailyReminder}
          disabled={testLoading || loading || initialLoading || !user}
          variant="outline"
          className="w-full border-green-200 text-green-600 hover:bg-green-50"
        >
          {testLoading ? 'Sending...' : 'Test Daily Reminder'}
        </Button>
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