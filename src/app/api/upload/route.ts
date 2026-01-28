import { NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "").toLowerCase().split(",");

// Server-side upload - file goes through our server to R2
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

        // Only admins can upload
        if (!ADMIN_WALLETS.includes(user.walletAddress.toLowerCase())) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const artist = formData.get('artist') as string;
        const moodType = formData.get('moodType') as string;

        if (!file || !title || !moodType) {
            return NextResponse.json({ error: "Missing required fields (file, title, moodType)" }, { status: 400 });
        }

        // Generate unique key
        const filename = file.name.replace(/\s+/g, "_");
        const key = `${uuidv4()}-${filename}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to R2
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        });

        await s3.send(command);

        // Create database record
        const song = await prisma.song.create({
            data: {
                title,
                artist: artist || "nuvyx",
                moodType,
                r2ObjectKey: key,
                duration: "0:00",
                tags: [],
            },
        });

        return NextResponse.json({ success: true, song });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Configure max file size (50MB)
export const config = {
    api: {
        bodyParser: false,
    },
};
