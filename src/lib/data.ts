import { TrendingDown, TrendingUp, Zap, Moon, Layers, Disc3, Sparkles } from "@/components/icons";
import React from 'react';

// Re-export specific icons needed for data structure
// Note: In a real app, storing components in data is not ideal, but for this migration we'll keep the structure similar
// and componentize the rendering.

export const MOOD_PRESETS = [
    { id: 'm1', label: 'Rekt / Recovery', icon: TrendingDown, color: 'bg-red-500/10 text-red-600 dark:text-red-400', filter: 'sad' },
    { id: 'm2', label: 'Green Candles', icon: TrendingUp, color: 'bg-green-500/10 text-green-600 dark:text-green-400', filter: 'hype' },
    { id: 'm3', label: 'Deep Work', icon: Zap, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', filter: 'focus' },
    { id: 'm4', label: 'Late Night', icon: Moon, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', filter: 'chill' },
];

// Data removed. Using APIs now.
