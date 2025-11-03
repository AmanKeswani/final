import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-supabase';
import { hasRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Only super admins can view all users
    if (!hasRole(user.role, 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}