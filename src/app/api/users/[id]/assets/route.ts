import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-supabase';
import { hasRole, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// GET /api/users/[id]/assets - Get user's asset assignments and history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Users can only view their own assets unless they're managers/admins
    if (user.role === 'USER' && id !== user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if target user exists
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Get current assignments
    const { data: currentAssignments, error: currentError } = await supabase
      .from('asset_assignments')
      .select(`
        id,
        assigned_at,
        returned_at,
        asset:assets (
          id,
          name,
          serial_number,
          model,
          brand,
          category,
          status
        )
      `)
      .eq('user_id', id)
      .is('returned_at', null)
      .order('assigned_at', { ascending: false });

    if (currentError) {
      console.error('Error fetching current assignments:', currentError);
      return NextResponse.json({ error: 'Failed to fetch current assignments' }, { status: 500 });
    }

    // Get assignment history
    const { data: assignmentHistory, error: historyError } = await supabase
      .from('asset_assignments')
      .select(`
        id,
        assigned_at,
        returned_at,
        asset:assets (
          id,
          name,
          serial_number,
          model,
          brand,
          category
        )
      `)
      .eq('user_id', id)
      .not('returned_at', 'is', null)
      .order('returned_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching assignment history:', historyError);
      return NextResponse.json({ error: 'Failed to fetch assignment history' }, { status: 500 });
    }

    // Get asset-related history entries
    const { data: assetHistory, error: assetHistoryError } = await supabase
      .from('asset_history')
      .select(`
        id,
        action,
        timestamp,
        notes,
        asset:assets (
          id,
          name,
          serial_number
        ),
        user:users (
          id,
          name,
          email
        )
      `)
      .eq('user_id', id)
      .order('timestamp', { ascending: false });

    if (assetHistoryError) {
      console.error('Error fetching asset history:', assetHistoryError);
      return NextResponse.json({ error: 'Failed to fetch asset history' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: targetUser,
        currentAssignments: currentAssignments || [],
        assignmentHistory: assignmentHistory || [],
        assetHistory: assetHistory || []
      }
    });
  } catch (error) {
    console.error('Error fetching user assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}