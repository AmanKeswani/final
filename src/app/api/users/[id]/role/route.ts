import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, getUserById } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// PATCH /api/users/[id]/role - Change a user's role (SUPER_ADMIN only)
export async function PATCH(
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

    if (!actor || actor.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const nextRoleRaw: string | undefined = body?.role;

    const validRoles = Object.values(UserRole);
    if (!nextRoleRaw || !validRoles.includes(nextRoleRaw as UserRole)) {
      return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
    }

    // Do not allow changing your own role to avoid locking yourself out unintentionally
    if (actor.id === id) {
      return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: nextRoleRaw as UserRole }
    });

    return NextResponse.json({ user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role } }, { status: 200 });
  } catch (error) {
    console.error('Error changing user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}