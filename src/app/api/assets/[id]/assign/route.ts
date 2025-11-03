import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/assets/[id]/assign - Assign asset to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();

    if (!user || !hasRole(user.role, 'MANAGER')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { assignToUserId, notes } = await request.json();

    if (!assignToUserId) {
      return NextResponse.json(
        { error: 'User ID is required for assignment' },
        { status: 400 }
      );
    }

    // Check if asset exists and is available
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select(`
        *,
        assignments:asset_assignments!asset_assignments_asset_id_fkey(*)
      `)
      .eq('id', id)
      .is('assignments.returned_at', null)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Asset is not available for assignment' },
        { status: 400 }
      );
    }

    if (asset.assignments && asset.assignments.length > 0) {
      return NextResponse.json(
        { error: 'Asset is already assigned to another user' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', assignToUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('asset_assignments')
      .insert({
        asset_id: id,
        user_id: assignToUserId,
        notes
      })
      .select(`
        *,
        user:users(id, name, email)
      `)
      .single();

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }

    // Update asset status
    const { error: updateError } = await supabase
      .from('assets')
      .update({ status: 'ASSIGNED' })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating asset status:', updateError);
      // Don't fail the request if status update fails
    }

    // Create history entry
    const { error: historyError } = await supabase
      .from('asset_history')
      .insert({
        asset_id: id,
        user_id: user.id,
        action: 'assigned',
        notes: `Asset assigned to ${targetUser.name || targetUser.email} by ${user.name || user.email}`
      });

    if (historyError) {
      console.error('Error creating asset history:', historyError);
      // Don't fail the request if history creation fails
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Error assigning asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}