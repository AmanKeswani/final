import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-supabase';
import { supabase } from '@/lib/supabase';

// POST /api/assets/[id]/revoke - Revoke asset from current user (mark assignment returned)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const actor = await getCurrentUser();

    if (!actor || !hasRole(actor.role, 'MANAGER')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { reason } = await request.json().catch(() => ({ reason: undefined }));

    // Find asset and its current active assignment
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
      return NextResponse.json({ error: 'Asset is not currently assigned' }, { status: 400 });
    }

    const activeAssignment = asset.assignments[0];
    const targetUser = activeAssignment.user;

    // Update assignment to mark as returned
    const updatedNotes = reason 
      ? `${activeAssignment.notes ? activeAssignment.notes + ' | ' : ''}Revoked: ${reason}` 
      : activeAssignment.notes;

    const { error: assignmentError } = await supabase
      .from('asset_assignments')
      .update({
        returned_at: new Date().toISOString(),
        notes: updatedNotes
      })
      .eq('id', activeAssignment.id);

    if (assignmentError) {
      console.error('Error updating assignment:', assignmentError);
      return NextResponse.json({ error: 'Failed to revoke asset' }, { status: 500 });
    }

    // Update asset status to AVAILABLE
    const { error: assetUpdateError } = await supabase
      .from('assets')
      .update({ status: 'AVAILABLE' })
      .eq('id', id);

    if (assetUpdateError) {
      console.error('Error updating asset status:', assetUpdateError);
      // Don't fail the request if status update fails
    }

    // Create history entry
    const { error: historyError } = await supabase
      .from('asset_history')
      .insert({
        asset_id: id,
        user_id: actor.id,
        action: 'revoked',
        notes: `Asset revoked from ${targetUser?.name || targetUser?.email}.${reason ? ' Reason: ' + reason : ''}`
      });

    if (historyError) {
      console.error('Error creating asset history:', historyError);
      // Don't fail the request if history creation fails
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error revoking asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}