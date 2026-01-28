"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

import { usePrivy } from "@privy-io/react-auth";

// Define the Song type matching our frontend needs (and DB schema)
export interface Song {
    id: string;
    title: string;
    artist: string;
    r2ObjectKey: string;
    moodType?: string;
    coverUrl?: string; // Optional cover art
}

interface PlayerContextType {
    currentSong: Song | null;
    isPlaying: boolean;
    playSong: (song: Song) => void;
    togglePlay: () => void;
    nextSong: () => void;
    prevSong: () => void;
    progress: number;
    duration: number;
    seek: (time: number) => void;
    queue: Song[];
    setQueue: (songs: Song[]) => void;
    queueIndex: number;
    shuffle: boolean;
    toggleShuffle: () => void;
    volume: number;
    setVolume: (volume: number) => void;
    librarySongIds: Set<string>;
    addToLibrary: (songId: string) => Promise<void>;
    removeFromLibrary: (songId: string) => Promise<void>;
    downloadSong: (song: Song) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const { authenticated, getAccessToken, login } = usePrivy();
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Queue state with refs to avoid stale closures
    const [queue, setQueueState] = useState<Song[]>([]);
    const [queueIndex, setQueueIndexState] = useState(-1);
    const queueRef = useRef<Song[]>([]);
    const queueIndexRef = useRef(-1);

    // Shuffle state
    const [shuffle, setShuffle] = useState(false);
    const shuffleRef = useRef(false);
    const playedIndicesRef = useRef<Set<number>>(new Set());

    // Volume state (0-1)
    const [volume, setVolumeState] = useState(0.75);

