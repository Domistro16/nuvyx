"use client";

import React, { useState, useEffect } from 'react';
import { Search, Layers, Trophy, Clock, Play, Pause, Plus, Check, TrendingUp, CloudRain, Flame, Gem, Rocket, Sparkles, MessageCircle, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePlayer, Song } from "@/providers/player-provider";

// Curated collections data
const COLLECTIONS = [
    { id: 101, title: 'The Bull Run Mix', subtitle: 'High energy for green candles', color: 'from-green-500 to-emerald-700', icon: TrendingUp, category: 'DeFi' },
    { id: 102, title: 'Bear Market Therapy', subtitle: 'Piano & Rain sounds', color: 'from-slate-700 to-slate-900', icon: CloudRain, category: 'DeFi' },
    { id: 103, title: 'Gas Wars: High Gwei', subtitle: 'Aggressive Phonk & Bass', color: 'from-orange-500 to-red-600', icon: Flame, category: 'L2 Scaling' },
    { id: 104, title: 'L2 Scaling Layers', subtitle: 'Minimalist Tech-House', color: 'from-blue-500 to-indigo-600', icon: Layers, category: 'L2 Scaling' },
    { id: 105, title: 'Doge To The Moon', subtitle: 'Hyperpop & Memes', color: 'from-yellow-400 to-orange-500', icon: Rocket, category: 'Meme Economy' },
    { id: 106, title: 'Blue Chip Serenity', subtitle: 'Ambient for Holders', color: 'from-blue-600 to-purple-600', icon: Gem, category: 'NFTs' },
];

