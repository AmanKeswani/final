'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/client-auth';
import { AuthUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Laptop, Smartphone, Monitor, Package, Clock, User, FileText, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';



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
      return 'bg-green-100 text-green-800 border-green-200';
    case 'available':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'retired':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'assigned':
      return 'bg-green-50 text-green-700';
    case 'returned':
      return 'bg-blue-50 text-blue-700';
    case 'maintenance':
      return 'bg-yellow-50 text-yellow-700';
    default:
      return 'bg-gray-50 text-gray-700';
  }
};

export default function UserAssetsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [assetsData, setAssetsData] = useState<UserAssetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializePage = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        // Fetch user assets data
        const response = await fetch(`/api/users/${currentUser.id}/assets`, {
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
            throw new Error(data.error || 'Failed to load assets');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load assets');
        }
      } catch (err: any) {
        console.error('Error loading assets:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600">Loading your assets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assetsData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/user/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Assets</h1>
                <p className="text-sm text-slate-600">View and manage your assigned assets</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>
                  <AvatarInitials name={assetsData.user.name} />
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{assetsData.user.name}</p>
                <p className="text-xs text-slate-500">{assetsData.user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Current Assets</p>
                  <p className="text-3xl font-bold">{assetsData.currentAssignments.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Assignments</p>
                  <p className="text-3xl font-bold">
                    {(() => {
                      const uniqueAssetIds = new Set([
                        ...assetsData.currentAssignments.map(a => a.asset.id),
                        ...assetsData.assignmentHistory.map(a => a.asset.id)
                      ]);
                      return uniqueAssetIds.size;
                    })()}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Activity Records</p>
                  <p className="text-3xl font-bold">{assetsData.assetHistory.length}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="current">Current Assets</TabsTrigger>
            <TabsTrigger value="history">Assignment History</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          {/* Current Assets */}
          <TabsContent value="current" className="space-y-6">
            {assetsData.currentAssignments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Current Assets</h3>
                  <p className="text-slate-600">You don't have any assets assigned to you at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {assetsData.currentAssignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            {getAssetIcon(assignment.asset.category)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{assignment.asset.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {assignment.asset.brand} {assignment.asset.model}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={getStatusColor(assignment.asset.status)}>
                          {assignment.asset.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 font-medium">Serial Number</p>
                          <p className="text-slate-900 font-mono">{assignment.asset.serialNumber}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Category</p>
                          <p className="text-slate-900 capitalize">{assignment.asset.category}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-slate-600">
                          <CalendarDays className="h-4 w-4" />
                          <span>Assigned {format(new Date(assignment.assignedAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      {assignment.notes && (
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Notes:</span> {assignment.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Assignment History */}
          <TabsContent value="history" className="space-y-6">
            {assetsData.assignmentHistory.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Assignment History</h3>
                  <p className="text-slate-600">You haven't returned any assets yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {assetsData.assignmentHistory.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            {getAssetIcon(assignment.asset.category)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{assignment.asset.name}</h3>
                            <p className="text-sm text-slate-600">
                              {assignment.asset.brand} {assignment.asset.model} • {assignment.asset.serialNumber}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                              <span>Assigned: {format(new Date(assignment.assignedAt), 'MMM dd, yyyy')}</span>
                              {assignment.returnedAt && (
                                <span>Returned: {format(new Date(assignment.returnedAt), 'MMM dd, yyyy')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-slate-50">
                          Returned
                        </Badge>
                      </div>
                      {assignment.notes && (
                        <div className="mt-4 bg-slate-50 p-3 rounded-lg">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Notes:</span> {assignment.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Log */}
          <TabsContent value="activity" className="space-y-6">
            {assetsData.assetHistory.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Activity Records</h3>
                  <p className="text-slate-600">No asset activity has been recorded yet.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your asset-related activities and changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assetsData.assetHistory.map((activity, index) => (
                      <div key={activity.id} className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                          {getAssetIcon('default')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900">
                              {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} - {activity.asset.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600">
                            Serial: {activity.asset.serialNumber}
                          </p>
                          {activity.details && (
                            <p className="text-sm text-slate-500 mt-1">{activity.details}</p>
                          )}
                          {activity.user && (
                            <div className="flex items-center space-x-2 mt-2">
                              <User className="h-3 w-3 text-slate-400" />
                              <p className="text-xs text-slate-500">
                                by {activity.user.name}
                              </p>
                            </div>
                          )}
                        </div>
                        {index < assetsData.assetHistory.length - 1 && (
                          <div className="absolute left-6 mt-8 w-px h-6 bg-slate-200"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}