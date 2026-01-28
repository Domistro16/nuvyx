import { NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "").toLowerCase().split(",");

export async function DELETE(request: Request) {
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

        // Only admins can cleanup R2 objects
        if (!ADMIN_WALLETS.includes(user.walletAddress.toLowerCase())) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { key } = await request.json();

        if (!key) {
            return NextResponse.json({ error: "Missing key" }, { status: 400 });
        }

        // Check if there's a song with this R2 key - if so, don't delete
        const existingSong = await prisma.song.findFirst({
            where: { r2ObjectKey: key }
        });

        if (existingSong) {
            return NextResponse.json({ error: "Cannot delete: R2 object is referenced by a song record" }, { status: 400 });
        }

        // Delete from R2
        const command = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        });

        await s3.send(command);

        return NextResponse.json({ success: true, message: "R2 object deleted" });
    } catch (error) {
        console.error("Cleanup error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
