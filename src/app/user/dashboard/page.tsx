'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/client-auth';
import { AuthUser, UserRole, RequestType, RequestStatus } from '@/lib/types';
import { getRoleDisplayName } from '@/lib/rbac';

interface Request {
  id: string;
  type: RequestType;
  description: string;
  status: RequestStatus;
  createdAt: string;
  deviceType?: string;
  preferences?: string;
  asset?: {
    id: string;
    name: string;
    serialNumber: string;
  };
}

interface AssetAssignment {
  id: string;
  assignedAt: string;
  notes?: string;
  asset: {
    id: string;
    name: string;
    serialNumber: string;
    model?: string;
    brand?: string;
    category: string;
  };
}

interface AssetType {
  id: string;
  name: string;
  description?: string;
  category: string;
  configurations?: AssetConfiguration[];
}

interface AssetConfiguration {
  id: string;
  name: string;
  description?: string;
  dataType: string;
  options?: string;
  isRequired: boolean;
  defaultValue?: string;
  displayOrder: number;
}

export default function UserDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [currentAssets, setCurrentAssets] = useState<AssetAssignment[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  // Update the newRequest state
  type RequestFormData = {
    type: RequestType;
    description: string;
    justification: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    deviceType: string;
    preferences: string;
    assetId?: string;
  };
  const [newRequest, setNewRequest] = useState<RequestFormData>({
    type: RequestType.NEW_ASSET,
    description: '',
    justification: '',
    urgency: 'MEDIUM',
    deviceType: '',
    preferences: ''
  });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      console.log('Dashboard: Starting to fetch user data...');
      try {
        const userData = await getCurrentUser();
        console.log('Dashboard: getCurrentUser result:', userData);
        if (!userData) {
          console.log('Dashboard: No user found, redirecting to login');
          router.push('/login');
          return;
        }
        
        if (userData.role !== UserRole.USER) {
          router.push(`/${userData.role.toLowerCase().replace('_', '-')}/dashboard`);
          return;
        }
        
        console.log('Dashboard: User found, setting user state');
        setUser(userData);
        
        // Fetch user's requests
        const requestsRes = await fetch('/api/requests', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setRequests(requestsData.requests);
        }
        
        // Fetch user's current assets
        const assetsRes = await fetch(`/api/users/${userData.id}/assets`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          if (assetsData.success && assetsData.data) {
            setCurrentAssets(assetsData.data.currentAssignments || []);
          }
        }
        
        // Fetch asset types for the dropdown
        const assetTypesRes = await fetch('/api/asset-types', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (assetTypesRes.ok) {
          const assetTypesData = await assetTypesRes.json();
          setAssetTypes(assetTypesData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRequest),
      });
  
      if (response.ok) {
        const data = await response.json();
        setRequests([data.request, ...requests]);
        setNewRequest({
          type: RequestType.NEW_ASSET,
          description: '',
          justification: '',
          urgency: 'MEDIUM',
          deviceType: '',
          preferences: ''
        });
        setShowNewRequestForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case RequestStatus.APPROVED:
        return 'text-green-600 bg-green-100';
      case RequestStatus.REJECTED:
        return 'text-red-600 bg-red-100';
      case RequestStatus.IN_PROGRESS:
        return 'text-blue-600 bg-blue-100';
      case RequestStatus.COMPLETED:
        return 'text-green-700 bg-green-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user.name || user.email} ({getRoleDisplayName(user.role)})
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/user/assets')}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Assets</h3>
            <p className="text-3xl font-bold text-blue-600">{currentAssets.length}</p>
            <p className="text-sm text-gray-600">Currently assigned</p>
            <p className="text-xs text-blue-600 mt-2">Click to view details →</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Requests</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {requests.filter(r => r.status === RequestStatus.PENDING || r.status === RequestStatus.IN_PROGRESS).length}
            </p>
            <p className="text-sm text-gray-600">Pending/In Progress</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Requests</h3>
            <p className="text-3xl font-bold text-gray-600">{requests.length}</p>
            <p className="text-sm text-gray-600">All time</p>
          </div>
        </div>

        {/* Current Assets */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">My Current Assets</h2>
            <button
              onClick={() => router.push('/user/assets')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              View All Assets
            </button>
          </div>
          <div className="p-6">
            {currentAssets.length === 0 ? (
              <p className="text-gray-600">No assets currently assigned to you.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentAssets.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.asset.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assignment.asset.brand} {assignment.asset.model}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assignment.asset.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assignment.asset.serialNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Requests Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">My Requests</h2>
            <button
              onClick={() => setShowNewRequestForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              New Request
            </button>
          </div>
          
          {/* New Request Form */}
          {showNewRequestForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request Type
                  </label>
                  <select
                    value={newRequest.type}
                    onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value as RequestType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={RequestType.NEW_ASSET}>New Asset</option>
                    <option value={RequestType.REPLACEMENT}>Replacement</option>
                    <option value={RequestType.COMPLAINT}>Complaint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Justification
                  </label>
                  <textarea
                    value={newRequest.justification}
                    onChange={(e) => setNewRequest({ ...newRequest, justification: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urgency
                  </label>
                  <select
                    value={newRequest.urgency}
                    onChange={(e) => setNewRequest({ ...newRequest, urgency: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Type
                  </label>
                  <select
                    value={newRequest.deviceType}
                    onChange={(e) => setNewRequest({ ...newRequest, deviceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select asset type</option>
                    {assetTypes.map((assetType) => (
                      <option key={assetType.id} value={assetType.name.toLowerCase()}>
                        {assetType.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferences
                  </label>
                  <textarea
                    value={newRequest.preferences}
                    onChange={(e) => setNewRequest({ ...newRequest, preferences: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Specify your preferences (e.g., screen size, RAM, storage, brand preferences, etc.)"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewRequestForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="p-6">
            {requests.length === 0 ? (
              <p className="text-gray-600">No requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preferences
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.type.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate">{request.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.deviceType || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={request.preferences}>
                            {request.preferences || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}