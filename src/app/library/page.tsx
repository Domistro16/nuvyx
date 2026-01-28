"use client";

import React, { useState, useEffect } from 'react';
import { Music, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { usePlayer } from "@/providers/player-provider";

// Mock data removed

type Track = {
    id: string;
    title: string;
    artist: string;
    duration?: string;
    moodType?: string;
    tags?: string[];
    createdAt?: string;
};

export default function Library() {
    const { authenticated, ready, getAccessToken } = usePrivy();
    const { playSong } = usePlayer();
    const [activeFilter, setActiveFilter] = useState('All Assets');
    const tabs = ['All Assets', 'Stream History', 'Liked Songs'];
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "My Library | NUVYX";
        const fetchContent = async () => {
            if (!ready || !authenticated) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const token = await getAccessToken();
                let endpoint = '';
                if (activeFilter === 'All Assets') endpoint = '/api/library';
                else if (activeFilter === 'Stream History') endpoint = '/api/interactions';
                else if (activeFilter === 'Liked Songs') endpoint = '/api/likes';

                const res = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    let mappedTracks: Track[] = [];

                    if (activeFilter === 'All Assets') {
                        mappedTracks = data.library.map((item: any) => ({
                            ...item.song,
                            createdAt: item.addedAt
                        }));
                    } else if (activeFilter === 'Stream History') {
                        mappedTracks = data.history.map((item: any) => ({
                            ...item.song,
                            createdAt: item.streamedAt
                        }));
                    } else if (activeFilter === 'Liked Songs') {
                        mappedTracks = data.likes.map((item: any) => ({
                            ...item.song,
                            createdAt: item.likedAt
                        }));
                    }
                    setTracks(mappedTracks);
                }
            } catch (err) {
                console.error("Failed to fetch vault content", err);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [ready, authenticated, activeFilter, getAccessToken]);

    const renderContent = () => {
        if (loading) {
            return <div className="lg:col-span-3 flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
        }

        const statusLabel = activeFilter === 'Stream History' ? 'Streamed' :
            activeFilter === 'Liked Songs' ? 'Liked' : 'Saved';

        return (
            <div className="lg:col-span-4">
                <div className="glass-panel rounded-3xl overflow-hidden shadow-xl">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-surface-300 dark:border-white/5 bg-surface-200/50 dark:bg-white/5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <div className="col-span-1">#</div><div className="col-span-5">Asset Details</div><div className="col-span-3">{activeFilter === 'Stream History' ? 'Streamed On' : 'Date Added'}</div><div className="col-span-2">Status</div><div className="col-span-1 text-right">Time</div>
                    </div>
                    <div className="divide-y divide-surface-300 dark:divide-white/5">
                        {tracks.length > 0 ? tracks.map((t, i) => (
                            <div
                                key={`${t.id}-${i}`} // Use index as well since history can have duplicates
                                onClick={() => playSong(t as any)}
                                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-200 dark:hover:bg-white/5 transition-all group cursor-pointer active:scale-[0.99]"
                            >
                                <div className="col-span-1 text-slate-400 font-mono text-xs group-hover:text-primary transition-colors">{i + 1}</div>
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-surface-300 dark:bg-white/10 flex items-center justify-center relative overflow-hidden group-hover:bg-primary group-hover:text-white transition-all shadow-sm group-hover:glow-primary"><Music size={18} /></div>
                                    <div className="min-w-0"><div className="font-semibold dark:text-white truncate">{t.title}</div><div className="text-xs text-slate-500 truncate">{t.artist}</div></div>
                                </div>
                                <div className="col-span-3 text-sm text-slate-500 font-medium">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Unknown'}</div>
                                <div className="col-span-2"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${activeFilter === 'Stream History' ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : 'bg-primary/10 text-primary border border-primary/20'}`}>{statusLabel}</span></div>
                                <div className="col-span-1 text-right text-sm text-slate-500 font-mono">{t.duration || '0:00'}</div>
                            </div>
                        )) : <div className="p-8 text-center text-slate-500 col-span-12">No tracks found in this category.</div>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div><h1 className="text-4xl lg:text-5xl font-black tracking-tight dark:text-white mb-2">My Vault</h1><p className="text-slate-500 dark:text-slate-400 text-lg">Your audio ledger.</p></div>
            </div>
            <div className="border-b border-surface-300 dark:border-dark-300">
                <div className="flex gap-8">
                    {tabs.map((tab) => (
                        <button key={tab} onClick={() => setActiveFilter(tab)} className={`pb-4 text-sm font-bold tracking-wide transition-colors relative ${activeFilter === tab ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                            {tab}
                            {activeFilter === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full dark:glow-primary"></div>}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid lg:grid-cols-4 gap-8">
                {renderContent()}

            </div>
        </div>
    );
}
