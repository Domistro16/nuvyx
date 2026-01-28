import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
        return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const claims = await verifyAuth(request);
    if (!claims) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { privyDid: claims.userId },
                    { walletAddress: address }
                ]
            },
        });

        // Ensure that if they provided an address, it actually belongs to their Privy identity in our records
        if (user && user.privyDid && user.privyDid !== claims.userId) {
            return NextResponse.json({ error: "Identity mismatch" }, { status: 403 });
        }

        return NextResponse.json({ exists: !!user, user });
    } catch (error) {
        console.error("Check user error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
