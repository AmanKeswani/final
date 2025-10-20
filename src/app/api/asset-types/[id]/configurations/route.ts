import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/asset-types/[id]/configurations - Get configurations for a specific asset type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {

    const configurations = await prisma.assetConfiguration.findMany({
      where: {
        assetTypeId: id,
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

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
    const assetType = await prisma.assetType.findUnique({
      where: { id },
    })

    if (!assetType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset type not found',
        },
        { status: 404 }
      )
    }

    const configuration = await prisma.assetConfiguration.create({
      data: {
        ...validatedData,
        assetTypeId: id,
      },
    })

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