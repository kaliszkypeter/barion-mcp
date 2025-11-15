# Testing Guide for `get_user_history`

This guide shows you how to test the new `get_user_history` function.

## Prerequisites

1. **Barion API Key**: You need a valid Barion API key for wallet operations
   - Get it from: https://secure.barion.com/Access
   - Test environment key works for testing

2. **Build the project**:
   ```bash
   npm install
   npm run build
   ```

## Method 1: Using MCP Inspector (Recommended)

The MCP Inspector provides a visual UI to test your MCP server tools.

### Step 1: Start the Inspector

```bash
# Set your API key as environment variable
export BARION_API_KEY=your_api_key_here
export BARION_ENVIRONMENT=test  # or 'prod'

# Run the inspector
npm run inspect
```

This will:
- Open a web UI in your browser (usually at http://localhost:5173)
- Show all available tools
- Allow you to test tools interactively

### Step 2: Test `get_user_history`

1. In the MCP Inspector UI, find the `get_user_history` tool
2. Click on it to expand
3. Fill in the parameters:
   - `lastRequestTime`: Use an ISO 8601 timestamp, e.g., `"2025-01-01T00:00:00.000Z"`
   - `format`: `"markdown"` or `"json"` (default: `"markdown"`)
   - `detail`: `"concise"` or `"detailed"` (default: `"concise"`)
4. Click "Call Tool" or "Execute"
5. View the response

### Example Parameters

```json
{
  "lastRequestTime": "2025-01-01T00:00:00.000Z",
  "format": "markdown",
  "detail": "concise"
}
```

## Method 2: Direct API Testing with curl

You can test the Barion API endpoint directly to verify it works:

```bash
# Replace YOUR_API_KEY with your actual API key
# Replace the timestamp with your desired LastRequestTime

curl -X GET \
  "https://api.test.barion.com/v3/userhistory/gethistory?LastRequestTime=2025-01-01T00:00:00.000Z" \
  -H "X-API-Key: YOUR_API_KEY"
```

For production:
```bash
curl -X GET \
  "https://api.barion.com/v3/userhistory/gethistory?LastRequestTime=2025-01-01T00:00:00.000Z" \
  -H "X-API-Key: YOUR_API_KEY"
```

## Method 3: Testing in Cursor/VS Code

If you're using Cursor or VS Code with MCP support:

### Step 1: Configure MCP Server

Add to your MCP configuration (usually in `.cursor/mcp.json` or VS Code settings):

```json
{
  "mcpServers": {
    "barion": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "BARION_API_KEY": "your_api_key_here",
        "BARION_ENVIRONMENT": "test"
      }
    }
  }
}
```

### Step 2: Test in Chat

In Cursor/VS Code chat, you can now ask:
- "Get my user history since 2025-01-01"
- "Show transactions after 2025-10-08T12:30:22.955Z"
- "Use get_user_history with lastRequestTime 2025-01-01T00:00:00.000Z"

## Method 4: Manual Testing Script

Create a simple test script to verify the function works:

```bash
# Create test script
cat > test-user-history.js << 'EOF'
import { WalletClient } from './dist/utils/wallet-client.js';

const apiKey = process.env.BARION_API_KEY;
const environment = process.env.BARION_ENVIRONMENT || 'test';

if (!apiKey) {
  console.error('Error: BARION_API_KEY environment variable is required');
  process.exit(1);
}

const client = new WalletClient(apiKey, environment);

// Test with a timestamp from 30 days ago
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const lastRequestTime = thirtyDaysAgo.toISOString();

console.log(`Testing getUserHistory with LastRequestTime: ${lastRequestTime}`);
console.log('---');

try {
  const result = await client.getUserHistory({ lastRequestTime });
  console.log(`Found ${result.length} transactions`);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
EOF

# Run the test
BARION_API_KEY=your_api_key_here BARION_ENVIRONMENT=test node test-user-history.js
```

## Method 5: Integration Test with MCP Protocol

Test the full MCP protocol flow:

```bash
# Create a test script that sends MCP messages
cat > test-mcp.js << 'EOF'
import { spawn } from 'child_process';

const server = spawn('node', ['dist/index.js'], {
  env: {
    ...process.env,
    BARION_API_KEY: process.env.BARION_API_KEY || 'test_key',
    BARION_ENVIRONMENT: 'test'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

server.stdin.write(JSON.stringify(initRequest) + '\n');

// Listen for responses
server.stdout.on('data', (data) => {
  console.log('Response:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

// After initialization, list tools
setTimeout(() => {
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  };
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1000);

// After listing tools, call get_user_history
setTimeout(() => {
  const callToolRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_user_history',
      arguments: {
        lastRequestTime: '2025-01-01T00:00:00.000Z',
        format: 'markdown',
        detail: 'concise'
      }
    }
  };
  server.stdin.write(JSON.stringify(callToolRequest) + '\n');
}, 2000);

// Cleanup after 5 seconds
setTimeout(() => {
  server.kill();
  process.exit(0);
}, 5000);
EOF

# Run the test
BARION_API_KEY=your_api_key_here node test-mcp.js
```

## Expected Response Format

The function should return an array of transaction objects:

```json
[
  {
    "TransactionId": "string",
    "Currency": "HUF" | "EUR" | "USD" | "CZK",
    "Amount": 1234.56,
    "TransactionTime": "2025-01-15T10:30:00.000Z",
    "Comment": "Transaction description",
    "Type": "Payment" | "Withdrawal" | "Transfer" | "Fee" | "Refund"
  }
]
```

## Troubleshooting

### Error: "Authentication Failed"
- Verify your API key is correct
- Check you're using the right environment (test vs prod)
- Ensure the API key has wallet access permissions

### Error: "Invalid timestamp format"
- Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `"2025-10-08T12:30:22.955Z"`

### No transactions returned
- Try using an older timestamp (e.g., 30 days ago)
- Verify you have transactions in your Barion account
- Check you're querying the correct environment (test vs prod)

### Build errors
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

## Quick Test Checklist

- [ ] Project builds successfully (`npm run build`)
- [ ] MCP Inspector can see `get_user_history` tool
- [ ] Tool accepts `lastRequestTime` parameter
- [ ] Tool returns transaction array (even if empty)
- [ ] Error handling works for invalid timestamps
- [ ] Error handling works for invalid API keys
- [ ] Response formatting works (markdown and json)
- [ ] Detail levels work (concise and detailed)

## Next Steps

After testing:
1. Verify the response matches Barion API documentation
2. Test edge cases (very old timestamps, future timestamps, etc.)
3. Test error scenarios (invalid API key, network errors)
4. Test with real transaction data if available



