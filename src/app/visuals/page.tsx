"use client";

import React from 'react';
import { Lock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";

export default function Visuals() {
    const { authenticated, login } = usePrivy();

    if (!authenticated) {
        return (
            <div className="relative h-[80vh] flex items-center justify-center overflow-hidden rounded-3xl border border-surface-300 dark:border-dark-300 bg-black animate-fade-in">
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)50%,rgba(0,0,0,0.25)50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
                <div className="relative z-10 text-center max-w-md p-8 bg-black/50 backdrop-blur-xl rounded-3xl border border-white/10">
                    <div className="w-16 h-16 bg-surface-100/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white/50"><Lock size={32} /></div>
                    <h2 className="text-3xl font-black text-white mb-2">Simulations Locked</h2>
                    <p className="text-slate-400 mb-8">Connect your wallet to access the generative visual layer of NUVYX.</p>
                    <Button className="w-full" onClick={login}>Connect Wallet to Enter</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                <div className="w-20 h-20 bg-surface-100 dark:bg-dark-200 rounded-full flex items-center justify-center text-slate-500">
                    <Video size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold dark:text-white mb-2">No Active Simulations</h1>
                    <p className="text-slate-500 max-w-md">There are currently no visual simulations running. Check back later for upcoming drops.</p>
                </div>
            </div>

            <section>
                <h2 className="text-2xl font-black dark:text-white mb-6">Archive</h2>
                <div className="p-12 text-center text-slate-500 border border-dashed border-surface-300 dark:border-dark-300 rounded-3xl">
                    Simulations archive is empty.
                </div>
            </section>
        </div>
    )
}
