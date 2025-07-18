'use client';

import React, { useEffect } from 'react';
import { useGasStore } from '@/store/gasStore';
import { getWeb3Service } from '@/services/web3Service';
import { debugRpcConnections } from '@/utils/rpcDebugger';
import ModeToggle from '@/components/ModeToggle';
import GasPriceOverview from '@/components/GasPriceOverview';
import SimpleChart from '@/components/SimpleChart';
import TransactionSimulator from '@/components/TransactionSimulator';

export default function Dashboard() {
  const { mode, isLoading, error } = useGasStore();

  useEffect(() => {
    // Initialize Web3 service when component mounts
    const web3Service = getWeb3Service();
    
    // Run debug diagnostics in development
    if (process.env.NODE_ENV === 'development') {
      debugRpcConnections().catch(console.error);
    }
    
    // Cleanup on unmount
    return () => {
      web3Service.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Cross-Chain Gas Tracker
              </h1>
              <p className="text-gray-400 text-sm">
                Real-time gas price monitoring and transaction simulation
              </p>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center space-x-4">
              {isLoading && (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-sm">Connecting...</span>
                </div>
              )}
              
              {error && (
                <div className="flex items-center space-x-2 text-red-400">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  <span className="text-sm">Connection Issues</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Connection Status Banner */}
          {error && (
            <div className="bg-amber-900/50 border border-amber-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-900 text-xs font-bold">!</span>
                </div>
                <div>
                  <h3 className="text-amber-200 font-medium">
                    Running in Simulation Mode
                  </h3>
                  <p className="text-amber-300 text-sm mt-1">
                    Unable to connect to blockchain RPC endpoints. The app is displaying 
                    realistic simulated gas prices instead of live data. 
                    This is common in development environments.
                  </p>
                  <p className="text-amber-400 text-xs mt-2">
                    Check the browser console for detailed connection diagnostics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mode Toggle */}
          <ModeToggle />

          {/* Live Mode */}
          {mode === 'live' && (
            <div className="space-y-8">
              {/* Gas Price Overview */}
              <GasPriceOverview />

              {/* Charts Grid */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">
                  Gas Price Charts (15-minute intervals)
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-6">
                  <SimpleChart chain="ethereum" height={400} />
                  <SimpleChart chain="polygon" height={400} />
                  <SimpleChart chain="arbitrum" height={400} />
                </div>
              </div>
            </div>
          )}

          {/* Simulation Mode */}
          {mode === 'simulation' && (
            <div className="space-y-8">
              {/* Quick Overview for context */}
              <GasPriceOverview />
              
              {/* Transaction Simulator */}
              <TransactionSimulator />
            </div>
          )}

          {/* Mermaid Diagram Info */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">System Architecture</h3>
            <div className="bg-gray-900 p-4 rounded-lg">
              <pre className="text-green-400 text-xs overflow-x-auto">
{`User → Next.js Frontend → Zustand State Store
         ↓                    ↓
    Mode Switch         Live/Simulation Mode
         ↓                    ↓
  WebSocket Providers ← Transaction Calculator
         ↓                    ↓
  [ETH, Polygon, ARB] → Uniswap V3 ETH/USDC Pool
         ↓                    ↓
   Base/Priority Fees → Calculate ETH/USD → Gas Cost USD
         ↓                    ↓
   Candlestick Chart ← Lightweight Charts`}
              </pre>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <p>
                This application demonstrates real-time cross-chain gas price tracking with:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Live WebSocket connections to Ethereum, Polygon, and Arbitrum</li>
                <li>Real-time ETH/USD pricing from Uniswap V3 swap events</li>
                <li>Interactive candlestick charts with 15-minute intervals</li>
                <li>Cross-chain transaction cost simulation</li>
                <li>Zustand state management with mode switching</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p className="text-sm">
              Built with Next.js, TypeScript, Ethers.js, Zustand, and Lightweight Charts
            </p>
            <p className="text-xs mt-2">
              Real-time cross-chain gas price monitoring and transaction simulation
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
