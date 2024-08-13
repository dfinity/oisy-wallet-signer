import {InternetIdentityPage} from '@dfinity/internet-identity-playwright';
import {assertNonNullish} from '@dfinity/utils';
import {expect} from '@playwright/test';
import {IdentityPage, IdentityPageParams} from './identity.page';

export class WalletPage extends IdentityPage {
  constructor({identity, ...rest}: IdentityPageParams & {identity: number | undefined}) {
    super(rest);

    this.identity = identity;
  }

  /**
   * @override
   */
  async signIn(): Promise<void> {
    await expect(this.page.getByTestId('login-button')).toBeVisible();

    const walletIIPage = new InternetIdentityPage({
      page: this.page,
      context: this.context,
      browser: this.browser
    });

    assertNonNullish(this.identity);

    await walletIIPage.signInWithIdentity({identity: this.identity});
  }

  async approvePermissions(): Promise<void> {
    await expect(this.page.getByTestId('requested-permissions')).toBeVisible();

    const ul = this.page.getByTestId('requested-permissions-list');

    const checkboxes = ul.locator('input');

    expect(await checkboxes.count()).toBe(2);

    await checkboxes.nth(0).click();

    const block = this.page.getByTestId('requested-permissions');
    await expect(block.getByText('1 permissions approved')).toBeVisible();

    await this.page.getByTestId('submit-permissions-button').click();
  }
}
