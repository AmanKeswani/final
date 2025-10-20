import { UserRole } from '@prisma/client';
import { AuthUser } from './auth';

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.USER]: 1,
    [UserRole.MANAGER]: 2,
    [UserRole.SUPER_ADMIN]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canAccessRoute(user: AuthUser | null, requiredRole: UserRole): boolean {
  if (!user) return false;
  return hasPermission(user.role, requiredRole);
}

export function canApproveRequests(userRole: UserRole): boolean {
  return userRole === UserRole.MANAGER || userRole === UserRole.SUPER_ADMIN;
}

export function canManageAssets(userRole: UserRole): boolean {
  return userRole === UserRole.SUPER_ADMIN;
}

export function canViewAllRequests(userRole: UserRole): boolean {
  return userRole === UserRole.MANAGER || userRole === UserRole.SUPER_ADMIN;
}

export function canUpdateRequestStatus(userRole: UserRole): boolean {
  return userRole === UserRole.SUPER_ADMIN;
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.USER:
      return 'User';
    case UserRole.MANAGER:
      return 'Manager';
    case UserRole.SUPER_ADMIN:
      return 'Super Admin';
    default:
      return 'Unknown';
  }
}

export function getAccessibleRoutes(role: UserRole): string[] {
  const baseRoutes = ['/dashboard', '/profile'];
  
  switch (role) {
    case UserRole.USER:
      return [...baseRoutes, '/requests', '/my-assets'];
    case UserRole.MANAGER:
      return [...baseRoutes, '/requests', '/manage-requests', '/assets', '/reports'];
    case UserRole.SUPER_ADMIN:
      return [...baseRoutes, '/requests', '/manage-requests', '/assets', '/manage-assets', '/users', '/reports', '/admin'];
    default:
      return baseRoutes;
  }
}