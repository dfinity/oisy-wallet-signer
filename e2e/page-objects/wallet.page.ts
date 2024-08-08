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
  async signInWithNewIdentity(): Promise<void> {
    await expect(this.page.getByTestId('login-button')).toBeVisible();

    const walletIIPage = new InternetIdentityPage({
      page: this.page,
      context: this.context,
      browser: this.browser
    });

    assertNonNullish(this.identity);

    await walletIIPage.signInWithIdentity({identity: this.identity});
  }
}
