import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        // Top Mints: Count downloads from the last 24 hours only
        // Exclude songs with 0 downloads, limit to 7
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const topMints = await prisma.$queryRaw`
            SELECT
                s.id,
                s.title,
                s.artist,
                s.r2_object_key as "r2ObjectKey",
                s.mood_type as "moodType",
                COUNT(d.id) as mints
            FROM songs s
            INNER JOIN downloads d ON d.song_id = s.id
            WHERE d.downloaded_at >= ${twentyFourHoursAgo}
            GROUP BY s.id, s.title, s.artist, s.r2_object_key, s.mood_type
            HAVING COUNT(d.id) > 0
            ORDER BY mints DESC
            LIMIT 7;
        `;

        const json = JSON.stringify(topMints, (_, v) =>
            typeof v === 'bigint' ? Number(v) : v
        );

        return new NextResponse(json, { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error("Top Mints error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
