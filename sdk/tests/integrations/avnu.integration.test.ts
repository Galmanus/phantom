/**
 * AVNU Integration Tests
 * 
 * These tests make real API calls to AVNU.
 * Skip in CI or when network is unavailable.
 */

import { describe, it, expect, vi } from 'vitest';
import { fetchQuote, getTokenPriceUSD, getSupportedTokens } from '../src/integrations/avnu';

// Skip these tests in CI environment
const describeSkipCI = process.env.CI ? describe.skip : describe;

describeSkipCI('AVNU Integration', () => {
  describe('fetchQuote', () => {
    it('should fetch real quote from AVNU API', async () => {
      // Use Starknet Sepolia testnet tokens
      const quote = await fetchQuote({
        sellTokenAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d', // STRK
        buyTokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', // ETH
        sellAmount: BigInt(1000000000000000000n), // 1 STRK
        takerAddress: '0x1',
      });

      expect(quote).toBeDefined();
      expect(quote.sellTokenAddress).toBe('0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d');
      expect(quote.buyTokenAddress).toBe('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7');
      expect(quote.sellAmount).toBe(BigInt(1000000000000000000n));
      expect(quote.buyAmount).toBeGreaterThan(0n);
    });

    it('should handle slippage parameter', async () => {
      const quote = await fetchQuote({
        sellTokenAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
        buyTokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        sellAmount: BigInt(1000000000000000000n),
        takerAddress: '0x1',
        slippage: 50, // 0.5%
      });

      expect(quote).toBeDefined();
    });

    it('should reject invalid token address', async () => {
      await expect(
        fetchQuote({
          sellTokenAddress: '0xinvalid',
          buyTokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
          sellAmount: BigInt(1000000000000000000n),
          takerAddress: '0x1',
        })
      ).rejects.toThrow();
    });
  });

  describe('getTokenPriceUSD', () => {
    it('should fetch real token price', async () => {
      const price = await getTokenPriceUSD('0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d');
      
      expect(price).toBeGreaterThan(0);
      expect(price).toBeLessThan(1000); // STRK price sanity check
    });

    it('should return different prices for different tokens', async () => {
      const strkPrice = await getTokenPriceUSD('0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d');
      const ethPrice = await getTokenPriceUSD('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7');

      expect(strkPrice).not.toBe(ethPrice);
    });
  });

  describe('getSupportedTokens', () => {
    it('should fetch list of supported tokens', async () => {
      const tokens = await getSupportedTokens();

      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);

      // Check token structure
      const firstToken = tokens[0];
      expect(firstToken).toHaveProperty('address');
      expect(firstToken).toHaveProperty('symbol');
      expect(firstToken).toHaveProperty('name');
      expect(firstToken).toHaveProperty('decimals');
    });

    it('should include major tokens', async () => {
      const tokens = await getSupportedTokens();
      const symbols = tokens.map(t => t.symbol);

      // Should have at least STRK and ETH
      expect(symbols).toContainEqual(expect.stringMatching(/STRK/i));
      expect(symbols).toContainEqual(expect.stringMatching(/ETH/i));
    });
  });
});
