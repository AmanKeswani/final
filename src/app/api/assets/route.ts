import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-supabase';
import { supabase } from '@/lib/supabase';

// GET /api/assets - Get all assets
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get assets with current assignments and history count
    const { data: assets, error } = await supabase
      .from('assets')
      .select(`
        *,
        assignments:asset_assignments!inner(
          id,
          assigned_at,
          returned_at,
          user:users(id, name, email)
        ),
        history_count:asset_history(count)
      `)
      .is('assignments.returned_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assets:', error);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    // Also get assets without current assignments
    const { data: unassignedAssets, error: unassignedError } = await supabase
      .from('assets')
      .select(`
        *,
        history_count:asset_history(count)
      `)
      .not('id', 'in', `(${assets?.map(a => a.id).join(',') || 'null'})`)
      .order('created_at', { ascending: false });

    if (unassignedError) {
      console.error('Error fetching unassigned assets:', unassignedError);
      return NextResponse.json({ error: 'Failed to fetch unassigned assets' }, { status: 500 });
    }

    // Combine and format the results
    const allAssets = [
      ...(assets || []).map(asset => ({
        ...asset,
        assignments: asset.assignments || [],
        _count: { history: asset.history_count?.[0]?.count || 0 }
      })),
      ...(unassignedAssets || []).map(asset => ({
        ...asset,
        assignments: [],
        _count: { history: asset.history_count?.[0]?.count || 0 }
      }))
    ];

    return NextResponse.json({ assets: allAssets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user can manage assets (MANAGER or SUPER_ADMIN)
    if (!hasRole(user.role, 'MANAGER')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const {
      name,
      description,
      serialNumber,
      model,
      brand,
      category,
      purchaseDate,
      warrantyExpiry,
      value,
      location
    } = await request.json();

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    // Create the asset
    const { data: asset, error: createError } = await supabase
      .from('assets')
      .insert({
        name,
        description,
        serial_number: serialNumber,
        model,
        brand,
        category,
        purchase_date: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        warranty_expiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null,
        value: value ? parseFloat(value) : null,
        location,
        status: 'AVAILABLE'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating asset:', createError);
      return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
    }

    // Create history entry
    const { error: historyError } = await supabase
      .from('asset_history')
      .insert({
        asset_id: asset.id,
        user_id: user.id,
        action: 'created',
        notes: `Asset created by ${user.name || user.email}`
      });

    if (historyError) {
      console.error('Error creating asset history:', historyError);
      // Don't fail the request if history creation fails
    }

    // Return asset with empty assignments and history count
    const assetWithRelations = {
      ...asset,
      assignments: [],
      _count: { history: 1 }
    };

    return NextResponse.json({ asset: assetWithRelations }, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}