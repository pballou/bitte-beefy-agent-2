import { ethers } from 'ethers';
import { BEEFY_API } from './api';

// Core ABIs needed for interacting with Beefy vaults
const BEEFY_VAULT_ABI = [
  'function want() external view returns (address)',
  'function balance() external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function deposit(uint256)',
  'function withdraw(uint256)',
  'function getPricePerFullShare() external view returns (uint256)'
];

interface BeefyVaultInfo {
  earnContractAddress: string;
  tokenDecimals: number;
  status: string;
  id: string;
  network: string;
  [key: string]: any;
}

// Helper functions to encode transaction data for vault interactions
export async function encodeDepositTransaction(
  vaultAddress: string,
  amount: string
) {
  const vault = new ethers.Contract(vaultAddress, BEEFY_VAULT_ABI, new ethers.VoidSigner('0x'));
  return vault.interface.encodeFunctionData('deposit', [amount]);
}

export async function encodeWithdrawTransaction(
  vaultAddress: string,
  amount: string
) {
  const vault = new ethers.Contract(vaultAddress, BEEFY_VAULT_ABI, new ethers.VoidSigner('0x'));
  return vault.interface.encodeFunctionData('withdraw', [amount]);
}

// Get user's vault token balance
export async function getVaultBalance(
  vaultAddress: string,
  userAddress: string,
  provider: ethers.Provider
) {
  try {
    const contract = new ethers.Contract(
      vaultAddress,
      ['function balanceOf(address) external view returns (uint256)'],
      provider
    );
    
    const balance = await contract.balanceOf(userAddress);
    
    return {
      balance,
      decimals: 18  // Standard for Beefy vault tokens
    };
  } catch (error) {
    throw new Error(`Failed to get vault data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}