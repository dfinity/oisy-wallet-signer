import {InternetIdentityPage} from '@dfinity/internet-identity-playwright';
import {expect} from '@playwright/test';
import {IcrcWalletPermissionState, IcrcWalletScopedMethod} from '../../src';
import {waitForFadeAnimation} from '../utils/test.utils';
import {IdentityPage, IdentityPageParams} from './identity.page';
import {WalletPage} from './wallet.page';

export class PartyPage extends IdentityPage {
  #partyIIPage: InternetIdentityPage;
  #walletPage: WalletPage | undefined;

  constructor(params: IdentityPageParams) {
    super(params);

    this.#partyIIPage = new InternetIdentityPage({
      page: this.page,
      context: this.context,
      browser: this.browser
    });
  }

  /**
   * @override
   */
  async signIn(): Promise<void> {
    this.identity = await this.#partyIIPage.signInWithNewIdentity();
  }

  async waitReady(): Promise<void> {
    const REPLICA_URL = 'http://localhost:4943';
    const INTERNET_IDENTITY_ID = 'rdmx6-jaaaa-aaaaa-aaadq-cai';

    await this.#partyIIPage.waitReady({url: REPLICA_URL, canisterId: INTERNET_IDENTITY_ID});
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
  }

  async assertConnected(): Promise<void> {
    await expect(this.page.getByTestId('wallet-connected')).toHaveScreenshot();
  }

  async assertSupportedStandards(): Promise<void> {
    await expect(this.page.getByTestId('supported-standards')).toBeVisible();

    const div = this.page.getByTestId('supported-standards');

    const icrc25ListItem = div.locator('ul > li', {
      hasText: 'ICRC-25'
    });

    await expect(icrc25ListItem).toBeVisible();
    await expect(icrc25ListItem).toHaveText('ICRC-25');
  }

  async assertPermissions(
    expectedPermissions: Record<IcrcWalletScopedMethod, IcrcWalletPermissionState>
  ): Promise<void> {
    await expect(this.page.getByTestId('permissions')).toBeVisible();

    const permissions = this.page.getByTestId('permissions');

    for (const [scope, expectedPermission] of Object.entries(expectedPermissions)) {
      await expect(permissions.getByText(`${scope}: ${expectedPermission}`)).toBeVisible();
    }
  }

  async requestPermissions(): Promise<void> {
    await expect(this.page.getByTestId('request-permissions-button')).toBeVisible();

    await this.page.getByTestId('request-permissions-button').click();

    await this.#walletPage?.approveRequestedPermissions();

    await expect(this.page.getByTestId('request-permissions')).toBeVisible();

    const permissions = this.page.getByTestId('request-permissions');

    await expect(permissions.getByText('icrc27_accounts: granted')).toBeVisible();
    await expect(permissions.getByText('icrc49_call_canister: denied')).toBeVisible();
  }

  async approvePermissionsAccounts(): Promise<void> {
    await expect(this.page.getByTestId('accounts-button')).toBeVisible();

    await this.page.getByTestId('accounts-button').click();

    await this.#walletPage?.approveAccountsPermissions();

    await this.assertAccounts();
  }

  async resetAccounts(): Promise<void> {
    await expect(this.page.getByTestId('reset-accounts-button')).toBeVisible();

    await this.page.getByTestId('reset-accounts-button').click();

    await expect(this.page.getByTestId('accounts-button')).toBeVisible();
  }

  async accounts(): Promise<void> {
    await expect(this.page.getByTestId('accounts-button')).toBeVisible();

    await this.page.getByTestId('accounts-button').click();

    await this.assertAccounts();
  }

  private async assertAccounts(): Promise<void> {
    await expect(this.page.getByTestId('accounts')).toBeVisible();

    const ul = this.page.getByTestId('accounts-list');

    const accounts = ul.locator('li');

    expect(await accounts.count()).toBe(1);

    // TODO: check principal
  }
}
