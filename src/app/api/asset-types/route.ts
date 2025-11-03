import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// GET /api/asset-types - Get all active asset types with their configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeConfigs = searchParams.get('includeConfigs') === 'true'

    let query = supabase
      .from('asset_types')
      .select(includeConfigs ? `
        *,
        configurations:asset_configurations(*)
      ` : '*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (includeConfigs) {
      query = query.eq('configurations.is_active', true);
    }

    const { data: assetTypes, error } = await query;

    if (error) {
      console.error('Error fetching asset types:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch asset types',
        },
        { status: 500 }
      )
    }

    // Sort configurations by display_order if included
    if (includeConfigs && assetTypes) {
      assetTypes.forEach(assetType => {
        if (assetType.configurations) {
          assetType.configurations.sort((a: any, b: any) => a.display_order - b.display_order);
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: assetTypes,
    })
  } catch (error) {
    console.error('Error fetching asset types:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch asset types',
      },
      { status: 500 }
    )
  }
}

// POST /api/asset-types - Create new asset type (Super Admin/Manager only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const createAssetTypeSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      category: z.string().min(1, 'Category is required'),
      isActive: z.boolean().default(true),
    })

    const validatedData = createAssetTypeSchema.parse(body)

    // Check if asset type with same name already exists
    const { data: existingAssetType, error: checkError } = await supabase
      .from('asset_types')
      .select('id')
      .eq('name', validatedData.name)
      .single();

    if (existingAssetType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset type with this name already exists',
        },
        { status: 400 }
      )
    }

    // Convert camelCase to snake_case for Supabase
    const supabaseData = {
      name: validatedData.name,
      description: validatedData.description,
      category: validatedData.category,
      is_active: validatedData.isActive,
    };

    const { data: assetType, error } = await supabase
      .from('asset_types')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating asset type:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create asset type',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: assetType,
        message: 'Asset type created successfully',
      },
      { status: 201 }
    )
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

    console.error('Error creating asset type:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create asset type',
      },
      { status: 500 }
    )
  }
}