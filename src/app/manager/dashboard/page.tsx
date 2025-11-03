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
  justification?: string;
  urgency: string;
  status: RequestStatus;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  asset?: {
    id: string;
    name: string;
    serialNumber: string;
  };
}

interface Asset {
  id: string;
  name: string;
  serialNumber?: string;
  model?: string;
  brand?: string;
  category: string;
  status: string;
  assignments: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function ManagerDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [actionComments, setActionComments] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'assets'>('requests');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) {
          router.push('/login');
          return;
        }
        
        if (userData.role !== UserRole.MANAGER) {
          router.push(`/${userData.role.toLowerCase().replace('_', '-')}/dashboard`);
          return;
        }
        
        setUser(userData);
        
        // Fetch all requests
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
        } else {
          throw new Error('Failed to fetch requests');
        }
        
        // Fetch all assets
        const assetsRes = await fetch('/api/assets', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          setAssets(assetsData.assets);
        } else {
          throw new Error('Failed to fetch assets');
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

  const handleRequestAction = async (requestId: string, status: RequestStatus) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          comments: actionComments,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        setRequests(requests.map(req => 
          req.id === requestId ? responseData.request : req
        ));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update request');
      }
      setSelectedRequest(null);
      setActionComments('');
    } catch (error: any) {
      console.error('Error updating request:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update request';
      alert(errorMessage);
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return 'text-red-600 bg-red-100';
      case 'HIGH':
        return 'text-orange-600 bg-orange-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const pendingRequests = requests.filter(r => r.status === RequestStatus.PENDING);
  const approvedRequests = requests.filter(r => r.status === RequestStatus.APPROVED);
  const assignedAssets = assets.filter(a => a.assignments.length > 0);

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
              <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Requests</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
            <p className="text-sm text-gray-600">Awaiting approval</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Approved Requests</h3>
            <p className="text-3xl font-bold text-green-600">{approvedRequests.length}</p>
            <p className="text-sm text-gray-600">Ready for processing</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Assets</h3>
            <p className="text-3xl font-bold text-blue-600">{assets.length}</p>
            <p className="text-sm text-gray-600">In inventory</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Assigned Assets</h3>
            <p className="text-3xl font-bold text-purple-600">{assignedAssets.length}</p>
            <p className="text-sm text-gray-600">Currently in use</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Requests Management
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'assets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Assets Overview
              </button>
            </nav>
          </div>

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="p-6">
              {requests.length === 0 ? (
                <p className="text-gray-600">No requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Urgency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.user.name || request.user.email}
                              </div>
                              <div className="text-sm text-gray-500">{request.user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.type.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-xs truncate">{request.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {request.status === RequestStatus.PENDING && (
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Review
                              </button>
                            )}
                            <button
                              onClick={() => {
                                alert(`Request Details:\n\nType: ${request.type}\nDescription: ${request.description}\nJustification: ${request.justification || 'N/A'}\nUrgency: ${request.urgency}\nCreated: ${new Date(request.createdAt).toLocaleString()}`);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="p-6">
              {assets.length === 0 ? (
                <p className="text-gray-600">No assets found.</p>
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
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned To
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assets.map((asset) => (
                        <tr key={asset.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                              <div className="text-sm text-gray-500">
                                {asset.brand} {asset.model}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asset.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asset.serialNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              asset.status === 'AVAILABLE' ? 'text-green-600 bg-green-100' :
                              asset.status === 'ASSIGNED' ? 'text-blue-600 bg-blue-100' :
                              asset.status === 'MAINTENANCE' ? 'text-yellow-600 bg-yellow-100' :
                              'text-gray-600 bg-gray-100'
                            }`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asset.assignments.length > 0 ? (
                              <div>
                                <div className="font-medium">
                                  {asset.assignments[0].user.name || asset.assignments[0].user.email}
                                </div>
                                <div className="text-gray-500">{asset.assignments[0].user.email}</div>
                              </div>
                            ) : (
                              'Unassigned'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Request Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Request</h3>
              <div className="space-y-3 mb-4">
                <div>
                  <span className="font-medium">User:</span> {selectedRequest.user.name || selectedRequest.user.email}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedRequest.type.replace('_', ' ')}
                </div>
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedRequest.description}</p>
                </div>
                {selectedRequest.justification && (
                  <div>
                    <span className="font-medium">Justification:</span>
                    <p className="text-sm text-gray-600 mt-1">{selectedRequest.justification}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Urgency:</span> {selectedRequest.urgency}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add comments about your decision..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleRequestAction(selectedRequest.id, RequestStatus.APPROVED)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRequestAction(selectedRequest.id, RequestStatus.REJECTED)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setActionComments('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}