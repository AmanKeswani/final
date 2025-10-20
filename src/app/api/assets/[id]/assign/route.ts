import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, getUserById } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageAssets } from '@/lib/rbac';
import { AssetStatus } from '@prisma/client';

// POST /api/assets/[id]/assign - Assign asset to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyAuthToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const user = await getUserById(decoded.userId);

    if (!user || !canManageAssets(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { assignToUserId, notes } = await request.json();

    if (!assignToUserId) {
      return NextResponse.json(
        { error: 'User ID is required for assignment' },
        { status: 400 }
      );
    }

    // Check if asset exists and is available
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { returnedAt: null }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.status !== AssetStatus.AVAILABLE) {
      return NextResponse.json(
        { error: 'Asset is not available for assignment' },
        { status: 400 }
      );
    }

    if (asset.assignments.length > 0) {
      return NextResponse.json(
        { error: 'Asset is already assigned to another user' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: assignToUserId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Create assignment and update asset status
    const [assignment] = await prisma.$transaction([
      prisma.assetAssignment.create({
        data: {
          assetId: id,
          userId: assignToUserId,
          notes
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.asset.update({
        where: { id },
        data: { status: AssetStatus.ASSIGNED }
      }),
      prisma.assetHistory.create({
        data: {
          assetId: id,
          userId: user.id,
          action: 'assigned',
          details: `Asset assigned to ${targetUser.name || targetUser.email} by ${user.name || user.email}`
        }
      })
    ]);

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Error assigning asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}