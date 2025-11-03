import { NextResponse } from 'next/server';
import { signOut } from '@/lib/auth-supabase';

export async function POST() {
  try {
    await signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}