// Debug utility for testing RPC connections
import { ethers } from 'ethers';

export interface RpcTestResult {
  url: string;
  success: boolean;
  blockNumber?: number;
  latency?: number;
  error?: string;
}

export class RpcDebugger {
  static async testRpcEndpoint(url: string, timeout: number = 5000): Promise<RpcTestResult> {
    const start = Date.now();
    
    try {
      const provider = new ethers.JsonRpcProvider(url, undefined, {
        batchMaxCount: 1,
        batchMaxSize: 1024,
        staticNetwork: true
      });

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), timeout)
      );

      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        timeoutPromise
      ]);

      const latency = Date.now() - start;
      
      return {
        url,
        success: true,
        blockNumber,
        latency
      };
    } catch (error) {
      const latency = Date.now() - start;
      return {
        url,
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async testAllEndpoints(endpoints: string[], timeout: number = 5000): Promise<RpcTestResult[]> {
    console.log(`🔍 Testing ${endpoints.length} RPC endpoints...`);
    
    const results = await Promise.all(
      endpoints.map(url => this.testRpcEndpoint(url, timeout))
    );

    // Sort by success and latency
    results.sort((a, b) => {
      if (a.success && !b.success) return -1;
      if (!a.success && b.success) return 1;
      return (a.latency || 0) - (b.latency || 0);
    });

    // Log results
    console.log('\n📊 RPC Endpoint Test Results:');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const latency = result.latency ? `${result.latency}ms` : 'N/A';
      const block = result.blockNumber ? `Block: ${result.blockNumber}` : '';
      const error = result.error ? `Error: ${result.error}` : '';
      
      console.log(`${status} ${index + 1}. ${result.url} (${latency}) ${block} ${error}`);
    });

    return results;
  }

  static async findBestEndpoint(endpoints: string[], timeout: number = 5000): Promise<string | null> {
    const results = await this.testAllEndpoints(endpoints, timeout);
    const working = results.find(r => r.success);
    return working?.url || null;
  }

  static async diagnoseConnectionIssues(chainName: string, endpoints: string[]) {
    console.log(`\n🔧 Diagnosing connection issues for ${chainName}...`);
    
    const results = await this.testAllEndpoints(endpoints);
    const working = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n📈 Summary for ${chainName}:`);
    console.log(`✅ Working endpoints: ${working.length}/${results.length}`);
    console.log(`❌ Failed endpoints: ${failed.length}/${results.length}`);

    if (working.length === 0) {
      console.log('⚠️  No working endpoints found. Possible issues:');
      console.log('   - Network connectivity problems');
      console.log('   - All RPC providers are down');
      console.log('   - Firewall/proxy blocking requests');
      console.log('   - Rate limiting from providers');
    } else {
      console.log(`✅ Best endpoint: ${working[0].url} (${working[0].latency}ms)`);
    }

    return {
      working,
      failed,
      bestEndpoint: working[0]?.url || null
    };
  }
}

// Development helper function
export const debugRpcConnections = async () => {
  if (process.env.NODE_ENV !== 'development') return;

  const chains = {
    ethereum: [
      'https://ethereum.publicnode.com',
      'https://rpc.ankr.com/eth',
      'https://eth.llamarpc.com',
      'https://1rpc.io/eth',
      'https://cloudflare-eth.com',
      'https://ethereum.blockpi.network/v1/rpc/public'
    ],
    polygon: [
      'https://polygon.publicnode.com',
      'https://rpc.ankr.com/polygon',
      'https://polygon.llamarpc.com',
      'https://1rpc.io/matic',
      'https://polygon.blockpi.network/v1/rpc/public',
      'https://polygon.drpc.org'
    ],
    arbitrum: [
      'https://arbitrum.publicnode.com',
      'https://rpc.ankr.com/arbitrum',
      'https://arbitrum.llamarpc.com',
      'https://1rpc.io/arb',
      'https://arbitrum.blockpi.network/v1/rpc/public',
      'https://arbitrum.drpc.org'
    ]
  };

  for (const [chainName, endpoints] of Object.entries(chains)) {
    await RpcDebugger.diagnoseConnectionIssues(chainName, endpoints);
  }
};
