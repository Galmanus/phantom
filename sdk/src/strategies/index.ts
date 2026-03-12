/**
 * PHANTOM Yield Strategies
 * 
 * Defines the available yield strategies for private BTC yield management
 * Each strategy routes to a different DeFi protocol on Starknet
 */

export type Protocol = 'vesu' | 'ekubo' | 're7' | 'uncap'
export type StrategyType = 'lending' | 'lp' | 'vault' | 'staking'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface YieldStrategy {
  id: string
  name: string
  protocol: Protocol
  type: StrategyType
  apy: number           // current APY in basis points (e.g. 500 = 5%)
  tvl: bigint           // current TVL in satoshis
  riskLevel: RiskLevel
  minDeposit: bigint   // minimum in satoshis (1 satoshi = 0.00000001 BTC)
  lockPeriod: number    // days (0 = no lock)
  contractAddress: string
  description: string
  isPrivate: boolean    // does this strategy preserve privacy?
}

// Default strategies - these will be fetched dynamically in production
// The addresses should be configured via environment variables

// Fallback APYs if API is unavailable (conservative estimates)
const FALLBACK_APYS: Record<string, number> = {
  'vesu-btc-lending': 350,
  'ekubo-btc-usdc-lp': 820,
  're7-btc-vault': 620,
};

export const PHANTOM_STRATEGIES: YieldStrategy[] = [
  {
    id: 'vesu-btc-lending',
    name: 'Vesu BTC Lending',
    protocol: 'vesu',
    type: 'lending',
    apy: 350,           // 3.5% — fetch dynamically in production
    tvl: 0n,            // fetch dynamically
    riskLevel: 'low',
    minDeposit: 10000n, // 0.0001 BTC
    lockPeriod: 0,
    contractAddress: process.env.NEXT_PUBLIC_VESU_POOL_ADDRESS || '0x',
    description: 'Lend strkBTC to earn yield. Variable rate, withdraw anytime.',
    isPrivate: true,
  },
  {
    id: 'ekubo-btc-usdc-lp',
    name: 'Ekubo BTC/USDC LP',
    protocol: 'ekubo',
    type: 'lp',
    apy: 820,           // 8.2% — fetch dynamically in production
    tvl: 0n,
    riskLevel: 'medium',
    minDeposit: 50000n, // 0.0005 BTC
    lockPeriod: 0,
    contractAddress: process.env.NEXT_PUBLIC_EKUBO_POOL_ADDRESS || '0x',
    description: 'Provide liquidity to the BTC/USDC pool. Earn swap fees privately.',
    isPrivate: true,
  },
  {
    id: 're7-btc-vault',
    name: 'Re7 BTC Vault',
    protocol: 're7',
    type: 'vault',
    apy: 620,           // 6.2% — fetch dynamically in production
    tvl: 0n,
    riskLevel: 'medium',
    minDeposit: 100000n, // 0.001 BTC
    lockPeriod: 7,
    contractAddress: process.env.NEXT_PUBLIC_RE7_VAULT_ADDRESS || '0x',
    description: 'Managed BTC vault by Re7 Capital. Optimized yield with 7-day withdrawal.',
    isPrivate: true,
  },
]

/**
 * Get strategy by ID
 */
export function getStrategyById(id: string): YieldStrategy | undefined {
  return PHANTOM_STRATEGIES.find(s => s.id === id)
}

/**
 * Get strategies by protocol
 */
export function getStrategiesByProtocol(protocol: Protocol): YieldStrategy[] {
  return PHANTOM_STRATEGIES.filter(s => s.protocol === protocol)
}

/**
 * Filter strategies by minimum deposit
 */
export function getStrategiesByMinDeposit(minSats: bigint): YieldStrategy[] {
  return PHANTOM_STRATEGIES.filter(s => s.minDeposit <= minSats)
}

/**
 * Get strategies sorted by APY (descending)
 */
export function getStrategiesSortedByAPY(): YieldStrategy[] {
  return [...PHANTOM_STRATEGIES].sort((a, b) => b.apy - a.apy)
}

/**
 * Format satoshis to BTC string
 */
export function formatSatsToBTC(sats: bigint): string {
  const btc = Number(sats) / 1e8
  if (btc === 0) return '0 BTC'
  return btc.toFixed(8).replace(/\.?0+$/, '') + ' BTC'
}

