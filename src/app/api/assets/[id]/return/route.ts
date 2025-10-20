import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, getUserById } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageAssets } from '@/lib/rbac';
import { AssetStatus } from '@prisma/client';

// POST /api/assets/[id]/return - Return asset from user
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { condition, notes } = await request.json();

    // Check if asset exists and is assigned
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { returnedAt: null },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.assignments.length === 0) {
      return NextResponse.json(
        { error: 'Asset is not currently assigned' },
        { status: 400 }
      );
    }

    const currentAssignment = asset.assignments[0];

    // Check permissions: user can return their own asset, or admin can return any asset
    if (currentAssignment.userId !== user.id && !canManageAssets(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Determine new asset status based on condition
    let newStatus: AssetStatus = AssetStatus.AVAILABLE;
    if (condition === 'DAMAGED') {
      newStatus = AssetStatus.MAINTENANCE;
    } else if (condition === 'LOST') {
      newStatus = AssetStatus.LOST;
    }

    // Update assignment and asset status
    const [updatedAssignment] = await prisma.$transaction([
      prisma.assetAssignment.update({
        where: { id: currentAssignment.id },
        data: {
          returnedAt: new Date(),
          notes: notes ? `Return notes: ${notes} (condition: ${condition})` : `Returned (condition: ${condition})`
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.asset.update({
        where: { id },
        data: { status: newStatus }
      }),
      prisma.assetHistory.create({
        data: {
          assetId: id,
          userId: user.id,
          action: 'returned',
          details: `Asset returned by ${(currentAssignment.user?.name || currentAssignment.user?.email || 'unknown user')} in ${condition} condition`,
        }
      })
    ]);

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    console.error('Error returning asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}