import { NextResponse } from 'next/server';
import { scheduleDailyReminders, sendDailyReminder } from '@/lib/notifications/scheduler';

export async function POST(request: Request) {
  try {
    console.log('[API] Received notification schedule request');
    console.log('[API] Request headers:', Object.fromEntries(request.headers.entries()));

    // Verify the request is from a trusted source (e.g., cron job)
    const authHeader = request.headers.get('authorization');
    console.log('[API] Auth header present:', !!authHeader);
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('[API] Authorization failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API] Authorization successful');
    console.log('[API] Processing scheduled notifications...');
    
    // Get current time in IST (GMT+5:30)
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const currentTime = istTime.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'  // Explicitly set IST timezone
    });

    console.log('[API] Time details:', {
      utc: now.toISOString(),
      ist: istTime.toISOString(),
      formattedTime: currentTime,
      timezone: 'Asia/Kolkata'
    });

    // Get all users who should receive notifications
    console.log('[API] Fetching user schedules...');
    const schedules = await scheduleDailyReminders();
    
    // Filter users whose reminder time matches current time
    const usersToNotify = schedules.filter(schedule => {
      const userReminderTime = schedule.preferences.reminderTime;
      const matches = userReminderTime === currentTime;
      console.log(`[API] Checking user ${schedule.userId}:`, {
        userReminderTime,
        currentTime,
        matches
      });
      return matches;
    });

    console.log(`[API] Found ${usersToNotify.length} users to notify at ${currentTime}`);
    console.log('[API] Users to notify:', usersToNotify.map(u => ({
      userId: u.userId,
      reminderTime: u.preferences.reminderTime
    })));

    // Send notifications
    console.log('[API] Starting to send notifications...');
    const results = await Promise.allSettled(
      usersToNotify.map(schedule => sendDailyReminder(schedule))
    );

    // Process results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log('[API] Notification results:', {
      total: results.length,
      successful,
      failed,
      details: results.map((r, i) => ({
        userId: usersToNotify[i].userId,
        status: r.status,
        value: r.status === 'fulfilled' ? r.value : r.reason
      }))
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${usersToNotify.length} notifications`,
      results: {
        successful,
        failed,
        currentTime,
        timezone: 'IST (GMT+5:30)',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[API] Error processing scheduled notifications:', error);
    if (error instanceof Error) {
      console.error('[API] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { 
        error: 'Failed to process scheduled notifications',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 