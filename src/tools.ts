import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { configurePaymentTools } from './tools/payment.js';
import { configureWalletTools } from './tools/wallet.js';

export interface BarionCredentials {
  poskey?: string;
  apiKey?: string;
  environment?: 'test' | 'prod';
}

export function configureAllTools(server: McpServer, credentials: BarionCredentials) {
  const environment = credentials.environment || 'test';

  // Configure payment-related tools (requires POSKey)
  if (credentials.poskey) {
    configurePaymentTools(server, credentials.poskey, environment);
  }

  // Configure wallet-related tools (requires API Key)
  if (credentials.apiKey) {
    configureWalletTools(server, credentials.apiKey, environment);
  }
}
