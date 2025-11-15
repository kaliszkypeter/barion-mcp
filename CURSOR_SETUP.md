# Adding Local Barion MCP Server to Cursor

This guide shows you how to configure Cursor to use your locally updated MCP server instead of the published npm package.

## Prerequisites

1. **Build the project** (if not already done):
   ```bash
   npm install
   npm run build
   ```

2. **Get your Barion API Key**:
   - For wallet operations: https://secure.barion.com/Access
   - For payment operations: https://secure.barion.com/Shop

## Method 1: Using Cursor Settings UI (Recommended)

### Step 1: Open Cursor Settings

1. Open Cursor
2. Go to **Cursor Settings** (or press `Cmd+,` on Mac / `Ctrl+,` on Windows)
3. Navigate to **MCP** section in the settings

### Step 2: Add/Edit MCP Server

1. Click **"Add new MCP Server"** (or edit existing "barion" server if it exists)
2. Configure as follows:

   **Server Name:** `barion` (or any name you prefer)

   **Type:** `command`

   **Command:** `node`

   **Arguments:** 
   ```
   /Users/kaliszkyp/Downloads/barion-mcp-main/dist/index.js
   ```
   *(Use the absolute path to your `dist/index.js` file)*

   **Environment Variables:**
   - `BARION_API_KEY`: `your_api_key_here`
   - `BARION_ENVIRONMENT`: `test` (or `prod` for production)
   - `BARION_POS_KEY`: `your_poskey_here` (optional, only if you need payment tools)

3. Click **"Save"** or **"OK"**

### Step 3: Restart Cursor

Restart Cursor for the changes to take effect.

## Method 2: Manual Configuration File

If you prefer to edit the configuration file directly:

### Step 1: Locate Cursor Config File

Cursor stores MCP configuration in:
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`

*Note: The exact path may vary. You can also find it by checking Cursor's settings or looking for `.cursor` or `Cursor` directories in your home folder.*

### Step 2: Edit the Configuration

Open the MCP settings file and add/update the barion server configuration:

```json
{
  "mcpServers": {
    "barion": {
      "command": "node",
      "args": [
        "/Users/kaliszkyp/Downloads/barion-mcp-main/dist/index.js"
      ],
      "env": {
        "BARION_API_KEY": "your_api_key_here",
        "BARION_ENVIRONMENT": "test",
        "BARION_POS_KEY": "your_poskey_here"
      }
    }
  }
}
```

**Important:** Replace `/Users/kaliszkyp/Downloads/barion-mcp-main/dist/index.js` with the **absolute path** to your `dist/index.js` file.

### Step 3: Get the Absolute Path

To get the absolute path to your project:

**On macOS/Linux:**
```bash
cd /Users/kaliszkyp/Downloads/barion-mcp-main
pwd
# Output: /Users/kaliszkyp/Downloads/barion-mcp-main
# Then append: /dist/index.js
```

**On Windows:**
```powershell
cd C:\path\to\barion-mcp-main
pwd
# Then append: \dist\index.js
```

## Method 3: Using npm link (Alternative)

If you want to use `npm` to run the local version:

### Step 1: Link the Package Locally

```bash
cd /Users/kaliszkyp/Downloads/barion-mcp-main
npm link
```

### Step 2: Configure Cursor

In Cursor settings, use:

**Command:** `npx`

**Arguments:** `barion-mcp`

This will use your locally linked version instead of the published package.

## Verification

### Step 1: Check MCP Server Status

1. Open Cursor
2. Open the chat/Composer
3. Look for MCP server status indicators (usually in the chat interface)
4. You should see the `barion` server connected

### Step 2: Test the New Function

Try asking Cursor:
- "What Barion MCP tools are available?"
- "Get my user history since 2025-01-01"
- "Use get_user_history with lastRequestTime 2025-01-01T00:00:00.000Z"

### Step 3: Check for Errors

If the server doesn't connect:
1. Check Cursor's output/logs for errors
2. Verify the path to `dist/index.js` is correct and absolute
3. Ensure the project is built (`npm run build`)
4. Verify your API key is correct
5. Check that Node.js is in your PATH

## Troubleshooting

### Error: "Cannot find module"

**Solution:** Make sure you've built the project:
```bash
npm run build
```

### Error: "Command not found: node"

**Solution:** Use the full path to node:
- **macOS/Linux:** `/usr/local/bin/node` or `/opt/homebrew/bin/node`
- **Windows:** `C:\Program Files\nodejs\node.exe`

Or find it with:
```bash
which node  # macOS/Linux
where node   # Windows
```

### Error: "Permission denied"

**Solution:** Make sure the `dist/index.js` file is executable:
```bash
chmod +x dist/index.js
```

### Server Not Appearing in Cursor

1. **Restart Cursor** completely (quit and reopen)
2. **Check the configuration file** syntax (valid JSON)
3. **Verify the path** is absolute and correct
4. **Check Cursor logs** for error messages

### Using Different Environments

To switch between test and production:

**Test environment:**
```json
"env": {
  "BARION_API_KEY": "your_test_api_key",
  "BARION_ENVIRONMENT": "test"
}
```

**Production environment:**
```json
"env": {
  "BARION_API_KEY": "your_prod_api_key",
  "BARION_ENVIRONMENT": "prod"
}
```

## Quick Setup Script

Here's a quick script to help you set up the configuration:

```bash
#!/bin/bash
# save as setup-cursor.sh

PROJECT_DIR="/Users/kaliszkyp/Downloads/barion-mcp-main"
DIST_PATH="$PROJECT_DIR/dist/index.js"

# Build the project
cd "$PROJECT_DIR"
npm install
npm run build

# Get absolute path
ABS_PATH=$(cd "$PROJECT_DIR" && pwd)/dist/index.js

echo "✅ Project built successfully"
echo ""
echo "📝 Add this to your Cursor MCP settings:"
echo ""
echo "Command: node"
echo "Arguments: $ABS_PATH"
echo ""
echo "Environment Variables:"
echo "  BARION_API_KEY: your_api_key_here"
echo "  BARION_ENVIRONMENT: test"
echo ""
echo "Or use this JSON config:"
echo ""
cat << EOF
{
  "mcpServers": {
    "barion": {
      "command": "node",
      "args": ["$ABS_PATH"],
      "env": {
        "BARION_API_KEY": "your_api_key_here",
        "BARION_ENVIRONMENT": "test"
      }
    }
  }
}
EOF
```

Run it with:
```bash
chmod +x setup-cursor.sh
./setup-cursor.sh
```

## Updating After Code Changes

Whenever you make changes to the code:

1. **Rebuild the project:**
   ```bash
   npm run build
   ```

2. **Restart Cursor** (or reload the MCP server if Cursor supports it)

The changes will be available immediately after restart.

## Next Steps

Once configured, you can:
- Test the new `get_user_history` function
- Use all other Barion MCP tools
- Develop and test new features locally

For testing instructions, see [TESTING.md](TESTING.md).



