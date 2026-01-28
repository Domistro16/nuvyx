"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Disc3, Sparkles, Search, Heart, Video, X, Twitter, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/user-provider";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const { ready, authenticated, user, login, logout } = usePrivy();
    const { dbUser, userStatus } = useUser();
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        // Check initial state
        const isDark = document.documentElement.classList.contains("dark") ||
            (!document.documentElement.classList.contains("light") &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        if (isDark) {
            setDarkMode(true);
            if (!document.documentElement.classList.contains("dark")) {
                document.documentElement.classList.add("dark");
            }
        } else {
            setDarkMode(false);
            if (!document.documentElement.classList.contains("light")) {
                document.documentElement.classList.add("light");
            }
        }
    }, []);

    const navItems = [
        { href: "/", label: "Home", icon: Sparkles },
        { href: "/explore", label: "Explore", icon: Search },
        { href: "/library", label: "My Library", icon: Heart },
        { href: "/visuals", label: "Simulations", icon: Video },
    ];

    const toggleDarkMode = () => {
        if (darkMode) {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
            setDarkMode(false);
        } else {
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
            setDarkMode(true);
        }
    };

    const TikTokIcon = ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" /></svg>
    );

    return (
        <>
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-80 glass-panel border-r transform transition-transform duration-300 lg:translate-x-0 shadow-2xl lg:shadow-none flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center justify-between mb-10">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <Disc3 size={24} />
                            </div>
                            <span className="text-2xl font-black tracking-tight dark:text-white">
                                NUVYX
                            </span>
                        </Link>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden p-2 rounded-full hover:bg-surface-300 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="space-y-1.5">
                        {navItems.map((item) => {
                            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                            return (
                                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start transition-all duration-300 px-4 py-2.5 rounded-xl h-auto",
                                            isActive
                                                ? "bg-slate-200 dark:bg-primary text-slate-900 dark:text-white font-bold dark:glow-primary"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <item.icon className={cn("mr-3 transition-colors", isActive ? "text-primary dark:text-white" : "text-slate-400 dark:text-slate-500")} size={20} />
                                        {item.label}
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex-1"></div>

                    <div className="space-y-6">
                        {ready && authenticated && dbUser ? (
                            <div className="bg-surface-200 dark:bg-white/5 rounded-2xl p-4 border border-surface-300 dark:border-white/10 space-y-3 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 bg-primary/10 blur-2xl rounded-full -mr-4 -mt-4 transition-all group-hover:bg-primary/20"></div>
                                <div className="flex items-center gap-2 text-sm font-bold dark:text-white relative z-10">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    Authenticated
                                </div>
                                <Button
                                    onClick={() => {
                                        if (dbUser.walletAddress) {
                                            navigator.clipboard.writeText(dbUser.walletAddress);
                                            alert("Address copied to clipboard!");
                                        }
                                    }}
                                    title="Click to copy address"
                                    className="w-full h-10 text-xs bg-surface-300 dark:bg-white/10 !text-slate-600 dark:!text-slate-300 shadow-none border border-surface-400 dark:border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all cursor-pointer truncate relative z-10"
                                >
                                    {dbUser.walletAddress ? `${dbUser.walletAddress.slice(0, 6)}...${dbUser.walletAddress.slice(-4)}` : 'Connected'}
                                </Button>
                                <Button
                                    onClick={logout}
                                    variant="ghost"
                                    className="w-full h-9 text-xs text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all relative z-10"
                                >
                                    Disconnect
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-surface-200 dark:bg-white/5 rounded-2xl p-4 border border-surface-300 dark:border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 bg-primary/10 blur-2xl rounded-full -mr-4 -mt-4"></div>
                                <Button
                                    onClick={login}
                                    disabled={!ready}
                                    className={cn(
                                        "w-full font-bold relative z-10 transition-all",
                                        ready && "dark:bg-primary dark:text-white dark:hover:bg-primary-dark dark:glow-primary"
                                    )}
                                >
                                    {ready && authenticated && userStatus === 'not-found' ? "Finalizing..." : "Connect Wallet"}
                                </Button>
                            </div>
                        )}
                        <div className="flex justify-center gap-4 pt-4 border-t border-surface-300 dark:border-white/10">
                            <a
                                href="#"
                                className="p-3 rounded-xl bg-surface-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all hover:scale-110 border border-transparent dark:hover:border-primary/30"
                            >
                                <Twitter size={20} />
                            </a>
                            <a
                                href="#"
                                className="p-3 rounded-xl bg-surface-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all hover:scale-110 border border-transparent dark:hover:border-primary/30"
                            >
                                <TikTokIcon size={20} />
                            </a>
                            <button
                                onClick={toggleDarkMode}
                                className="p-3 rounded-xl bg-surface-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-all hover:scale-110 border border-transparent dark:hover:border-amber-500/30"
                            >
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </>
    );
}
