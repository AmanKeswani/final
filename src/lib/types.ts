// Shared types that can be used on both client and server
export type UserRole = 'USER' | 'MANAGER' | 'SUPER_ADMIN';

export type RequestType = 'ASSET_REQUEST' | 'ASSET_RETURN' | 'ASSET_TRANSFER' | 'MAINTENANCE_REQUEST' | 'OTHER';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED' | 'LOST';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

// Helper function to check if user has required role
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    'USER': 1,
    'MANAGER': 2,
    'SUPER_ADMIN': 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}