// Utility functions for safe number formatting and handling
export const safeNumber = (value: any, fallback: number = 0): number => {
  if (typeof value !== 'number' || !isFinite(value) || isNaN(value)) {
    return fallback;
  }
  return value;
};

export const formatGwei = (wei: number): string => {
  const safeWei = safeNumber(wei);
  const gwei = safeWei / 1e9;
  return gwei.toFixed(2);
};

export const formatEther = (wei: number): string => {
  const safeWei = safeNumber(wei);
  const ether = safeWei / 1e18;
  return ether.toFixed(8);
};

export const formatCurrency = (amount: number): string => {
  const safeAmount = safeNumber(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(safeAmount);
};

export const formatPercentage = (value: number): string => {
  const safeValue = safeNumber(value);
  return `${safeValue.toFixed(2)}%`;
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  const safeValue = safeNumber(value);
  return safeValue.toFixed(decimals);
};

// Safe math operations
export const safeAdd = (a: number, b: number): number => {
  return safeNumber(a) + safeNumber(b);
};

export const safeSubtract = (a: number, b: number): number => {
  return safeNumber(a) - safeNumber(b);
};

export const safeMultiply = (a: number, b: number): number => {
  return safeNumber(a) * safeNumber(b);
};

export const safeDivide = (a: number, b: number): number => {
  const safeA = safeNumber(a);
  const safeB = safeNumber(b);
  if (safeB === 0) return 0;
  return safeA / safeB;
};

// Safe SVG coordinate helpers
export const safeSvgCoordinate = (value: number): string => {
  const safeValue = safeNumber(value);
  return safeValue.toString();
};

export const safeSvgPoints = (points: Array<{x: number, y: number}>): string => {
  return points
    .map(point => `${safeSvgCoordinate(point.x)},${safeSvgCoordinate(point.y)}`)
    .join(' ');
};

// Debug helpers
export const debugNumber = (value: any, label?: string): void => {
  if (process.env.NODE_ENV === 'development') {
    const prefix = label ? `[${label}]` : '';
    console.log(`${prefix} Value: ${value}, Type: ${typeof value}, isFinite: ${isFinite(value)}, isNaN: ${isNaN(value)}`);
  }
};
