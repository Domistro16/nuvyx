"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from "@privy-io/react-auth";
import {
    Loader2,
    Save,
    ArrowLeft,
    Music,
    AlertCircle,
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from 'next/link';

interface SongFormData {
    title: string;
    artist: string;
    moodType: string;
}

const MOOD_OPTIONS = [
    { value: "chill", label: "Chill (Late Night)" },
    { value: "focus", label: "Focus (Deep Work)" },
    { value: "hype", label: "Hype (Green Candles)" },
    { value: "sad", label: "Sad (Rekt / Recovery)" },
];

export default function EditSong({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const { getAccessToken, authenticated } = usePrivy();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState<SongFormData>({
        title: '',
        artist: '',
        moodType: '',
    });

    useEffect(() => {
        const fetchSong = async () => {
            try {
                const res = await fetch(`/api/songs?id=${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.song) {
                        setFormData({
                            title: data.song.title,
                            artist: data.song.artist,
                            moodType: data.song.moodType,
                        });
                    } else {
                        setError("Song not found");
                    }
                } else {
                    setError("Failed to load song details");
                }
            } catch (err) {
                console.error("Failed to fetch song", err);
                setError("Failed to load song details");
            } finally {
                setLoading(false);
            }
        };

        if (authenticated) {
            fetchSong();
        }
    }, [authenticated, id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const token = await getAccessToken();
            const res = await fetch('/api/songs', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id,
                    ...formData
                })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/admin');
                }, 1500);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to update song");
            }
        } catch (err) {
            console.error("Update failed", err);
            setError("Internal server error");
        } finally {
            setSaving(false);
        }
    };

    if (!authenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Music size={48} className="text-slate-300" />
                <h1 className="text-2xl font-bold dark:text-white">Admin Access Required</h1>
                <p className="text-slate-500 text-center">Please connect your wallet to edit songs.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-slate-500">
                <Loader2 className="animate-spin" size={32} />
                <p className="font-medium">Loading metadata...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-full text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
                        <ArrowLeft size={20} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black dark:text-white">Edit Song</h1>
                    <p className="text-slate-500">Update metadata for "{formData.title}"</p>
                </div>
            </div>

            <Card className="p-8 bg-surface-100 dark:glass-dark border border-surface-300 dark:border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-24 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12"></div>
                <form onSubmit={handleSave} className="space-y-6 relative z-10">
                    {error && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 text-sm font-bold">
                            <CheckCircle size={18} />
                            Song updated successfully! Redirecting...
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Song Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full h-12 px-4 rounded-xl border border-surface-400 dark:border-white/10 bg-white dark:bg-white/5 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all font-medium text-lg"
                                placeholder="Enter track title"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Artist</label>
                            <input
                                type="text"
                                required
                                value={formData.artist}
                                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                                className="w-full h-12 px-4 rounded-xl border border-surface-400 dark:border-white/10 bg-white dark:bg-white/5 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all font-medium"
                                placeholder="Enter artist name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Mood Preset</label>
                            <select
                                required
                                value={formData.moodType}
                                onChange={(e) => setFormData({ ...formData, moodType: e.target.value })}
                                className="w-full h-12 px-4 rounded-xl border border-surface-400 dark:border-white/10 bg-white dark:bg-white/5 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all font-medium appearance-none"
                            >
                                <option value="" disabled>Select a mood</option>
                                {MOOD_OPTIONS.map(mood => (
                                    <option key={mood.value} value={mood.value} className="bg-dark-200">{mood.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-14 font-black text-lg shadow-xl group dark:glow-primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <><Loader2 className="animate-spin mr-2" size={20} /> Saving Changes...</>
                            ) : (
                                <><Save size={20} className="mr-2 group-hover:rotate-12 transition-transform" /> Update Track Metadata</>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
