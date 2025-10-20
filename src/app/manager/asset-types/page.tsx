'use client'

import { useState, useEffect, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface AssetConfiguration {
  id: string
  name: string
  dataType: string
  options?: string[]
  isRequired: boolean
  isActive: boolean
}

interface AssetType {
  id: string
  name: string
  description?: string
  category: string
  isActive: boolean
  configurations: AssetConfiguration[]
  createdAt: string
  updatedAt: string
}

interface NewAssetType {
  name: string
  description: string
  category: string
}

interface NewConfiguration {
  name: string
  dataType: string
  options: string
  isRequired: boolean
}

export default function ManagerAssetTypesPage() {
  const router = useRouter()
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null)
  const [newAssetType, setNewAssetType] = useState<NewAssetType>({
    name: '',
    description: '',
    category: '',
  })
  const [newConfiguration, setNewConfiguration] = useState<NewConfiguration>({
    name: '',
    dataType: 'text',
    options: '',
    isRequired: false,
  })

  useEffect(() => {
    fetchAssetTypes()
  }, [])

  const fetchAssetTypes = async () => {
    try {
      const response = await fetch('/api/asset-types', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAssetTypes(data.data)
        }
      } else {
        throw new Error('Failed to fetch asset types')
      }
    } catch (error) {
      console.error('Error fetching asset types:', error)
      toast.error('Failed to fetch asset types')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssetType = async () => {
    try {
      const response = await fetch('/api/asset-types', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssetType),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Asset type created successfully')
          setIsCreateDialogOpen(false)
          setNewAssetType({ name: '', description: '', category: '' })
          fetchAssetTypes()
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create asset type')
      }
    } catch (error: any) {
      console.error('Error creating asset type:', error)
      toast.error(error.message || 'Failed to create asset type')
    }
  }

  const handleToggleAssetType = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/asset-types/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success(`Asset type ${isActive ? 'activated' : 'deactivated'} successfully`)
          fetchAssetTypes()
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update asset type')
      }
    } catch (error: any) {
      console.error('Error updating asset type:', error)
      toast.error(error.message || 'Failed to update asset type')
    }
  }

  const handleCreateConfiguration = async () => {
    if (!selectedAssetType) return

    try {
      const configData = {
        ...newConfiguration,
        options: newConfiguration.options
          ? newConfiguration.options.split(',').map(opt => opt.trim()).filter(opt => opt)
          : undefined,
      }

      const response = await fetch(
        `/api/asset-types/${selectedAssetType.id}/configurations`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(configData),
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Configuration created successfully')
          setIsConfigDialogOpen(false)
          setNewConfiguration({
            name: '',
            dataType: 'text',
            options: '',
            isRequired: false,
          })
          fetchAssetTypes()
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create configuration')
      }
    } catch (error: any) {
      console.error('Error creating configuration:', error)
      toast.error(error.message || 'Failed to create configuration')
    }
  }

  const openConfigDialog = (assetType: AssetType) => {
    setSelectedAssetType(assetType)
    setIsConfigDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading asset types...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Asset Type Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage asset types and their configurations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Asset Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Asset Type</DialogTitle>
              <DialogDescription>
                Add a new asset type to the system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newAssetType.name}
                  onChange={(e) =>
                    setNewAssetType({ ...newAssetType, name: e.target.value })
                  }
                  placeholder="e.g., Laptop"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAssetType.description}
                  onChange={(e) =>
                    setNewAssetType({ ...newAssetType, description: e.target.value })
                  }
                  placeholder="Brief description of the asset type"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={newAssetType.category}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setNewAssetType({ ...newAssetType, category: e.target.value })
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="" disabled>Select category</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Peripheral">Peripheral</option>
                  <option value="Accessory">Accessory</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAssetType}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {assetTypes.map((assetType) => (
          <Card key={assetType.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {assetType.name}
                    <Badge variant={assetType.isActive ? 'default' : 'secondary'}>
                      {assetType.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{assetType.description}</CardDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline">{assetType.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {assetType.configurations.length} configuration(s)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openConfigDialog(assetType)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Add Config
                  </Button>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`toggle-${assetType.id}`} className="text-sm">
                      Active
                    </Label>
                    <input
                      type="checkbox"
                      id={`toggle-${assetType.id}`}
                      checked={assetType.isActive}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleToggleAssetType(assetType.id, e.target.checked)
                      }
                      className="h-5 w-9 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            {assetType.configurations.length > 0 && (
              <CardContent>
                <h4 className="font-semibold mb-3">Configurations:</h4>
                <div className="grid gap-2">
                  {assetType.configurations.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{config.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Type: {config.dataType}
                          {config.isRequired && ' • Required'}
                          {config.options && ` • Options: ${config.options.join(', ')}`}
                        </div>
                      </div>
                      <Badge variant={config.isActive ? 'default' : 'secondary'}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Configuration</DialogTitle>
            <DialogDescription>
              Add a new configuration for {selectedAssetType?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="config-name">Name</Label>
              <Input
                id="config-name"
                value={newConfiguration.name}
                onChange={(e) =>
                  setNewConfiguration({ ...newConfiguration, name: e.target.value })
                }
                placeholder="e.g., RAM Size"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config-dataType">Data Type</Label>
              <select
                id="config-dataType"
                value={newConfiguration.dataType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setNewConfiguration({ ...newConfiguration, dataType: e.target.value })
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
                <option value="date">Date</option>
              </select>
            </div>
            {newConfiguration.dataType === 'select' && (
              <div className="grid gap-2">
                <Label htmlFor="config-options">Options</Label>
                <Input
                  id="config-options"
                  value={newConfiguration.options}
                  onChange={(e) =>
                    setNewConfiguration({ ...newConfiguration, options: e.target.value })
                  }
                  placeholder="Option 1, Option 2, Option 3"
                />
                <p className="text-sm text-muted-foreground">
                  Separate options with commas
                </p>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="config-required"
                checked={newConfiguration.isRequired}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewConfiguration({ ...newConfiguration, isRequired: e.target.checked })
                }
                className="h-5 w-5 cursor-pointer"
              />
              <Label htmlFor="config-required">Required field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfigDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateConfiguration}>Add Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}