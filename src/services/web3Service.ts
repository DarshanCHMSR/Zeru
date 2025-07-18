import { ethers } from 'ethers';
import { useGasStore } from '@/store/gasStore';
import { DEV_CONFIG, devLog, isDevelopment } from '@/config/development';

interface ChainConfig {
  name: string;
  rpcUrl: string;
  fallbackUrls: readonly string[];
  blockTime: number; // in seconds
}

// Chain configurations with more reliable RPC endpoints
const CHAIN_CONFIGS = {
  ethereum: {
    name: 'Ethereum',
    rpcUrl: 'https://ethereum.publicnode.com',
    fallbackUrls: [
      'https://rpc.ankr.com/eth',
      'https://eth.llamarpc.com',
      'https://1rpc.io/eth',
      'https://cloudflare-eth.com',
      'https://ethereum.blockpi.network/v1/rpc/public'
    ],
    blockTime: 12,
  },
  polygon: {
    name: 'Polygon',
    rpcUrl: 'https://polygon.publicnode.com',
    fallbackUrls: [
      'https://rpc.ankr.com/polygon',
      'https://polygon.llamarpc.com',
      'https://1rpc.io/matic',
      'https://polygon.blockpi.network/v1/rpc/public',
      'https://polygon.drpc.org'
    ],
    blockTime: 2,
  },
  arbitrum: {
    name: 'Arbitrum',
    rpcUrl: 'https://arbitrum.publicnode.com',
    fallbackUrls: [
      'https://rpc.ankr.com/arbitrum',
      'https://arbitrum.llamarpc.com',
      'https://1rpc.io/arb',
      'https://arbitrum.blockpi.network/v1/rpc/public',
      'https://arbitrum.drpc.org'
    ],
    blockTime: 1,
  },
} as const;

type ChainKey = keyof typeof CHAIN_CONFIGS;

