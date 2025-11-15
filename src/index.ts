#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { configureAllTools } from './tools.js';

interface Arguments {
  poskey?: string;
  apiKey?: string;
  environment?: string;
}

async function main() {
  // Parse command line arguments
  const argv = await yargs(hideBin(process.argv))
    .option('poskey', {
      alias: 'p',
      type: 'string',
      description: 'Barion POSKey for payment operations (or use BARION_POS_KEY env variable)',
    })
    .option('api-key', {
      alias: 'k',
      type: 'string',
      description: 'Barion API Key for wallet operations (or use BARION_API_KEY env variable)',
    })
    .option('environment', {
      alias: 'e',
      type: 'string',
      description: 'Barion environment: test or prod (or use BARION_ENVIRONMENT env variable, default: test)',
      choices: ['test', 'prod'],
    })
    .help()
    .alias('help', 'h')
    .parse() as Arguments;

  // Get credentials from args or environment
  const poskey = argv.poskey || process.env.BARION_POS_KEY;
  const apiKey = argv.apiKey || process.env.BARION_API_KEY;
  const environment = (argv.environment || process.env.BARION_ENVIRONMENT || 'test') as 'test' | 'prod';

  // Debug logging
  console.error('[Debug] POSKey present:', !!poskey, poskey ? `(${poskey.substring(0, 8)}...)` : '(none)');
  console.error('[Debug] API Key present:', !!apiKey, apiKey ? `(${apiKey.substring(0, 8)}...)` : '(none)');
  console.error('[Debug] Environment:', environment);

  if (!poskey && !apiKey) {
    console.error('Error: At least one credential is required. Provide BARION_POS_KEY for payment tools or BARION_API_KEY for wallet tools.');
    process.exit(1);
  }

  // Create the MCP server
  const server = new McpServer(
    {
      name: 'barion-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Configure all tools
  configureAllTools(server, { poskey, apiKey, environment });

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Barion MCP server started successfully');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
