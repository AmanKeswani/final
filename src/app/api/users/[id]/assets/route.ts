import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, getUserById } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canViewAllRequests } from '@/lib/rbac';
import { UserRole } from '@prisma/client';

// GET /api/users/[id]/assets - Get user's asset assignments and history
export async function GET(
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Users can only view their own assets unless they're managers/admins
    if (user.role === UserRole.USER && id !== user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Get current assignments
    const currentAssignments = await prisma.assetAssignment.findMany({
      where: {
        userId: id,
        returnedAt: null
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            model: true,
            brand: true,
            category: true,
            status: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    // Get assignment history
    const assignmentHistory = await prisma.assetAssignment.findMany({
      where: {
        userId: id,
        returnedAt: { not: null }
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            model: true,
            brand: true,
            category: true
          }
        }
      },
      orderBy: { returnedAt: 'desc' }
    });

    // Get asset-related history entries
    const assetHistory = await prisma.assetHistory.findMany({
      where: {
        userId: id
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            serialNumber: true
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        user: targetUser,
        currentAssignments,
        assignmentHistory,
        assetHistory
      }
    });
  } catch (error) {
    console.error('Error fetching user assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}