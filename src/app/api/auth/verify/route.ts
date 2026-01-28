import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyMessage } from "viem";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const claims = await verifyAuth(request);
        if (!claims) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { walletAddress, signature } = await request.json();

        if (!walletAddress || !signature) {
            return NextResponse.json({ error: "Missing wallet address or signature" }, { status: 400 });
        }

        const message = `Welcome to Nuvyx\n\nSign this message to verifying your identity.\n\nWallet: ${walletAddress}`;

        // Verify signature
        const isValid = await verifyMessage({
            address: walletAddress,
            message: message,
            signature: signature,
        });

        if (!isValid) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // Upsert user (Create if new, 'login' if exists)
        // Using upsert ensures we handle both cases atomically
        const user = await prisma.user.upsert({
            where: { walletAddress: walletAddress },
            update: {
                privyDid: claims.userId,
            },
            create: {
                walletAddress: walletAddress,
                privyDid: claims.userId,
            },
        });

        return NextResponse.json({ success: true, user });

    } catch (error) {
        console.error("Auth verification error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
