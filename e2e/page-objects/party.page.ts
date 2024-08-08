import {InternetIdentityPage} from '@dfinity/internet-identity-playwright';
import {expect} from '@playwright/test';
import {waitForFadeAnimation} from '../utils/test.utils';
import {IdentityPage, IdentityPageParams} from './identity.page';
import {WalletPage} from './wallet.page';

export class PartyPage extends IdentityPage {
  readonly #iiPage: InternetIdentityPage;

  constructor({
    iiPage,
    ...rest
  }: IdentityPageParams & {
    iiPage: InternetIdentityPage;
  }) {
    super(rest);

    this.#iiPage = iiPage;
  }

  /**
   * @override
   */
  async signInWithNewIdentity(): Promise<void> {
    this.identity = await this.#iiPage.signInWithNewIdentity();
  }

  async goto(): Promise<void> {
    await this.page.goto('http://localhost:5173');
  }

  async connect(): Promise<void> {
    await expect(this.page.getByTestId('connect-wallet-button')).toBeVisible();

    const walletPagePromise = this.context.waitForEvent('page');

    await this.page.getByTestId('connect-wallet-button').click();

    const walletPage = await walletPagePromise;
    await expect(walletPage).toHaveTitle('Wallet');

    const walletPageObject = new WalletPage({
      identity: this.identity,
      page: walletPage,
      context: this.context,
      browser: this.browser
    });

    await walletPageObject.signInWithNewIdentity();

    // Finally assert relying party is connected

    await expect(this.page.getByTestId('wallet-connected')).toBeVisible();

    await waitForFadeAnimation(this.page);

    await expect(this.page.getByTestId('wallet-connected')).toHaveScreenshot();
  }
}
