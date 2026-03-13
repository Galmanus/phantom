'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from '@starknet-react/core'
import { CallData } from 'starknet'
import { fetchQuote, buildSwapCalldata, type AVNUQuote } from '@/sdk/src/integrations/avnu'
import { useWalletStore } from '@/store/walletStore'
import { parseWalletError } from '@/lib/wallet-errors'
import { WalletConnector } from '@/components/wallet/WalletConnector'

// Supported input assets
const BTC_ASSETS = [
  { symbol: 'wBTC', label: 'Wrapped Bitcoin', addressKey: 'wBTC', decimals: 8 },
  { symbol: 'tBTC', label: 'tBTC',            addressKey: 'tBTC', decimals: 18 },
  { symbol: 'LBTC', label: 'Liquid Bitcoin',  addressKey: 'LBTC', decimals: 8 },
  { symbol: 'SolvBTC', label: 'Solv Bitcoin', addressKey: 'SolvBTC', decimals: 18 },
] as const

type BTCAssetKey = typeof BTC_ASSETS[number]['addressKey']

export default function SwapPage() {
  const { account, address } = useAccount()
  const { setTransactionState, setLastTransactionHash, transactionState } = useWalletStore()

  // Form state
  const [inputAsset, setInputAsset] = useState<BTCAssetKey>('wBTC')
  const [inputAmount, setInputAmount] = useState('')
  const [slippage, setSlippage] = useState(50) // 0.5% padrão

  // Quote state
  const [quote, setQuote] = useState<AVNUQuote | null>(null)
  const [isFetchingQuote, setIsFetchingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  // Transaction state
  const [txError, setTxError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getTokenAddress = useCallback((key: BTCAssetKey): string => {
    const addresses: Record<BTCAssetKey, string> = {
      wBTC: process.env.NEXT_PUBLIC_TOKEN_WBTC || '',
      tBTC: process.env.NEXT_PUBLIC_TOKEN_TBTC || '',
      LBTC: process.env.NEXT_PUBLIC_TOKEN_LBTC || '',
      SolvBTC: process.env.NEXT_PUBLIC_TOKEN_SOLVBTC || '',
    }
    return addresses[key]
  }, [])

  const strkBtcAddress = process.env.NEXT_PUBLIC_STRKBTC_ADDRESS || ''
  const selectedAsset = BTC_ASSETS.find(a => a.addressKey === inputAsset)!

  // Converter amount string para bigint (respeitando decimais do asset)
  const parseInputAmount = useCallback((): bigint | null => {
    const parsed = parseFloat(inputAmount)
    if (isNaN(parsed) || parsed <= 0) return null
    return BigInt(Math.floor(parsed * 10 ** selectedAsset.decimals))
  }, [inputAmount, selectedAsset])

  // ─── Fetch quote com debounce ───────────────────────────────────────────

  const fetchSwapQuote = useCallback(async () => {
    const amountBigInt = parseInputAmount()
    if (!amountBigInt || !address) {
      setQuote(null)
      return
    }

    const sellAddress = getTokenAddress(inputAsset)
    if (!sellAddress) {
      setQuoteError(`Token address not configured for ${inputAsset}. Set NEXT_PUBLIC_TOKEN_${inputAsset.toUpperCase()} in .env.local`)
      return
    }
    if (!strkBtcAddress) {
      setQuoteError('strkBTC address not configured. Set NEXT_PUBLIC_STRKBTC_ADDRESS in .env.local')
      return
    }

    setIsFetchingQuote(true)
    setQuoteError(null)

    try {
      const q = await fetchQuote({
        sellTokenAddress: sellAddress,
        buyTokenAddress: strkBtcAddress,
        sellAmount: amountBigInt,
        takerAddress: address,
        slippage,
      })
      setQuote(q)
    } catch (error) {
      setQuoteError(parseWalletError(error))
      setQuote(null)
    } finally {
      setIsFetchingQuote(false)
    }
  }, [parseInputAmount, address, inputAsset, getTokenAddress, strkBtcAddress, slippage])

  // Auto-fetch quote com debounce quando amount muda
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null)
      return
    }
    const timer = setTimeout(fetchSwapQuote, 600)
    return () => clearTimeout(timer)
  }, [inputAmount, inputAsset, fetchSwapQuote])

  // ─── Execute swap ─────────────────────────────────────────────────────────

  const handleSwap = async () => {
    if (!account || !address || !quote) return

    setTxError(null)
    setTxHash(null)
    setTransactionState('approving')

    try {
      const amountBigInt = parseInputAmount()
      if (!amountBigInt) throw new Error('Invalid amount')

      const sellAddress = getTokenAddress(inputAsset)
      if (!sellAddress) throw new Error(`Token address not configured for ${inputAsset}`)

      // Calcular minAmountOut com slippage
      const slippageFactor = BigInt(10000 - slippage)
      const minAmountOut = (quote.buyAmount * slippageFactor) / 10000n

      // 1. Approve AVNU Router para gastar tokens
      setTransactionState('approving')
      const AVNU_ROUTER = process.env.NEXT_PUBLIC_AVNU_ROUTER_ADDRESS || ''
      if (!AVNU_ROUTER) throw new Error('AVNU router address not configured. Set NEXT_PUBLIC_AVNU_ROUTER_ADDRESS in .env.local')

      const approveCall = {
        contractAddress: sellAddress,
        entrypoint: 'approve',
        calldata: CallData.compile({
          spender: AVNU_ROUTER,
          amount: {
            low: amountBigInt & BigInt('0xffffffffffffffffffffffffffffffff'),
            high: amountBigInt >> 128n,
          },
        }),
      }

      // 2. Executar swap via AVNU
      setTransactionState('submitting')
      const swapCalldata = buildSwapCalldata(quote, address, minAmountOut)

      const swapCall = {
        contractAddress: AVNU_ROUTER,
        entrypoint: 'multi_route_swap',
        calldata: swapCalldata,
      }

      const result = await account.execute([approveCall, swapCall])
      setTxHash(result.transaction_hash)
      setLastTransactionHash(result.transaction_hash)
      setTransactionState('success')
      setInputAmount('')
      setQuote(null)
    } catch (error) {
      const friendly = parseWalletError(error)
      setTxError(friendly)
      setTransactionState('error')
    }
  }

  // ─── Formatação ───────────────────────────────────────────────────────────

  const formatAmount = (amount: bigint, decimals: number): string => {
    const divisor = 10n ** BigInt(decimals)
    const whole = amount / divisor
    const frac = amount % divisor
    return `${whole}.${frac.toString().padStart(decimals, '0').slice(0, 6).replace(/0+$/, '') || '0'}`
  }

  const isSubmitting = transactionState === 'approving' || transactionState === 'submitting'
  const canSwap = !!account && !!quote && !isSubmitting && parseInputAmount() !== null

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-void pt-24 pb-16 px-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/30
                            flex items-center justify-center">
              <svg className="w-5 h-5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-parchment">Get strkBTC</h1>
              <p className="text-xs text-secondary">Powered by AVNU DEX Aggregator</p>
            </div>
          </div>
        </div>

        {/* Swap Card */}
        <div className="bg-panel border border-subtle rounded-2xl p-6 space-y-4">

          {/* Input: Sell */}
          <div className="bg-surface border border-subtle rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-secondary uppercase tracking-wider">You sell</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.0"
                value={inputAmount}
                onChange={e => setInputAmount(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 bg-transparent text-2xl font-mono text-parchment
                           outline-none placeholder-muted disabled:opacity-50"
                min="0"
                step="any"
              />
              <select
                value={inputAsset}
                onChange={e => setInputAsset(e.target.value as BTCAssetKey)}
                disabled={isSubmitting}
                className="bg-void border border-subtle rounded-lg px-3 py-2
                           text-sm font-mono text-parchment outline-none
                           focus:border-amber/50 disabled:opacity-50"
              >
                {BTC_ASSETS.map(a => (
                  <option key={a.addressKey} value={a.addressKey}>{a.symbol}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-amber/10 border border-amber/30
                            flex items-center justify-center">
              <svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Output: Buy */}
          <div className="bg-surface border border-subtle rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-secondary uppercase tracking-wider">You receive</span>
              <span className="text-xs font-mono text-zk-green">Private by default</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-2xl font-mono text-parchment">
                {isFetchingQuote ? (
                  <span className="text-muted animate-pulse">Quoting...</span>
                ) : quote ? (
                  formatAmount(quote.buyAmount, 8)
                ) : (
                  <span className="text-muted">0.0</span>
                )}
              </div>
              <div className="px-3 py-2 bg-amber/10 border border-amber/30 rounded-lg">
                <span className="text-sm font-mono text-amber">strkBTC</span>
              </div>
            </div>
          </div>

          {/* Quote details */}
          {quote && !isFetchingQuote && (
            <div className="bg-void/50 rounded-xl p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-secondary">Rate</span>
                <span className="text-parchment">
                  1 {selectedAsset.symbol} = {quote.price.toFixed(6)} strkBTC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Price impact</span>
                <span className={quote.priceImpact > 1 ? 'text-error' : 'text-parchment'}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Route</span>
                <span className="text-parchment">
                  {quote.route.map(r => r.name).join(' → ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Slippage</span>
                <span className="text-parchment">{(slippage / 100).toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* Slippage setting */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-secondary">Slippage:</span>
            <select
              value={slippage}
              onChange={e => setSlippage(Number(e.target.value))}
              disabled={isSubmitting}
              className="bg-void border border-subtle rounded px-2 py-1 text-parchment"
            >
              <option value={30}>0.3%</option>
              <option value={50}>0.5%</option>
              <option value={100}>1.0%</option>
              <option value={300}>3.0%</option>
            </select>
          </div>

          {/* Erros */}
          {quoteError && (
            <div className="bg-error/10 border border-error/30 rounded-xl p-3">
              <p className="text-xs text-error font-mono">{quoteError}</p>
            </div>
          )}
          {txError && (
            <div className="bg-error/10 border border-error/30 rounded-xl p-3">
              <p className="text-xs text-error font-mono">{txError}</p>
            </div>
          )}

          {/* Sucesso */}
          {transactionState === 'success' && txHash && (
            <div className="bg-zk-green/10 border border-zk-green/30 rounded-xl p-3">
              <p className="text-xs text-zk-green font-mono">
                Swap confirmed!{' '}
                <a
                  href={`https://sepolia.starkscan.co/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on explorer ↗
                </a>
              </p>
            </div>
          )}

          {/* Wallet / Swap button */}
          {!account ? (
            <WalletConnector />
          ) : (
            <button
              onClick={handleSwap}
              disabled={!canSwap}
              className="w-full py-4 rounded-xl font-mono text-sm uppercase tracking-wider
                         transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                         bg-amber text-void font-bold hover:bg-amber/90
                         disabled:bg-subtle disabled:text-muted"
            >
              {isSubmitting
                ? transactionState === 'approving'
                  ? 'Approving...'
                  : 'Swapping...'
                : 'Swap'}
            </button>
          )}
        </div>

        {/* Info */}
        <p className="text-center text-xs text-muted mt-4 font-mono">
          strkBTC is private by default via Starknet STRK20 protocol
        </p>

      </div>
    </div>
  )
}
