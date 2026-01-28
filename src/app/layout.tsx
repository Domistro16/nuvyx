"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Player } from "@/components/layout/player";
import { useState } from "react";
import { Menu } from "@/components/icons";
import Providers from "./providers";
import { AuthFlow } from "@/components/auth-flow";
import { PlayerProvider } from "@/providers/player-provider";
import { UserProvider } from "@/providers/user-provider";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>NUVYX | The Sound of the Blockchain</title>
        <meta name="description" content="NUVYX is a premium decentralized audio platform for discoverable vibes and on-chain music." />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#020617" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased bg-background text-foreground">
        <Providers>
          <UserProvider>
            <AuthFlow />
            <PlayerProvider>
              <div className="flex min-h-screen font-sans">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

                <main className="flex-1 min-w-0 lg:ml-80 pb-36 transition-all">
                  <header className="lg:hidden flex items-center justify-between p-4 sticky top-0 z-30 bg-surface-200/90 dark:bg-dark-100/90 backdrop-blur-md border-b border-surface-300 dark:border-dark-300">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSidebarOpen(true)}>
                        <Menu />
                      </button>
                      <span className="font-bold text-lg dark:text-white">NUVYX</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/20"></div>
                  </header>

                  <div className="max-w-7xl mx-auto px-4 py-8 lg:px-12 lg:py-16">
                    {children}
                  </div>
                </main>

                <Player />
              </div>
            </PlayerProvider>
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}
