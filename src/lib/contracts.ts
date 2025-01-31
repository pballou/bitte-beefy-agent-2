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