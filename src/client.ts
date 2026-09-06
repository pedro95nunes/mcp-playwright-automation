import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Test client: performs the same handshake Claude Desktop does.
async function testServer(): Promise<void> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.resolve(__dirname, 'index.js')],
    stderr: 'inherit'
  });

  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(transport);
  console.log('Handshake complete:', client.getServerVersion());

  console.log('\n=== Test 1: List tools ===');
  const { tools } = await client.listTools();
  console.log(tools.map((tool) => tool.name).join(', '));

  console.log('\n=== Test 2: Navigate to example.com ===');
  console.log(
    await client.callTool({
      name: 'navigate',
      arguments: { url: 'https://example.com' }
    })
  );

  console.log('\n=== Test 3: Extract title ===');
  console.log(
    await client.callTool({
      name: 'extractData',
      arguments: { selector: 'h1' }
    })
  );

  await client.close();
}

testServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
