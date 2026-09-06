# mcp-playwright-automation

An [MCP](https://modelcontextprotocol.io) server that gives an AI assistant
(Claude Desktop, or any MCP client) control of a real Chromium browser through
[Playwright](https://playwright.dev).

Once connected, the assistant can open pages, click elements, fill in forms,
read text or HTML off the page, and capture screenshots — all inside a single
persistent browser session.

## How it works

The server speaks MCP over **stdio**: the client launches `dist/index.js` as a
subprocess and exchanges JSON-RPC messages over stdin/stdout. Because stdout is
the protocol channel, all logging goes to stderr.

A single Chromium instance and page are shared across calls, so state (cookies,
current URL, session) persists between tools. The browser is launched **lazily**
— on the first tool call, not at startup — so the MCP handshake stays fast. It
is closed on `SIGINT`, `SIGTERM`, or when the stdio channel closes.

```
src/
  index.ts     MCP server: tool registration, schemas, lifecycle
  tools.ts     Tool implementations (the Playwright calls)
  browser.ts   BrowserManager: lazy launch, shared page, cleanup
  client.ts    Test client that drives the server like Claude Desktop does
```

## Tools

| Tool | Arguments | Description |
| --- | --- | --- |
| `navigate` | `url` | Navigates to a URL |
| `click` | `selector` | Clicks an element (CSS selector) |
| `fillForm` | `selector`, `text` | Fills a form field |
| `extractData` | `selector` | Returns the text content of an element |
| `getPageContent` | — | Returns the full HTML of the page |
| `screenshot` | `filename` | Saves a PNG screenshot |

`screenshot` accepts either an absolute path or a name relative to the
screenshots directory. Since MCP clients start the server with an unpredictable
working directory, relative names are resolved against the `screenshots/` folder at the project root — override it with the `MCP_SCREENSHOT_DIR` environment
variable.

## Requirements

- Node.js 18+ (developed on 22)
- Chromium, installed via Playwright

## Setup

```bash
npm install
npx playwright install chromium
npm run build
```

## Usage

### With Claude Desktop

Add the server to `claude_desktop_config.json`
(`~/Library/Application Support/Claude/` on macOS,
`%APPDATA%\Claude\` on Windows), using an **absolute** path:

```json
{
  "mcpServers": {
    "playwright-automation": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-playwright-automation/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop, and the six tools become available in conversation.

### Verifying it works

The bundled test client performs the same handshake an MCP client does, lists
the tools, navigates to `example.com`, and extracts its heading:

```bash
npm run test:client
```

You can also run the server directly — it will wait for JSON-RPC on stdin:

```bash
npm start
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run build` | Compiles `src/` to `dist/` with `tsc` |
| `npm start` | Runs the MCP server over stdio |
| `npm run test:client` | Runs the test client against the built server |
| `npx playwright test` | Runs the Playwright suite in `tests/` |

## Tests

`tests/` holds a standard Playwright suite, configured in
`playwright.config.ts` to run against Chromium, Firefox, and WebKit. A GitHub
Actions workflow (`.github/workflows/playwright.yml`) runs it on every push and
pull request to `main`, and uploads the HTML report as an artifact.

Note that these tests cover browser behaviour directly; they do not exercise
the MCP layer. Use `npm run test:client` for that.

## Notes

- `dist/` and `screenshots/` are generated and therefore not tracked in git.
- The browser runs headless. To watch it work, pass `{ headless: false }` to
  `chromium.launch()` in `src/browser.ts`.
