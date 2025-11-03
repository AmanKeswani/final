import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/requests - Get requests (all for managers/admins, own for users)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user can view all requests (MANAGER or SUPER_ADMIN)
    const canViewAll = hasRole(user.role, 'MANAGER');

    let query = supabase
      .from('requests')
      .select(`
        *,
        requester:users!requests_requested_by_fkey(id, name, email),
        asset:assets(id, name, serial_number)
      `)
      .order('created_at', { ascending: false });

    // If user can't view all requests, filter to only their own
    if (!canViewAll) {
      query = query.eq('requested_by', user.id);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/requests - Create new request
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const {
      type,
      assetId,
      description,
      justification,
      urgency,
      deviceType,
      preferences
    } = await request.json();

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }

    // Validate request type
    const validTypes = ['NEW_ASSET', 'REPLACEMENT', 'REPAIR', 'UPGRADE'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    // For replacement requests, asset ID is required
    if (type === 'REPLACEMENT' && !assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required for replacement requests' },
        { status: 400 }
      );
    }

    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert({
        requested_by: user.id,
        type,
        title: description.substring(0, 100),
        description,
        priority: urgency?.toLowerCase() || 'medium',
        device_type: deviceType || null,
        preferences: preferences || null,
        asset_id: assetId || null,
        status: 'PENDING'
      })
      .select(`
        *,
        requester:users!requests_requested_by_fkey(id, name, email),
        asset:assets(id, name, serial_number)
      `)
      .single();

    if (error) {
      console.error('Error creating request:', error);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}