import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/asset-types - Get all active asset types with their configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeConfigs = searchParams.get('includeConfigs') === 'true'

    const assetTypes = await prisma.assetType.findMany({
      where: {
        isActive: true,
      },
      include: {
        configurations: includeConfigs ? {
          where: {
            isActive: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        } : false,
      },
      orderBy: {
        name: 'asc',
      },
    })

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
    const existingAssetType = await prisma.assetType.findUnique({
      where: { name: validatedData.name },
    })

    if (existingAssetType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset type with this name already exists',
        },
        { status: 400 }
      )
    }

    const assetType = await prisma.assetType.create({
      data: validatedData,
    })

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