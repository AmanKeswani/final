import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// PATCH /api/asset-types/[id] - Update asset type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset type ID is required',
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    const updateAssetTypeSchema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      category: z.string().min(1).optional(),
      isActive: z.boolean().optional(),
    })

    const validatedData = updateAssetTypeSchema.parse(body)

    // Check if asset type exists
    const { data: existingAssetType, error: existingError } = await supabase
      .from('asset_types')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existingAssetType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset type not found',
        },
        { status: 404 }
      )
    }

    // If name is being updated, check for duplicates
    if (validatedData.name && validatedData.name !== existingAssetType.name) {
      const { data: duplicateAssetType, error: duplicateError } = await supabase
        .from('asset_types')
        .select('id')
        .eq('name', validatedData.name)
        .neq('id', id)
        .single();

      if (duplicateAssetType) {
        return NextResponse.json(
          {
            success: false,
            error: 'Asset type with this name already exists',
          },
          { status: 409 }
        )
      }
    }

    // Convert camelCase to snake_case for Supabase
    const supabaseData: any = {};
    if (validatedData.name !== undefined) supabaseData.name = validatedData.name;
    if (validatedData.description !== undefined) supabaseData.description = validatedData.description;
    if (validatedData.category !== undefined) supabaseData.category = validatedData.category;
    if (validatedData.isActive !== undefined) supabaseData.is_active = validatedData.isActive;

    const { data: assetType, error: updateError } = await supabase
      .from('asset_types')
      .update(supabaseData)
      .eq('id', id)
      .select(`
        *,
        configurations:asset_configurations!asset_configurations_asset_type_id_fkey(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating asset type:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update asset type',
        },
        { status: 500 }
      )
    }

    // Filter and sort configurations
    if (assetType.configurations) {
      assetType.configurations = assetType.configurations
        .filter((config: any) => config.is_active)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({
      success: true,
      data: assetType,
      message: 'Asset type updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    console.error('Error updating asset type:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update asset type',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/asset-types/[id] - Delete asset type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset type ID is required',
        },
        { status: 400 }
      )
    }

    // Check if asset type exists
    const { data: existingAssetType, error: existingError } = await supabase
      .from('asset_types')
      .select(`
        *,
        assets(*),
        configurations:asset_configurations(*)
      `)
      .eq('id', id)
      .single();

    if (existingError || !existingAssetType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset type not found',
        },
        { status: 404 }
      )
    }

    // Check if there are assets using this type
    if (existingAssetType.assets && existingAssetType.assets.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete asset type that has associated assets',
        },
        { status: 409 }
      )
    }

    // Delete configurations first, then asset type
    const { error: configDeleteError } = await supabase
      .from('asset_configurations')
      .delete()
      .eq('asset_type_id', id);

    if (configDeleteError) {
      console.error('Error deleting configurations:', configDeleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete asset type configurations',
        },
        { status: 500 }
      )
    }

    const { error: deleteError } = await supabase
      .from('asset_types')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting asset type:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete asset type',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Asset type deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting asset type:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete asset type',
      },
      { status: 500 }
    )
  }
}