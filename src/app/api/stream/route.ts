import { verifyAuth } from "@/lib/auth";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get("download") === "true";

    const claims = await verifyAuth(request);
    if (isDownload && !claims) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key = searchParams.get("key");

    if (!key) {
        return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    try {
        const isDownload = searchParams.get("download") === "true";
        const filename = searchParams.get("filename") || key;
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: isDownload ? `attachment; filename="${filename}"` : undefined,
        });

        // Generate a presigned URL valid for 1 hour
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Stream URL error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
