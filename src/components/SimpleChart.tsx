import React from 'react';
import { useGasStore } from '@/store/gasStore';

interface SimpleChartProps {
  chain: 'ethereum' | 'polygon' | 'arbitrum';
  height?: number;
}

const chainColors = {
  ethereum: '#627EEA',
  polygon: '#8247E5',
  arbitrum: '#2D374B',
};

const chainNames = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
};

const SimpleChart: React.FC<SimpleChartProps> = ({ chain, height = 300 }) => {
  const { chains } = useGasStore();
  const chainData = chains[chain];

  const formatGwei = (value: number) => {
    return `${value.toFixed(2)} Gwei`;
  };

  const currentPrice = chainData.history.length > 0 
    ? chainData.history[chainData.history.length - 1].close 
    : 0;

  const previousPrice = chainData.history.length > 1 
    ? chainData.history[chainData.history.length - 2].close 
    : currentPrice;

  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

  // Create simple SVG chart
  const createSimpleChart = () => {
    if (!chainData.history.length) return null;

    const maxValue = Math.max(...chainData.history.map(p => p.close));
    const minValue = Math.min(...chainData.history.map(p => p.close));
    const valueRange = maxValue - minValue || 1;

    // Safety check for NaN values
    if (!isFinite(maxValue) || !isFinite(minValue) || !isFinite(valueRange)) {
      return null;
    }

    const points = chainData.history.map((point, index) => {
      const x = (index / (chainData.history.length - 1)) * 100;
      const y = ((maxValue - point.close) / valueRange) * 80 + 10;
      
      // Safety check for NaN values
      if (!isFinite(x) || !isFinite(y)) {
        return '0,0';
      }
      
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
        {/* Grid lines */}
        <defs>
          <pattern id={`grid-${chain}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${chain})`} />
        
        {/* Price line */}
        <polyline
          points={points}
          fill="none"
          stroke={chainColors[chain]}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Data points */}
        {chainData.history.map((point, index) => {
          const x = (index / (chainData.history.length - 1)) * 100;
          const y = ((maxValue - point.close) / valueRange) * 80 + 10;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1"
              fill={chainColors[chain]}
              className="opacity-60"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: chainColors[chain] }}
          />
          <h3 className="text-lg font-semibold text-white">
            {chainNames[chain]} Gas Prices
          </h3>
          <div className={`flex items-center space-x-1 ${chainData.isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${chainData.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs">
              {chainData.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {formatGwei(currentPrice)}
          </div>
          <div className={`text-sm flex items-center ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <span className="mr-1">
              {priceChange >= 0 ? '↗' : '↘'}
            </span>
            {formatGwei(Math.abs(priceChange))} ({priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div 
        className="relative bg-gray-900 rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {chainData.history.length > 0 ? (
          createSimpleChart()
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                {chainData.isConnected ? 'Waiting for data...' : 'Not connected'}
              </div>
              {!chainData.isConnected && (
                <div className="text-xs text-gray-500">
                  Attempting to reconnect...
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Chart info overlay */}
        {chainData.history.length > 0 && (
          <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-80 rounded px-2 py-1 text-xs text-gray-300">
            {chainData.history.length} data points
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Base Fee</div>
          <div className="text-white font-medium">
            {formatGwei(chainData.baseFee / 1e9)}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Priority Fee</div>
          <div className="text-white font-medium">
            {formatGwei(chainData.priorityFee / 1e9)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChart;
