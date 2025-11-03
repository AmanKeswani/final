'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/client-auth';
import { AuthUser } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Laptop,
  Smartphone,
  Monitor,
  Package,
  Calendar,
  User,
  Mail,
  Shield,
  Clock,
  Activity
} from 'lucide-react';


interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  model?: string;
  brand?: string;
  category: string;
  status: string;
}

interface AssetAssignment {
  id: string;
  assignedAt: string;
  returnedAt?: string;
  condition?: string;
  notes?: string;
  asset: Asset;
}

interface AssetHistory {
  id: string;
  action: string;
  details?: string;
  timestamp: string;
  asset: {
    id: string;
    name: string;
    serialNumber: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface UserAssetsData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  currentAssignments: AssetAssignment[];
  assignmentHistory: AssetAssignment[];
  assetHistory: AssetHistory[];
}

const getAssetIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'laptop':
    case 'computer':
      return <Laptop className="h-5 w-5" />;
    case 'mobile':
    case 'phone':
      return <Smartphone className="h-5 w-5" />;
    case 'monitor':
    case 'display':
      return <Monitor className="h-5 w-5" />;
    default:
      return <Package className="h-5 w-5" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'assigned':
      return 'bg-green-100 text-green-800';
    case 'available':
      return 'bg-blue-100 text-blue-800';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800';
    case 'retired':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    case 'user':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatRoleName = (role: string) => {
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function UserAssetsDetailPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [assetsData, setAssetsData] = useState<UserAssetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingAssetId, setRevokingAssetId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [updatingRole, setUpdatingRole] = useState<boolean>(false);
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    if (assetsData?.user?.role) {
      setSelectedRole(assetsData.user.role);
    }
  }, [assetsData]);

  async function refreshAssetsData() {
    try {
      const response = await fetch(`/api/users/${userId}/assets`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAssetsData(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to refresh assets data', err);
    }
  }

  async function handleRevoke(assetId: string) {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      setError('You do not have permission to revoke assets');
      return;
    }
    setRevokingAssetId(assetId);
    setActionMessage(null);
    try {
      const reason = (typeof window !== 'undefined') ? window.prompt('Optional: reason for revocation') || undefined : undefined;
      const response = await fetch(`/api/assets/${assetId}/revoke`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        setActionMessage('Asset revoked successfully');
        await refreshAssetsData();
      } else {
        const e = await response.json();
        setError(e.error || 'Failed to revoke asset');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to revoke asset');
    } finally {
      setRevokingAssetId(null);
    }
  }

  async function handleRoleUpdate() {
    if (!assetsData) return;
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      setError('You do not have permission to change roles');
      return;
    }
    if (selectedRole === assetsData.user.role) {
      setActionMessage('No changes to save');
      return;
    }
    setUpdatingRole(true);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/users/${assetsData.user.id}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });
      if (response.ok) {
        const res = await response.json();
        setAssetsData(prev => prev ? { ...prev, user: { ...prev.user, role: res.user.role } } : prev);
        setActionMessage('Role updated successfully');
      } else {
        const e = await response.json();
        setError(e.error || 'Failed to update role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  }

  useEffect(() => {
    const initializePage = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setCurrentUser(user);

        // Fetch user assets data
        const response = await fetch(`/api/users/${userId}/assets`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAssetsData(data.data);
          } else {
            setError('Failed to load user assets data');
          }
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load user assets data');
        }
      } catch (err: any) {
        console.error('Error loading user assets:', err);
        setError(err.message || 'Failed to load user assets');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user assets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Assets</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!assetsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  const { user: targetUser, currentAssignments, assignmentHistory, assetHistory } = assetsData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold text-gray-900">
                User Assets - {targetUser.name}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                  {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700">{currentUser?.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold">
                {targetUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{targetUser.name}</h2>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {targetUser.email}
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-gray-600" />
                  <Badge className={getRoleColor(targetUser.role)}>
                    {formatRoleName(targetUser.role)}
                  </Badge>
                </div>
                {currentUser?.role === 'SUPER_ADMIN' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="USER">User</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                    <button
                      onClick={handleRoleUpdate}
                      disabled={updatingRole || selectedRole === targetUser.role}
                      className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {updatingRole ? 'Saving...' : 'Save Role'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Current Assets</p>
                <p className="text-3xl font-bold">{currentAssignments.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Assignments</p>
                <p className="text-3xl font-bold">{(() => {
                  const uniqueAssetIds = new Set([
                    ...currentAssignments.map(a => a.asset.id),
                    ...assignmentHistory.map(a => a.asset.id)
                  ]);
                  return uniqueAssetIds.size;
                })()}</p>
              </div>
              <Activity className="h-8 w-8 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Activity Records</p>
                <p className="text-3xl font-bold">{assetHistory.length}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Current Assets ({currentAssignments.length})</TabsTrigger>
            <TabsTrigger value="history">Assignment History ({assignmentHistory.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity Log ({assetHistory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentAssignments.length === 0 ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Current Assets</h3>
                <p className="text-gray-500">This user has no assets currently assigned.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentAssignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            {getAssetIcon(assignment.asset.category)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{assignment.asset.name}</h3>
                            <p className="text-sm text-gray-500">{assignment.asset.serialNumber}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(assignment.asset.status)}>
                          {assignment.asset.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {assignment.asset.brand && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Brand:</span>
                            <span className="font-medium">{assignment.asset.brand}</span>
                          </div>
                        )}
                        {assignment.asset.model && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Model:</span>
                            <span className="font-medium">{assignment.asset.model}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Category:</span>
                          <span className="font-medium">{assignment.asset.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Assigned:</span>
                          <span className="font-medium">{format(new Date(assignment.assignedAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <div className="px-6 pb-6 pt-0">
                        <button
                          onClick={() => handleRevoke(assignment.asset.id)}
                          disabled={revokingAssetId === assignment.asset.id}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed w-full text-sm"
                        >
                          {revokingAssetId === assignment.asset.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {assignmentHistory.length === 0 ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignment History</h3>
                <p className="text-gray-500">This user has no previous asset assignments.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Asset
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Returned
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Condition
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignmentHistory.map((assignment) => {
                        const assignedDate = new Date(assignment.assignedAt);
                        const returnedDate = assignment.returnedAt ? new Date(assignment.returnedAt) : null;
                        const duration = returnedDate 
                          ? Math.ceil((returnedDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24))
                          : null;

                        return (
                          <tr key={assignment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="p-2 bg-gray-50 rounded-lg mr-3">
                                  {getAssetIcon(assignment.asset.category)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{assignment.asset.name}</div>
                                  <div className="text-sm text-gray-500">{assignment.asset.serialNumber}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(assignedDate, 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {returnedDate ? format(returnedDate, 'MMM dd, yyyy') : 'Not returned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {duration ? `${duration} days` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {assignment.condition ? (
                                <Badge className="bg-gray-100 text-gray-800">
                                  {assignment.condition}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {assetHistory.length === 0 ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Records</h3>
                <p className="text-gray-500">No asset-related activities found for this user.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Asset
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assetHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className="bg-blue-100 text-blue-800">
                              {record.action}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{record.asset.name}</div>
                            <div className="text-sm text-gray-500">{record.asset.serialNumber}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {record.details || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}