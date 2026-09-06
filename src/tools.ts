import * as fs from 'fs';
import * as path from 'path';
import { browserManager } from './browser';

// Claude Desktop starts the server with an unpredictable cwd (usually "/"),
// so relative screenshot paths need a stable anchor.
const SCREENSHOT_DIR =
  process.env.MCP_SCREENSHOT_DIR ?? path.resolve(__dirname, '..', 'screenshots');

export const tools = {
  async navigate(url: string): Promise<string> {
    const page = await browserManager.getPage();
    await page.goto(url);
    return `Navigated to ${url}`;
  },

  async click(selector: string): Promise<string> {
    const page = await browserManager.getPage();
    await page.click(selector);
    return `Clicked on: ${selector}`;
  },

  async fillForm(selector: string, text: string): Promise<string> {
    const page = await browserManager.getPage();
    await page.fill(selector, text);
    return `Filled ${selector} with: ${text}`;
  },

  async extractData(selector: string): Promise<string> {
    const page = await browserManager.getPage();
    const content = await page.textContent(selector);
    return content || 'No content found';
  },

  async getPageContent(): Promise<string> {
    const page = await browserManager.getPage();
    return await page.content();
  },

  async screenshot(filename: string): Promise<string> {
    const page = await browserManager.getPage();
    const target = path.isAbsolute(filename)
      ? filename
      : path.join(SCREENSHOT_DIR, filename);

    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await page.screenshot({ path: target });
    return `Screenshot saved to: ${target}`;
  }
};
