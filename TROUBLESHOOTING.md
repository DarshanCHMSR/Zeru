# Troubleshooting RPC Connection Issues

## Common Error Messages

### "Failed to fetch" or "TypeError: Failed to fetch"
This is the most common error when RPC endpoints are unavailable.

**Causes:**
- RPC endpoint is down or overloaded
- Network connectivity issues
- CORS restrictions (development only)
- Rate limiting from the provider

**Solutions:**
1. **Check Network Connection**: Ensure you have internet connectivity
2. **Try Different Endpoints**: The app will automatically try multiple endpoints
3. **Wait and Retry**: Sometimes providers are temporarily unavailable
4. **Clear Browser Cache**: Hard refresh (Ctrl+F5) can help
5. **Check Firewall**: Ensure no firewall is blocking outbound connections

### "Connection timeout"
The RPC endpoint didn't respond within the timeout period.

**Solutions:**
1. **Slower Network**: Increase timeout in development config
2. **Provider Issues**: Try different RPC providers
3. **Regional Issues**: Some providers may be slower in certain regions

### "JsonRpcProvider failed to detect network"
The ethers.js provider couldn't establish a connection.

**Solutions:**
1. **Invalid RPC URL**: Check if the endpoint URL is correct
2. **Network Mismatch**: Ensure the endpoint supports the correct network
3. **Provider Configuration**: Some providers require specific headers

## Development vs Production

### Development Environment
- Uses shorter timeouts for faster debugging
- Includes verbose logging and diagnostics
- Automatically falls back to simulation mode
- Shows detailed error messages

### Production Environment
- Uses longer timeouts for reliability
- Minimal logging for performance
- Graceful fallback to simulation
- User-friendly error messages

## Simulation Mode

When RPC connections fail, the app automatically switches to simulation mode:

- **Realistic Gas Prices**: Generated using historical patterns
- **Price Volatility**: Includes random fluctuations
- **Full Functionality**: All features work with simulated data
- **No Real Data**: Prices are not real-time

## Debugging Steps

1. **Open Browser Console**: Press F12 and check the Console tab
2. **Look for RPC Test Results**: The app runs diagnostics on startup
3. **Check Network Tab**: Look for failed requests to RPC endpoints
4. **Try Manual Testing**: Use the RPC debugger utility

## Manual RPC Testing

You can test RPC endpoints manually:

```bash
# Test Ethereum endpoint
curl -X POST https://ethereum.publicnode.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test Polygon endpoint
curl -X POST https://polygon.publicnode.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Getting Help

If you continue to experience issues:

1. **Check Console**: Look for detailed error messages
2. **Try Different Browser**: Test in incognito/private mode
3. **Update Browser**: Ensure you're using a recent version
4. **Check System**: Verify no antivirus/firewall is blocking connections

## Environment Variables

For custom RPC endpoints, you can add environment variables:

```bash
# .env.local
NEXT_PUBLIC_ETHEREUM_RPC=https://your-custom-endpoint.com
NEXT_PUBLIC_POLYGON_RPC=https://your-polygon-endpoint.com
NEXT_PUBLIC_ARBITRUM_RPC=https://your-arbitrum-endpoint.com
```
