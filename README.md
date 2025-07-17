# 🚀 Real-Time Cross-Chain Gas Price Tracker

A comprehensive web application for monitoring real-time gas prices across multiple blockchain networks with interactive charts, transaction simulation, and wallet cost analysis.

![Gas Tracker](https://img.shields.io/badge/Next.js-15.4.1-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Ethereum](https://img.shields.io/badge/Ethereum-Web3-627EEA?style=for-the-badge&logo=ethereum)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Architecture](#-architecture)
- [API & Services](#-api--services)
- [Components](#-components)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

## ✨ Features

### 🔗 Multi-Chain Support
- **Ethereum Mainnet** - Real-time gas price monitoring
- **Polygon (Matic)** - Layer 2 scaling solution tracking
- **Arbitrum** - Optimistic rollup gas price analysis

### 📊 Real-Time Data
- **Live Gas Price Tracking** - Base fee and priority fee monitoring
- **Interactive Charts** - SVG-based candlestick-style price visualization
- **USD Price Conversion** - ETH/USD pricing for cost calculations
- **24-Hour Historical Data** - Price movement trends and analysis

### 🎯 Smart Features
- **Live/Simulation Mode Toggle** - Switch between real and simulated data
- **Transaction Cost Calculator** - Estimate costs for different transaction types
- **Cross-Chain Comparison** - Find the cheapest network for transactions
- **Wallet Simulation** - Test transaction scenarios without real costs

### 🛡️ Robust Connection Handling
- **Multiple RPC Fallbacks** - Automatic failover across multiple providers
- **Offline Simulation** - Realistic data when RPC connections fail
- **Connection Retry Logic** - Smart reconnection with exponential backoff
- **Error Recovery** - Graceful handling of network issues

## 🛠️ Tech Stack

### Frontend Framework
- **Next.js 15.4.1** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React 19** - Latest React features and optimizations

### Web3 & Blockchain
- **ethers.js v6** - Ethereum library for blockchain interactions
- **Multiple RPC Providers**:
  - LlamaRPC (Primary)
  - Ankr
  - PublicNode
  - 1RPC

### State Management
- **Zustand** - Lightweight state management
- **subscribeWithSelector** - Reactive state subscriptions
- **Persistent Storage** - State persistence across sessions

### Data Visualization
- **Custom SVG Charts** - Lightweight, responsive chart components
- **Real-time Updates** - Live data streaming to charts
- **Interactive Elements** - Hover effects and tooltips

### Development Tools
- **ESLint** - Code linting and quality
- **TypeScript Strict Mode** - Enhanced type checking
- **Hot Module Replacement** - Fast development experience

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DarshanCHMSR/Zeru.git
   cd Zeru
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production
```bash
npm run build
npm start
```

## 🏗️ Architecture

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main dashboard page
│   ├── layout.tsx         # Root layout with metadata
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── GasPriceOverview.tsx
│   ├── TransactionSimulator.tsx
│   ├── SimpleChart.tsx
│   └── ModeToggle.tsx
├── services/              # Business logic
│   └── web3Service.ts     # Blockchain connections
└── store/                 # State management
    └── gasStore.ts        # Zustand store
```

### Data Flow
1. **Web3Service** connects to multiple RPC endpoints
2. **Real-time polling** fetches latest block data every 6 seconds
3. **Zustand store** manages application state
4. **React components** subscribe to state changes
5. **Charts update** automatically with new data

## 🔌 API & Services

### Web3Service Features
- **Multi-provider failover** across 4 RPC endpoints per chain
- **Connection timeout handling** (10-second timeout)
- **Automatic retry logic** (30-second intervals)
- **Real-time block monitoring** with gas price extraction
- **USD price simulation** with 2% volatility

### Gas Price Ranges (Simulation Fallback)
- **Ethereum**: 15-35 Gwei base, 1-4 Gwei priority
- **Polygon**: 20-100 Gwei base, 1-3 Gwei priority
- **Arbitrum**: 0.1-0.5 Gwei base, 0.01-0.1 Gwei priority

### RPC Endpoints
```typescript
const CHAIN_CONFIGS = {
  ethereum: {
    primary: 'https://eth.llamarpc.com',
    fallbacks: [
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
      'https://1rpc.io/eth'
    ]
  },
  // ... other chains
}
```

## 🧩 Components

### Core Components

#### `GasPriceOverview`
- Real-time gas price display
- Connection status indicators
- USD cost calculations
- Chain-specific styling

#### `TransactionSimulator`
- Transaction type selection
- Gas limit input
- Cross-chain cost comparison
- Simulation vs live data

#### `SimpleChart`
- SVG-based chart rendering
- 24-hour price history
- Responsive design
- Real-time updates

#### `ModeToggle`
- Live/Simulation mode switching
- State persistence
- Visual mode indicators

### State Management
```typescript
interface GasState {
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
}
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
No environment variables required - uses public RPC endpoints.

### Deployment Platforms
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker** containers

### Performance Optimizations
- **Static page generation** for faster loading
- **Code splitting** with Next.js automatic optimization
- **Tree shaking** for smaller bundle sizes
- **Image optimization** with Next.js Image component

## 🔧 Configuration

### Customizing RPC Endpoints
Edit `src/services/web3Service.ts`:
```typescript
const CHAIN_CONFIGS = {
  ethereum: {
    rpcUrl: 'YOUR_PRIMARY_RPC',
    fallbackUrls: ['FALLBACK_1', 'FALLBACK_2']
  }
}
```

### Adding New Chains
1. Add chain config to `CHAIN_CONFIGS`
2. Update type definitions
3. Add chain-specific styling
4. Update UI components

## 📊 Features in Detail

### Real-Time Monitoring
- **Block-level accuracy** - Monitors latest blocks for gas prices
- **Priority fee calculation** - Smart estimation based on network
- **Connection health** - Visual indicators for RPC status
- **Automatic failover** - Seamless switching between providers

### Transaction Simulation
- **Cost estimation** - Calculate transaction costs across chains
- **Gas optimization** - Find cheapest execution network
- **Scenario testing** - Multiple transaction types supported
- **Historical comparison** - Compare with past prices

### User Experience
- **Dark theme** - Modern, eye-friendly interface
- **Responsive design** - Works on desktop and mobile
- **Real-time updates** - Live data without page refresh
- **Error handling** - Graceful degradation with simulation

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component-based architecture

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙋‍♂️ Support

For support and questions:
- Create an [Issue](https://github.com/DarshanCHMSR/Zeru/issues)
- Submit a [Pull Request](https://github.com/DarshanCHMSR/Zeru/pulls)

---

**Built with ❤️ using Next.js, TypeScript, and Web3 technologies**

*Real-time gas price tracking made simple and reliable*