export default function Explore() {
    const [exploreCategory, setExploreCategory] = useState('All');
    const [topMints, setTopMints] = useState<Song[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Song[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { playSong, currentSong, isPlaying, librarySongIds, addToLibrary, removeFromLibrary } = usePlayer();

    const categories = ['All', 'DeFi', 'NFTs', 'L2 Scaling', 'Meme Economy'];

    const filteredCollections = exploreCategory === 'All'
        ? COLLECTIONS
        : COLLECTIONS.filter(c => c.category === exploreCategory);

    useEffect(() => {
        document.title = "Explore | NUVYX";
        const fetchTopMints = async () => {
            try {
                const res = await fetch('/api/ranking/top-mints');
                if (res.ok) {
                    const data = await res.json();
                    setTopMints(data);
                }
            } catch (e) {
                console.error("Failed to fetch top mints", e);
            }
        };
        fetchTopMints();
    }, []);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/songs?query=${encodeURIComponent(searchQuery)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSearchResults(data.songs || []);
                    }
                } catch (e) {
                    console.error("Search failed", e);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight dark:text-white mb-2">Explore</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Discover the sound of the blockchain.</p>
                </div>
                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search genres, transaction hashes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-100 dark:bg-white/5 dark:backdrop-blur-xl border border-surface-300 dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {categories.map((tag) => (
                    <button
                        key={tag}
                        onClick={() => setExploreCategory(tag)}
                        className={`whitespace-nowrap px-5 py-2 rounded-full border text-sm font-semibold transition-all ${exploreCategory === tag
                            ? 'bg-slate-900 dark:bg-primary text-white dark:text-white border-transparent dark:glow-primary'
                            : 'border-surface-300 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary dark:hover:bg-white/5'
                            }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>


            {/* Conditional Search Results or Main Content */}
            {searchQuery.trim().length >= 2 ? (
                <section className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            <Search className="text-primary" /> Search Results "{searchQuery}"
                        </h2>
                    </div>
                    <div className="glass-panel rounded-3xl p-2 min-h-[200px] shadow-xl">
                        {isSearching ? (
                            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                                <Sparkles className="animate-pulse text-primary" size={32} />
                                <p>Scanning the blockchain for matches...</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((song, i) => (
                                <div
                                    key={song.id}
                                    onClick={() => playSong(song)}
                                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-200 dark:hover:bg-white/5 transition-all group cursor-pointer animate-fade-in active:scale-[0.99]"
                                >
                                    <div className="w-8 text-center text-slate-400 font-mono text-xs">{i + 1}</div>
                                    <div className="w-12 h-12 rounded-xl bg-surface-300 dark:bg-dark-400 flex items-center justify-center relative overflow-hidden group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Music size={20} className="relative z-10" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold dark:text-white truncate">{song.title}</h4>
                                        <p className="text-xs text-slate-500 font-medium">{song.artist}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className={`p-2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-all ${librarySongIds.has(song.id) ? 'text-primary' : 'text-slate-400 hover:text-primary dark:hover:bg-primary/20'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (librarySongIds.has(song.id)) removeFromLibrary(song.id);
                                            else addToLibrary(song.id);
                                        }}
                                    >
                                        {librarySongIds.has(song.id) ? <Check size={18} /> : <Plus size={18} />}
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-slate-500">
                                <p>No tracks or artists found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Top Mints (2/3 width) */}
                    <section className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                                <Trophy className="text-amber-500" /> Top Mints (24h)
                            </h2>
                        </div>
                        <div className="glass-panel rounded-3xl p-2 min-h-[200px] shadow-xl">
                            {topMints.length > 0 ? topMints.map((song, i) => {
                                const isCurrent = currentSong?.id === song.id;
                                const isPlayingLocal = isCurrent && isPlaying;
                                const mints = (song as any).mints || 0;

                                return (
                                    <div
                                        key={song.id}
                                        onClick={() => playSong(song)}
                                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-200 dark:hover:bg-white/5 transition-all group cursor-pointer animate-fade-in active:scale-[0.99]"
                                    >
                                        <div className={`w-8 text-center font-black text-lg ${i === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {i + 1}
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-surface-300 dark:bg-white/10 flex items-center justify-center relative overflow-hidden group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                            <div className={`absolute inset-0 opacity-50 bg-gradient-to-tr ${i % 2 === 0 ? 'from-primary to-purple-500' : 'from-accent to-emerald-600'}`}></div>
                                            {isPlayingLocal ? (
                                                <Pause size={20} className="relative z-10 text-white fill-current" />
                                            ) : (
                                                <Music size={20} className="relative z-10 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold dark:text-white truncate">{song.title}</h4>
                                            <p className="text-xs text-slate-500 font-medium">{song.artist}</p>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <div className="font-bold dark:text-white text-sm">{mints} Mints</div>
                                            <div className="text-xs text-green-500 font-bold">Last 24h</div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className={`p-2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-all ${librarySongIds.has(song.id) ? 'text-primary' : 'text-slate-400'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (librarySongIds.has(song.id)) removeFromLibrary(song.id);
                                                else addToLibrary(song.id);
                                            }}
                                        >
                                            {librarySongIds.has(song.id) ? <Check size={18} /> : <Plus size={18} />}
                                        </Button>
                                    </div>
                                );
                            }) : (
                                <div className="p-8 text-center text-slate-500">
                                    No mints in the last 24 hours. Be the first to download!
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Upcoming Drops (1/3 width) */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                                <Clock className="text-indigo-500" /> Upcoming Drops
                            </h2>
                        </div>
                        <div className="bg-black text-white rounded-3xl p-0 relative overflow-hidden h-full min-h-[400px] border border-surface-300 dark:border-dark-300 shadow-xl flex flex-col">
                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-60"
                                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop')" }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                            <div className="relative z-10 p-6 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-auto">
                                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        Exclusive
                                    </span>
                                    <div className="bg-black/50 backdrop-blur rounded-lg px-3 py-1 text-sm font-mono border border-white/20">
                                        04:20:59
                                    </div>
                                </div>
                                <div className="mb-8">
                                    <h3 className="text-3xl font-black mb-2 leading-tight">
                                        Ether-Wave <br />Vol. 2
                                    </h3>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 mt-auto">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-300">
                                        <Sparkles size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wide">Shape the Sound</span>
                                    </div>
                                    <Button
                                        className="w-full h-11 text-xs font-black shadow-xl dark:glow-primary"
                                    >
                                        <MessageCircle size={16} className="mr-2" /> Suggest a Vibe
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
