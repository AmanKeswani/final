"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";    
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { getCurrentUser } from "@/lib/client-auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Login successful, response data:", data);

                // Successful login - redirect based on user role
                const userRole = data.user?.role;
                let redirectPath = "/user/dashboard";

                switch (userRole) {
                    case "USER":
                        redirectPath = "/user/dashboard";
                        break;
                    case "MANAGER":
                        redirectPath = "/manager/dashboard";
                        break;
                    case "SUPER_ADMIN":
                        redirectPath = "/super-admin/dashboard";
                        break;
                    default:
                        redirectPath = "/user/dashboard";
                }

                console.log("Redirecting to:", redirectPath);
                console.log("Response headers:", response.headers);
                
                // Force a page reload to ensure middleware processes the new cookie
                setTimeout(() => {
                    console.log("Executing redirect now...");
                    window.location.replace(redirectPath);
                }, 1000);

                return;
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Login failed");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Welcome back
                    </CardTitle>
                    <CardDescription className="text-center">
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleLogin}
                        className="space-y-4"
                    >
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium text-gray-700"
                            >
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="pl-10"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="pl-10 pr-10"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/signup"
                                className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
                            >
                                Don't have an account? Sign up
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
