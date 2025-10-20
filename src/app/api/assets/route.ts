import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, getUserById } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageAssets } from '@/lib/rbac';
import { AssetStatus } from '@prisma/client';

// GET /api/assets - Get all assets
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

    const assets = await prisma.asset.findMany({
      include: {
        assignments: {
          where: { returnedAt: null },
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: {
          select: { history: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    if (!user || !canManageAssets(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const {
      name,
      description,
      serialNumber,
      model,
      brand,
      category,
      purchaseDate,
      warrantyExpiry,
      value,
      location
    } = await request.json();

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        description,
        serialNumber,
        model,
        brand,
        category,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        value: value ? parseFloat(value) : null,
        location,
        status: AssetStatus.AVAILABLE
      }
    });

    // Create history entry
    await prisma.assetHistory.create({
      data: {
        assetId: asset.id,
        userId: user.id,
        action: 'created',
        details: `Asset created by ${user.name || user.email}`
      }
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}