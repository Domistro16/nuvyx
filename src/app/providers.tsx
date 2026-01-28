"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

    return (
        <PrivyProvider
            appId={appId}
            config={{
                appearance: {
                    theme: "dark",
                    accentColor: "#676FFF",
                    logo: "https://your-logo-url",
                },
                embeddedWallets:
                {
                    ethereum: {
                        createOnLogin: "users-without-wallets"
                    }
                }

            }}
        >
            {children}
        </PrivyProvider>
    );
}
