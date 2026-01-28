import { NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

        // Optional: restriction to admins
        if (!ADMIN_WALLETS.includes(user.walletAddress.toLowerCase())) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { filename, contentType } = await request.json();

        if (!filename || !contentType) {
            return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });
        }

        const key = `${uuidv4()}-${filename.replace(/\s+/g, "_")}`;

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return NextResponse.json({ url, key });
    } catch (error) {
        console.error("Presign error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
