import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: {
        utc: now.toISOString(),
        ist: istTime.toISOString(),
        formatted: istTime.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        })
      },
      environment: process.env.NODE_ENV,
      cronEnabled: !!process.env.CRON_SECRET
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 