"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "@/lib/client-auth";
import { AuthUser } from "@/lib/auth";
import {
    UserRole,
    RequestType,
    RequestStatus,
    AssetStatus,
} from "@prisma/client";
import { getRoleDisplayName } from "@/lib/rbac";

interface Request {
    id: string;
    type: RequestType;
    description: string;
    justification?: string;
    urgency: string;
    status: RequestStatus;
    stage?: string;
    comments?: string;
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
    approver?: {
        id: string;
        name: string;
        email: string;
    };
}

interface Asset {
    id: string;
    name: string;
    description?: string;
    serialNumber?: string;
    model?: string;
    brand?: string;
    category: string;
    status: AssetStatus;
    location?: string;
    value?: number;
    assignments: Array<{
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export default function SuperAdminDashboard() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [requests, setRequests] = useState<Request[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"requests" | "assets" | "users">(
        "requests"
    );
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(
        null
    );
    const [showNewAssetForm, setShowNewAssetForm] = useState(false);
    const [showAssignAssetModal, setShowAssignAssetModal] =
        useState<Asset | null>(null);
    const [newAsset, setNewAsset] = useState({
        name: "",
        description: "",
        serialNumber: "",
        model: "",
        brand: "",
        category: "",
        location: "",
        value: "",
    });
    const [assignmentData, setAssignmentData] = useState({
        userId: "",
        notes: "",
    });
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = await getCurrentUser();
                console.log("User data after login:", userData);
                console.log("User role:", userData?.role);
                console.log(
                    "Attempting redirect to:",
                    "/super-admin/dashboard"
                );
                if (!userData) {
                    router.push("/login");
                    return;
                }

                if (userData.role !== UserRole.SUPER_ADMIN) {
                    router.push(
                        `/${userData.role
                            .toLowerCase()
                            .replace("_", "-")}/dashboard`
                    );
                    return;
                }

                setUser(userData);

                // Fetch all requests
                const requestsRes = await fetch("/api/requests", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (requestsRes.ok) {
                    const requestsData = await requestsRes.json();
                    setRequests(requestsData.requests);
                }

                // Fetch all assets
                const assetsRes = await fetch("/api/assets", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (assetsRes.ok) {
                    const assetsData = await assetsRes.json();
                    setAssets(assetsData.assets);
                }

                // Fetch all users (for assignment purposes)
                const usersRes = await fetch("/api/users", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setUsers(usersData.users || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleSignOut = async () => {
        await logout();
        router.push("/login");
    };

    const handleRequestStatusUpdate = async (
        requestId: string,
        status: RequestStatus,
        stage?: string
    ) => {
        try {
            const response = await fetch(`/api/requests/${requestId}`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status,
                    stage,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setRequests(
                    requests.map((req) =>
                        req.id === requestId ? data.request : req
                    )
                );
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Failed to update request");
            }
        } catch (error: any) {
            console.error("Error updating request:", error);
            alert("Failed to update request");
        }
    };

    const handleCreateAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/assets", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...newAsset,
                    value: newAsset.value ? parseFloat(newAsset.value) : null,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setAssets([data.asset, ...assets]);
                setNewAsset({
                    name: "",
                    description: "",
                    serialNumber: "",
                    model: "",
                    brand: "",
                    category: "",
                    location: "",
                    value: "",
                });
                setShowNewAssetForm(false);
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Failed to create asset");
            }
        } catch (error) {
            console.error("Error creating asset:", error);
            alert("Failed to create asset");
        }
    };

    const handleAssignAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showAssignAssetModal) return;

        try {
            const response = await fetch(
                `/api/assets/${showAssignAssetModal.id}/assign`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        assignToUserId: assignmentData.userId,
                        notes: assignmentData.notes,
                    }),
                }
            );

