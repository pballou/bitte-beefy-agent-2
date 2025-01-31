// Core ABIs needed for interacting with Beefy vaults
export const BEEFY_VAULT_ABI = [
  'function want() external view returns (address)',
  'function balance() external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function deposit(uint256)',
  'function withdraw(uint256)',
  'function getPricePerFullShare() external view returns (uint256)',
  'function name() external view returns (string)'
] as const;

// Interface for vault data
export interface BeefyVault {
  vaultId: string
  name: string
  address: string
  chainId: number
  token: string
  tokenAddress: string
  tokenDecimals: number
  apy: number
  tvl: number
}

// Type for transaction parameters
export type VaultTransactionParams = {
  vaultAddress: string;
  amount: bigint;
  chainId: number;
  gas?: {
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  };
};