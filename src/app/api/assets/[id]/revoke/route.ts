import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, getUserById } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageAssets } from '@/lib/rbac';
import { AssetStatus } from '@prisma/client';

// POST /api/assets/[id]/revoke - Revoke asset from current user (mark assignment returned)
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
    const actor = await getUserById(decoded.userId);

    if (!actor || !canManageAssets(actor.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { reason } = await request.json().catch(() => ({ reason: undefined }));

    // Find asset and its current active assignment
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { returnedAt: null },
          include: { user: true }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const activeAssignment = asset.assignments[0];

    if (!activeAssignment) {
      return NextResponse.json({ error: 'Asset is not currently assigned' }, { status: 400 });
    }

    const targetUser = activeAssignment.user;

    // Mark returned and set asset AVAILABLE; record history
    await prisma.$transaction([
      prisma.assetAssignment.update({
        where: { id: activeAssignment.id },
        data: { returnedAt: new Date(), notes: reason ? `${activeAssignment.notes ? activeAssignment.notes + ' | ' : ''}Revoked: ${reason}` : activeAssignment.notes }
      }),
      prisma.asset.update({
        where: { id },
        data: { status: AssetStatus.AVAILABLE }
      }),
      prisma.assetHistory.create({
        data: {
          assetId: id,
          userId: actor.id,
          action: 'revoked',
          details: `Asset revoked from ${targetUser?.name || targetUser?.email}.${reason ? ' Reason: ' + reason : ''}`
        }
      })
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error revoking asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}