    // Library state
    const [librarySongIds, setLibrarySongIds] = useState<Set<string>>(new Set());

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (currentSong && isPlaying) {
            document.title = `${currentSong.title} - ${currentSong.artist} | NUVYX`;
        } else {
            document.title = 'NUVYX | Soundtrack for Every Moment';
        }
    }, [currentSong, isPlaying]);

    // Fetch library on auth
    useEffect(() => {
        const fetchLibrary = async () => {
            if (!authenticated) {
                setLibrarySongIds(new Set());
                return;
            }
            try {
                const token = await getAccessToken();
                const res = await fetch('/api/library', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const ids = new Set<string>(data.library.map((item: any) => item.songId));
                    setLibrarySongIds(ids);
                }
            } catch (err) {
                console.error("Failed to fetch library", err);
            }
        };
        fetchLibrary();
    }, [authenticated, getAccessToken]);

    const addToLibrary = useCallback(async (songId: string) => {
        if (!authenticated) {
            login();
            return;
        }
        try {
            const token = await getAccessToken();
            const res = await fetch('/api/library', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ songId })
            });
            if (res.ok) {
                setLibrarySongIds(prev => new Set([...prev, songId]));
            }
        } catch (err) {
            console.error("Failed to add to library", err);
        }
    }, [authenticated, getAccessToken]);

    const removeFromLibrary = useCallback(async (songId: string) => {
        if (!authenticated) {
            login();
            return;
        }
        try {
            const token = await getAccessToken();
            const res = await fetch('/api/library', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ songId })
            });
            if (res.ok) {
                setLibrarySongIds(prev => {
                    const next = new Set(prev);
                    next.delete(songId);
                    return next;
                });
            }
        } catch (err) {
            console.error("Failed to remove from library", err);
        }
    }, [authenticated, getAccessToken]);

    const downloadSong = useCallback(async (song: Song) => {
        if (!authenticated) {
            login();
            return;
        }
        try {
            // Format filename: Artist - Title.mp3 (clean up extensions in title if present)
            const cleanTitle = song.title.replace(/\.(mp3|mpeg|wav|ogg|m4a)$/i, '').replace(/_/g, ' ');
            const safeArtist = song.artist.replace(/_/g, ' ');
            const fileName = `${safeArtist} - ${cleanTitle}.mp3`.replace(/[<>:"/\\|?*]/g, '');

            const token = await getAccessToken();
            const res = await fetch(`/api/stream?key=${encodeURIComponent(song.r2ObjectKey)}&download=true&filename=${encodeURIComponent(fileName)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error("Failed to get download URL");
            const { url } = await res.json();

            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Log download interaction and add to library if authenticated
            if (authenticated) {
                const token = await getAccessToken();
                // Parallelize both actions
                Promise.all([
                    fetch('/api/interactions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ type: 'download', songId: song.id })
                    }),
                    addToLibrary(song.id)
                ]).catch(console.error);
            }
        } catch (err) {
            console.error("Download failed", err);
        }
    }, [authenticated, getAccessToken, addToLibrary]);

    // Volume control function
    const setVolume = useCallback((newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolumeState(clampedVolume);
        if (audioRef.current) {
            audioRef.current.volume = clampedVolume;
        }
    }, []);

    const toggleShuffle = useCallback(() => {
        setShuffle(prev => {
            const newVal = !prev;
            shuffleRef.current = newVal;
            if (newVal) {
                // Reset played indices when enabling shuffle
                playedIndicesRef.current = new Set();
                // Add current song to played
                const currentIdx = queueIndexRef.current;
                if (currentIdx >= 0) {
                    playedIndicesRef.current.add(currentIdx);
                }
            }
            return newVal;
        });
    }, []);

    // Wrapper to update both state and ref
    const setQueue = useCallback((songs: Song[]) => {
        queueRef.current = songs;
        setQueueState(songs);
    }, []);

    const setQueueIndex = useCallback((index: number) => {
        queueIndexRef.current = index;
        setQueueIndexState(index);
    }, []);

    const playTrack = useCallback(async (song: Song) => {
        if (!audioRef.current) return;

        setCurrentSong(song);

        try {
            const token = authenticated ? await getAccessToken() : null;
            // Fetch presigned URL from our API
            const res = await fetch(`/api/stream?key=${encodeURIComponent(song.r2ObjectKey)}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) {
                throw new Error('Failed to get stream URL');
            }
            const { url } = await res.json();

            audioRef.current.src = url;
            await audioRef.current.play();
            setIsPlaying(true);

            // Log stream to backend (fire and forget) if authenticated
            if (authenticated) {
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                try {
                    const token = await getAccessToken();
                    headers['Authorization'] = `Bearer ${token}`;
                    fetch('/api/interactions', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ type: 'stream', songId: song.id })
                    }).catch(console.error);
                } catch (e) {
                    console.error("Failed to get token for interaction", e);
                }
            }

        } catch (err) {
            console.error("Playback failed", err);
            setIsPlaying(false);
        }
    }, [authenticated, getAccessToken]);

    const playAtIndex = useCallback(async (index: number) => {
        const currentQueue = queueRef.current;
        if (index < 0 || index >= currentQueue.length) return;

        const song = currentQueue[index];
        setQueueIndex(index);
        await playTrack(song);
    }, [playTrack, setQueueIndex]);

    // Initialize audio element
    useEffect(() => {
        audioRef.current = new Audio();
        const audio = audioRef.current;

        const updateProgress = () => {
            setProgress(audio.currentTime);
            setDuration(audio.duration || 0);
        };

        const onEnded = () => {
            setIsPlaying(false);
            // Auto-play next in queue using refs
            const currentIndex = queueIndexRef.current;
            const currentQueue = queueRef.current;
            if (currentIndex < currentQueue.length - 1) {
                playAtIndex(currentIndex + 1);
            }
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('loadedmetadata', updateProgress);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('loadedmetadata', updateProgress);
            audio.pause();
        };
    }, [playAtIndex]);

    const togglePlay = useCallback(() => {
        if (!audioRef.current || !currentSong) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
        }
    }, [currentSong, isPlaying]);

    const playSong = useCallback(async (song: Song) => {
        if (!audioRef.current) return;

        // If same song, toggle play/pause
        if (currentSong?.id === song.id) {
            togglePlay();
            return;
        }

        // Use ref for current queue state
        const currentQueue = queueRef.current;

        // Check if song is already in queue
        const existingIndex = currentQueue.findIndex(s => s.id === song.id);
        if (existingIndex !== -1) {
            // Play from existing queue position
            await playAtIndex(existingIndex);
        } else {
            // Add to queue and play
            const newQueue = [...currentQueue, song];
            setQueue(newQueue);
            setQueueIndex(newQueue.length - 1);
            await playTrack(song);
        }
    }, [currentSong?.id, togglePlay, playAtIndex, playTrack, setQueue, setQueueIndex]);

    const nextSong = useCallback(() => {
        const currentQueue = queueRef.current;
        const currentIndex = queueIndexRef.current;

        if (currentQueue.length === 0) return;

        if (shuffleRef.current) {
            // Shuffle mode: pick a random unplayed song
            const played = playedIndicesRef.current;
            const unplayedIndices = currentQueue
                .map((_, i) => i)
                .filter(i => !played.has(i));

            if (unplayedIndices.length === 0) {
                // All songs played, reset and start over with a random one
                playedIndicesRef.current = new Set();
                const randomIndex = Math.floor(Math.random() * currentQueue.length);
                playedIndicesRef.current.add(randomIndex);
                playAtIndex(randomIndex);
            } else {
                // Pick a random unplayed song
                const randomIdx = unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)];
                playedIndicesRef.current.add(randomIdx);
                playAtIndex(randomIdx);
            }
        } else {
            // Normal sequential mode
            const nextIndex = currentIndex + 1;
            if (nextIndex < currentQueue.length) {
                playAtIndex(nextIndex);
            } else {
                // Loop back to start
                playAtIndex(0);
            }
        }
    }, [playAtIndex]);

    const prevSong = useCallback(() => {
        const currentQueue = queueRef.current;
        const currentIndex = queueIndexRef.current;

        if (currentQueue.length === 0) return;

        // If more than 3 seconds in, restart current song
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }

        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            playAtIndex(prevIndex);
        } else {
            // Loop to end
            playAtIndex(currentQueue.length - 1);
        }
    }, [playAtIndex]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    }, []);

    return (
        <PlayerContext.Provider value={{
            currentSong,
            isPlaying,
            playSong,
            togglePlay,
            nextSong,
            prevSong,
            progress,
            duration,
            seek,
            queue,
            setQueue,
            queueIndex,
            shuffle,
            toggleShuffle,
            volume,
            setVolume,
            librarySongIds,
            addToLibrary,
            removeFromLibrary,
            downloadSong
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}
