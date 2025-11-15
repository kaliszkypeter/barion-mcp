# Development Guide

## Architecture Overview

This MCP server is built following the pattern from the [Azure DevOps MCP server](https://github.com/microsoft/azure-devops-mcp). It consists of:

### Core Components

1. **[src/index.ts](src/index.ts)** - Main entry point
   - Parses command-line arguments
   - Initializes the McpServer
   - Configures tools
   - Establishes stdio transport connection

2. **[src/tools.ts](src/tools.ts)** - Tool configuration orchestrator
   - Coordinates registration of all tools
   - Can be extended to support multiple domains (e.g., payment, wallet, etc.)

3. **[src/tools/payment.ts](src/tools/payment.ts)** - Payment tool implementations
   - Registers payment-related tools with the MCP server
   - Defines Zod schemas for type-safe parameter validation
   - Implements tool handlers that call the Barion API client

4. **[src/utils/barion-client.ts](src/utils/barion-client.ts)** - Barion API client
   - Handles HTTP communication with Barion API
   - Supports both test and production environments
   - Provides type-safe interfaces for API requests

## Adding New Tools

To add a new tool to the server:

### 1. Create a new tool file (optional)

If you're adding tools for a new domain, create a new file like `src/tools/wallet.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function configureWalletTools(server: McpServer, apiKey: string) {
  // Define your tool here
  server.tool(
    'get_balance',
    'Get the wallet balance',
    {
      // Define parameters using Zod schemas
      currency: z.string().describe('Currency code (e.g., HUF, EUR, USD)'),
    },
    async (args) => {
      // Implement tool logic
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ balance: 1000, currency: args.currency }, null, 2),
          },
        ],
      };
    }
  );
}
```

### 2. Register the tool in [src/tools.ts](src/tools.ts)

```typescript
import { configureWalletTools } from './tools/wallet.js';

export function configureAllTools(server: McpServer, apiKey: string) {
  configurePaymentTools(server, apiKey);
  configureWalletTools(server, apiKey);  // Add this line
}
```

### 3. Build and test

```bash
npm run build
npm start
```

## Tool API Reference

### Tool Registration Pattern

```typescript
server.tool(
  'tool_name',           // Unique identifier
  'Tool description',    // Human-readable description
  {                      // Parameter schema (ZodRawShape)
    param1: z.string().describe('Description'),
    param2: z.number().optional().describe('Optional param'),
  },
  async (args) => {     // Tool handler function
    // args is type-safe based on the schema
    return {
      content: [
        {
          type: 'text',
          text: 'Response text',
        },
      ],
    };
  }
);
```

### Parameter Types

Use Zod schemas to define type-safe parameters:

```typescript
{
  // String
  name: z.string().describe('User name'),

  // Number
  amount: z.number().describe('Payment amount'),

  // Enum
  type: z.enum(['Immediate', 'Reservation']).describe('Payment type'),

  // Optional
  comment: z.string().optional().describe('Optional comment'),

  // Array
  items: z.array(z.string()).describe('List of items'),

  // Object
  metadata: z.object({
    key: z.string(),
    value: z.string(),
  }).describe('Metadata object'),
}
```

## Testing the Server

### Using MCP Inspector

The MCP Inspector provides a UI for testing your server:

```bash
npm run inspect
```

This will start the inspector and allow you to:
- See all registered tools
- Test tools with different parameters
- View request/response logs

### Using stdio directly

You can test the server by sending JSON-RPC messages via stdin:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | BARION_API_KEY=test_key node dist/index.js
```

### Integration with Claude Desktop

1. Update your Claude Desktop config at:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Add the barion-mcp server configuration (see [claude_desktop_config.json](claude_desktop_config.json))

3. Restart Claude Desktop

## API Client Development

### Adding New Barion API Methods

To add support for a new Barion API endpoint:

1. Define the request/response interfaces in [src/utils/barion-client.ts](src/utils/barion-client.ts):

```typescript
export interface NewOperationRequest {
  field1: string;
  field2: number;
}
```

2. Add the method to the BarionClient class:

```typescript
async newOperation(request: NewOperationRequest): Promise<unknown> {
  const payload = {
    Field1: request.field1,
    Field2: request.field2,
  };

  return this.request('/v2/Operation/Endpoint', payload);
}
```

Note: Barion API uses PascalCase for field names, so we map from camelCase.

## Environment Configuration

### Test vs Production

The Barion client supports both test and production environments:

```typescript
// Test environment (default)
const client = new BarionClient(apiKey, 'test');

// Production environment
const client = new BarionClient(apiKey, 'prod');
```

API endpoints:
- Test: `https://api.test.barion.com`
- Production: `https://api.barion.com`

## Error Handling

Tools should handle errors gracefully and return informative messages:

```typescript
async (args) => {
  try {
    const result = await client.someOperation(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}
```

## Code Style

This project uses:
- **TypeScript** with strict mode enabled
- **Prettier** for code formatting
- **ES Modules** (not CommonJS)

Format your code before committing:

```bash
npm run format
```

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP SDK TypeScript Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Barion API Documentation](https://docs.barion.com/)
- [Azure DevOps MCP Server](https://github.com/microsoft/azure-devops-mcp) (reference implementation)
