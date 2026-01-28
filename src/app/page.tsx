"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, TrendingUp, Play, ArrowRight, Pause, Clock, Flame, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MOOD_PRESETS } from "@/lib/data";
import { usePlayer, Song } from "@/providers/player-provider";

// Category definitions for the rotating carousel
const CATEGORIES = [
  { id: 'trending', label: 'Trending Tracks', icon: TrendingUp, filter: null },
  { id: 'latest', label: 'Latest Tracks', icon: Clock, filter: null },
  ...MOOD_PRESETS.map(m => ({
    id: m.filter,
    label: `Top ${m.label} Tracks`,
    icon: m.icon,
    filter: m.filter
  }))
];

export default function Home() {
  const [manualFilter, setManualFilter] = useState<string | null>(null);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { playSong, currentSong, isPlaying, setQueue } = usePlayer();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all songs and trending songs on mount
  useEffect(() => {
    document.title = "Home | NUVYX";
    const fetchData = async () => {
      try {
        // Fetch trending songs
        const trendingRes = await fetch('/api/ranking/trending');
        if (trendingRes.ok) {
          const trendingData = await trendingRes.json();
          if (Array.isArray(trendingData)) {
            setTrendingSongs(trendingData);
          }
        }

        // Fetch all songs
        const allRes = await fetch('/api/songs');
        if (allRes.ok) {
          const allData = await allRes.json();
          const songs = (allData.songs || []).map((s: Record<string, unknown>) => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            r2ObjectKey: s.r2ObjectKey,
            moodType: s.moodType,
          }));
          setAllSongs(songs);
        }
      } catch (err) {
        console.error("Failed to fetch tracks", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-rotate categories every 5 seconds (only when no manual filter)
  useEffect(() => {
    if (manualFilter !== null || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCategoryIndex(prev => (prev + 1) % CATEGORIES.length);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [manualFilter, isPaused]);

  // Get current category
  const currentCategory = manualFilter !== null
    ? CATEGORIES.find(c => c.id === manualFilter) || CATEGORIES[0]
    : CATEGORIES[categoryIndex];

  // Get tracks for current category
  const getDisplayTracks = useCallback(() => {
    if (currentCategory.id === 'trending') {
      return trendingSongs.length > 0 ? trendingSongs : allSongs.slice(0, 10);
    }
    if (currentCategory.id === 'latest') {
      return allSongs.slice(0, 10);
    }
    // Filter by mood
    return allSongs.filter(s => s.moodType === currentCategory.filter).slice(0, 10);
  }, [currentCategory, allSongs, trendingSongs]);

  const displayTracks = getDisplayTracks();

  // Update queue when category changes or data loads
  useEffect(() => {
    if (displayTracks.length > 0) {
      setQueue(displayTracks);
    }
  }, [currentCategory.id, allSongs.length, trendingSongs.length, setQueue]);

  // Handle manual filter selection
  const handleFilterClick = (filterId: string) => {
    if (manualFilter === filterId) {
      // Clicking same filter clears it, resumes auto-rotate
      setManualFilter(null);
    } else {
      setManualFilter(filterId);
    }
  };

  // Handle clicking on the category indicator to pause/resume
  const handleCategoryClick = () => {
    if (manualFilter === null) {
      setIsPaused(!isPaused);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // Find a mood that matches the query
    const matchedMood = MOOD_PRESETS.find(m =>
      m.label.toLowerCase().includes(query) ||
      m.filter.toLowerCase().includes(query)
    );

    if (matchedMood) {
      setManualFilter(matchedMood.filter);
    } else {
      // Fallback: If no mood matches, we could search by title/artist
      // but for now let's just show an alert or clear the filter
      console.log("No mood match found for:", query);
    }
  };

  return (
    <div className="space-y-16 animate-fade-in">
      <section className="text-center lg:text-left space-y-8">
        <h1 className="text-4xl lg:text-7xl font-black tracking-tight dark:text-white leading-[1.1]">Every moment <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">has a soundtrack.</span></h1>
        <div className="max-w-2xl lg:mr-auto relative group z-10">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-indigo-500 to-accent rounded-full opacity-0 group-hover:opacity-20 blur-md transition duration-500"></div>
          <form onSubmit={handleSearch} className="relative flex items-center bg-surface-100 dark:bg-white/5 dark:backdrop-blur-xl rounded-full p-2 shadow-2xl border border-surface-300 dark:border-white/10">
            <div className="pl-4 pr-3 text-primary"><Sparkles className="animate-pulse" /></div>
            <input
              type="text"
              placeholder="Describe your mood... (e.g. 'Focus', 'Rekt', 'Hype')"
              className="flex-1 bg-transparent border-none outline-none dark:text-white placeholder:text-slate-400 h-11 w-full text-lg font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="h-11 w-11 p-0 rounded-full dark:glow-primary dark:bg-primary"><ArrowRight size={20} /></Button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold dark:text-white mb-6 tracking-tight">Select Intent</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MOOD_PRESETS.map(m => (
            <Card key={m.id} onClick={() => handleFilterClick(m.filter)} className={`p-0 overflow-hidden group hover:border-primary/50 cursor-pointer relative transition-all dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 ${manualFilter === m.filter ? 'ring-2 ring-primary border-primary dark:glow-primary' : ''}`}>
              <div className="p-6 flex flex-col items-center text-center gap-4 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg glow-primary ${m.color}`}>
                  <m.icon size={28} />
                </div>
                <span className="font-semibold dark:text-white">{m.label}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={handleCategoryClick}
              title={manualFilter === null ? (isPaused ? "Click to resume auto-rotate" : "Click to pause auto-rotate") : "Clear filter to enable auto-rotate"}
            >
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <currentCategory.icon className="text-primary" />
                {currentCategory.label}
              </h2>
              {manualFilter === null && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isPaused ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/20 text-primary'}`}>
                  {isPaused ? 'Paused' : 'Auto'}
                </span>
              )}
            </div>
            {manualFilter !== null && (
              <button onClick={() => setManualFilter(null)} className="text-sm text-slate-500 hover:text-primary">
                Clear Filter
              </button>
            )}
          </div>

          {/* Category indicators */}
          <div className="flex gap-1 mb-4">
            {CATEGORIES.map((cat, i) => (
              <div
                key={cat.id}
                className={`h-1 flex-1 rounded-full transition-all duration-300 cursor-pointer ${(manualFilter === cat.id || (manualFilter === null && categoryIndex === i))
                  ? 'bg-primary'
                  : 'bg-surface-300 dark:bg-dark-400 hover:bg-primary/50'
                  }`}
                onClick={() => {
                  setManualFilter(cat.id);
                }}
                title={cat.label}
              />
            ))}
          </div>

          <div className="glass-panel rounded-3xl p-2 space-y-1 min-h-[200px] shadow-xl">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : displayTracks.length > 0 ? (
              displayTracks.map((t, i) => {
                const isCurrent = currentSong?.id === t.id;
                const isPlayingLocal = isCurrent && isPlaying;

                return (
                  <div
                    key={t.id}
                    onClick={() => playSong(t)}
                    className={`group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer ${isCurrent ? 'bg-primary/10 border border-primary/20 dark:bg-primary/20' : 'hover:bg-surface-200 dark:hover:bg-white/5 active:scale-[0.98]'}`}
                  >
                    <div className="w-8 text-center text-slate-400 text-sm font-bold group-hover:text-primary transition-colors">{i + 1}</div>
                    <div className="w-12 h-12 rounded-lg bg-surface-300 dark:bg-white/10 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-all shadow-sm group-hover:glow-primary">
                      {isPlayingLocal ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate ${isCurrent ? 'text-primary' : 'dark:text-white'}`}>{t.title}</div>
                      <div className="text-slate-500 text-xs truncate font-medium">{t.artist}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500">No tracks found for this category.</div>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <Card className="bg-black border-none text-white relative overflow-hidden h-full min-h-[300px] flex flex-col justify-end group cursor-pointer shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-60 group-hover:scale-105 transition duration-1000"></div>
            <div className="relative z-20">
              <div className="flex items-center gap-2 mb-3"><span className="bg-red-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider animate-pulse">Featured Simulation</span></div>
              <h3 className="text-2xl font-black mb-2 leading-tight">Liquidity Pool Serenade</h3>
              <p className="text-slate-300 text-sm mb-6 font-medium">Watch the generative AI visualizer.</p>
              <Link href="/visuals" className="relative z-30">
                <Button className="w-full h-12 font-black text-lg shadow-xl dark:glow-primary group">
                  <Play size={20} className="mr-2 group-hover:rotate-12 transition-transform" /> Watch Now
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
