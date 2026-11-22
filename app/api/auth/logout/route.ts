import { NextResponse } from 'next/server';
import { getClearSessionCookieConfig } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set(getClearSessionCookieConfig());
  return response;
}
