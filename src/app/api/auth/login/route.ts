import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-supabase";
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

        // With Supabase, the session is automatically managed
        // We just return the user data
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
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