            if (response.ok) {
                // Refresh assets data
                const assetsRes = await fetch("/api/assets", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (assetsRes.ok) {
                    const assetsData = await assetsRes.json();
                    setAssets(assetsData.assets);
                }
                setShowAssignAssetModal(null);
                setAssignmentData({ userId: "", notes: "" });
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Failed to assign asset");
            }
        } catch (error) {
            console.error("Error assigning asset:", error);
            alert("Failed to assign asset");
        }
    };

    const getStatusColor = (status: RequestStatus) => {
        switch (status) {
            case RequestStatus.PENDING:
                return "text-yellow-600 bg-yellow-100";
            case RequestStatus.APPROVED:
                return "text-green-600 bg-green-100";
            case RequestStatus.REJECTED:
                return "text-red-600 bg-red-100";
            case RequestStatus.IN_PROGRESS:
                return "text-blue-600 bg-blue-100";
            case RequestStatus.COMPLETED:
                return "text-green-700 bg-green-200";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    const approvedRequests = requests.filter(
        (r) => r.status === RequestStatus.APPROVED
    );
    const inProgressRequests = requests.filter(
        (r) => r.status === RequestStatus.IN_PROGRESS
    );
    const completedRequests = requests.filter(
        (r) => r.status === RequestStatus.COMPLETED
    );
    const availableAssets = assets.filter(
        (a) => a.status === AssetStatus.AVAILABLE
    );

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
                            <h1 className="text-2xl font-bold text-gray-900">
                                Super Admin Dashboard
                            </h1>
                            <p className="text-sm text-gray-600">
                                Welcome, {user.name || user.email} (
                                {getRoleDisplayName(user.role)})
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Approved Requests
                        </h3>
                        <p className="text-3xl font-bold text-green-600">
                            {approvedRequests.length}
                        </p>
                        <p className="text-sm text-gray-600">
                            Ready to process
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            In Progress
                        </h3>
                        <p className="text-3xl font-bold text-blue-600">
                            {inProgressRequests.length}
                        </p>
                        <p className="text-sm text-gray-600">Being processed</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Completed
                        </h3>
                        <p className="text-3xl font-bold text-green-700">
                            {completedRequests.length}
                        </p>
                        <p className="text-sm text-gray-600">Finished tasks</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Total Assets
                        </h3>
                        <p className="text-3xl font-bold text-purple-600">
                            {assets.length}
                        </p>
                        <p className="text-sm text-gray-600">In inventory</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Available Assets
                        </h3>
                        <p className="text-3xl font-bold text-indigo-600">
                            {availableAssets.length}
                        </p>
                        <p className="text-sm text-gray-600">Ready to assign</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab("requests")}
                                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                                    activeTab === "requests"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                Request Management
                            </button>
                            <button
                                onClick={() => setActiveTab("assets")}
                                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                                    activeTab === "assets"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                Asset Management
                            </button>
                            <button
                                onClick={() => setActiveTab("users")}
                                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                                    activeTab === "users"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                User Management
                            </button>
                        </nav>
                    </div>

                    {/* Requests Tab */}
                    {activeTab === "requests" && (
                        <div className="p-6">
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
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stage
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
                                                            {request.user
                                                                .name ||
                                                                request.user
                                                                    .email}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {request.user.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {request.type.replace(
                                                        "_",
                                                        " "
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="max-w-xs truncate">
                                                        {request.description}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                            request.status
                                                        )}`}
                                                    >
                                                        {request.status.replace(
                                                            "_",
                                                            " "
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {request.stage || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {(request.status ===
                                                        RequestStatus.APPROVED ||
                                                        request.status ===
                                                            RequestStatus.IN_PROGRESS) && (
                                                        <button
                                                            onClick={() =>
                                                                setSelectedRequest(
                                                                    request
                                                                )
                                                            }
                                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                                        >
                                                            Update
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            alert(
                                                                `Request Details:\n\nType: ${
                                                                    request.type
                                                                }\nDescription: ${
                                                                    request.description
                                                                }\nJustification: ${
                                                                    request.justification ||
                                                                    "N/A"
                                                                }\nUrgency: ${
                                                                    request.urgency
                                                                }\nStatus: ${
                                                                    request.status
                                                                }\nStage: ${
                                                                    request.stage ||
                                                                    "N/A"
                                                                }\nComments: ${
                                                                    request.comments ||
                                                                    "N/A"
                                                                }\nApprover: ${
                                                                    request
                                                                        .approver
                                                                        ?.name ||
                                                                    "N/A"
                                                                }\nCreated: ${new Date(
                                                                    request.createdAt
                                                                ).toLocaleString()}`
                                                            );
                                                        }}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Assets Tab */}
                    {activeTab === "assets" && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Asset Inventory
                                </h3>
                                <button
                                    onClick={() => setShowNewAssetForm(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Add New Asset
                                </button>
                            </div>

                            {/* New Asset Form */}
                            {showNewAssetForm && (
                                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <form
                                        onSubmit={handleCreateAsset}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={newAsset.name}
                                                onChange={(e) =>
                                                    setNewAsset({
                                                        ...newAsset,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Category *
                                            </label>
                                            <input
                                                type="text"
                                                value={newAsset.category}
                                                onChange={(e) =>
                                                    setNewAsset({
                                                        ...newAsset,
                                                        category:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Brand
                                            </label>
                                            <input
                                                type="text"
                                                value={newAsset.brand}
                                                onChange={(e) =>
                                                    setNewAsset({
                                                        ...newAsset,
                                                        brand: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Model
                                            </label>
                                            <input
                                                type="text"
                                                value={newAsset.model}
                                                onChange={(e) =>
                                                    setNewAsset({
                                                        ...newAsset,
                                                        model: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Serial Number
                                            </label>
                                            <input
                                                type="text"
                                                value={newAsset.serialNumber}
                                                onChange={(e) =>
                                                    setNewAsset({
                                                        ...newAsset,
                                                        serialNumber:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                value={newAsset.location}
                                                onChange={(e) =>
                                                    setNewAsset({
                                                        ...newAsset,
                                                        location:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Value ($)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={newAsset.value}
                                                onChange={(e) =>
                                                    setNewAsset({
                                                        ...newAsset,
                                                        value: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                value={newAsset.description}
                                                onChange={(e) =>
                                                    setNewAsset({
                                                        ...newAsset,
                                                        description:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows={2}
                                            />
                                        </div>
                                        <div className="col-span-2 flex space-x-3">
                                            <button
                                                type="submit"
                                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Create Asset
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowNewAssetForm(false)
                                                }
                                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

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
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Assigned To
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {assets.map((asset) => (
                                            <tr key={asset.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {asset.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {asset.brand}{" "}
                                                            {asset.model} -{" "}
                                                            {asset.serialNumber}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {asset.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            asset.status ===
                                                            AssetStatus.AVAILABLE
                                                                ? "text-green-600 bg-green-100"
                                                                : asset.status ===
                                                                  AssetStatus.ASSIGNED
                                                                ? "text-blue-600 bg-blue-100"
                                                                : asset.status ===
                                                                  AssetStatus.MAINTENANCE
                                                                ? "text-yellow-600 bg-yellow-100"
                                                                : "text-gray-600 bg-gray-100"
                                                        }`}
                                                    >
                                                        {asset.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {asset.assignments.length >
                                                    0
                                                        ? asset.assignments[0]
                                                              .user.name ||
                                                          asset.assignments[0]
                                                              .user.email
                                                        : "Unassigned"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {asset.status ===
                                                        AssetStatus.AVAILABLE && (
                                                        <button
                                                            onClick={() =>
                                                                setShowAssignAssetModal(
                                                                    asset
                                                                )
                                                            }
                                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                                        >
                                                            Assign
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            alert(
                                                                `Asset Details:\n\nName: ${
                                                                    asset.name
                                                                }\nCategory: ${
                                                                    asset.category
                                                                }\nBrand: ${
                                                                    asset.brand ||
                                                                    "N/A"
                                                                }\nModel: ${
                                                                    asset.model ||
                                                                    "N/A"
                                                                }\nSerial: ${
                                                                    asset.serialNumber ||
                                                                    "N/A"
                                                                }\nLocation: ${
                                                                    asset.location ||
                                                                    "N/A"
                                                                }\nValue: $${
                                                                    asset.value ||
                                                                    "N/A"
                                                                }\nDescription: ${
                                                                    asset.description ||
                                                                    "N/A"
                                                                }`
                                                            );
                                                        }}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === "users" && (
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                User Management
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((userData) => (
                                            <tr key={userData.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {userData.name ||
                                                                userData.email}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {userData.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            userData.role ===
                                                            UserRole.SUPER_ADMIN
                                                                ? "text-purple-600 bg-purple-100"
                                                                : userData.role ===
                                                                  UserRole.MANAGER
                                                                ? "text-blue-600 bg-blue-100"
                                                                : "text-green-600 bg-green-100"
                                                        }`}
                                                    >
                                                        {getRoleDisplayName(
                                                            userData.role
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/super-admin/users/${userData.id}/assets`
                                                            )
                                                        }
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View Assets
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Request Update Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Update Request Status
                            </h3>
                            <div className="space-y-3 mb-4">
                                <div>
                                    <span className="font-medium">User:</span>{" "}
                                    {selectedRequest.user.name ||
                                        selectedRequest.user.email}
                                </div>
                                <div>
                                    <span className="font-medium">Type:</span>{" "}
                                    {selectedRequest.type.replace("_", " ")}
                                </div>
                                <div>
                                    <span className="font-medium">
                                        Current Status:
                                    </span>{" "}
                                    {selectedRequest.status}
                                </div>
                                <div>
                                    <span className="font-medium">
                                        Current Stage:
                                    </span>{" "}
                                    {selectedRequest.stage || "N/A"}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {selectedRequest.status ===
                                    RequestStatus.APPROVED && (
                                    <button
                                        onClick={() =>
                                            handleRequestStatusUpdate(
                                                selectedRequest.id,
                                                RequestStatus.IN_PROGRESS,
                                                "Processing"
                                            )
                                        }
                                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Mark as In Progress
                                    </button>
                                )}
                                {selectedRequest.status ===
                                    RequestStatus.IN_PROGRESS && (
                                    <button
                                        onClick={() =>
                                            handleRequestStatusUpdate(
                                                selectedRequest.id,
                                                RequestStatus.COMPLETED,
                                                "Completed"
                                            )
                                        }
                                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Mark as Completed
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Asset Assignment Modal */}
            {showAssignAssetModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Assign Asset
                            </h3>
                            <div className="mb-4">
                                <span className="font-medium">Asset:</span>{" "}
                                {showAssignAssetModal.name}
                            </div>

                            <form
                                onSubmit={handleAssignAsset}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Assign to User
                                    </label>
                                    <select
                                        value={assignmentData.userId}
                                        onChange={(e) =>
                                            setAssignmentData({
                                                ...assignmentData,
                                                userId: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">
                                            Select a user...
                                        </option>
                                        {users
                                            .filter(
                                                (u) => u.role === UserRole.USER
                                            )
                                            .map((userData) => (
                                                <option
                                                    key={userData.id}
                                                    value={userData.id}
                                                >
                                                    {userData.name ||
                                                        userData.email}{" "}
                                                    ({userData.email})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        value={assignmentData.notes}
                                        onChange={(e) =>
                                            setAssignmentData({
                                                ...assignmentData,
                                                notes: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Add any notes about this assignment..."
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Assign
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAssignAssetModal(null);
                                            setAssignmentData({
                                                userId: "",
                                                notes: "",
                                            });
                                        }}
                                        className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
