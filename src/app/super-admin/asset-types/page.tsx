'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/client-auth';
import { AuthUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface AssetType {
  id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: string;
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
  isActive: boolean;
}

export default function AssetTypesManagement() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssetType, setEditingAssetType] = useState<AssetType | null>(null);
  const [newAssetType, setNewAssetType] = useState({
    name: '',
    description: '',
    category: '',
  });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) {
          router.push('/login');
          return;
        }
        
        if (userData.role !== UserRole.SUPER_ADMIN) {
          router.push('/dashboard');
          return;
        }
        
        setUser(userData);
        
        // Fetch asset types with configurations
        const response = await fetch('/api/asset-types?includeConfigs=true', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAssetTypes(data.data);
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

  const handleCreateAssetType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/asset-types', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssetType),
      });

      if (response.ok) {
        const data = await response.json();
        setAssetTypes([...assetTypes, data.data]);
        setNewAssetType({ name: '', description: '', category: '' });
        setShowCreateForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create asset type');
      }
    } catch (error) {
      console.error('Error creating asset type:', error);
      alert('Failed to create asset type');
    }
  };

  const toggleAssetTypeStatus = async (assetType: AssetType) => {
    try {
      const response = await fetch(`/api/asset-types/${assetType.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !assetType.isActive
        }),
      });

      if (response.ok) {
        setAssetTypes(assetTypes.map(at => 
          at.id === assetType.id ? { ...at, isActive: !at.isActive } : at
        ));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update asset type');
      }
    } catch (error) {
      console.error('Error updating asset type:', error);
      alert('Failed to update asset type');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Asset Types Management</h1>
              <p className="mt-1 text-sm text-gray-500">Manage asset types and their configurations</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Asset Type
              </button>
              <button
                onClick={() => router.push('/super-admin/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Asset Type Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Asset Type</h2>
            <form onSubmit={handleCreateAssetType} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newAssetType.name}
                    onChange={(e) => setNewAssetType({ ...newAssetType, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newAssetType.category}
                    onChange={(e) => setNewAssetType({ ...newAssetType, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Computing">Computing</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Peripherals">Peripherals</option>
                    <option value="Networking">Networking</option>
                    <option value="Audio/Video">Audio/Video</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newAssetType.description}
                    onChange={(e) => setNewAssetType({ ...newAssetType, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Asset Type
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Asset Types List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Asset Types ({assetTypes.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Configurations
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
                {assetTypes.map((assetType) => (
                  <tr key={assetType.id} className={!assetType.isActive ? 'opacity-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{assetType.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {assetType.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{assetType.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {assetType.configurations?.length || 0} configurations
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        assetType.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {assetType.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => router.push(`/super-admin/asset-types/${assetType.id}/configurations`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Manage Configs
                      </button>
                      <button
                        onClick={() => toggleAssetTypeStatus(assetType)}
                        className={`${assetType.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {assetType.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}