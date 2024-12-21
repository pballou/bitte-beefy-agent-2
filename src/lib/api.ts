import { BeefyResponse, BeefyVault } from './schemas';

// API endpoints for Beefy Finance
const BEEFY_API = {
  VAULTS: 'https://api.beefy.finance/vaults',
  APY: 'https://api.beefy.finance/apy',
  APY_BREAKDOWN: 'https://api.beefy.finance/apy/breakdown',
  TVL: 'https://api.beefy.finance/tvl',
} as const;

/**
 * Transforms and validates vault data
 */
function transformVaultData(
  vaults: Record<string, any>,
  apys: Record<string, number>,
  apyBreakdowns: Record<string, any>,
  tvls: Record<string, { [key: string]: number }>,
): BeefyVault[] {
  // Flatten TVL data from all chains
  const flatTvls = Object.values(tvls).reduce((acc, chainTvls) => ({
    ...acc,
    ...chainTvls
  }), {});

  return Object.values(vaults)
    .filter(vault => vault.status === 'active')
    .map(vault => {
      const breakdown = apyBreakdowns[vault.id];
      const apy = breakdown?.totalApy || apys[vault.id] || 0;
      const tvl = flatTvls[vault.id] || 0;
      
      return {
        name: vault.name,
        description: `Yield optimization for ${vault.name}`,
        apy: apy * 100,
        tvl: tvl,
        platform: vault.platformId,
        chain: vault.network || vault.chain,
        assets: vault.assets,
        risks: vault.risks,
        // Always use Beefy URL for consistency
        addLiquidityUrl: `https://app.beefy.com/vault/${vault.id}`
      };
    })
    .filter(vault => 
      vault.apy > 0 && 
      vault.apy < 1000 && 
      vault.tvl > 10000
    )
    .sort((a, b) => b.apy - a.apy)
    .slice(0, 20);
}

/**
 * Fetches and returns the top yield opportunities from Beefy Finance
 * @returns Promise with vault data and timestamp
 * @throws Error if API requests fail
 */
export async function getTopBeefyVaults(): Promise<BeefyResponse> {
  try {
    const [vaults, apys, apyBreakdowns, tvls] = await Promise.all([
      fetch(BEEFY_API.VAULTS).then(r => r.json()),
      fetch(BEEFY_API.APY).then(r => r.json()),
      fetch(BEEFY_API.APY_BREAKDOWN).then(r => r.json()),
      fetch(BEEFY_API.TVL).then(r => r.json())
    ]);

    const transformedVaults = transformVaultData(vaults, apys, apyBreakdowns, tvls);
    
    // Convert timestamp to human-readable date
    const currentDate = new Date().toISOString();
    
    return {
      vaults: transformedVaults,
      timestamp: currentDate
    };
  } catch (error: unknown) {
    console.error('Error fetching Beefy data:', error);
    throw new Error(`Failed to fetch Beefy data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
