import React from 'react';
import { useGasStore } from '@/store/gasStore';

const chainNames = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
};

const chainColors = {
  ethereum: '#627EEA',
  polygon: '#8247E5',
  arbitrum: '#2D374B',
};

const GasPriceOverview: React.FC = () => {
  const { chains, usdPrice } = useGasStore();

  const formatGwei = (wei: number) => {
    if (!isFinite(wei) || isNaN(wei)) {
      return '0.00';
    }
    return (wei / 1e9).toFixed(2);
  };

  const formatCurrency = (amount: number) => {
    if (!isFinite(amount) || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getGasLevel = (totalGas: number) => {
    const gwei = totalGas / 1e9;
    if (gwei < 20) return { level: 'Low', color: 'text-green-400', bgColor: 'bg-green-900' };
    if (gwei < 50) return { level: 'Medium', color: 'text-yellow-400', bgColor: 'bg-yellow-900' };
    return { level: 'High', color: 'text-red-400', bgColor: 'bg-red-900' };
  };

  const calculateTransactionCost = (baseFee: number, priorityFee: number) => {
    const gasLimit = 21000; // Standard ETH transfer
    const totalGasCost = (baseFee + priorityFee) * gasLimit;
    const usdCost = (totalGasCost / 1e18) * usdPrice;
    
    // Safety checks for NaN values
    const safeTotalGasCost = isFinite(totalGasCost) ? totalGasCost : 0;
    const safeUsdCost = isFinite(usdCost) ? usdCost : 0;
    
    return { totalGasCost: safeTotalGasCost, usdCost: safeUsdCost };
  };

  return (
    <div className="space-y-4">
      {/* ETH Price Header */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Current ETH Price</h2>
            <p className="text-gray-400 text-sm">Live market price</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatCurrency(usdPrice)}
            </div>
            <div className="text-sm text-gray-400">per ETH</div>
          </div>
        </div>
      </div>

      {/* Gas Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(chains).map(([chainKey, chainData]) => {
          const totalGas = chainData.baseFee + chainData.priorityFee;
          const gasLevel = getGasLevel(totalGas);
          const { totalGasCost, usdCost } = calculateTransactionCost(chainData.baseFee, chainData.priorityFee);
          const chainName = chainNames[chainKey as keyof typeof chainNames];
          const chainColor = chainColors[chainKey as keyof typeof chainColors];

          return (
            <div key={chainKey} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: chainColor }}
                  />
                  <h3 className="font-semibold text-white">{chainName}</h3>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${gasLevel.bgColor} ${gasLevel.color} bg-opacity-20`}>
                    {gasLevel.level}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${chainData.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
              </div>

              {/* Gas Prices */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Fee:</span>
                  <span className="text-white font-medium">
                    {formatGwei(chainData.baseFee)} Gwei
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Priority Fee:</span>
                  <span className="text-white font-medium">
                    {formatGwei(chainData.priorityFee)} Gwei
                  </span>
                </div>
                <div className="border-t border-gray-600 pt-2 flex justify-between">
                  <span className="text-gray-400 font-medium">Total:</span>
                  <span className="text-white font-bold">
                    {formatGwei(totalGas)} Gwei
                  </span>
                </div>
              </div>

              {/* Transaction Cost */}
              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-1">Standard Transfer Cost</div>
                <div className="text-lg font-bold text-white">
                  {formatCurrency(usdCost)}
                </div>
                <div className="text-xs text-gray-400">
                  {(totalGasCost / 1e18).toFixed(6)} ETH
                </div>
              </div>

              {/* Last Updated */}
              {chainData.lastUpdated > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  Updated {new Date(chainData.lastUpdated).toLocaleTimeString()}
                </div>
              )}

              {/* Connection Status */}
              {!chainData.isConnected && (
                <div className="mt-2 text-xs text-red-400 bg-red-900 bg-opacity-20 px-2 py-1 rounded">
                  Connection lost - reconnecting...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gas Level Legend */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-medium text-white mb-3">Gas Price Levels</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-400" />
            <span className="text-gray-300">Low (&lt; 20 Gwei)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-yellow-400" />
            <span className="text-gray-300">Medium (20-50 Gwei)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-400" />
            <span className="text-gray-300">High (&gt; 50 Gwei)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GasPriceOverview;
