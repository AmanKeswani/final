import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, getUserById } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canViewAllRequests } from '@/lib/rbac';
import { UserRole, RequestStatus, RequestType } from '@prisma/client';

// GET /api/requests - Get requests (all for managers/admins, own for users)
export async function GET(request: NextRequest) {
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

    const whereClause = canViewAllRequests(user.role) 
      ? {} 
      : { requestedBy: user.id }; // Changed from userId to requestedBy

    const requests = await prisma.request.findMany({
      where: whereClause,
      include: {
        requester: {
          select: { id: true, name: true, email: true }
        },
        asset: {
          select: { id: true, name: true, serialNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/requests - Create new request
export async function POST(request: NextRequest) {
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

    const {
      type,
      assetId,
      description,
      justification,
      urgency,
      deviceType,
      preferences
    } = await request.json();

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }

    // Validate request type
    if (!Object.values(RequestType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    // For replacement requests, asset ID is required
    if (type === RequestType.REPLACEMENT && !assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required for replacement requests' },
        { status: 400 }
      );
    }

    const newRequest = await prisma.request.create({
      data: {
        requestedBy: user.id,  // Changed from userId to requestedBy
        type,
        title: description.substring(0, 100), // Add title field
        description,
        priority: urgency?.toLowerCase() || 'medium', // Changed from urgency to priority
        deviceType: deviceType || null,
        preferences: preferences || null,
        assetId: assetId || null,
        status: RequestStatus.PENDING
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true }
        },
        asset: {
          select: { id: true, name: true, serialNumber: true }
        }
      }
    });

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}