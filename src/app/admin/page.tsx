"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePrivy } from "@privy-io/react-auth";
import {
    Music,
    Edit,
    Plus,
    Search,
    Trash2,
    ExternalLink,
    TrendingUp,
    Clock,
    Zap,
    Moon,
    TrendingDown,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Song } from "@/providers/player-provider";

const MOOD_COLORS: Record<string, string> = {
    chill: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    focus: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    hype: 'bg-green-500/10 text-green-600 dark:text-green-400',
    sad: 'bg-red-500/10 text-red-600 dark:text-red-400'
};

const MOOD_LABELS: Record<string, string> = {
    chill: 'Late Night',
    focus: 'Deep Work',
    hype: 'Green Candles',
    sad: 'Rekt / Recovery'
};

export default function AdminDashboard() {
    const { authenticated, getAccessToken } = usePrivy();
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const res = await fetch('/api/songs');
                if (res.ok) {
                    const data = await res.json();
                    setSongs(data.songs || []);
                }
            } catch (err) {
                console.error("Failed to fetch songs", err);
            } finally {
                setLoading(false);
            }
        };

        if (authenticated) {
            fetchSongs();
        }
    }, [authenticated]);

    const filteredSongs = songs.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteSong = async (id: string, title: string) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = await getAccessToken();
            const res = await fetch('/api/songs', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                setSongs(prev => prev.filter(s => s.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete song");
            }
        } catch (err) {
            console.error("Delete failed", err);
            alert("Internal server error");
        }
    };

    if (!authenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Music size={48} className="text-slate-300" />
                <h1 className="text-2xl font-bold dark:text-white">Admin Access Required</h1>
                <p className="text-slate-500 text-center max-w-md">Please connect your wallet and sign in with an authorized admin account to manage songs.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight dark:text-white mb-2">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your music catalog and track metadata.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/upload">
                        <Button className="font-bold">
                            <Plus size={18} className="mr-2" /> Upload New
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 glass-panel rounded-3xl shadow-xl transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary dark:glow-primary">
                            <Music size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black dark:text-white">{songs.length}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Tracks</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 glass-panel rounded-3xl shadow-xl transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black dark:text-white">{songs.filter(s => s.moodType === 'hype').length}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Hype Vibes</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 glass-panel rounded-3xl shadow-xl transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Moon size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black dark:text-white">{songs.filter(s => s.moodType === 'chill').length}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Chill Vibes</div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Search songs by title or artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-100 dark:bg-white/5 dark:backdrop-blur-xl border border-surface-300 dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white transition-all shadow-sm"
                />
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-surface-300 dark:border-white/5 bg-surface-200/50 dark:bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Track Details</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Mood</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Storage Key</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-300 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-primary" size={32} />
                                            <span className="text-slate-500 font-medium">Scanning catalog...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSongs.length > 0 ? (
                                filteredSongs.map((song) => (
                                    <tr key={song.id} className="group hover:bg-surface-200/50 dark:hover:bg-dark-300/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-surface-300 dark:bg-white/10 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm group-hover:glow-primary">
                                                    <Music size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold dark:text-white truncate">{song.title}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{song.artist}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${song.moodType ? MOOD_COLORS[song.moodType] : 'bg-slate-500/10 text-slate-500'}`}>
                                                {song.moodType ? (MOOD_LABELS[song.moodType] || song.moodType) : 'Vibe'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-surface-200 dark:bg-white/5 px-2 py-1.5 rounded-lg max-w-[150px] truncate border border-transparent dark:border-white/5">
                                                {song.r2ObjectKey}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/edit/${song.id}`}>
                                                    <Button variant="ghost" className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10">
                                                        <Edit size={18} />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                                                    onClick={() => handleDeleteSong(song.id, song.title)}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No songs found. Start by uploading some music!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
