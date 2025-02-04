'use client'

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, base, arbitrum, bsc, avalanche, optimism } from 'wagmi/chains'
import { useState } from 'react'

// Get projectId safely with fallback for build time
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Create wagmi config
const config = createConfig({
  chains: [mainnet, base, arbitrum, bsc, avalanche, optimism],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [optimism.id]: http()
  },
  ssr: true
})

// Create web3modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  defaultChain: mainnet,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
  },
  metadata: {
    name: 'Bitte Beefy Agent',
    description: 'Find the best yield opportunities across 23 chains',
    url: 'https://bitte-beefy-agent.vercel.app',
    icons: ['https://bitte-beefy-agent.vercel.app/beefy-agent-logo.png']
  }
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}