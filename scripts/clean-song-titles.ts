import { prisma } from '../src/lib/db';

async function main() {
    console.log('--- Database Title Cleanup Started ---');

    if (!process.env.DATABASE_URL) {
        console.error('Error: DATABASE_URL not found in environment.');
        process.exit(1);
    }

    const songs = await prisma.song.findMany();
    console.log(`Found ${songs.length} total songs.`);

    let updatedCount = 0;

    for (const song of songs) {
        if (song.title.toLowerCase().endsWith('.mp3')) {
            const newTitle = song.title.replace(/\.mp3$/i, '');

            console.log(`Updating: "${song.title}" -> "${newTitle}"`);

            await prisma.song.update({
                where: { id: song.id },
                data: { title: newTitle }
            });

            updatedCount++;
        }
    }

    console.log('--- Cleanup Finished ---');
    console.log(`Successfully updated ${updatedCount} song titles.`);
}

main()
    .catch((e) => {
        console.error('Error during cleanup:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
