import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const user = await authenticateUser(email, password);

        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Create JWT token
        const token = await createAuthToken(user.id, user.role);

        // Set cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });

        response.cookies.set("auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });


        return response;
    } catch (error) {
        console.error(
            "Login error:",
            error instanceof Error ? error.message : "Unknown error"
        );
        console.error(
            "Login error stack:",
            error instanceof Error ? error.stack : error
        );
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
