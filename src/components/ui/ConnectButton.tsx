'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'

export function ConnectButton() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  // Format address for display (0x1234...5678)
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="flex gap-2">
      {isConnected && (
        <button
          onClick={() => open({ view: 'Networks' })}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md"
        >
          Chain: {chainId}
        </button>
      )}
      <button 
        onClick={() => open()}
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
      >
        {isConnected && address ? formatAddress(address) : 'Connect Wallet'}
      </button>
    </div>
  )
}