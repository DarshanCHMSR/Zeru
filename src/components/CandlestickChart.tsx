import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  LineData, 
  ColorType
} from 'lightweight-charts';
import { useGasStore, GasPoint } from '@/store/gasStore';

interface CandlestickChartProps {
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

const CandlestickChart: React.FC<CandlestickChartProps> = ({ chain, height = 300 }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  const { chains } = useGasStore();
  const chainData = chains[chain];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a1a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add line series (simplified from candlestick for compatibility)
    const lineSeries = chart.addLineSeries({
      color: chainColors[chain],
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = lineSeries;
    setIsChartReady(true);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height, chain]);

  useEffect(() => {
    if (!isChartReady || !seriesRef.current || !chainData.history.length) return;

    // Convert GasPoint data to LineData format (using close price)
    const lineData: LineData[] = chainData.history.map((point: GasPoint) => ({
      time: Math.floor(point.time / 1000) as LineData['time'], // Convert to seconds
      value: point.close,
    }));

    // Update series data
    seriesRef.current.setData(lineData);

    // Fit content to show all data
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [chainData.history, isChartReady]);

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
        ref={chartContainerRef} 
        className="relative"
        style={{ height: `${height}px` }}
      >
        {!chainData.history.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded">
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

export default CandlestickChart;
