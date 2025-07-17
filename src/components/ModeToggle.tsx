import React from 'react';
import { useGasStore } from '@/store/gasStore';

const ModeToggle: React.FC = () => {
  const { mode, setMode } = useGasStore();

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Monitoring Mode</h3>
          <p className="text-gray-400 text-sm">
            {mode === 'live' 
              ? 'Real-time gas price monitoring across chains' 
              : 'Simulate transaction costs across different chains'
            }
          </p>
        </div>
        
        <div className="flex bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setMode('live')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'live'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${mode === 'live' ? 'bg-green-400' : 'bg-gray-400'}`} />
              <span>Live Mode</span>
            </div>
          </button>
          
          <button
            onClick={() => setMode('simulation')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'simulation'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${mode === 'simulation' ? 'bg-purple-400' : 'bg-gray-400'}`} />
              <span>Simulation</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeToggle;
