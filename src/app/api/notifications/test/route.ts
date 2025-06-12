import { NextResponse } from 'next/server';
import { getMessaging } from 'firebase-admin/messaging';
import { adminDb } from '@/lib/firebase/admin';
import { scheduleDailyReminders, sendDailyReminder } from '@/lib/notifications/scheduler';
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
    console.log('[Notifications API] Firebase Admin initialized successfully');
  } catch (error) {
    console.error('[Notifications API] Error initializing Firebase Admin:', error);
  }
}

const db = getFirestore();

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    console.log('Received notification request:', requestData);

    const { title, body: notificationBody, icon, badge, data, userId } = requestData;

    // Validate required fields
    if (!title || !notificationBody || !userId) {
      console.error('Missing required fields:', { title, notificationBody, userId });
      return NextResponse.json(
        { error: 'Missing required fields: title, body, and userId are required' },
        { status: 400 }
      );
    }

    // Get the user's FCM token from Firestore
    console.log('Fetching user document for userId:', userId);
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error('User document not found for userId:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    console.log('User data retrieved:', { hasFcmToken: !!userData?.fcmToken });

    if (!userData?.fcmToken) {
      console.error('No FCM token found for user:', userId);
      return NextResponse.json(
        { error: 'No FCM token found for user' },
        { status: 400 }
      );
    }

    // Send the notification
    const message = {
      notification: {
        title,
        body: notificationBody,
      },
      webpush: {
        notification: {
          icon: icon || '/icon.png',
          badge: badge || '/badge.png',
          actions: [
            {
              action: 'open',
              title: 'Open App'
            }
          ]
        },
        fcmOptions: {
          link: '/'
        }
      },
      data: {
        ...data,
        click_action: '/'
      },
      token: userData.fcmToken,
    };

    console.log('Sending FCM message:', message);
    const response = await getMessaging().send(message);
    console.log('Successfully sent test notification:', response);

    return NextResponse.json({ 
      success: true, 
      messageId: response,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  console.log('[Notifications API] Test notification endpoint called');
  
  try {
    // First get all users with FCM tokens
    const usersSnapshot = await db.collection('users')
      .where('fcmToken', '!=', null)
      .get();

    console.log('[Notifications API] Found users with FCM tokens:', usersSnapshot.size);

    if (usersSnapshot.empty) {
      console.log('[Notifications API] No users with FCM tokens found');
      return NextResponse.json({ 
        message: 'No users with FCM tokens found',
        count: 0
      }, { status: 200 });
    }

    // Filter users with daily reminders enabled in memory
    const eligibleUsers = usersSnapshot.docs.filter(doc => {
      const userData = doc.data();
      return userData.notificationPreferences?.dailyReminders === true;
    });

    console.log('[Notifications API] Users with daily reminders enabled:', eligibleUsers.length);

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ 
        message: 'No users with daily reminders enabled found',
        count: 0
      }, { status: 200 });
    }

    const messaging = getMessaging();
    const notifications = eligibleUsers.map(async (doc) => {
      const userData = doc.data();
      console.log('[Notifications API] Sending notification to user:', doc.id);
      
      try {
        const response = await messaging.send({
          token: userData.fcmToken,
          notification: {
            title: 'Test Notification',
            body: 'This is a test notification from Lifelog',
          },
          data: {
            type: 'test',
            timestamp: new Date().toISOString(),
          },
        });
        console.log('[Notifications API] Successfully sent notification to user:', doc.id, response);
        return { success: true, userId: doc.id };
      } catch (error) {
        console.error('[Notifications API] Error sending notification to user:', doc.id, error);
        return { success: false, userId: doc.id, error };
      }
    });

    // Send notifications to all users and collect results
    const results = await Promise.all(notifications);
    const successfulSends = results.filter(r => r.success).length;
    const failedSends = results.filter(r => !r.success).length;

    console.log('[Notifications API] Notification results:', {
      total: results.length,
      successful: successfulSends,
      failed: failedSends
    });

    if (failedSends > 0) {
      console.warn('[Notifications API] Some notifications failed to send');
      return NextResponse.json({ 
        message: 'Some notifications failed to send',
        results: {
          total: results.length,
          successful: successfulSends,
          failed: failedSends
        }
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({ 
      message: 'Test notifications sent successfully',
      results: {
        total: results.length,
        successful: successfulSends,
        failed: failedSends
      }
    });
  } catch (error) {
    console.error('[Notifications API] Error in test notification endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 