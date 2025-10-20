import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, getUserById } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canApproveRequests, canUpdateRequestStatus } from '@/lib/rbac';
import { RequestStatus, UserRole } from '@prisma/client';

// PATCH /api/requests/[id] - Update request status
export async function PATCH(
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

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Check if request exists
    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: { requester: true }
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Permission checks based on status change
    if (status === RequestStatus.APPROVED || status === RequestStatus.REJECTED) {
      if (!canApproveRequests(user.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    if (status === RequestStatus.IN_PROGRESS || status === RequestStatus.COMPLETED) {
      if (!canUpdateRequestStatus(user.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    // Update request
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        status,
        approvedBy: (status === RequestStatus.APPROVED || status === RequestStatus.REJECTED) ? user.id : undefined
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true }
        },
        asset: {
          select: { id: true, name: true, serialNumber: true }
        },
        approver: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/requests/[id] - Get specific request
export async function GET(
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

    const requestData = await prisma.request.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, email: true }
        },
        asset: {
          select: { id: true, name: true, serialNumber: true, category: true }
        },
        approver: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Users can only view their own requests unless they're managers/admins
    if (user.role === UserRole.USER && requestData.requestedBy !== user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json({ request: requestData });
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}