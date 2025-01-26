'use client'

import { BEEFY_VAULT_ABI } from '@/lib/contracts'
import { type VaultTransactionParams } from '@/lib/contracts'
import { useWriteContract, useAccount, useReadContract } from 'wagmi'

export function useVaultContract() {
  const { isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const deposit = async ({ vaultAddress, amount, chainId }: VaultTransactionParams) => {
    if (!isConnected) throw new Error('Wallet not connected')

    try {
      return await writeContractAsync({
        address: vaultAddress as `0x${string}`,
        abi: BEEFY_VAULT_ABI,
        functionName: 'deposit',
        args: [amount],
        chainId
      })
    } catch (error) {
      console.error('Deposit error:', error)
      throw error instanceof Error 
        ? error 
        : new Error('Failed to deposit into vault')
    }
  }

  // Read functions
  const useVaultName = (vaultAddress?: `0x${string}`, chainId?: number) => {
    return useReadContract({
      address: vaultAddress,
      abi: BEEFY_VAULT_ABI,
      functionName: 'name',
      chainId
    })
  }

  return { deposit, useVaultName }
}