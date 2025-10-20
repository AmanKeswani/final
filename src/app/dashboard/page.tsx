'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/client-auth';
import type { AuthUser } from '@/lib/auth';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await getCurrentUser();
      setLoading(false);
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Redirect to role-specific dashboard
      switch (currentUser.role) {
        case 'USER':
          router.push('/user/dashboard');
          break;
        case 'MANAGER':
          router.push('/manager/dashboard');
          break;
        case 'SUPER_ADMIN':
          router.push('/super-admin/dashboard');
          break;
        default:
          router.push('/user/dashboard');
      }
    };

    getUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to your dashboard...</div>
      </div>
    );
  }

  // This should not be reached as the component redirects in useEffect
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Redirecting...</div>
    </div>
  );
}