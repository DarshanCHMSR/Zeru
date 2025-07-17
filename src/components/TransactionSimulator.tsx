import React, { useEffect } from 'react';
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

const TransactionSimulator: React.FC = () => {
  const {
    simulationInput,
    simulationResults,
    usdPrice,
    setSimulationInput,
    calculateSimulation,
  } = useGasStore();

  useEffect(() => {
    calculateSimulation();
  }, [simulationInput, usdPrice, calculateSimulation]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatEther = (wei: number) => {
    return (wei / 1e18).toFixed(8);
  };

  const formatGwei = (wei: number) => {
    return (wei / 1e9).toFixed(2);
  };

  const getCheapestChain = () => {
    if (simulationResults.length === 0) return null;
    return simulationResults.reduce((cheapest, current) => 
      current.totalCostUSD < cheapest.totalCostUSD ? current : cheapest
    );
  };

  const getMostExpensiveChain = () => {
    if (simulationResults.length === 0) return null;
    return simulationResults.reduce((expensive, current) => 
      current.totalCostUSD > expensive.totalCostUSD ? current : expensive
    );
  };

  const cheapest = getCheapestChain();
  const mostExpensive = getMostExpensiveChain();

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-6">Transaction Cost Simulator</h2>
      
      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Transaction Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={simulationInput.amount}
              onChange={(e) => setSimulationInput({ amount: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.5"
              step="0.001"
              min="0"
            />
            <span className="absolute right-3 top-2 text-gray-400 text-sm">ETH</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Primary Chain (for comparison)
          </label>
          <select
            value={simulationInput.chain}
            onChange={(e) => setSimulationInput({ chain: e.target.value as any })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
          </select>
        </div>
      </div>

      {/* Current ETH Price */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Current ETH Price</span>
          <span className="text-lg font-semibold text-white">
            {formatCurrency(usdPrice)}
          </span>
        </div>
      </div>

      {/* Results Section */}
      {simulationResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Cross-Chain Comparison</h3>
          
          {/* Summary Cards */}
          {cheapest && mostExpensive && simulationResults.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-4">
                <div className="text-green-300 text-sm font-medium">Cheapest Option</div>
                <div className="text-white text-lg font-bold capitalize">
                  {cheapest.chain}
                </div>
                <div className="text-green-300">
                  {formatCurrency(cheapest.totalCostUSD)}
                </div>
              </div>
              
              <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4">
                <div className="text-red-300 text-sm font-medium">Most Expensive</div>
                <div className="text-white text-lg font-bold capitalize">
                  {mostExpensive.chain}
                </div>
                <div className="text-red-300">
                  {formatCurrency(mostExpensive.totalCostUSD)}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Chain</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">Base Fee</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">Priority Fee</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">Total Gas</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">USD Cost</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">Savings</th>
                </tr>
              </thead>
              <tbody>
                {simulationResults
                  .sort((a, b) => a.totalCostUSD - b.totalCostUSD)
                  .map((result, index) => {
                    const isSelected = result.chain === simulationInput.chain;
                    const savings = cheapest && result.chain !== cheapest.chain 
                      ? result.totalCostUSD - cheapest.totalCostUSD 
                      : 0;

                    return (
                      <tr 
                        key={result.chain} 
                        className={`border-b border-gray-700 ${isSelected ? 'bg-blue-900 bg-opacity-30' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: chainColors[result.chain as keyof typeof chainColors] }}
                            />
                            <span className="text-white font-medium capitalize">
                              {chainNames[result.chain as keyof typeof chainNames]}
                            </span>
                            {index === 0 && (
                              <span className="bg-green-600 text-green-100 text-xs px-2 py-1 rounded">
                                Cheapest
                              </span>
                            )}
                            {isSelected && (
                              <span className="bg-blue-600 text-blue-100 text-xs px-2 py-1 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-300">
                          {formatGwei(result.baseFee)} Gwei
                        </td>
                        <td className="text-right py-3 px-4 text-gray-300">
                          {formatGwei(result.priorityFee)} Gwei
                        </td>
                        <td className="text-right py-3 px-4 text-gray-300">
                          {formatEther(result.totalGasCost)} ETH
                        </td>
                        <td className="text-right py-3 px-4 text-white font-medium">
                          {formatCurrency(result.totalCostUSD)}
                        </td>
                        <td className="text-right py-3 px-4">
                          {savings > 0 ? (
                            <span className="text-red-400">
                              +{formatCurrency(savings)}
                            </span>
                          ) : savings < 0 ? (
                            <span className="text-green-400">
                              {formatCurrency(Math.abs(savings))}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-700 rounded-lg p-4 mt-4">
            <h4 className="text-white font-medium mb-2">Transaction Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Amount:</span>
                <span className="text-white ml-2">{simulationInput.amount} ETH</span>
              </div>
              <div>
                <span className="text-gray-400">Gas Limit:</span>
                <span className="text-white ml-2">21,000</span>
              </div>
              <div>
                <span className="text-gray-400">Transaction Type:</span>
                <span className="text-white ml-2">Standard Transfer</span>
              </div>
              <div>
                <span className="text-gray-400">ETH Price:</span>
                <span className="text-white ml-2">{formatCurrency(usdPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {simulationResults.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No gas price data available</div>
          <div className="text-gray-500 text-sm">
            Please wait for the connections to establish and data to load.
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionSimulator;
