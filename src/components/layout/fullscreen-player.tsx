"use client";

import React, { useState } from "react";
import {
    Disc3, Play, SkipBack, SkipForward, Heart, ChevronDown,
    Volume2, VolumeX, Pause, Shuffle, Repeat, Share2, ListMusic,
    MoreHorizontal, Download, Plus, Check
} from "lucide-react";
import { usePlayer } from "@/providers/player-provider";
import { usePrivy } from "@privy-io/react-auth";

export function FullscreenPlayer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const {
        currentSong, isPlaying, togglePlay, nextSong, prevSong,
        progress, duration, seek, shuffle, toggleShuffle, queue, volume, setVolume,
        librarySongIds, addToLibrary, removeFromLibrary, downloadSong
    } = usePlayer();
    const { getAccessToken, authenticated } = usePrivy();
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = async () => {
        if (!currentSong || !authenticated) return;
        try {
            const token = await getAccessToken();
            await fetch('/api/likes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ songId: currentSong.id, action: isLiked ? 'unlike' : 'like' })
            });
            setIsLiked(!isLiked);
        } catch (e) {
            console.error(e);
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        seek(percentage * duration);
    };

    // Clean up title by removing file extensions
    const cleanTitle = (title: string) => {
        return title.replace(/\.(mp3|mpeg|wav|ogg|m4a)$/i, '').replace(/_/g, ' ');
    };

    if (!currentSong || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-slate-900 to-black" />

            {/* Animated blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse" />
            </div>

            {/* Content - fixed height layout */}
            <div className="relative h-full max-h-screen flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden">
                {/* Header - fixed height */}
                <div className="flex items-center justify-between shrink-0">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition"
                    >
                        <ChevronDown size={24} />
                    </button>
                    <div className="text-center">
                        <p className="text-white/60 text-xs uppercase tracking-widest font-medium">Now Playing</p>
                        <p className="text-white text-sm font-semibold">{currentSong.moodType || 'Vibe'} Mix</p>
                    </div>
                    <button
                        onClick={() => alert("More actions coming soon (Copy Link, Share to X, Add to Playlist)")}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition"
                    >
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                {/* Album Art - flexible, takes remaining space */}
                <div className="flex-1 min-h-0 flex items-center justify-center py-2 overflow-hidden">
                    <div className="relative group w-full max-w-[280px] md:max-w-[320px] lg:max-w-[380px] aspect-square">
                        <div className="absolute -inset-2 bg-gradient-to-b from-primary/50 to-accent/50 rounded-2xl blur-xl opacity-50" />
                        <div className="relative w-full h-full rounded-xl bg-slate-800 overflow-hidden shadow-2xl">
                            {currentSong.coverUrl ? (
                                <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                                    <Disc3 className={`text-primary w-28 h-28 ${isPlaying ? 'animate-spin-slow' : ''}`} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Song Info - fixed height */}
                <div className="flex items-center justify-between shrink-0 mb-3">
                    <div className="flex-1 min-w-0 mr-4">
                        <h1 className="text-xl md:text-2xl font-black text-white truncate">{cleanTitle(currentSong.title)}</h1>
                        <p className="text-white/60 text-sm md:text-base font-medium truncate">{currentSong.artist}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => {
                                if (librarySongIds.has(currentSong.id)) {
                                    removeFromLibrary(currentSong.id);
                                } else {
                                    addToLibrary(currentSong.id);
                                }
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${librarySongIds.has(currentSong.id) ? 'text-primary' : 'text-white/60 hover:text-white'}`}
                        >
                            {librarySongIds.has(currentSong.id) ? <Check size={24} /> : <Plus size={24} />}
                        </button>
                        <button
                            onClick={handleLike}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isLiked ? 'text-red-500' : 'text-white/60 hover:text-white'}`}
                        >
                            <Heart size={24} className={isLiked ? 'fill-current' : ''} />
                        </button>
                    </div>
                </div>

                {/* Progress Bar - fixed height */}
                <div className="shrink-0 mb-4">
                    <div
                        className="h-1 bg-white/20 rounded-full cursor-pointer group"
                        onClick={handleSeek}
                    >
                        <div
                            className="h-full bg-white rounded-full relative"
                            style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition" />
                        </div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-white/60 font-medium">
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls - fixed height */}
                <div className="flex items-center justify-center gap-6 shrink-0 mb-4">
                    <button
                        onClick={toggleShuffle}
                        className={`transition-all ${shuffle ? 'text-primary' : 'text-white/60 hover:text-white'}`}
                    >
                        <Shuffle size={20} />
                    </button>
                    <button onClick={prevSong} className="text-white hover:scale-110 transition-transform">
                        <SkipBack size={28} className="fill-current" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-14 h-14 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform shadow-2xl"
                    >
                        {isPlaying ? (
                            <Pause size={28} className="fill-current" />
                        ) : (
                            <Play size={28} className="fill-current ml-0.5" />
                        )}
                    </button>
                    <button onClick={nextSong} className="text-white hover:scale-110 transition-transform">
                        <SkipForward size={28} className="fill-current" />
                    </button>
                    <button className="text-white/60 hover:text-white transition-colors">
                        <Repeat size={20} />
                    </button>
                </div>

                {/* Bottom Actions - fixed height */}
                <div className="flex items-center justify-between shrink-0">
                    <button className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
                        <ListMusic size={18} />
                        <span className="text-xs font-medium hidden sm:inline">Queue ({queue.length})</span>
                    </button>
                    <div className="flex items-center gap-2 text-white/60">
                        <button onClick={() => setVolume(volume > 0 ? 0 : 0.75)}>
                            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <div
                            className="w-20 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percentage = x / rect.width;
                                setVolume(percentage);
                            }}
                        >
                            <div className="h-full bg-white rounded-full" style={{ width: `${volume * 100}%` }} />
                        </div>
                    </div>
                    <button
                        onClick={() => downloadSong(currentSong)}
                        className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
                    >
                        <Download size={18} />
                        <span className="text-xs font-medium hidden sm:inline">Download</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
