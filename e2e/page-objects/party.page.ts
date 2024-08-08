import {InternetIdentityPage} from '@dfinity/internet-identity-playwright';
import {expect} from '@playwright/test';
import {waitForFadeAnimation} from '../utils/test.utils';
import {IdentityPage, IdentityPageParams} from './identity.page';
import {WalletPage} from './wallet.page';

export class PartyPage extends IdentityPage {
  #walletPage: WalletPage | undefined;

  constructor(params: IdentityPageParams) {
    super(params);
  }

  /**
   * @override
   */
  async signIn(): Promise<void> {
    const partyIIPage = new InternetIdentityPage({
      page: this.page,
      context: this.context,
      browser: this.browser
    });

    this.identity = await partyIIPage.signInWithNewIdentity();
  }

  async waitReady(): Promise<void> {
    const partyIIPage = new InternetIdentityPage({
      page: this.page,
      context: this.context,
      browser: this.browser
    });

    const REPLICA_URL = 'http://localhost:4943';
    const INTERNET_IDENTITY_ID = 'rdmx6-jaaaa-aaaaa-aaadq-cai';

    await partyIIPage.waitReady({url: REPLICA_URL, canisterId: INTERNET_IDENTITY_ID});
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

    this.#walletPage = new WalletPage({
      identity: this.identity,
      page: walletPage,
      context: this.context,
      browser: this.browser
    });

    await this.#walletPage.signIn();

    // Finally assert relying party is connected

    await expect(this.page.getByTestId('wallet-connected')).toBeVisible();

    await waitForFadeAnimation(this.page);

    await expect(this.page.getByTestId('wallet-connected')).toHaveScreenshot();
  }

  async assertSupportedStandards(): Promise<void> {
    await expect(this.page.getByTestId('supported-standards')).toBeVisible();
  }
}
