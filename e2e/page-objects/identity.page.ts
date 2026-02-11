import {Browser, BrowserContext, Page, expect} from '@playwright/test';

export interface IdentityPageParams {
  page: Page;
  context: BrowserContext;
  browser: Browser;
}

export abstract class IdentityPage {
  protected readonly page: Page;
  protected readonly context: BrowserContext;
  protected readonly browser: Browser;

  protected constructor({page, context, browser}: IdentityPageParams) {
    this.page = page;
    this.context = context;
    this.browser = browser;
  }

  abstract signIn(): Promise<void>;

  async close(): Promise<void> {
    await this.page.close();
  }

  async getUserId(): Promise<string> {
    await expect(this.page.getByTestId('user-id')).toBeVisible();

    const output = this.page.getByTestId('user-id');

    await expect(output).toContainText(/\S+/);

    return await output.innerText();
  }

  async assertBalance(balance: string): Promise<void> {
    await expect(this.page.getByTestId('icp-balance')).toBeVisible();

    const output = this.page.getByTestId('icp-balance');

    await expect(output).toContainText(`${balance} ICP`);
  }
}
