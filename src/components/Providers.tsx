'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterWallet } from '@/lib/farcasterConnector'; 
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base],
  connectors: [
    farcasterWallet(), // Primary: Uses Farcaster SDK (No popup)
    injected(),        // Fallback: For local browser testing (MetaMask/Rabby)
  ],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}