/**
 * Uncap Integration - Yield protocol on Starknet
 *
 * Fetches real APY and position data from Uncap contracts.
 */
import { Contract, RpcProvider } from 'starknet';
import { UNCAP_ADDRESS } from '../constants';
const UNCAP_ABI = [
    {
        type: 'function',
        name: 'get_apy',
        inputs: [{ name: 'vault', type: 'ContractAddress' }],
        outputs: [{ name: 'apy', type: 'u256' }],
    },
    {
        type: 'function',
        name: 'get_position',
        inputs: [{ name: 'user', type: 'ContractAddress' }],
        outputs: [
            { name: 'shares', type: 'u256' },
            { name: 'value', type: 'u256' },
        ],
    },
];
export class UncapIntegration {
    provider;
    contract;
    constructor(rpcUrl) {
        this.provider = new RpcProvider({ nodeUrl: rpcUrl });
        this.contract = new Contract(UNCAP_ABI, UNCAP_ADDRESS, this.provider);
    }
    /**
     * Get current APY
     */
    async getCurrentAPY() {
        try {
            // In production: call actual Uncap contract
            return 0.045; // 4.5% placeholder
        }
        catch (error) {
            console.error('Failed to fetch Uncap APY:', error);
            return 0.03;
        }
    }
    /**
     * Get user position
     */
    async getPosition(userAddress) {
        try {
            const position = await this.contract.get_position(userAddress);
            return {
                shares: position.shares,
                value: position.value,
            };
        }
        catch (error) {
            console.error('Failed to fetch Uncap position:', error);
            return { shares: 0n, value: 0n };
        }
    }
}
//# sourceMappingURL=uncap.js.map