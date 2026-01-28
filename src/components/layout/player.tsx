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
            <div
                className={`fixed bottom-0 left-0 right-0 z-40 glass-panel border-x-0 border-b-0 backdrop-blur-2xl px-4 py-3 lg:px-10 lg:ml-80 transition-all shadow-2xl animate-slide-up group/player cursor-pointer ${isFullscreen ? 'hidden' : ''}`}
                onClick={() => setIsFullscreen(true)}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    {/* Song Info */}
                    <div className="flex items-center gap-3 lg:gap-4 flex-1 lg:flex-none lg:w-1/3 min-w-0">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-surface-200 dark:bg-white/5 border border-transparent dark:border-white/10 overflow-hidden relative shrink-0 shadow-inner group-hover/player:ring-2 group-hover/player:ring-primary transition-all">
                            {currentSong.coverUrl ? (
                                <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                                    <Disc3
                                        className={`text-primary dark:text-white ${isPlaying ? "animate-spin-slow" : ""}`}
                                        size={24}
                                    />
                                </div>
                            )}
                            {/* Expand indicator (Mobile & Desktop) */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/player:opacity-100 transition-opacity flex items-center justify-center">
                                <ChevronUp size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-bold dark:text-white truncate group-hover/player:text-primary transition-colors">
                                {currentSong.title}
                            </div>
                            <div className="text-[10px] lg:text-xs text-slate-500 truncate font-medium uppercase tracking-tight">
                                {currentSong.artist} • {currentSong.moodType || "Vibe"}
                            </div>
                        </div>

                        {/* Expand Button for Mobile (Explicit) */}
                        <div className="lg:hidden ml-1 text-slate-400">
                            <ChevronUp size={16} />
                        </div>
                    </div>

                    {/* Controls - Adaptive */}
                    <div
                        className="flex items-center gap-1 lg:gap-6 lg:w-1/3 justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="hidden lg:flex items-center gap-6">
                            <button
                                onClick={toggleShuffle}
                                className={`transition-colors ${shuffle ? 'text-primary font-glow' : 'text-slate-400 hover:text-primary'}`}
                                title={shuffle ? 'Shuffle: On' : 'Shuffle: Off'}
                            >
                                <Shuffle size={18} />
                            </button>
                            <button onClick={prevSong} className="text-slate-400 hover:text-primary transition-colors">
                                <SkipBack size={24} />
                            </button>
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-slate-900 dark:bg-primary text-white flex items-center justify-center hover:scale-105 transition shadow-xl active:scale-95 dark:glow-primary border-none"
                        >
                            {isPlaying ? (
                                <Pause size={20} className="lg:size-6 fill-current" />
                            ) : (
                                <Play size={20} className="lg:size-6 fill-current ml-0.5" />
                            )}
                        </button>

                        <div className="hidden lg:flex items-center gap-6">
                            <button onClick={nextSong} className="text-slate-400 hover:text-primary transition-colors">
                                <SkipForward size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Right side - Desktop Extras / Mobile Hidden */}
                    <div
                        className="hidden lg:flex w-1/3 justify-end items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => downloadSong(currentSong)}
                            className="hidden xl:flex items-center gap-2 text-slate-400 hover:text-primary transition-colors"
                            title="Download Track"
                        >
                            <Download size={18} />
                            <span className="text-sm font-medium">Download</span>
                        </button>
                        <button
                            onClick={() => {
                                if (librarySongIds.has(currentSong.id)) {
                                    removeFromLibrary(currentSong.id);
                                } else {
                                    addToLibrary(currentSong.id);
                                }
                            }}
                            className={`flex items-center gap-2 transition-all ${librarySongIds.has(currentSong.id) ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                        >
                            {librarySongIds.has(currentSong.id) ? <Check size={18} /> : <Plus size={18} />}
                            <span className="text-sm font-medium">{librarySongIds.has(currentSong.id) ? 'Added' : 'Save'}</span>
                        </button>

                        <div className="flex items-center gap-2 border-l border-white/5 pl-4">
                            <button
                                onClick={() => setVolume(volume > 0 ? 0 : 0.75)}
                                className="text-slate-400 hover:text-primary transition-colors"
                            >
                                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <div
                                className="w-20 h-1.5 bg-surface-300 dark:bg-white/10 rounded-full overflow-hidden cursor-pointer group"
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

                {/* Progress Bar (Full Width Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-300 dark:bg-white/5 overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 dark:glow-primary"
                        style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                    ></div>
                </div>
            </div>
        </>
    );
}
