import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-supabase";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Auth check error:", error);
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
}
