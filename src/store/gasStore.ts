import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface GasPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChainGas {
  baseFee: number;
  priorityFee: number;
  history: GasPoint[];
  lastUpdated: number;
  isConnected: boolean;
}

export interface SimulationInput {
  amount: string;
  chain: 'ethereum' | 'polygon' | 'arbitrum';
}

export interface SimulationResult {
  chain: string;
  gasLimit: number;
  totalGasCost: number;
  totalCostUSD: number;
  baseFee: number;
  priorityFee: number;
}

export interface GasState {
  mode: 'live' | 'simulation';
  chains: {
    ethereum: ChainGas;
    polygon: ChainGas;
    arbitrum: ChainGas;
  };
  usdPrice: number;
  simulationInput: SimulationInput;
  simulationResults: SimulationResult[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setMode: (mode: 'live' | 'simulation') => void;
  updateGas: (
    chain: keyof GasState['chains'], 
    baseFee: number, 
    priorityFee: number
  ) => void;
  setUsdPrice: (price: number) => void;
  setSimulationInput: (input: Partial<SimulationInput>) => void;
  calculateSimulation: () => void;
  setConnectionStatus: (chain: keyof GasState['chains'], connected: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  addHistoryPoint: (chain: keyof GasState['chains'], point: GasPoint) => void;
}

const initialChainState: ChainGas = {
  baseFee: 0,
  priorityFee: 0,
  history: [],
  lastUpdated: 0,
  isConnected: false,
};

export const useGasStore = create<GasState>()(
  subscribeWithSelector((set, get) => ({
    mode: 'live',
    chains: {
      ethereum: { ...initialChainState },
      polygon: { ...initialChainState },
      arbitrum: { ...initialChainState },
    },
    usdPrice: 0,
    simulationInput: {
      amount: '0.5',
      chain: 'ethereum',
    },
    simulationResults: [],
    isLoading: false,
    error: null,

    setMode: (mode) => set({ mode }),

    updateGas: (chain, baseFee, priorityFee) =>
      set((state) => {
        // Safety checks for NaN values
        const safeBaseFee = isFinite(baseFee) ? baseFee : 0;
        const safePriorityFee = isFinite(priorityFee) ? priorityFee : 0;
        
        const timestamp = Date.now();
        const currentGas = (safeBaseFee + safePriorityFee) / 1e9; // Convert to Gwei

        // Safety check for the final gas value
        const safeCurrentGas = isFinite(currentGas) ? currentGas : 0;

        // Create new history point
        const newPoint: GasPoint = {
          time: timestamp,
          open: state.chains[chain].history.length > 0 
            ? state.chains[chain].history[state.chains[chain].history.length - 1].close 
            : safeCurrentGas,
          high: safeCurrentGas,
          low: safeCurrentGas,
          close: safeCurrentGas,
        };

        // Update existing point if within same 15-min interval
        const intervalMs = 15 * 60 * 1000; // 15 minutes
        const currentInterval = Math.floor(timestamp / intervalMs) * intervalMs;
        
        let updatedHistory = [...state.chains[chain].history];
        const lastPoint = updatedHistory[updatedHistory.length - 1];
        
        if (lastPoint && Math.floor(lastPoint.time / intervalMs) * intervalMs === currentInterval) {
          // Update existing point in the same interval
          lastPoint.close = safeCurrentGas;
          lastPoint.high = Math.max(lastPoint.high, safeCurrentGas);
          lastPoint.low = Math.min(lastPoint.low, safeCurrentGas);
          lastPoint.time = timestamp;
        } else {
          // Add new point
          updatedHistory.push(newPoint);
          // Keep only last 100 points for performance
          if (updatedHistory.length > 100) {
            updatedHistory = updatedHistory.slice(-100);
          }
        }

        return {
          chains: {
            ...state.chains,
            [chain]: {
              ...state.chains[chain],
              baseFee: safeBaseFee,
              priorityFee: safePriorityFee,
              history: updatedHistory,
              lastUpdated: timestamp,
            },
          },
        };
      }),

    setUsdPrice: (price) => set({ usdPrice: isFinite(price) ? price : 0 }),

    setSimulationInput: (input) =>
      set((state) => ({
        simulationInput: { ...state.simulationInput, ...input },
      })),

    calculateSimulation: () => {
      const { chains, usdPrice, simulationInput } = get();
      const amount = parseFloat(simulationInput.amount || '0');

      if (amount <= 0 || usdPrice <= 0) {
        set({ simulationResults: [] });
        return;
      }

      const results: SimulationResult[] = [];
      const gasLimit = 21000; // Standard ETH transfer

      Object.entries(chains).forEach(([chainName, chainData]) => {
        if (chainData.baseFee > 0) {
          const totalGasCost = (chainData.baseFee + chainData.priorityFee) * gasLimit;
          const totalCostUSD = (totalGasCost / 1e18) * usdPrice;

          results.push({
            chain: chainName,
            gasLimit,
            totalGasCost,
            totalCostUSD,
            baseFee: chainData.baseFee,
            priorityFee: chainData.priorityFee,
          });
        }
      });

      set({ simulationResults: results });
    },

    setConnectionStatus: (chain, connected) =>
      set((state) => ({
        chains: {
          ...state.chains,
          [chain]: {
            ...state.chains[chain],
            isConnected: connected,
          },
        },
      })),

    setError: (error) => set({ error }),
    setLoading: (loading) => set({ isLoading: loading }),
    addHistoryPoint: (chain, point) =>
      set((state) => ({
        chains: {
          ...state.chains,
          [chain]: {
            ...state.chains[chain],
            history: [...state.chains[chain].history, point],
          },
        },
      })),
  }))
);