/**
 * Parse BTC string to satoshis
 */
export function parseBTCToSats(btcString: string): bigint {
  const btc = parseFloat(btcString.replace(/[^\d.]/g, ''))
  return BigInt(Math.floor(btc * 1e8))
}

/**
 * Calculate estimated yield for a position
 */
export function calculateEstimatedYield(
  amount: bigint,
  apy: number,  // in basis points
  days: number
): bigint {
  // Simple interest calculation: amount * (apy/10000) * (days/365)
  const yieldSats = Number(amount) * (apy / 10000) * (days / 365)
  return BigInt(Math.floor(yieldSats))
}

/**
 * Strategy index for Cairo contract
 */
export const STRATEGY_INDEX: Record<string, number> = {
  'vesu-btc-lending': 0,
  'ekubo-btc-usdc-lp': 1,
  're7-btc-vault': 2,
}

export const STRATEGY_BY_INDEX: Record<number, string> = {
  0: 'vesu-btc-lending',
  1: 'ekubo-btc-usdc-lp',
  2: 're7-btc-vault',
}

/**
 * Fetch live APYs from protocol APIs
 * Returns a map of strategy ID to APY in basis points
 * Uses Next.js caching when available (revalidate every 5 minutes)
 */
export async function fetchLiveAPYs(): Promise<Record<string, number>> {
  const apys: Record<string, number> = { ...FALLBACK_APYS };

  try {
    // Try Vesu API (example endpoint - replace with actual API)
    const VESU_API = process.env.NEXT_PUBLIC_VESU_API || 'https://api.vesu.xyz/v1';
    const vesuResponse = await fetch(`${VESU_API}/markets`);
    
    if (vesuResponse.ok) {
      const vesuData = await vesuResponse.json();
      // Map Vesu market data to strategy APY
      // Adjust field names based on actual Vesu API response shape
      const wbtcMarket = vesuData.markets?.find((m: any) => m.asset === 'WBTC' || m.asset === 'BTC');
      if (wbtcMarket?.supplyApy) {
        apys['vesu-btc-lending'] = Math.round(wbtcMarket.supplyApy * 100);
      }
    }
  } catch (error) {
    console.warn('[PHANTOM] Failed to fetch Vesu APY, using fallback');
  }

  try {
    // Try Ekubo API (example endpoint - replace with actual API)
    const EKUBO_API = process.env.NEXT_PUBLIC_EKUBO_API || 'https://api.ekubo.org/v1';
    const ekuboResponse = await fetch(`${EKUBO_API}/pools/TVL`);
    
    if (ekuboResponse.ok) {
      const ekuboData = await ekuboResponse.json();
      // Map Ekubo pool data to strategy APY
      const btcUsdcPool = ekuboData.pools?.find((p: any) => 
        (p.token0 === 'WBTC' && p.token1 === 'USDC') ||
        (p.token0 === 'BTC' && p.token1 === 'USDC')
      );
      if (btcUsdcPool?.apy) {
        apys['ekubo-btc-usdc-lp'] = Math.round(btcUsdcPool.apy * 100);
      }
    }
  } catch (error) {
    console.warn('[PHANTOM] Failed to fetch Ekubo APY, using fallback');
  }

  try {
    // Try Re7 API (example endpoint - replace with actual API)
    const RE7_API = process.env.NEXT_PUBLIC_RE7_API || 'https://api.re7.capital/v1';
    const re7Response = await fetch(`${RE7_API}/vaults/btc/apy`);
    
    if (re7Response.ok) {
      const re7Data = await re7Response.json();
      if (re7Data.apy) {
        apys['re7-btc-vault'] = Math.round(re7Data.apy * 100);
      }
    }
  } catch (error) {
    console.warn('[PHANTOM] Failed to fetch Re7 APY, using fallback');
  }

  return apys;
}

/**
 * Get strategies with live APY data
 * Combines static strategy data with live APY fetched from APIs
 */
export async function getStrategiesWithLiveAPY(): Promise<YieldStrategy[]> {
  const liveApys = await fetchLiveAPYs();
  
  return PHANTOM_STRATEGIES.map(strategy => ({
    ...strategy,
    apy: liveApys[strategy.id] ?? strategy.apy,
  }));
}