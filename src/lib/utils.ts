import { ethers } from 'ethers';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currently supported chains and their identifiers
export const SUPPORTED_CHAINS = {
  1: 'ethereum',
  8453: 'base',
  42161: 'arbitrum',
  56: 'bsc',
  43114: 'avax',
  10: 'optimism'
} as const;

export function isValidAddress(address: string): boolean {
  try {
    const normalizedAddress = address.toLowerCase();
    return ethers.isAddress(normalizedAddress);
  } catch (error) {
    return false;
  }
}

// Get appropriate provider for the given chain
export function getProviderForChain(chainId: number): ethers.JsonRpcProvider {
  const RPC_URLS = {
    1: 'https://ethereum.publicnode.com',
    8453: 'https://base.publicnode.com',
    42161: 'https://arbitrum.publicnode.com',
    56: 'https://bsc.publicnode.com',
    43114: 'https://avalanche.publicnode.com',
    10: 'https://optimism.publicnode.com'
  };

  if (!SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return new ethers.JsonRpcProvider(RPC_URLS[chainId as keyof typeof RPC_URLS]);
}