#!/bin/bash
# Quick setup script for Cursor MCP configuration

PROJECT_DIR="/Users/kaliszkyp/Downloads/barion-mcp-main"
DIST_PATH="$PROJECT_DIR/dist/index.js"

echo "🔧 Barion MCP Server - Cursor Setup"
echo "===================================="
echo ""

# Check if dist/index.js exists
if [ ! -f "$DIST_PATH" ]; then
    echo "⚠️  Building project first..."
    cd "$PROJECT_DIR"
    npm install
    npm run build
    echo ""
fi

# Get absolute path
ABS_PATH=$(cd "$PROJECT_DIR" && pwd)/dist/index.js

echo "✅ Project is ready!"
echo ""
echo "📋 Cursor Configuration:"
echo "======================="
echo ""
echo "1. Open Cursor Settings -> MCP"
echo "2. Add/Edit MCP Server with these settings:"
echo ""
echo "   Server Name: barion"
echo "   Type: command"
echo "   Command: node"
echo "   Arguments: $ABS_PATH"
echo ""
echo "   Environment Variables:"
echo "     BARION_API_KEY: (your API key)"
echo "     BARION_ENVIRONMENT: test"
echo "     BARION_POS_KEY: (optional, for payment tools)"
echo ""
echo "📋 Or use this JSON config:"
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
echo ""
echo "💡 After configuring, restart Cursor to apply changes."
echo ""



