import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "").toLowerCase().split(",");

export async function POST(request: Request) {
    const claims = await verifyAuth(request);
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Build query conditions based on what we have from auth
        const conditions = [];
        if (claims.userId) conditions.push({ privyDid: claims.userId });
        if (claims.walletAddress) conditions.push({ walletAddress: claims.walletAddress });

        if (conditions.length === 0) {
            return NextResponse.json({ error: "No user identifier available" }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { OR: conditions }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (!ADMIN_WALLETS.includes(user.walletAddress.toLowerCase())) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { title, artist, moodType, r2ObjectKey, duration, tags } = await request.json();

        if (!title || !moodType || !r2ObjectKey) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create Song record
        const song = await prisma.song.create({
            data: {
                title,
                artist: artist || "nuvyx",
                moodType,
                r2ObjectKey,
                duration: duration || "0:00",
                tags: tags || [],
            },
        });

        return NextResponse.json({ success: true, song });
    } catch (error) {
        console.error("Create song error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const id = searchParams.get('id');

    try {
        if (id) {
            const song = await prisma.song.findUnique({
                where: { id }
            });
            if (!song) return NextResponse.json({ error: "Song not found" }, { status: 404 });
            return NextResponse.json({ song });
        }

        let where: any = {};
        if (query) {
            where = {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { artist: { contains: query, mode: 'insensitive' } }
                ]
            };
        }

        const songs = await prisma.song.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ songs });
    } catch (error) {
        console.error("Songs GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const claims = await verifyAuth(request);
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const conditions = [];
        if (claims.userId) conditions.push({ privyDid: claims.userId });
        if (claims.walletAddress) conditions.push({ walletAddress: claims.walletAddress });

        const user = await prisma.user.findFirst({
            where: { OR: conditions }
        });

        if (!user || !ADMIN_WALLETS.includes(user.walletAddress.toLowerCase())) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { id, title, artist, moodType, duration, tags } = await request.json();

        if (!id) {
            return NextResponse.json({ error: "Missing song ID" }, { status: 400 });
        }

        const updatedSong = await prisma.song.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(artist && { artist }),
                ...(moodType && { moodType }),
                ...(duration && { duration }),
                ...(tags && { tags }),
            }
        });

        return NextResponse.json({ success: true, song: updatedSong });
    } catch (error) {
        console.error("Update song error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const claims = await verifyAuth(request);
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const conditions = [];
        if (claims.userId) conditions.push({ privyDid: claims.userId });
        if (claims.walletAddress) conditions.push({ walletAddress: claims.walletAddress });

        const user = await prisma.user.findFirst({
            where: { OR: conditions }
        });

        if (!user || !ADMIN_WALLETS.includes(user.walletAddress.toLowerCase())) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: "Missing song ID" }, { status: 400 });
        }

        await prisma.song.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete song error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
