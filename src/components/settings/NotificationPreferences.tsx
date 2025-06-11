'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, CheckCircle2, AlertCircle, Clock, Trophy, Calendar, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { updateNotificationPreferences, sendTestNotification, initializeMessaging } from '@/lib/firebase/messaging';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NotificationPreferences {
  dailyReminders: boolean;
  weeklyDigest: boolean;
  achievements: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export default function NotificationPreferences() {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyReminders: true,
    weeklyDigest: true,
    achievements: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Function to verify Firestore state
  const verifyFirestoreState = async (userId: string, expectedPreferences: NotificationPreferences) => {
    try {
      console.log('[Firebase Verification] Starting verification process...');
      console.log('[Firebase Verification] User ID:', userId);
      console.log('[Firebase Verification] Expected preferences:', JSON.stringify(expectedPreferences, null, 2));
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('[Firebase Verification] User document not found in Firestore');
        return false;
      }

      const firestoreData = userDoc.data();
      console.log('[Firebase Verification] Complete Firestore data:', JSON.stringify(firestoreData, null, 2));
      
      if (!firestoreData.notificationPreferences) {
        console.error('[Firebase Verification] No notification preferences found in Firestore');
        return false;
      }

      const firestorePreferences = firestoreData.notificationPreferences;
      console.log('[Firebase Verification] Firestore preferences:', JSON.stringify(firestorePreferences, null, 2));

      // Normalize the data structures for comparison
      const normalizedExpected = {
        dailyReminders: Boolean(expectedPreferences.dailyReminders),
        weeklyDigest: Boolean(expectedPreferences.weeklyDigest),
        achievements: Boolean(expectedPreferences.achievements),
        quietHours: {
          enabled: Boolean(expectedPreferences.quietHours.enabled),
          start: String(expectedPreferences.quietHours.start),
          end: String(expectedPreferences.quietHours.end)
        }
      };

      const normalizedActual = {
        dailyReminders: Boolean(firestorePreferences.dailyReminders),
        weeklyDigest: Boolean(firestorePreferences.weeklyDigest),
        achievements: Boolean(firestorePreferences.achievements),
        quietHours: {
          enabled: Boolean(firestorePreferences.quietHours?.enabled),
          start: String(firestorePreferences.quietHours?.start || '22:00'),
          end: String(firestorePreferences.quietHours?.end || '07:00')
        }
      };

      console.log('[Firebase Verification] Normalized expected:', JSON.stringify(normalizedExpected, null, 2));
      console.log('[Firebase Verification] Normalized actual:', JSON.stringify(normalizedActual, null, 2));

      // Detailed comparison of each preference
      const comparison = {
        dailyReminders: {
          expected: normalizedExpected.dailyReminders,
          actual: normalizedActual.dailyReminders,
          match: normalizedExpected.dailyReminders === normalizedActual.dailyReminders
        },
        weeklyDigest: {
          expected: normalizedExpected.weeklyDigest,
          actual: normalizedActual.weeklyDigest,
          match: normalizedExpected.weeklyDigest === normalizedActual.weeklyDigest
        },
        achievements: {
          expected: normalizedExpected.achievements,
          actual: normalizedActual.achievements,
          match: normalizedExpected.achievements === normalizedActual.achievements
        },
        quietHours: {
          expected: normalizedExpected.quietHours,
          actual: normalizedActual.quietHours,
          match: JSON.stringify(normalizedExpected.quietHours) === JSON.stringify(normalizedActual.quietHours)
        }
      };

      console.log('[Firebase Verification] Detailed comparison:', JSON.stringify(comparison, null, 2));

      const isMatching = 
        comparison.dailyReminders.match &&
        comparison.weeklyDigest.match &&
        comparison.achievements.match &&
        comparison.quietHours.match;

      console.log('[Firebase Verification] Overall match result:', isMatching);
      
      if (!isMatching) {
        console.warn('[Firebase Verification] Mismatch detected in the following fields:');
        Object.entries(comparison).forEach(([key, value]) => {
          if (!value.match) {
            console.warn(`[Firebase Verification] ${key}:`, {
              expected: value.expected,
              actual: value.actual,
              difference: JSON.stringify(value.expected) !== JSON.stringify(value.actual) 
                ? 'Values differ' 
                : 'Types differ'
            });
          }
        });
      }
      
      return isMatching;
    } catch (error) {
      console.error('[Firebase Verification] Error during verification:', error);
      if (error instanceof Error) {
        console.error('[Firebase Verification] Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      return false;
    }
  };

  useEffect(() => {
    if (!user) {
      console.log('[NotificationPreferences] No user found, skipping preferences setup');
      return;
    }

    console.log('[NotificationPreferences] Setting up real-time listener for user:', user.uid);
    const userRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(
      userRef,
      async (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log('[NotificationPreferences] Received preferences update:', data.notificationPreferences);
          
          if (data.notificationPreferences) {
            const oldPreferences = preferences;
            setPreferences(data.notificationPreferences);
            console.log('[NotificationPreferences] Updated local preferences state');
            
            // Verify the change was reflected in Firestore
            const isVerified = await verifyFirestoreState(user.uid, data.notificationPreferences);
            console.log('[NotificationPreferences] Firestore verification result:', isVerified);
            
            if (!isVerified) {
              console.warn('[NotificationPreferences] Warning: Local state and Firestore state mismatch');
            }
          }
        } else {
          console.log('[NotificationPreferences] No preferences found in Firestore');
        }
        setInitialLoading(false);
      },
      (error) => {
        console.error('[NotificationPreferences] Error in preferences listener:', error);
        setError('Failed to load preferences');
        setInitialLoading(false);
      }
    );

    console.log('[NotificationPreferences] Real-time listener setup complete');
    return () => {
      console.log('[NotificationPreferences] Cleaning up real-time listener');
      unsubscribe();
    };
  }, [user]);

  const handleEnableNotifications = async () => {
    console.log('[NotificationPreferences] Starting notification enable process');
    setLoading(true);
    setError(null);
    try {
      console.log('[NotificationPreferences] Initializing messaging...');
      const token = await initializeMessaging();
      
      if (token) {
        console.log('[NotificationPreferences] Successfully enabled notifications with token:', token);
        
        // Verify token was saved to Firestore
        const isVerified = await verifyFirestoreState(user!.uid, preferences);
        console.log('[NotificationPreferences] Token save verification:', isVerified);
        
        setSuccess('Notifications enabled successfully');
      } else {
        console.log('[NotificationPreferences] Failed to get FCM token');
        setError('Failed to enable notifications');
      }
    } catch (error) {
      console.error('[NotificationPreferences] Error enabling notifications:', error);
      setError(error instanceof Error ? error.message : 'Error enabling notifications');
    } finally {
      setLoading(false);
      console.log('[NotificationPreferences] Notification enable process completed');
    }
  };

  const handleTestNotification = async () => {
    console.log('[NotificationPreferences] Starting test notification process');
    setTestLoading(true);
    setError(null);
    try {
      setSuccess('Test notification will be sent in 5 seconds...');
      console.log('[NotificationPreferences] Waiting 5 seconds before sending test notification...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('[NotificationPreferences] Sending test notification...');
      await sendTestNotification();
      console.log('[NotificationPreferences] Test notification sent successfully');
      setSuccess('Test notification sent successfully');
    } catch (error) {
      console.error('[NotificationPreferences] Error sending test notification:', error);
      setError(error instanceof Error ? error.message : 'Failed to send test notification');
    } finally {
      setTestLoading(false);
      console.log('[NotificationPreferences] Test notification process completed');
    }
  };

  const togglePreference = async (key: keyof NotificationPreferences) => {
    if (!user) {
      console.log('[NotificationPreferences] Cannot toggle preference: No user found');
      return;
    }

    console.log(`[NotificationPreferences] Starting toggle process for ${key}`);
    console.log('[NotificationPreferences] Current preferences:', JSON.stringify(preferences, null, 2));
    
    setLoading(true);
    setError(null);
    try {
      const newPreferences = {
        ...preferences,
        [key]: key === 'quietHours' 
          ? { ...preferences.quietHours, enabled: !preferences.quietHours.enabled }
          : !preferences[key as Exclude<keyof NotificationPreferences, 'quietHours'>],
      };
      
      console.log('[NotificationPreferences] New preferences to be saved:', JSON.stringify(newPreferences, null, 2));
      console.log('[NotificationPreferences] Updating Firestore...');
      
      // First update Firestore
      await updateNotificationPreferences(user.uid, newPreferences);
      console.log('[NotificationPreferences] Firestore update successful');
      
      // Wait for Firestore to update (increased delay)
      console.log('[NotificationPreferences] Waiting for Firestore to update...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify the change was reflected in Firestore
      console.log('[NotificationPreferences] Starting verification...');
      const isVerified = await verifyFirestoreState(user.uid, newPreferences);
      console.log('[NotificationPreferences] Firestore verification result:', isVerified);
      
      if (!isVerified) {
        console.warn('[NotificationPreferences] Warning: Changes not reflected in Firestore');
        // Try one more time after a longer delay
        console.log('[NotificationPreferences] Retrying verification after longer delay...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        const retryVerified = await verifyFirestoreState(user.uid, newPreferences);
        console.log('[NotificationPreferences] Retry verification result:', retryVerified);
        
        if (!retryVerified) {
          setError('Failed to verify changes in database. Please refresh the page and try again.');
        } else {
          setSuccess('Preferences updated successfully');
        }
      } else {
        setSuccess('Preferences updated successfully');
      }
      
    } catch (error) {
      console.error('[NotificationPreferences] Error updating preferences:', error);
      if (error instanceof Error) {
        console.error('[NotificationPreferences] Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      setError(error instanceof Error ? error.message : 'Failed to update preferences');
    } finally {
      setLoading(false);
      console.log('[NotificationPreferences] Toggle process completed');
    }
  };

  const getPreferenceButton = (key: keyof NotificationPreferences, icon: React.ReactNode, label: string) => {
    const isEnabled = key === 'quietHours' ? preferences.quietHours.enabled : preferences[key as Exclude<keyof NotificationPreferences, 'quietHours'>];
    console.log(`[NotificationPreferences] Rendering button for ${key}, enabled: ${isEnabled}`);
    
    return (
      <Button
        variant={isEnabled ? "default" : "outline"}
        className={`w-full flex items-center justify-start gap-3 transition-all duration-200 ${
          isEnabled 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
        }`}
        onClick={() => togglePreference(key)}
        disabled={loading || initialLoading}
      >
        <div className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}>
          {icon}
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium">{label}</span>
          <span className={`text-sm ${isEnabled ? 'text-blue-100' : 'text-gray-500'}`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </Button>
    );
  };

  if (initialLoading) {
    console.log('[NotificationPreferences] Rendering loading state');
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  console.log('[NotificationPreferences] Rendering main component with preferences:', preferences);
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {getPreferenceButton('dailyReminders', <Calendar className="h-5 w-5" />, 'Daily Reminders')}
          {getPreferenceButton('weeklyDigest', <Zap className="h-5 w-5" />, 'Weekly Digest')}
          {getPreferenceButton('achievements', <Trophy className="h-5 w-5" />, 'Achievements')}
          {getPreferenceButton('quietHours', <Clock className="h-5 w-5" />, 'Quiet Hours')}
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <Button
            onClick={handleEnableNotifications}
            disabled={loading || initialLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </Button>

          <Button
            onClick={handleTestNotification}
            disabled={testLoading || loading || initialLoading}
            variant="outline"
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            {testLoading ? 'Sending...' : 'Send Test Notification'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 