'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ConnectButton } from '@/components/ui/ConnectButton'
import { useVaultContract } from '@/hooks/useVaultContract'
import { useAccount, useChainId, useSwitchChain, useBalance, usePublicClient, useWalletClient } from 'wagmi'
import { formatUnits, type Hash } from 'viem'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

// Core ABIs - only including methods we need
const WETH_ABI = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address","name": "spender","type": "address"},
      {"internalType": "uint256","name": "amount","type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool","name": "","type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Standard ERC20 ABI (just what we need)
const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address","name": "spender","type": "address"},
      {"internalType": "uint256","name": "amount","type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool","name": "","type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Map of wrapped native tokens by chain ID (e.g., WETH on Base)
const WRAPPED_NATIVE: Record<number, `0x${string}`> = {
  8453: '0x4200000000000000000000000000000000000006', // WETH on Base
  137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',  // WMATIC on Polygon
  // Add more as needed
}

// Helper to check if vault accepts native token (ETH, MATIC, etc)
const isNativeTokenVault = (tokenAddress: string): boolean => {
  return Object.values(WRAPPED_NATIVE).includes(tokenAddress as `0x${string}`)
}

// Create a separate component for the deposit form
function DepositForm() {
  const searchParams = useSearchParams()
  const { deposit } = useVaultContract()
  const { isConnected, address } = useAccount()
  const currentChainId = useChainId()  // renamed for clarity
  const { switchChain, isPending: isSwitchPending, error: switchError } = useSwitchChain()
  const [status, setStatus] = useState<'idle' | 'switching' | 'depositing' | 'confirming' | 'completed' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const publicClient = usePublicClient()
  const [isChainSwitching, setIsChainSwitching] = useState(false)
  const [txHash, setTxHash] = useState<string>()
  const { data: walletClient } = useWalletClient()

  // Get the target chain ID from URL params or current chain
  const targetChainId = searchParams.get('chainId') 
    ? parseInt(searchParams.get('chainId')!) 
    : currentChainId

  // Get ETH balance for the target chain
  const { data: balance } = useBalance({
    address: address,
    chainId: targetChainId,
    token: undefined
  })

  // Format balance with fewer decimals
  const formattedBalance = balance 
    ? Number(formatUnits(balance.value, balance.decimals)).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      })
    : '0'

  // Network names mapping
  const networks: Record<number, string> = {
    1: 'Ethereum',
    8453: 'Base',
    42161: 'Arbitrum One',
    56: 'BNB Smart Chain',
    43114: 'Avalanche',
    10: 'Optimism',
    137: 'Polygon',
    250: 'Fantom'
  }

  // Get network name
  const networkName = networks[targetChainId] || `Chain ID: ${targetChainId}`

  // Move debug logging into useEffect
  useEffect(() => {
    if (balance) {
      console.log('Current State:', {
        currentChainId,
        targetChainId,
        networkName,
        searchParams: Object.fromEntries(searchParams.entries()),
        balance: {
          value: balance.value.toString(),
          formatted: formattedBalance,
          symbol: balance.symbol
        }
      })
    }
  }, [balance, currentChainId, targetChainId, networkName, searchParams, formattedBalance])

  // Add this to prevent automatic deposit
  const [hasAttemptedDeposit, setHasAttemptedDeposit] = useState(false)

  // Format amount for display (convert from wei to ETH)
  const depositAmount = searchParams.get('amount')
    ? Number(formatUnits(BigInt(searchParams.get('amount') || '0'), 18)).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      })
    : '0'

  // Watch transaction status
  useEffect(() => {
    if (!txHash || !publicClient) return

    const waitForTransaction = async () => {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash as Hash,
          confirmations: 1,
          timeout: 5 * 60 * 1000, // 5 minutes
          onReplaced: (replacement) => {
            console.log('Transaction replaced:', replacement)
            // Handle replacement based on type
            if (replacement.reason === 'replaced' || replacement.reason === 'repriced') {
              setTxHash(replacement.transaction.hash)
            }
          }
        })
        
        setStatus('completed')
        console.log('Transaction settled:', receipt)
      } catch (error) {
        setStatus('error')
        setErrorMessage(
          error instanceof Error 
            ? `Transaction failed: ${error.message}` 
            : 'Transaction failed'
        )
        console.error('Transaction error:', error)
      }
    }

    waitForTransaction()

    // Add timeout for stuck transactions
    const timeout = setTimeout(() => {
      if (status === 'depositing' || status === 'confirming') {
        setStatus('error')
        setErrorMessage('Transaction timed out. Please try again.')
      }
    }, 5 * 60 * 1000)

    return () => {
      clearTimeout(timeout)
    }
  }, [txHash, publicClient, status])

  // Function to handle chain switching
  const handleChainSwitch = async () => {
    if (!targetChainId) return
    
    try {
      setIsChainSwitching(true)
      setStatus('switching')
      await switchChain({ chainId: targetChainId })
    } catch (error) {
      setStatus('error')
      setErrorMessage(
        error instanceof Error 
          ? `Failed to switch network: ${error.message}` 
          : 'Failed to switch network'
      )
      console.error('Chain switch error:', error)
    } finally {
      setIsChainSwitching(false)
    }
  }

  // Check if we're on the right chain
  const isWrongChain = isConnected && currentChainId !== targetChainId

  // Updated deposit handler
  const handleDeposit = async () => {
    if (!isConnected) throw new Error('Wallet not connected')
    if (!publicClient) throw new Error('Public client not initialized')
    if (!walletClient) throw new Error('Wallet client not initialized')

    try {
      if (isWrongChain) {
        await handleChainSwitch()
        return
      }

      const amount = BigInt(searchParams.get('amount') || '0')
      const vaultAddress = searchParams.get('vault') || ''
      const tokenAddress = searchParams.get('tokenAddress') || ''

      setStatus('depositing')

      // Handle deposit flow for both native tokens (requiring wrapping) and ERC20 tokens
      if (isNativeTokenVault(tokenAddress)) {
        // Native token flow (e.g., ETH -> WETH)
        setErrorMessage('Wrapping native token...')
        
        const wrapHash = await walletClient.writeContract({
          address: tokenAddress as `0x${string}`,
          abi: WETH_ABI,
          functionName: 'deposit',
          value: amount
        })
        await publicClient.waitForTransactionReceipt({ hash: wrapHash })
        
        setErrorMessage('Approving wrapped token...')
        const approveHash = await walletClient.writeContract({
          address: tokenAddress as `0x${string}`,
          abi: WETH_ABI,
          functionName: 'approve',
          args: [vaultAddress as `0x${string}`, amount]
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      } else {
        // Standard ERC20 token flow
        setErrorMessage('Approving token...')
        const approveHash = await walletClient.writeContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [vaultAddress as `0x${string}`, amount]
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      }

      // Final deposit step (same for both flows)
      setErrorMessage('Depositing to vault...')
      const depositHash = await deposit({
        vaultAddress,
        amount,
        chainId: targetChainId
      })

      setTxHash(depositHash)
      setStatus('confirming')

    } catch (error) {
      setStatus('error')
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Transaction failed'
      )
      console.error('Deposit error:', error)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Beefy Vault Deposit</h1>
        <ConnectButton />
      </div>

      <div className="max-w-md mx-auto bg-card p-6 rounded-lg shadow-lg space-y-6">
        {/* Status Messages */}
        {status === 'switching' && (
          <div className="text-yellow-500 p-4 bg-yellow-500/10 rounded-md">
            Switching to {networkName}...
          </div>
        )}
        
        {status === 'depositing' && (
          <div className="text-blue-500 p-4 bg-blue-500/10 rounded-md">
            Initiating deposit...
          </div>
        )}

        {status === 'confirming' && txHash && (
          <div className="text-blue-500 p-4 bg-blue-500/10 rounded-md">
            <div className="flex flex-col gap-2">
              <span>Waiting for confirmation...</span>
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm flex items-center gap-1 hover:underline"
              >
                View on Explorer <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="text-green-500 p-4 bg-green-500/10 rounded-md">
            Transaction completed! 
            {txHash && (
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="ml-2 text-sm flex items-center gap-1 hover:underline"
              >
                View on Explorer <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="text-red-500 p-4 bg-red-500/10 rounded-md">
            {errorMessage}
          </div>
        )}

        {/* Transaction Details */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h2 className="font-semibold text-lg mb-4">Transaction Details</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">{networkName}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{depositAmount} {balance?.symbol}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Vault</span>
              <a
                href={`https://app.beefy.com/vault/${searchParams.get('vaultId')}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <span className="font-mono text-xs">
                  {searchParams.get('vault')?.slice(0, 6)}...{searchParams.get('vault')?.slice(-4)}
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Balance</span>
              <span className="font-medium">{formattedBalance} {balance?.symbol}</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="text-center p-4 bg-primary/10 rounded-md">
            Please connect your wallet to continue
          </div>
        )}

        {/* Chain Switch Warning */}
        {isWrongChain && (
          <div className="text-yellow-500 p-4 bg-yellow-500/10 rounded-md mb-4">
            Please switch to {networkName} to continue
          </div>
        )}

        {/* Switch Chain Error */}
        {switchError && (
          <div className="text-red-500 p-4 bg-red-500/10 rounded-md mb-4">
            {switchError.message}
          </div>
        )}

        {/* Deposit Button */}
        {isConnected && status === 'idle' && (
          <Button 
            onClick={handleDeposit}
            disabled={isSwitchPending || isChainSwitching}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg"
            size="lg"
          >
            {isWrongChain 
              ? `Switch to ${networkName}`
              : `Deposit ${depositAmount} ${balance?.symbol}`
            }
          </Button>
        )}

        {/* Loading States */}
        {(isSwitchPending || isChainSwitching) && (
          <div className="text-primary p-4 bg-primary/10 rounded-md mb-4">
            Switching networks...
          </div>
        )}
      </div>
    </div>
  )
}

// Wrap the form in Suspense
export default function DepositPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DepositForm />
    </Suspense>
  )
}