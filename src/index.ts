import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { browserManager } from './browser';
import { tools } from './tools';

// stdout is the MCP JSON-RPC channel: any logging must go to stderr.
const log = (...args: unknown[]) => console.error('[MCP]', ...args);

const server = new McpServer({
  name: 'playwright-automation',
  version: '1.0.0'
});

const text = (value: string) => ({
  content: [{ type: 'text' as const, text: value }]
});

server.registerTool(
  'navigate',
  {
    title: 'Navigate',
    description: 'Navigates to a specific URL',
    inputSchema: { url: z.string().describe('URL to navigate to') }
  },
  async ({ url }) => text(await tools.navigate(url))
);

server.registerTool(
  'click',
  {
    title: 'Click',
    description: 'Clicks an element on the page',
    inputSchema: { selector: z.string().describe('CSS selector of the element') }
  },
  async ({ selector }) => text(await tools.click(selector))
);

server.registerTool(
  'fillForm',
  {
    title: 'Fill form',
    description: 'Fills a form field',
    inputSchema: {
      selector: z.string().describe('CSS selector of the field'),
      text: z.string().describe('Text to fill in')
    }
  },
  async (args) => text(await tools.fillForm(args.selector, args.text))
);

server.registerTool(
  'extractData',
  {
    title: 'Extract data',
    description: 'Extracts the text of an element on the page',
    inputSchema: { selector: z.string().describe('CSS selector of the element') }
  },
  async ({ selector }) => text(await tools.extractData(selector))
);

server.registerTool(
  'getPageContent',
  {
    title: 'Page content',
    description: 'Gets the full HTML content of the page',
    inputSchema: {}
  },
  async () => text(await tools.getPageContent())
);

server.registerTool(
  'screenshot',
  {
    title: 'Screenshot',
    description: 'Takes a screenshot of the page',
    inputSchema: {
      filename: z
        .string()
        .describe('File name (relative to the screenshots/ folder) or absolute path')
    }
  },
  async ({ filename }) => text(await tools.screenshot(filename))
);

async function shutdown(reason: string): Promise<void> {
  log(`Shutting down (${reason})`);
  try {
    await browserManager.close();
  } catch (error) {
    log('Error closing the browser:', error);
  }
  process.exit(0);
}

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('Server connected over stdio');

  transport.onclose = () => {
    void shutdown('stdio closed');
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  log('Fatal error:', error);
  process.exit(1);
});
