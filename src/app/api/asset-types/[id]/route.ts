import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const existingAssetType = await prisma.assetType.findUnique({
      where: { id },
    })

    if (!existingAssetType) {
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
      const duplicateAssetType = await prisma.assetType.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id },
        },
      })

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

    const assetType = await prisma.assetType.update({
      where: { id },
      data: validatedData,
      include: {
        configurations: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    })

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
    const existingAssetType = await prisma.assetType.findUnique({
      where: { id },
      include: {
        assets: true,
        configurations: true,
      },
    })

    if (!existingAssetType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset type not found',
        },
        { status: 404 }
      )
    }

    // Check if there are assets using this type
    if (existingAssetType.assets.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete asset type that has associated assets',
        },
        { status: 409 }
      )
    }

    // Delete configurations first, then asset type
    await prisma.$transaction([
      prisma.assetConfiguration.deleteMany({
        where: { assetTypeId: id },
      }),
      prisma.assetType.delete({
        where: { id },
      }),
    ])

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