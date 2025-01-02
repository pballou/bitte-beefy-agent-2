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
  try {
    console.log('Encoding deposit transaction:', { vaultAddress, amount });
    const vault = new ethers.Contract(vaultAddress, BEEFY_VAULT_ABI, new ethers.VoidSigner('0x'));
    const data = vault.interface.encodeFunctionData('deposit', [amount]);
    console.log('Deposit transaction encoded successfully');
    return data;
  } catch (error) {
    console.error('Failed to encode deposit transaction:', error);
    throw new Error(`Failed to encode deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function encodeWithdrawTransaction(
  vaultAddress: string,
  amount: string
) {
  try {
    console.log('Encoding withdraw transaction:', { vaultAddress, amount });
    const vault = new ethers.Contract(vaultAddress, BEEFY_VAULT_ABI, new ethers.VoidSigner('0x'));
    const data = vault.interface.encodeFunctionData('withdraw', [amount]);
    console.log('Withdraw transaction encoded successfully');
    return data;
  } catch (error) {
    console.error('Failed to encode withdraw transaction:', error);
    throw new Error(`Failed to encode withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get user's vault token balance
export async function getVaultBalance(
  vaultAddress: string,
  userAddress: string,
  provider: ethers.Provider
) {
  try {
    console.log('Fetching vault balance:', { vaultAddress, userAddress });
    const contract = new ethers.Contract(
      vaultAddress,
      ['function balanceOf(address) external view returns (uint256)'],
      provider
    );
    
    const balance = await contract.balanceOf(userAddress);
    console.log('Vault balance retrieved:', { balance: balance.toString() });
    
    return {
      balance,
      decimals: 18
    };
  } catch (error) {
    console.error('Failed to get vault balance:', error);
    throw new Error(`Failed to get vault data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}