import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-supabase';
import { hasRole, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// PATCH /api/users/[id]/role - Change a user's role (SUPER_ADMIN only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const actor = await getCurrentUser();

    if (!actor || !hasRole(actor.role, 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const nextRoleRaw: string | undefined = body?.role;

    const validRoles: UserRole[] = ['USER', 'MANAGER', 'SUPER_ADMIN'];
    if (!nextRoleRaw || !validRoles.includes(nextRoleRaw as UserRole)) {
      return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
    }

    // Do not allow changing your own role to avoid locking yourself out unintentionally
    if (actor.id === id) {
      return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 });
    }

    // Check if target user exists
    const { data: targetUser, error: findError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', id)
      .single();

    if (findError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user role
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ role: nextRoleRaw as UserRole })
      .eq('id', id)
      .select('id, email, name, role')
      .single();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    console.error('Error changing user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}