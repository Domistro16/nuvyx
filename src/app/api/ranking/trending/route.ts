import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        // Raw query for Trending (7 days streaming count)
        // Only songs that have been streamed in the last 7 days
        const trending = await prisma.$queryRaw`
            SELECT
                s.id,
                s.title,
                s.artist,
                s.r2_object_key as "r2ObjectKey",
                s.mood_type as "moodType",
                COUNT(st.id) as "weekly_streams"
            FROM songs s
            JOIN streams st ON st.song_id = s.id
            WHERE st.streamed_at >= NOW() - INTERVAL '7 days'
            GROUP BY s.id
            ORDER BY "weekly_streams" DESC
            LIMIT 20;
        `;

        // BigInt serialization fix if needed (COUNT returns BigInt)
        const json = JSON.stringify(trending, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v
        );

        return new NextResponse(json, { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error("Trending error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
