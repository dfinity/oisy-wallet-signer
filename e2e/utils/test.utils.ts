import type {Page} from '@playwright/test';

export const waitForFadeAnimation = async (page: Page) => await page.waitForTimeout(400);
