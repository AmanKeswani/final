import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { UserRole } from "@/lib/auth-supabase";

// Define protected routes and their required roles
const protectedRoutes = {
    "/user": "USER" as UserRole,
    "/manager": "MANAGER" as UserRole,
    "/super-admin": "SUPER_ADMIN" as UserRole,
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

    // Create Supabase client for middleware
    const response = NextResponse.next();
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    // Check if the route needs protection
    const isProtectedRoute = Object.keys(protectedRoutes).some((route) =>
        pathname.startsWith(route)
    );
    console.log("Middleware: Is protected route:", isProtectedRoute);

    // Handle protected routes first
    if (isProtectedRoute) {
        try {
            // Get the current session
            const { data: { session }, error } = await supabase.auth.getSession();
            
            console.log("Middleware: Session found:", !!session);

            // Redirect to login if no session
            if (!session || error) {
                console.log("Middleware: No session, redirecting to login");
                return NextResponse.redirect(new URL("/login", request.url));
            }

            // Get user profile from public.users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, name, role')
                .eq('id', session.user.id)
                .single();

            if (userError || !userData) {
                console.log("Middleware: User profile not found, redirecting to login");
                return NextResponse.redirect(new URL("/login", request.url));
            }

            const userRole = userData.role as UserRole;
            console.log("Middleware: User role:", userRole);

            // Check role-based access
            for (const [route, requiredRole] of Object.entries(
                protectedRoutes
            )) {
                if (pathname.startsWith(route) && requiredRole) {
                    // For hierarchical access: SUPER_ADMIN can access all, MANAGER can access USER routes
                    const hasAccess =
                        userRole === requiredRole ||
                        userRole === "SUPER_ADMIN" ||
                        (userRole === "MANAGER" && requiredRole === "USER");

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
                            case "USER":
                                return NextResponse.redirect(
                                    new URL("/user/dashboard", request.url)
                                );
                            case "MANAGER":
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
            console.log("Middleware: Authentication failed:", error);
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
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // CSP header
    response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;"
    );

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
