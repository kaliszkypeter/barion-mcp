[![Install in VS Code](https://img.shields.io/badge/Install_in-VS_Code-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=barion&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22barion-mcp%22%5D%2C%22env%22%3A%7B%7D%7D)
[![Install in VS Code Insiders](https://img.shields.io/badge/Install_in-VS_Code_Insiders-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=barion&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22barion-mcp%22%5D%2C%22env%22%3A%7B%7D%7D&quality=insiders)
[![Install in Visual Studio](https://img.shields.io/badge/Install_in-Visual_Studio-C16FDE?style=flat-square&logo=visualstudio&logoColor=white)](https://vs-open.link/mcp-install?%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22barion-mcp%22%5D%2C%22env%22%3A%7B%7D%7D)
[![Install in Cursor](https://img.shields.io/badge/Install_in-Cursor-000000?style=flat-square&logoColor=white)](https://cursor.com/en/install-mcp?name=barion&config=eyJuYW1lIjoiYmFyaW9uIiwiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJiYXJpb24tbWNwIl0sImVudiI6e319)

# Barion MCP Server

A Model Context Protocol (MCP) server for integrating Barion payment and wallet services with AI assistants and development tools.

## Features

This MCP server provides tools to interact with the Barion API:


## Prerequisites

* Node js 18 or newer
* Barion credentials:
   - **POSKey** for payment operations (get from [Shops](https://secure.barion.com/Shop))
   - **API Key** for wallet operations (get from [Wallet -> Access](https://secure.barion.com/Access))
* VS Code, Cursor, Windsurf, Claude Desktop, Goose or any other MCP client


## Getting Started

### Quick Install

Click one of the buttons below to install the MCP server in your preferred IDE:

[![Install in VS Code](https://img.shields.io/badge/Install_in-VS_Code-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=barion&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22barion-mcp%22%5D%2C%22env%22%3A%7B%7D%7D)
[![Install in VS Code Insiders](https://img.shields.io/badge/Install_in-VS_Code_Insiders-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=barion&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22barion-mcp%22%5D%2C%22env%22%3A%7B%7D%7D&quality=insiders)
[![Install in Visual Studio](https://img.shields.io/badge/Install_in-Visual_Studio-C16FDE?style=flat-square&logo=visualstudio&logoColor=white)](https://vs-open.link/mcp-install?%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22barion-mcp%22%5D%2C%22env%22%3A%7B%7D%7D)
[![Install in Cursor](https://img.shields.io/badge/Install_in-Cursor-000000?style=flat-square&logoColor=white)](https://cursor.com/en/install-mcp?name=barion&config=eyJuYW1lIjoiYmFyaW9uIiwiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJiYXJpb24tbWNwIl0sImVudiI6e319)

### Manual Installation

**Standard config** works in most tools:

```js
{
  "servers": {
    "barion": {
      "command": "npx",
      "args": [
        "-y",
        "barion-mcp"
      ],
      "env": {}
    }
  }
}
```

<details>
<summary>VS Code</summary>

#### Click the button to install:

[![Install in VS Code](https://img.shields.io/badge/Install_in-VS_Code-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=barion&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22barion-mcp%22%5D%2C%22env%22%3A%7B%7D%7D)

#### Or install manually:

Follow the MCP install [guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server), use the standard config above. You can also install the barion MCP server using the VS Code CLI:

```bash
code --add-mcp '{\"name\":\"barion\",\"command\":\"npx\",\"args\":[\"-y\",\"barion-mcp\"],\"env\":{}}'
```

After installation, the barion MCP server will be available for use with your GitHub Copilot agent in VS Code.
</details>

<details>
<summary>VS Code Insiders</summary>

#### Click the button to install:

[![Install in VS Code Insiders](https://img.shields.io/badge/Install_in-VS_Code_Insiders-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=barion&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22barion-mcp%22%5D%2C%22env%22%3A%7B%7D%7D&quality=insiders)

#### Or install manually:

Follow the MCP install [guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server), use the standard config above. You can also install the barion MCP server using the VS Code Insiders CLI:

```bash
code-insiders --add-mcp '{\"name\":\"barion\",\"command\":\"npx\",\"args\":[\"-y\",\"barion-mcp\"],\"env\":{}}'
```

After installation, the barion MCP server will be available for use with your GitHub Copilot agent in VS Code Insiders.
</details>

<details>
<summary>Visual Studio</summary>

#### Click the button to install:

[![Install in Visual Studio](https://img.shields.io/badge/Install_in-Visual_Studio-C16FDE?style=flat-square&logo=visualstudio&logoColor=white)](https://vs-open.link/mcp-install?%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22barion-mcp%22%5D%2C%22env%22%3A%7B%7D%7D)

#### Or install manually:

1. Open Visual Studio
2. Navigate to the GitHub Copilot Chat window
3. Click the tools icon (???) in the chat toolbar
4. Click the + "Add Server" button to open the "Configure MCP server" dialog
5. Fill in the configuration:
   - **Server ID**: `barion`
   - **Type**: Select `stdio` from the dropdown
   - **Command**: `npx`
   - **Arguments**: `-y barion-mcp`
6. Click "Save" to add the server

For detailed instructions, see the [Visual Studio MCP documentation](https://learn.microsoft.com/visualstudio/ide/mcp-servers).
</details>

<details>
<summary>Cursor</summary>

#### Click the button to install:

[![Install in Cursor](https://img.shields.io/badge/Install_in-Cursor-000000?style=flat-square&logoColor=white)](https://cursor.com/en/install-mcp?name=barion&config=eyJuYW1lIjoiYmFyaW9uIiwiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJiYXJpb24tbWNwIl0sImVudiI6e319)

#### Or install manually:

Go to `Cursor Settings` -> `MCP` -> `Add new MCP Server`. Name to your liking, use `command` type with the command from the standard config above. You can also verify config or add command like arguments via clicking `Edit`.
</details>

<details>
<summary>Claude Code</summary>

Use the Claude Code CLI to add the barion MCP server:

```bash
claude mcp add barion npx -y barion-mcp
```
</details>

<details>
<summary>Claude Desktop</summary>

Follow the MCP install [guide](https://modelcontextprotocol.io/quickstart/user), use the standard config above.
</details>

<details>
<summary>Codex</summary>

Create or edit the configuration file `~/.codex/config.toml` and add:

```toml
[mcp_servers.barion]
command = "npx"
args = ["-y", "barion-mcp"]
```

For more information, see the [Codex MCP documentation](https://github.com/openai/codex/blob/main/codex-rs/config.md#mcp_servers).
</details>

<details>
<summary>Windsurf</summary>

Follow Windsurf MCP [documentation](https://docs.windsurf.com/windsurf/cascade/mcp). Use the standard config above.
</details>

### Configuration Details

- **Server Name:** `barion`
- **Type:** NPX Package
- **Package:** `barion-mcp`

### Need Help?

For more information about the Model Context Protocol, visit [modelcontextprotocol.io](https://modelcontextprotocol.io).


### Example Usage

Once connected, you can use natural language commands like:

**Payment operations:**
- "Start a new Barion payment for 100 HUF"
- "Check the status of payment ID abc123"
- "Refund 50 EUR from transaction xyz789"

**Wallet operations:**
- "Show my Barion wallet balance"
- "Get my wallet statement for January 2025"
- "Send 100 HUF to user@example.com"
- "Withdraw 500 EUR to my bank account"

## Development

For development and contributing, see [DEVELOPMENT.md](DEVELOPMENT.md).


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Resources

- [Barion API Documentation](https://docs.barion.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
