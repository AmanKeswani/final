import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { User, UserRole } from '@prisma/client';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-here';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(email: string, password: string, name?: string, role: UserRole = UserRole.USER): Promise<AuthUser> {
  const hashedPassword = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
  
  return user;
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function createAuthToken(userId: string, role: UserRole): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new SignJWT({ userId, role })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<{ userId: string; role: UserRole } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      role: payload.role as UserRole
    };
  } catch (error) {
    return null;
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
  
  return user;
}