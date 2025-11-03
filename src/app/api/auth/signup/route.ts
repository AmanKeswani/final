import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth-supabase';
import { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate role if provided
    let userRole: UserRole = 'USER'; // Default role
    if (role && ['USER', 'MANAGER', 'SUPER_ADMIN'].includes(role)) {
      userRole = role;
    }

    const user = await createUser(email, password, name, userRole);

    // With Supabase, the session is automatically managed
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error instanceof Error ? error.message : 'Unknown error');
    
    // Check for duplicate email error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}