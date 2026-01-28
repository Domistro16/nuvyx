"use client";

import React, { useState, useRef } from 'react';
import { Loader2, Upload, X, Music } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePrivy } from "@privy-io/react-auth";

interface FileWithMetadata {
    file: File;
    title: string;
    artist: string;
    moodType: string;
}

// Mood options matching the homepage presets
const MOOD_OPTIONS = [
    { value: "chill", label: "Chill (Late Night)" },
    { value: "focus", label: "Focus (Deep Work)" },
    { value: "hype", label: "Hype (Green Candles)" },
    { value: "sad", label: "Sad (Rekt / Recovery)" },
];

export default function AdminUpload() {
    const { getAccessToken, authenticated } = usePrivy();
    const [files, setFiles] = useState<FileWithMetadata[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadErrors, setUploadErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                artist: "nuvyxm",
                moodType: "chill"
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const updateFileMetadata = (index: number, field: keyof FileWithMetadata, value: string) => {
        setFiles(prev => prev.map((f, i) =>
            i === index ? { ...f, [field]: value } : f
        ));
    };

    const deleteR2Object = async (key: string, token: string) => {
        try {
            await fetch('/api/upload/cleanup', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key })
            });
        } catch (error) {
            console.error("Failed to cleanup R2 object:", key, error);
        }
    };

    const handleUpload = async () => {
        if (!authenticated) {
            alert("Please login first");
            return;
        }
        setUploading(true);
        let uploadedCount = 0;

        try {
            const token = await getAccessToken();

            for (const fileData of files) {
                try {
                    // Server-side upload - file goes through our server to R2
                    const formData = new FormData();
                    formData.append('file', fileData.file);
                    formData.append('title', fileData.title);
                    formData.append('artist', fileData.artist);
                    formData.append('moodType', fileData.moodType);

                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData,
                    });

                    if (res.ok) {
                        uploadedCount++;
                        setProgress(Math.round((uploadedCount / files.length) * 100));
                    } else {
                        const errorData = await res.json().catch(() => ({}));
                        console.error(`Upload failed for ${fileData.file.name}:`, errorData);
                    }

                } catch (error) {
                    console.error(`Error uploading ${fileData.file.name}:`, error);
                }
            }

            setUploading(false);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            if (uploadedCount === files.length) {
                alert(`✅ Success! All ${uploadedCount} files uploaded.`);
                setFiles([]);
                setUploadErrors([]);
            } else if (uploadedCount > 0) {
                alert(`⚠️ Partial success: ${uploadedCount}/${files.length} files uploaded.\n\nFailed files may have authentication issues. Please try again.`);
            } else {
                alert(`❌ Upload failed. This could be due to:\n\n• Authentication timeout (Privy server)\n• Network issues\n• Server error\n\nPlease check your connection and try again.`);
            }

            setProgress(0);
        } catch (error) {
            console.error("Global upload error:", error);
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            alert(`❌ Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-black dark:text-white mb-2 underline decoration-primary/30 decoration-4">Upload Music</h1>
                <p className="text-slate-500 dark:text-slate-400">Upload tracks to Cloudflare R2 with metadata.</p>
            </div>

            <Card className="border-dashed border-2 border-surface-400 dark:border-white/10 bg-surface-100/50 dark:glass-dark group transition-all hover:border-primary/50">
                <div
                    className="flex flex-col items-center justify-center p-12 cursor-pointer transition-colors rounded-xl relative overflow-hidden"
                    onClick={() => document.getElementById('file-upload')?.click()}
                >
                    <div className="absolute top-0 right-0 p-16 bg-primary/5 blur-3xl rounded-full -mr-8 -mt-8 group-hover:bg-primary/10 transition-all"></div>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 dark:glow-primary relative z-10">
                        <Upload size={32} />
                    </div>
                    <h3 className="text-lg font-bold dark:text-white mb-1 relative z-10">Click to upload audio files</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 relative z-10">Supports MP3, WAV, FLAC</p>
                    <Button variant="secondary" type="button" className="relative z-10">Select Files</Button>
                </div>
                <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    multiple
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </Card>

            {files.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-bold dark:text-white">Selected Files ({files.length})</h3>
                    <div className="space-y-4">
                        {files.map((fileData, i) => (
                            <div key={i} className="border border-surface-300 dark:border-white/5 rounded-2xl overflow-hidden bg-surface-100 dark:glass-dark p-4 shadow-lg transition-all hover:border-white/10">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-surface-300 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 shadow-sm border border-transparent dark:border-white/5">
                                        <Music size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{fileData.file.name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{(fileData.file.size / 1024 / 1024).toFixed(2)} MB</div>
                                            </div>
                                            <button onClick={() => removeFile(i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    value={fileData.title}
                                                    onChange={(e) => updateFileMetadata(i, 'title', e.target.value)}
                                                    className="w-full px-4 py-2 text-sm rounded-lg border border-surface-300 dark:border-white/10 bg-surface-100 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                                    placeholder="Song title"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Artist</label>
                                                <input
                                                    type="text"
                                                    value={fileData.artist}
                                                    onChange={(e) => updateFileMetadata(i, 'artist', e.target.value)}
                                                    className="w-full px-4 py-2 text-sm rounded-lg border border-surface-300 dark:border-white/10 bg-surface-100 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                                    placeholder="Artist name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mood</label>
                                                <select
                                                    value={fileData.moodType}
                                                    onChange={(e) => updateFileMetadata(i, 'moodType', e.target.value)}
                                                    className="w-full px-4 py-2 text-sm rounded-lg border border-surface-300 dark:border-white/10 bg-surface-100 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                                >
                                                    {MOOD_OPTIONS.map(mood => (
                                                        <option key={mood.value} value={mood.value} className="bg-dark-200">{mood.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-surface-300 dark:border-white/10">
                        <Button variant="ghost" onClick={() => setFiles([])} disabled={uploading}>Clear All</Button>
                        <Button onClick={handleUpload} disabled={uploading} className="dark:glow-primary">
                            {uploading ? (
                                <><Loader2 className="animate-spin mr-2" size={18} /> Uploading {progress}%</>
                            ) : (
                                <>Upload {files.length} Tracks</>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

