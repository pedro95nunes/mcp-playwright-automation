import { Browser, Page, chromium } from 'playwright';

export class BrowserManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private launching: Promise<void> | null = null;

  // Lazy initialization: Chromium only starts on the first tool call,
  // so it doesn't delay the MCP handshake.
  async initialize(): Promise<void> {
    if (this.page) return;

    if (!this.launching) {
      this.launching = (async () => {
        this.browser = await chromium.launch();
        this.page = await this.browser.newPage();
      })().catch((error) => {
        this.launching = null;
        this.browser = null;
        this.page = null;
        throw error;
      });
    }

    await this.launching;
  }

  async getPage(): Promise<Page> {
    await this.initialize();
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    return this.page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.launching = null;
    }
  }
}

export const browserManager = new BrowserManager();
