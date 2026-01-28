"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";
import { useUser } from "@/providers/user-provider";

export function AuthFlow() {
    const { ready, authenticated, user, logout } = usePrivy();
    const { wallets } = useWallets();
    const { userStatus, isSigning, setIsSigning, registerUser } = useUser();
    const hasAttemptedRef = useRef<string | null>(null);

    useEffect(() => {
        const address = user?.wallet?.address;

        // Only run if Privy is ready and user is authenticated
        if (!ready || !authenticated || !address) return;

        // Wait while user check is pending
        if (userStatus === 'pending') return;

        // User already exists - no action needed
        if (userStatus === 'exists') return;

        // Already signing or already attempted for this address
        if (isSigning || hasAttemptedRef.current === address) return;

        // userStatus === 'not-found' - prompt for signature
        const handleNewUser = async () => {
            hasAttemptedRef.current = address;
            setIsSigning(true);

            try {
                const wallet = wallets.find((w) => w.address === address);

                if (!wallet) {
                    console.error("Wallet not found in useWallets");
                    setIsSigning(false);
                    return;
                }

                const message = `Welcome to Nuvyx\n\nSign this message to verifying your identity.\n\nWallet: ${address}`;

                try {
                    const signature = await wallet.sign(message);
                    await registerUser(signature);
                } catch (signError) {
                    console.error("User rejected signature or validation failed", signError);
                    // Reset so they can try again
                    hasAttemptedRef.current = null;
                    await logout();
                }
            } catch (error) {
                console.error("Auth flow error", error);
                hasAttemptedRef.current = null;
            } finally {
                setIsSigning(false);
            }
        };

        handleNewUser();
    }, [ready, authenticated, user, wallets, logout, userStatus, isSigning, setIsSigning, registerUser]);

    if (isSigning) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm text-white p-6">
                <div className="max-w-md w-full bg-surface-100 dark:bg-dark-200 border border-surface-300 dark:border-dark-300 rounded-3xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-primary/20">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 002.04 15.111m15.733-5.144c.545 2.158.827 4.409.827 6.732 0 2.008-.212 3.962-.617 5.848m-10.733-5.848V5a2 2 0 114 0v1m0 0V7m0-2h4m-4 2h4m-4 4h4m1 11.2a10.004 10.004 0 005.144-5.144m-1.557 3.072l-.088-1.558a8.007 8.007 0 01-3.147-3.146l-1.557-.088m1.557 3.072c-.662.05-1.332.074-2.012.074s-1.35-.024-2.012-.074m0 0L8.258 17.3a8.003 8.003 0 01-3.147-3.146l1.557-.088" /></svg>
                    </div>
                    <h2 className="text-2xl font-black mb-4 dark:text-white uppercase tracking-tight">Welcome to Nuvyx</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        To activate your account and access all features, please sign the verification message in your wallet.
                    </p>
                    <div className="flex items-center justify-center gap-3 text-sm font-medium text-slate-500 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20"></div>
                        Waiting for Signature...
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