class Web3Service {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private isConnected: Map<string, boolean> = new Map();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeConnections();
  }

  private async initializeConnections() {
    const store = useGasStore.getState();
    store.setLoading(true);
    store.setError(null);

    // Start with simulated data immediately to provide fallback
    console.log('🚀 Starting Web3Service with fallback simulation...');
    this.startOfflineSimulation();

    // Start ETH/USD price monitoring
    this.startUsdPriceMonitoring();

    // Try to connect to all chains in parallel (with individual error handling)
    const connectionPromises = Object.entries(CHAIN_CONFIGS).map(async ([chainKey, config]) => {
      try {
        await this.connectToChain(chainKey as keyof typeof CHAIN_CONFIGS, config);
        return { chainKey, success: true };
      } catch (error) {
        console.error(`Failed to connect to ${chainKey}:`, error);
        return { chainKey, success: false, error };
      }
    });

    // Wait for all connection attempts to complete
    const results = await Promise.all(connectionPromises);
    
    // Check if any connections succeeded
    const successfulConnections = results.filter(result => result.success);
    
    if (successfulConnections.length === 0) {
      console.log('⚠️  No real blockchain connections available. Running in simulation mode.');
      store.setError('No blockchain connections available. Using simulated data.');
    } else {
      console.log(`✅ Successfully connected to ${successfulConnections.length}/${results.length} blockchain(s)`);
      if (successfulConnections.length < results.length) {
        const failedChains = results.filter(r => !r.success).map(r => r.chainKey);
        console.log(`⚠️  Failed to connect to: ${failedChains.join(', ')}. Using simulation for these chains.`);
      }
    }

    store.setLoading(false);
  }

  private async connectToChain(chainKey: keyof typeof CHAIN_CONFIGS, config: ChainConfig) {
    const store = useGasStore.getState();
    const urlsToTry = [config.rpcUrl, ...config.fallbackUrls];

    for (let i = 0; i < urlsToTry.length; i++) {
      const rpcUrl = urlsToTry[i];
      try {
        devLog(`Attempting to connect to ${config.name} using ${rpcUrl}`);
        
        // Create provider with better configuration
        const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
          batchMaxCount: 1,
          batchMaxSize: 1024,
          staticNetwork: true
        });

        // Test connection with shorter timeout and better error handling
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout (5s)')), DEV_CONFIG.connectionTimeout)
        );
        
        const blockNumber = await Promise.race([
          provider.getBlockNumber(),
          timeoutPromise
        ]);

        if (typeof blockNumber !== 'number' || blockNumber <= 0) {
          throw new Error('Invalid block number received');
        }

        this.providers.set(chainKey, provider);
        this.isConnected.set(chainKey, true);
        store.setConnectionStatus(chainKey as ChainKey, true);
        store.setError(null); // Clear any previous errors

        console.log(`✅ Successfully connected to ${config.name} using ${rpcUrl} (Block: ${blockNumber})`);
        
        // Start monitoring blocks for this chain
        this.startBlockMonitoring(chainKey, config);
        return; // Success, exit the retry loop

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`❌ Failed to connect to ${config.name} using ${rpcUrl}: ${errorMessage}`);
        
        // If this was the last URL to try, mark as failed
        if (i === urlsToTry.length - 1) {
          this.isConnected.set(chainKey, false);
          store.setConnectionStatus(chainKey as ChainKey, false);
          
          console.log(`🔄 All RPC endpoints failed for ${config.name}. Using simulation mode. Will retry in 30 seconds.`);
          
          // Schedule retry after 30 seconds
          const timeout = setTimeout(() => {
            console.log(`🔄 Retrying connection to ${config.name}...`);
            this.connectToChain(chainKey, config);
          }, 30000);
          
          this.reconnectTimeouts.set(chainKey, timeout);
        }
        // Continue to next URL
      }
    }
  }

  private async startBlockMonitoring(chainKey: string, config: ChainConfig) {
    const provider = this.providers.get(chainKey);
    if (!provider) return;

    const store = useGasStore.getState();
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

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
            } catch {
              // Fallback to 2 Gwei
              priorityFee = Number(ethers.parseUnits('2', 'gwei'));
            }
          } else {
            // For other chains, use default priority fee
            priorityFee = Number(ethers.parseUnits('1', 'gwei'));
          }

          store.updateGas(chainKey as ChainKey, baseFee, priorityFee);
          consecutiveErrors = 0; // Reset error counter on success
          
          // Ensure connection status is marked as true
          if (!this.isConnected.get(chainKey)) {
            this.isConnected.set(chainKey, true);
            store.setConnectionStatus(chainKey as ChainKey, true);
            console.log(`✅ ${config.name} connection restored`);
          }
        }
      } catch (error) {
        consecutiveErrors++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`⚠️  Error fetching block for ${chainKey} (${consecutiveErrors}/${maxConsecutiveErrors}): ${errorMessage}`);
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.log(`❌ ${config.name} connection lost after ${maxConsecutiveErrors} consecutive errors`);
          this.isConnected.set(chainKey, false);
          store.setConnectionStatus(chainKey as ChainKey, false);
          
          // Remove the failed provider
          this.providers.delete(chainKey);
          
          // Retry connection after 10 seconds
          setTimeout(() => {
            console.log(`🔄 Attempting to reconnect to ${config.name}...`);
            this.connectToChain(chainKey as keyof typeof CHAIN_CONFIGS, config);
          }, 10000);
          
          return; // Stop monitoring this chain
        }
      }
    };

    // Initial call
    await pollLatestBlock();

    // Set up interval polling
    const intervalId = setInterval(pollLatestBlock, 6000); // Poll every 6 seconds
    
    // Store interval ID for cleanup
    this.reconnectTimeouts.set(`${chainKey}_monitor`, intervalId as any);
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

  private startOfflineSimulation() {
    // Provide simulated gas prices as fallback when RPC connections fail
    const store = useGasStore.getState();
    
    console.log('🎭 Starting offline simulation for fallback data...');
    
    const simulateGasPrices = () => {
      const now = Date.now();
      
      // Generate realistic but fake gas prices with more variation
      const ethBase = Math.max(10, 15 + Math.random() * 40 - 10); // 10-45 Gwei with volatility
      const ethPriority = Math.max(0.5, 1 + Math.random() * 4 - 1); // 0.5-4 Gwei
      
      const polygonBase = Math.max(15, 25 + Math.random() * 100 - 25); // 15-125 Gwei  
      const polygonPriority = Math.max(0.5, 1 + Math.random() * 3 - 0.5); // 0.5-3.5 Gwei
      
      const arbitrumBase = Math.max(0.05, 0.2 + Math.random() * 0.6 - 0.15); // 0.05-0.65 Gwei
      const arbitrumPriority = Math.max(0.005, 0.02 + Math.random() * 0.08 - 0.015); // 0.005-0.085 Gwei
      
      // Convert to wei for consistency
      const ethBaseWei = ethBase * 1e9;
      const ethPriorityWei = ethPriority * 1e9;
      const polygonBaseWei = polygonBase * 1e9;
      const polygonPriorityWei = polygonPriority * 1e9;
      const arbitrumBaseWei = arbitrumBase * 1e9;
      const arbitrumPriorityWei = arbitrumPriority * 1e9;
      
      // Only update if we don't have real connections
      if (!this.isConnected.get('ethereum')) {
        store.updateGas('ethereum', ethBaseWei, ethPriorityWei);
      }
      if (!this.isConnected.get('polygon')) {
        store.updateGas('polygon', polygonBaseWei, polygonPriorityWei);
      }
      if (!this.isConnected.get('arbitrum')) {
        store.updateGas('arbitrum', arbitrumBaseWei, arbitrumPriorityWei);
      }
      
      // Log simulation status occasionally
      if (now % 60000 < 10000) { // Every ~minute
        const simulated = [];
        if (!this.isConnected.get('ethereum')) simulated.push('Ethereum');
        if (!this.isConnected.get('polygon')) simulated.push('Polygon');
        if (!this.isConnected.get('arbitrum')) simulated.push('Arbitrum');
        
        if (simulated.length > 0) {
          console.log(`🎭 Simulating gas prices for: ${simulated.join(', ')}`);
        }
      }
    };

    // Start simulation immediately
    simulateGasPrices();
    
    // Update every 8 seconds (slightly different from real data to add variety)
    setInterval(simulateGasPrices, 8000);
  }

  public disconnect() {
    // Clean up connections
    for (const provider of this.providers.values()) {
      if (provider && 'destroy' in provider) {
        provider.destroy?.();
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
