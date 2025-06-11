import { NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { token, title, body } = await request.json();

    if (!token || !title || !body) {
      console.error('Missing required fields:', { token, title, body });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Sending notification with payload:', {
      token,
      title,
      body
    });

    // Send the notification
    const message = {
      notification: {
        title,
        body,
      },
      token,
      webpush: {
        fcmOptions: {
          link: '/'
        }
      }
    };

    const response = await adminMessaging.send(message);
    console.log('Successfully sent notification:', response);

    return NextResponse.json({ 
      success: true, 
      messageId: response 
    });
  } catch (error) {
    console.error('[API] Error sending notification:', error);
    // Safely check error type before accessing 'code'
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as any).code === 'messaging/invalid-registration-token'
    ) {
      return NextResponse.json(
        { error: 'Invalid registration token' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to send notification', details: (error as any)?.message || String(error) },
      { status: 500 }
    );
  }
} 