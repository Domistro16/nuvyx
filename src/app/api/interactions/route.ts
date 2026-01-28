import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: Request) {
    const claims = await verifyAuth(request);
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const user = await prisma.user.findFirst({
            where: { OR: [{ walletAddress: claims.walletAddress }, { privyDid: claims.userId }] }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Fetch streams for this user, ordered by most recent, distinct by songId
        const streams = await prisma.stream.findMany({
            where: { userId: user.id },
            include: { song: true },
            distinct: ['songId'],
            orderBy: { streamedAt: 'desc' },
            take: 50 // Limit to last 50 unique songs
        });

        return NextResponse.json({ history: streams });
    } catch (error) {
        console.error("History GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { type, songId } = await request.json();

        if (!songId || !type) {
            return NextResponse.json({ error: "Missing type or songId" }, { status: 400 });
        }

        // Optional auth for streams, required for downloads
        const claims = await verifyAuth(request);
        let user = null;

        if (claims) {
            user = await prisma.user.findFirst({
                where: { OR: [{ walletAddress: claims.walletAddress }, { privyDid: claims.userId }] }
            });
        }

        if (type === 'stream') {
            await prisma.stream.create({
                data: {
                    songId,
                    userId: user?.id || null, // Anonymous streams allowed
                }
            });
            return NextResponse.json({ success: true });
        } else if (type === 'download') {
            if (!user) {
                return NextResponse.json({ error: "Authentication required for downloads" }, { status: 401 });
            }

            const existing = await prisma.download.findFirst({
                where: { userId: user.id, songId }
            });

            if (!existing) {
                await prisma.download.create({
                    data: { userId: user.id, songId }
                });
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid interaction type" }, { status: 400 });

    } catch (error) {
        console.error("Interaction error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
