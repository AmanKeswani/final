import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/requests/[id] - Update request status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Check if request exists
    const { data: existingRequest, error: fetchError } = await supabase
      .from('requests')
      .select('*, requester:users!requests_requested_by_fkey(*)')
      .eq('id', id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Permission checks based on status change
    if (status === 'APPROVED' || status === 'REJECTED') {
      if (!hasRole(user.role, 'MANAGER')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    if (status === 'IN_PROGRESS' || status === 'COMPLETED') {
      if (!hasRole(user.role, 'MANAGER')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    // Update request
    const updateData: any = { status };
    if (status === 'APPROVED' || status === 'REJECTED') {
      updateData.approved_by = user.id;
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        requester:users!requests_requested_by_fkey(id, name, email),
        asset:assets(id, name, serial_number),
        approver:users!requests_approved_by_fkey(id, name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/requests/[id] - Get specific request
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: requestData, error } = await supabase
      .from('requests')
      .select(`
        *,
        requester:users!requests_requested_by_fkey(id, name, email),
        asset:assets(id, name, serial_number, category),
        approver:users!requests_approved_by_fkey(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Users can only view their own requests unless they're managers/admins
    if (user.role === 'USER' && requestData.requested_by !== user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json({ request: requestData });
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}