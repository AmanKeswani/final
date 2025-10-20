import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key-here";

// Define protected routes and their required roles
const protectedRoutes = {
    "/user": UserRole.USER,
    "/manager": UserRole.MANAGER,
    "/super-admin": UserRole.SUPER_ADMIN,
};

// Rate limiting store (in production, use Redis or a database)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
};

function getRateLimitKey(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "anonymous";
    return ip;
}

function isRateLimited(key: string): boolean {
    const now = Date.now();
    const record = rateLimit.get(key);

    if (!record) {
        rateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
        return false;
    }

    if (now > record.resetTime) {
        rateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
        return false;
    }

    if (record.count >= RATE_LIMIT.max) {
        return true;
    }

    record.count++;
    return false;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    console.log("Middleware: Processing request for:", pathname);

    // Check if the route needs protection
    const isProtectedRoute = Object.keys(protectedRoutes).some((route) =>
        pathname.startsWith(route)
    );
    console.log("Middleware: Is protected route:", isProtectedRoute);

    // Handle protected routes first
    if (isProtectedRoute) {
        const token = request.cookies.get("auth-token")?.value;
        console.log("Middleware: Token found:", !!token);

        // Redirect to login if no token
        if (!token) {
            console.log("Middleware: No token, redirecting to login");
            return NextResponse.redirect(new URL("/login", request.url));
        }

        try {
            console.log("Middleware: Verifying token with jose...");

            // Convert secret to Uint8Array for jose
            const secret = new TextEncoder().encode(JWT_SECRET);

            // Verify token using jose (Edge Runtime compatible)
            const { payload } = await jwtVerify(token, secret);

            console.log("Middleware: Decoded token:", payload);

            const userRole = payload.role as UserRole;
            console.log("Middleware: Token verified, user role:", userRole);

            // Check role-based access
            for (const [route, requiredRole] of Object.entries(
                protectedRoutes
            )) {
                if (pathname.startsWith(route) && requiredRole) {
                    // For hierarchical access: SUPER_ADMIN can access all, MANAGER can access USER routes
                    const hasAccess =
                        userRole === requiredRole ||
                        userRole === UserRole.SUPER_ADMIN ||
                        (userRole === UserRole.MANAGER &&
                            requiredRole === UserRole.USER);

                    console.log(
                        "Middleware: Checking access - userRole:",
                        userRole,
                        "requiredRole:",
                        requiredRole,
                        "hasAccess:",
                        hasAccess
                    );

                    if (!hasAccess) {
                        console.log(
                            "Middleware: Access denied, redirecting based on role"
                        );
                        // Redirect to appropriate dashboard based on user's role
                        switch (userRole) {
                            case UserRole.USER:
                                return NextResponse.redirect(
                                    new URL("/user/dashboard", request.url)
                                );
                            case UserRole.MANAGER:
                                return NextResponse.redirect(
                                    new URL("/manager/dashboard", request.url)
                                );
                            // SUPER_ADMIN always has access (handled above), so no redirect case needed here
                            default:
                                return NextResponse.redirect(
                                    new URL("/login", request.url)
                                );
                        }
                    }
                    break;
                }
            }

            console.log("Middleware: Access granted, continuing...");
        } catch (error) {
            console.log("Middleware: Token verification failed:", error);
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // Apply rate limiting to API routes
    if (request.nextUrl.pathname.startsWith("/api/")) {
        const key = getRateLimitKey(request);

        if (isRateLimited(key)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Too many requests",
                    message: "Rate limit exceeded. Please try again later.",
                },
                { status: 429 }
            );
        }
    }

    // Security headers
    const response = NextResponse.next();

    // CORS headers for API routes
    if (request.nextUrl.pathname.startsWith("/api/")) {
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        );
        response.headers.set(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );
    }

    // Security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // CSP header
    response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;"
    );

    return response;
}

export const config = {
    matcher: [
        "/api/dashboard/:path*",
        "/api/users/:path*",
        "/api/assets/:path*",
        "/api/requests/:path*",
        "/manager/:path*",
        "/super-admin/:path*",
        "/user/:path*",
    ],
};
