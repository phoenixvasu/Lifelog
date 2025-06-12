import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export async function GET(request: Request) {
  // Disable Vercel/Next.js caching for this API route
  const headers = { 'Cache-Control': 'no-store' };

  try {
    // Query users
    const usersSnapshot = await db.collection('users')
      .where('fcmToken', '!=', null)
      .where('notificationPreferences.dailyReminders', '==', true)
      .get();

    const userCount = usersSnapshot.size;
    const fcmTokens: string[] = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      fcmTokens.push(userData.fcmToken);
    });

    console.log(`[Daily Reminder] Found ${userCount} users with daily reminders enabled.`);
    console.log(`[Daily Reminder] FCM Tokens:`, fcmTokens);

    if (usersSnapshot.empty) {
      return NextResponse.json({ message: 'No users to notify.' }, { status: 200 });
    }

    const messaging = getMessaging();
    const results = await Promise.allSettled(usersSnapshot.docs.map(async doc => {
      const userData = doc.data();
      const message = {
        notification: {
          title: 'Daily Journal Reminder',
          body: 'Time to write in your journal! Take a moment to reflect on your day.',
        },
        webpush: {
          notification: {
            icon: '/icon.png',
            badge: '/badge.png',
            actions: [{ action: 'open', title: 'Write Now' }]
          },
          fcmOptions: { link: '/journal/new' }
        },
        data: {
          type: 'daily_reminder',
          timestamp: new Date().toISOString(),
          click_action: '/journal/new'
        },
        token: userData.fcmToken,
      };
      try {
        await messaging.send(message);
        return { status: 'fulfilled' };
      } catch (err: any) {
        // Log error code and message for debugging
        console.error(
          `[Daily Reminder] Failed to send to token ${userData.fcmToken}:`,
          err.code,
          err.message
        );
        return { status: 'rejected', code: err.code, message: err.message, token: userData.fcmToken };
      }
    }));

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const failedDetails = results.filter(r => r.status === 'rejected');

    return NextResponse.json({
      message: `Sent reminders to ${successful} users, failed for ${failed}`,
      tokens: fcmTokens,
      failedDetails,
      timestamp: new Date().toISOString()
    }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500, headers });
  }
}