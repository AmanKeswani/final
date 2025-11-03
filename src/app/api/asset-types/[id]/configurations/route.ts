import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// GET /api/asset-types/[id]/configurations - Get configurations for a specific asset type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {

    const { data: configurations, error } = await supabase
      .from('asset_configurations')
      .select('*')
      .eq('asset_type_id', id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching asset configurations:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch asset configurations',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: configurations,
    })
  } catch (error) {
    console.error('Error fetching asset configurations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch asset configurations',
      },
      { status: 500 }
    )
  }
}

// POST /api/asset-types/[id]/configurations - Create new configuration for asset type
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json()
    
    const createConfigSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      dataType: z.enum(['text', 'number', 'select', 'boolean']),
      options: z.string().optional(),
      isRequired: z.boolean().default(false),
      defaultValue: z.string().optional(),
      displayOrder: z.number().default(0),
      isActive: z.boolean().default(true),
    })

    const validatedData = createConfigSchema.parse(body)

    // Verify asset type exists
    const { data: assetType, error: assetTypeError } = await supabase
      .from('asset_types')
      .select('id')
      .eq('id', id)
      .single();

    if (assetTypeError || !assetType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset type not found',
        },
        { status: 404 }
      )
    }

    // Convert camelCase to snake_case for Supabase
    const supabaseData = {
      name: validatedData.name,
      description: validatedData.description,
      data_type: validatedData.dataType,
      options: validatedData.options,
      is_required: validatedData.isRequired,
      default_value: validatedData.defaultValue,
      display_order: validatedData.displayOrder,
      is_active: validatedData.isActive,
      asset_type_id: id,
    };

    const { data: configuration, error } = await supabase
      .from('asset_configurations')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating asset configuration:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create asset configuration',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: configuration,
        message: 'Configuration created successfully',
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

    console.error('Error creating asset configuration:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create asset configuration',
      },
      { status: 500 }
    )
  }
}