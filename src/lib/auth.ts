import { PrivyClient } from "@privy-io/server-auth";

const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!
);

export interface AuthClaims {
    userId: string;
    walletAddress?: string;
}

export async function verifyAuth(request: Request): Promise<AuthClaims | null> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];

    try {
        // Add a timeout to prevent long hangs
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Auth timeout")), 10000)
        );

        const verifiedClaims = await Promise.race([
            privy.verifyAuthToken(token),
            timeoutPromise
        ]) as { userId: string };

        // Get user details to extract wallet address
        let walletAddress: string | undefined;
        try {
            const user = await privy.getUser(verifiedClaims.userId);
            walletAddress = user?.wallet?.address;
        } catch {
            // Wallet lookup failed, continue without it
        }

        return {
            userId: verifiedClaims.userId,
            walletAddress
        };
    } catch (error) {
        console.error("JWT Verification failed:", error);
        return null;
    }
}

