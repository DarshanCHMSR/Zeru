import { ethers } from 'ethers';
import { useGasStore } from '@/store/gasStore';

interface ChainConfig {
  name: string;
  rpcUrl: string;
  blockTime: number; // in seconds
}

// Chain configurations
const CHAIN_CONFIGS = {
  ethereum: {
    name: 'Ethereum',
    rpcUrl: 'wss://eth-mainnet.g.alchemy.com/v2/demo', // Using demo endpoint
    blockTime: 12,
  },
  polygon: {
    name: 'Polygon',
    rpcUrl: 'wss://polygon-mainnet.g.alchemy.com/v2/demo', // Using demo endpoint
    blockTime: 2,
  },
  arbitrum: {
    name: 'Arbitrum',
    rpcUrl: 'wss://arb-mainnet.g.alchemy.com/v2/demo', // Using demo endpoint
    blockTime: 1,
  },
} as const;

type ChainKey = keyof typeof CHAIN_CONFIGS;

// Uniswap V3 ETH/USDC pool address
const UNISWAP_V3_ETH_USDC_POOL = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';

// Uniswap V3 Pool ABI (only the events we need)
const UNISWAP_V3_POOL_ABI = [
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
];

class Web3Service {
  private providers: Map<string, ethers.WebSocketProvider> = new Map();
  private isConnected: Map<string, boolean> = new Map();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeConnections();
  }

  private async initializeConnections() {
    const store = useGasStore.getState();
    store.setLoading(true);

    for (const [chainKey, config] of Object.entries(CHAIN_CONFIGS)) {
      try {
        await this.connectToChain(chainKey as keyof typeof CHAIN_CONFIGS, config);
      } catch (error) {
        console.error(`Failed to connect to ${chainKey}:`, error);
        store.setError(`Failed to connect to ${config.name}`);
      }
    }

    // Start ETH/USD price monitoring
    this.startUsdPriceMonitoring();
    store.setLoading(false);
  }

  private async connectToChain(chainKey: keyof typeof CHAIN_CONFIGS, config: ChainConfig) {
    const store = useGasStore.getState();

    try {
      // For demo purposes, we'll use HTTP providers instead of WebSocket to avoid connection issues
      const httpRpcUrl = config.rpcUrl.replace('wss://', 'https://').replace('/ws/', '/');
      const provider = new ethers.JsonRpcProvider(httpRpcUrl);

      // Test connection
      await provider.getBlockNumber();

      this.providers.set(chainKey, provider as any);
      this.isConnected.set(chainKey, true);
      store.setConnectionStatus(chainKey as ChainKey, true);

      console.log(`Connected to ${config.name}`);
      
      // Start monitoring blocks for this chain
      this.startBlockMonitoring(chainKey, config);

    } catch (error) {
      console.error(`Failed to connect to ${config.name}:`, error);
      this.isConnected.set(chainKey, false);
      store.setConnectionStatus(chainKey as ChainKey, false);
      
      // Retry connection after 5 seconds
      const timeout = setTimeout(() => {
        this.connectToChain(chainKey, config);
      }, 5000);
      
      this.reconnectTimeouts.set(chainKey, timeout);
    }
  }

  private async startBlockMonitoring(chainKey: string, config: ChainConfig) {
    const provider = this.providers.get(chainKey);
    if (!provider) return;

    const store = useGasStore.getState();

    // For demo purposes, we'll poll for latest block every 6 seconds instead of real-time
    const pollLatestBlock = async () => {
      try {
        const latestBlock = await provider.getBlock('latest');
        if (latestBlock) {
          let baseFee = 0;
          let priorityFee = 0;

          if (latestBlock.baseFeePerGas) {
            baseFee = Number(latestBlock.baseFeePerGas);
          }

          // Estimate priority fee (simplified)
          if (chainKey === 'ethereum') {
            // For Ethereum, we can get a more accurate priority fee
            try {
              const feeData = await provider.getFeeData();
              if (feeData.maxPriorityFeePerGas) {
                priorityFee = Number(feeData.maxPriorityFeePerGas);
              }
            } catch (error) {
              // Fallback to 2 Gwei
              priorityFee = Number(ethers.parseUnits('2', 'gwei'));
            }
          } else {
            // For other chains, use default priority fee
            priorityFee = Number(ethers.parseUnits('1', 'gwei'));
          }

          store.updateGas(chainKey as ChainKey, baseFee, priorityFee);
        }
      } catch (error) {
        console.error(`Error fetching block for ${chainKey}:`, error);
        store.setConnectionStatus(chainKey as ChainKey, false);
        
        // Retry connection
        setTimeout(() => {
          this.connectToChain(chainKey as keyof typeof CHAIN_CONFIGS, config);
        }, 5000);
      }
    };

    // Initial call
    await pollLatestBlock();

    // Set up interval polling
    setInterval(pollLatestBlock, 6000); // Poll every 6 seconds
  }

  private async startUsdPriceMonitoring() {
    const store = useGasStore.getState();
    
    // For demo purposes, we'll use a simulated ETH/USD price with some volatility
    const simulateEthPrice = () => {
      // Base price around $3000 with some random fluctuation
      const basePrice = 3000;
      const volatility = 0.02; // 2% volatility
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const currentPrice = basePrice * (1 + randomChange);
      
      store.setUsdPrice(currentPrice);
    };

    // Initial price
    simulateEthPrice();

    // Update price every 10 seconds
    setInterval(simulateEthPrice, 10000);

    /* 
    // Real implementation would look like this:
    try {
      const provider = this.providers.get('ethereum');
      if (!provider) return;

      const poolContract = new ethers.Contract(
        UNISWAP_V3_ETH_USDC_POOL,
        UNISWAP_V3_POOL_ABI,
        provider
      );

      // Listen for swap events
      poolContract.on('Swap', (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick) => {
        try {
          // Calculate ETH/USD price from sqrtPriceX96
          const price = this.calculatePriceFromSqrtPriceX96(sqrtPriceX96);
          store.setUsdPrice(price);
        } catch (error) {
          console.error('Error calculating price:', error);
        }
      });

      // Also get current price
      const slot0 = await poolContract.slot0();
      const currentPrice = this.calculatePriceFromSqrtPriceX96(slot0.sqrtPriceX96);
      store.setUsdPrice(currentPrice);

    } catch (error) {
      console.error('Error setting up USD price monitoring:', error);
      // Fallback to simulated price
      simulateEthPrice();
    }
    */
  }

  private calculatePriceFromSqrtPriceX96(sqrtPriceX96: bigint): number {
    // Convert sqrtPriceX96 to actual price
    // price = (sqrtPriceX96 ** 2 * 10**12) / (2**192)
    // Note: This is simplified - actual implementation would need precise decimal handling
    const sqrtPrice = Number(sqrtPriceX96) / (2 ** 96);
    const price = (sqrtPrice ** 2) * (10 ** 12); // Adjust for USDC decimals (6) vs ETH decimals (18)
    return price;
  }

  public async getCurrentGasPrices() {
    const store = useGasStore.getState();
    const results: Record<string, { baseFee: number; priorityFee: number }> = {};

    for (const [chainKey, provider] of this.providers.entries()) {
      try {
        const feeData = await provider.getFeeData();
        results[chainKey] = {
          baseFee: Number(feeData.gasPrice || 0),
          priorityFee: Number(feeData.maxPriorityFeePerGas || 0),
        };
      } catch (error) {
        console.error(`Error getting gas prices for ${chainKey}:`, error);
      }
    }

    return results;
  }

  public disconnect() {
    // Clean up connections
    for (const provider of this.providers.values()) {
      if (provider && 'destroy' in provider) {
        (provider as any).destroy();
      }
    }
    
    // Clear timeouts
    for (const timeout of this.reconnectTimeouts.values()) {
      clearTimeout(timeout);
    }
    
    this.providers.clear();
    this.isConnected.clear();
    this.reconnectTimeouts.clear();
  }
}

// Create singleton instance
let web3Service: Web3Service | null = null;

export const getWeb3Service = () => {
  if (!web3Service) {
    web3Service = new Web3Service();
  }
  return web3Service;
};

export default Web3Service;
