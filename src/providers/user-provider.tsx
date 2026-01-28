"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

interface User {
    id: string;
    walletAddress: string;
    createdAt: string;
}

// Three-state system to definitively track user check status
type UserStatus = 'pending' | 'exists' | 'not-found';

interface UserContextType {
    dbUser: User | null;
    userStatus: UserStatus;
    isLoading: boolean;
    isSigning: boolean;
    checkUser: () => Promise<void>;
    registerUser: (signature: string) => Promise<void>;
    setIsSigning: (val: boolean) => void;
    setUserStatus: (status: UserStatus) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
    const [dbUser, setDbUser] = useState<User | null>(null);
    const [userStatus, setUserStatus] = useState<UserStatus>('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [isSigning, setIsSigning] = useState(false);

    const checkUser = async () => {
        if (!user?.wallet?.address) return;

        // Set pending while checking
        setUserStatus('pending');

        try {
            const token = await getAccessToken();
            const res = await fetch(`/api/auth/check?address=${user.wallet.address}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('[UserProvider] Check response status:', res.status);

            if (!res.ok) {
                console.error('[UserProvider] Check API failed:', res.status, res.statusText);
                setUserStatus('not-found');
                return;
            }

            const data = await res.json();
            console.log('[UserProvider] Check response data:', data);

            if (data.exists && data.user) {
                console.log('[UserProvider] User exists, setting status to exists');
                setDbUser(data.user);
                setUserStatus('exists');
            } else {
                console.log('[UserProvider] User not found, setting status to not-found');
                setDbUser(null);
                setUserStatus('not-found');
            }
        } catch (error) {
            console.error("Error checking user:", error);
            // On error, treat as not-found so user can try signing
            setUserStatus('not-found');
        } finally {
            setIsLoading(false);
        }
    };

    const registerUser = async (signature: string) => {
        if (!user?.wallet?.address) return;

        try {
            const token = await getAccessToken();
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    walletAddress: user.wallet.address,
                    signature,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setDbUser(data.user);
                setUserStatus('exists');
            } else {
                throw new Error("Registration failed");
            }
        } catch (error) {
            console.error("Error registering user:", error);
            await logout();
        }
    };

    useEffect(() => {
        if (ready) {
            if (authenticated) {
                checkUser();
            } else {
                // Reset state on logout
                setDbUser(null);
                setUserStatus('pending');
                setIsLoading(false);
            }
        }
    }, [ready, authenticated, user]);

    return (
        <UserContext.Provider value={{ dbUser, userStatus, isLoading, isSigning, checkUser, registerUser, setIsSigning, setUserStatus }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
