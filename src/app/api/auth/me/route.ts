import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserById, verifyAuthToken } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token")?.value;
        console.log("Auth check: Retrieved token from cookies:", token);

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const decoded = await verifyAuthToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const user = await getUserById(decoded.userId);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
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
