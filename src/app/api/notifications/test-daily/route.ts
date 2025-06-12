import { NextResponse } from 'next/server';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Test Daily Reminder API] Firebase Admin initialized successfully');
  } catch (error) {
    console.error('[Test Daily Reminder API] Error initializing Firebase Admin:', error);
  }
}

const db = getFirestore();

export async function GET() {
  console.log('[Test Daily Reminder API] Test endpoint called at:', new Date().toISOString());
  
  try {
    // Get current time in IST
    const now = new Date();
    const istHour = (now.getUTCHours() + 5) % 24; // Convert to IST
    const istMinute = now.getUTCMinutes();
    const currentTime = `${istHour.toString().padStart(2, '0')}:${istMinute.toString().padStart(2, '0')}`;
    
    console.log('[Test Daily Reminder API] Current time in IST:', currentTime);

    // First get all users with FCM tokens
    const usersSnapshot = await db.collection('users')
      .where('fcmToken', '!=', null)
      .get();

    console.log('[Test Daily Reminder API] Found users with FCM tokens:', usersSnapshot.size);

    if (usersSnapshot.empty) {
      console.log('[Test Daily Reminder API] No users with FCM tokens found');
      return NextResponse.json({ 
        message: 'No users with FCM tokens found',
        count: 0,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }

    // Filter users with daily reminders enabled and check their reminder time
    const eligibleUsers = usersSnapshot.docs.filter(doc => {
      const userData = doc.data();
      const preferences = userData.notificationPreferences;
      const isEnabled = preferences?.dailyReminders === true;
      const userReminderTime = preferences?.reminderTime || '12:10';
      
      console.log(`[Test Daily Reminder API] User ${doc.id} preferences:`, {
        hasPreferences: !!preferences,
        dailyReminders: preferences?.dailyReminders,
        reminderTime: userReminderTime,
        currentTime,
        isEnabled,
        timeMatches: userReminderTime === currentTime
      });
      
      return isEnabled && userReminderTime === currentTime;
    });

    console.log('[Test Daily Reminder API] Users eligible for reminder at', currentTime, ':', eligibleUsers.length);

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ 
        message: 'No users with daily reminders enabled found',
        count: 0,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }

    const messaging = getMessaging();
    const notifications = eligibleUsers.map(async (doc) => {
      const userData = doc.data();
      console.log('[Test Daily Reminder API] Sending reminder to user:', doc.id);
      
      try {
        const message = {
          token: userData.fcmToken,
          notification: {
            title: 'Test Daily Reminder',
            body: 'This is a test daily reminder notification!',
          },
          data: {
            type: 'test_daily_reminder',
            timestamp: new Date().toISOString(),
            action: 'open_journal'
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'daily_reminders'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default'
              }
            }
          }
        };

        console.log('[Test Daily Reminder API] Sending FCM message:', {
          userId: doc.id,
          token: userData.fcmToken.substring(0, 10) + '...',
          messageType: 'test_daily_reminder'
        });

        const response = await messaging.send(message);
        console.log('[Test Daily Reminder API] Successfully sent reminder to user:', doc.id, response);
        return { success: true, userId: doc.id };
      } catch (error) {
        console.error('[Test Daily Reminder API] Error sending reminder to user:', doc.id, error);
        // If token is invalid, remove it from the user's document
        if (error instanceof Error && error.message.includes('messaging/invalid-registration-token')) {
          try {
            await db.collection('users').doc(doc.id).update({
              fcmToken: null,
              'notificationPreferences.dailyReminders': false
            });
            console.log('[Test Daily Reminder API] Removed invalid FCM token for user:', doc.id);
          } catch (updateError) {
            console.error('[Test Daily Reminder API] Error updating user document:', updateError);
          }
        }
        return { success: false, userId: doc.id, error };
      }
    });

    // Send notifications to all users and collect results
    const results = await Promise.all(notifications);
    const successfulSends = results.filter(r => r.success).length;
    const failedSends = results.filter(r => !r.success).length;

    console.log('[Test Daily Reminder API] Reminder results:', {
      total: results.length,
      successful: successfulSends,
      failed: failedSends,
      timestamp: new Date().toISOString()
    });

    if (failedSends > 0) {
      console.warn('[Test Daily Reminder API] Some reminders failed to send');
      return NextResponse.json({ 
        message: 'Some reminders failed to send',
        results: {
          total: results.length,
          successful: successfulSends,
          failed: failedSends,
          timestamp: new Date().toISOString()
        }
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({ 
      message: 'Test daily reminders sent successfully',
      results: {
        total: results.length,
        successful: successfulSends,
        failed: failedSends,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Test Daily Reminder API] Error in test endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test daily reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 