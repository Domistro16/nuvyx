import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// GET: List user's library
export async function GET(request: Request) {
    const claims = await verifyAuth(request);
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
         const user = await prisma.user.findFirst({
            where: { OR: [{ walletAddress: claims.walletAddress } , {privyDid: claims.userId }]} 
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const library = await prisma.library.findMany({
            where: { userId: user.id },
            include: { song: true },
            orderBy: { addedAt: 'desc' }
        });
        return NextResponse.json({ library });
    } catch (error) {
        console.error("Library list error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Add to library
export async function POST(request: Request) {
    const claims = await verifyAuth(request);
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { songId } = await request.json();

        if (!songId) {
            return NextResponse.json({ error: "Missing songId" }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { OR: [{ walletAddress: claims.walletAddress } , {privyDid: claims.userId }]} 
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const entry = await prisma.library.create({
            data: {
                userId: user.id,
                songId
            }
        });

        return NextResponse.json({ success: true, entry });
    } catch (error) {
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ success: true, message: "Already in library" });
        }
        console.error("Library add error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Remove from library
export async function DELETE(request: Request) {
    const claims = await verifyAuth(request);
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { songId } = await request.json();

        if (!songId) {
            return NextResponse.json({ error: "Missing songId" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { privyDid: claims.userId }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        await prisma.library.deleteMany({
            where: {
                userId: user.id,
                songId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Library remove error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
