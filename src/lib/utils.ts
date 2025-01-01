import { ethers } from 'ethers';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currently supported chains and their identifiers
export const SUPPORTED_CHAINS = {
  1: 'ethereum'
} as const;

// Validate Ethereum address format
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
  if (!SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return new ethers.JsonRpcProvider('https://ethereum.publicnode.com');
}