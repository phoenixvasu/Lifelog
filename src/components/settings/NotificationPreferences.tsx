'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { registerForNotifications, checkNotificationSupport } from '@/lib/notifications/register';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NotificationPreferences {
  dailyReminders: boolean;
}

export default function NotificationPreferences() {
  const { user, loading: authLoading } = useAuthStore();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyReminders: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const checkNotifications = async () => {
      if (!user) {
        setInitialLoading(false);
        return;
      }
      try {
        const support = await checkNotificationSupport();
        if (!support.supported) {
          setInitialLoading(false);
          return;
        }
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && userDoc.data().notificationPreferences) {
          setPreferences(userDoc.data().notificationPreferences);
        }
      } catch {
        // ignore
      } finally {
        setInitialLoading(false);
      }
    };
    checkNotifications();
  }, [user]);

  const handleDailyRemindersToggle = async (checked: boolean) => {
    if (!user) {
      toast.error('Please sign in to enable notifications');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (checked) {
        const token = await registerForNotifications();
        if (!token) throw new Error('Failed to register for notifications');
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          fcmToken: token,
          notificationPreferences: { dailyReminders: true },
          updatedAt: new Date()
        });
        setPreferences({ dailyReminders: true });
        toast.success('Daily reminders enabled successfully');
        setSuccess('Daily reminders enabled successfully');
      } else {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          fcmToken: null,
          notificationPreferences: { dailyReminders: false },
          updatedAt: new Date()
        });
        setPreferences({ dailyReminders: false });
        toast.success('Daily reminders disabled successfully');
        setSuccess('Daily reminders disabled successfully');
      }
    } catch (error) {
      setError('Failed to update notification settings');
      toast.error('Failed to update notification settings');
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
            disabled={loading || !user}
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