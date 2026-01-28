import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// GET: Check if liked or list (if needed)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const songId = searchParams.get("songId");

    const claims = await verifyAuth(request);
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Find our internal user by Privy DID
          const user = await prisma.user.findFirst({
                     where: { OR: [{ walletAddress: claims.walletAddress } , {privyDid: claims.userId }]} 
                 });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (songId) {
            // Check specific like
            const like = await prisma.likedSong.findUnique({
                where: { userId_songId: { userId: user.id, songId } }
            });
            return NextResponse.json({ liked: !!like });
        } else {
            // List all liked songs
            const likes = await prisma.likedSong.findMany({
                where: { userId: user.id },
                include: { song: true },
                orderBy: { likedAt: 'desc' }
            });
            return NextResponse.json({ likes });
        }
    } catch (error) {
        console.error("Likes GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Toggle like (or strict Add)
export async function POST(request: Request) {
    const claims = await verifyAuth(request);
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { songId, action } = await request.json(); // action: 'like' | 'unlike'

        if (!songId) {
            return NextResponse.json({ error: "Missing songId" }, { status: 400 });
        }

         const user = await prisma.user.findFirst({
                     where: { OR: [{ walletAddress: claims.walletAddress } , {privyDid: claims.userId }]} 
                 });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (action === 'unlike') {
            await prisma.likedSong.deleteMany({
                where: { userId: user.id, songId }
            });
            return NextResponse.json({ success: true, liked: false });
        } else {
            // Default to like
            await prisma.likedSong.create({
                data: { userId: user.id, songId }
            });
            return NextResponse.json({ success: true, liked: true });
        }

    } catch (error) {
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ success: true, liked: true });
        }
        console.error("Likes POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
