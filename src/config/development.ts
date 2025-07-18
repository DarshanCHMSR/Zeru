// Development configuration for better error handling and debugging
export const DEV_CONFIG = {
  // Enable more verbose logging
  enableVerboseLogging: true,
  
  // Shorter timeouts for development
  connectionTimeout: 5000,
  
  // Faster retry intervals for development
  retryInterval: 10000,
  
  // Maximum retry attempts before giving up
  maxRetryAttempts: 3,
  
  // Enable simulation mode by default if too many connections fail
  fallbackToSimulation: true,
  
  // Polling intervals
  blockPollingInterval: 6000,
  simulationPollingInterval: 8000,
  pricePollingInterval: 10000,
  
  // Connection health check
  enableHealthCheck: true,
  healthCheckInterval: 30000,
};

// Helper function to log development messages
export const devLog = (message: string, type: 'info' | 'warn' | 'error' = 'info') => {
  if (DEV_CONFIG.enableVerboseLogging && process.env.NODE_ENV === 'development') {
    const emoji = type === 'info' ? '💡' : type === 'warn' ? '⚠️' : '❌';
    console.log(`${emoji} [Web3Service] ${message}`);
  }
};

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
