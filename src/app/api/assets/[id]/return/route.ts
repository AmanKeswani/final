import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/assets/[id]/return - Return asset from user
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { condition, notes } = await request.json();

    // Check if asset exists and is assigned
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select(`
        *,
        assignments:asset_assignments!asset_assignments_asset_id_fkey(
          *,
          user:users(id, name, email)
        )
      `)
      .eq('id', id)
      .is('assignments.returned_at', null)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (!asset.assignments || asset.assignments.length === 0) {
      return NextResponse.json(
        { error: 'Asset is not currently assigned' },
        { status: 400 }
      );
    }

    const currentAssignment = asset.assignments[0];

    // Check permissions: user can return their own asset, or admin can return any asset
    if (currentAssignment.user_id !== user.id && !hasRole(user.role, 'MANAGER')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Determine new asset status based on condition
    let newStatus = 'AVAILABLE';
    if (condition === 'DAMAGED') {
      newStatus = 'MAINTENANCE';
    } else if (condition === 'LOST') {
      newStatus = 'LOST';
    }

    // Update assignment
    const { data: updatedAssignment, error: assignmentError } = await supabase
      .from('asset_assignments')
      .update({
        returned_at: new Date().toISOString(),
        notes: notes ? `Return notes: ${notes} (condition: ${condition})` : `Returned (condition: ${condition})`
      })
      .eq('id', currentAssignment.id)
      .select(`
        *,
        user:users(id, name, email)
      `)
      .single();

    if (assignmentError) {
      console.error('Error updating assignment:', assignmentError);
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
    }

    // Update asset status
    const { error: updateError } = await supabase
      .from('assets')
      .update({ status: newStatus })
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
        action: 'returned',
        notes: `Asset returned by ${(currentAssignment.user?.name || currentAssignment.user?.email || 'unknown user')} in ${condition} condition`
      });

    if (historyError) {
      console.error('Error creating asset history:', historyError);
      // Don't fail the request if history creation fails
    }

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    console.error('Error returning asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}