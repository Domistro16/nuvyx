"use client";

import React, { useState } from "react";
import { Disc3, Play, SkipBack, SkipForward, Heart, Volume2, VolumeX, Pause, Shuffle, ChevronUp, Download, Plus, Check } from "lucide-react";
import { usePlayer } from "@/providers/player-provider";
import { usePrivy } from "@privy-io/react-auth";
import { FullscreenPlayer } from "./fullscreen-player";

export function Player() {
    const {
        currentSong, isPlaying, togglePlay, nextSong, prevSong, progress, duration, seek, shuffle, toggleShuffle, volume, setVolume,
        librarySongIds, addToLibrary, removeFromLibrary, downloadSong
    } = usePlayer();
    const { getAccessToken, authenticated } = usePrivy();
    const [isFullscreen, setIsFullscreen] = useState(false);

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
                body: JSON.stringify({ songId: currentSong.id, action: 'like' })
            });
        } catch (e) {
            console.error(e);
        }
    };

    if (!currentSong) return null;

    return (
        <>
            {/* Fullscreen Player */}
            <FullscreenPlayer isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} />

            {/* Mini Player */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 glass-panel border-x-0 border-b-0 backdrop-blur-2xl px-4 py-4 lg:px-10 lg:ml-80 transition-all shadow-2xl animate-slide-up ${isFullscreen ? 'hidden' : ''}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    {/* Song Info - Clickable to open fullscreen */}
                    <div
                        className="flex items-center gap-4 w-1/3 min-w-0 cursor-pointer group"
                        onClick={() => setIsFullscreen(true)}
                    >
                        <div className="w-14 h-14 rounded-xl bg-surface-200 dark:bg-white/5 border border-transparent dark:border-white/10 overflow-hidden relative shrink-0 shadow-inner group-hover:ring-2 group-hover:ring-primary transition-all">
                            {currentSong.coverUrl ? (
                                <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                                    <Disc3
                                        className={`text-primary dark:text-white ${isPlaying ? "animate-spin-slow" : ""}`}
                                        size={28}
                                    />
                                </div>
                            )}
                            {/* Expand indicator */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ChevronUp size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-bold dark:text-white truncate group-hover:text-primary transition-colors">
                                {currentSong.title}
                            </div>
                            <div className="text-xs text-slate-500 truncate font-medium">
                                {currentSong.artist} • {currentSong.moodType || "Vibe"}
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (librarySongIds.has(currentSong.id)) {
                                        removeFromLibrary(currentSong.id);
                                    } else {
                                        addToLibrary(currentSong.id);
                                    }
                                }}
                                className={`transition-all active:scale-90 ${librarySongIds.has(currentSong.id) ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                                title={librarySongIds.has(currentSong.id) ? 'Remove from Library' : 'Add to Library'}
                            >
                                {librarySongIds.has(currentSong.id) ? <Check size={18} /> : <Plus size={18} />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="text-slate-400 hover:text-red-500 transition-transform active:scale-90">
                                <Heart size={18} />
                            </button>
                        </div>
                        {/* Progress Bar (Mini) */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-300 dark:bg-white/5">
                            <div
                                className="h-full bg-primary transition-all duration-300 dark:glow-primary"
                                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col items-center gap-1 w-1/3">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={toggleShuffle}
                                className={`transition-colors ${shuffle ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                                title={shuffle ? 'Shuffle: On' : 'Shuffle: Off'}
                            >
                                <Shuffle size={18} />
                            </button>
                            <button onClick={prevSong} className="text-slate-400 hover:text-primary transition-colors">
                                <SkipBack size={24} />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="w-12 h-12 rounded-full bg-slate-900 dark:bg-primary text-white dark:text-white flex items-center justify-center hover:scale-105 transition shadow-xl active:scale-95 dark:glow-primary border-none"
                            >
                                {isPlaying ? (
                                    <Pause size={24} className="fill-current" />
                                ) : (
                                    <Play size={24} className="fill-current ml-0.5" />
                                )}
                            </button>
                            <button onClick={nextSong} className="text-slate-400 hover:text-primary transition-colors">
                                <SkipForward size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="w-1/3 flex justify-end items-center gap-4">
                        <button
                            onClick={() => downloadSong(currentSong)}
                            className="hidden md:flex items-center gap-2 text-slate-400 hover:text-primary transition-colors"
                            title="Download Track"
                        >
                            <Download size={18} />
                            <span className="text-sm font-medium">Download</span>
                        </button>
                        <button
                            onClick={() => setIsFullscreen(true)}
                            className="hidden lg:flex items-center gap-2 text-slate-400 hover:text-primary transition-colors"
                        >
                            <ChevronUp size={18} />
                            <span className="text-sm font-medium">Expand</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setVolume(volume > 0 ? 0 : 0.75)}
                                className="text-slate-400 hover:text-primary transition-colors"
                            >
                                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <div
                                className="w-24 h-1.5 bg-surface-300 dark:bg-white/10 rounded-full overflow-hidden cursor-pointer group"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percentage = x / rect.width;
                                    setVolume(percentage);
                                }}
                            >
                                <div
                                    className="h-full bg-slate-500 dark:bg-primary group-hover:glow-primary transition-all"
                                    style={{ width: `${volume * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
