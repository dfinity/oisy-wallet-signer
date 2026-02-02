import {InternetIdentityPage} from '@dfinity/internet-identity-playwright';
import {expect} from '@playwright/test';
import {IcrcPermissionState, IcrcScopedMethod} from '../../src';
import {
  mockConsentMessageIcrc1Transfer,
  mockConsentMessageIcrc2Approve,
  mockConsentMessageIcrc2TransferFrom
} from '../mocks/consent-message.mocks';
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
    await this.#partyIIPage.signIn();
  }

  async waitReady(): Promise<void> {
    const REPLICA_URL = 'http://127.0.0.1:4943';
    const INTERNET_IDENTITY_ID = 'rdmx6-jaaaa-aaaaa-aaadq-cai';

    await this.#partyIIPage.waitReady({url: REPLICA_URL, canisterId: INTERNET_IDENTITY_ID});
  }

  async goto(): Promise<void> {
    await this.page.goto('http://localhost:5173/dev');
  }

  async connect(): Promise<void> {
    await expect(this.page.getByTestId('connect-wallet-button')).toBeVisible();

    const walletPagePromise = this.context.waitForEvent('page');

    await this.page.getByTestId('connect-wallet-button').click();

    const walletPage = await walletPagePromise;
    await expect(walletPage).toHaveTitle('Wallet');

    this.#walletPage = new WalletPage({
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
    await expect(this.page.getByTestId('wallet-connected-value')).toHaveText('Connected');
  }

  async assertDisconnected(): Promise<void> {
    // The relying party polls every 5 sec for the status of the wallet. The constant is currently not exposed.
    await this.page.waitForTimeout(10000);

    await expect(this.page.getByTestId('wallet-connected')).not.toBeVisible();
    await expect(this.page.getByTestId('wallet-disconnected')).toBeVisible();
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
    expectedPermissions: Record<IcrcScopedMethod, IcrcPermissionState>
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

    await this.#walletPage?.approveAccountsPermission();

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

    await expect(accounts).toHaveCount(1);

    // TODO: check principal
  }

  async approvePermissionsConsentMessageIcrc1Transfer(): Promise<void> {
    const partyUserId = await this.getUserId();

    await expect(this.page.getByTestId('call-icrc1-transfer-button')).toBeVisible();

    await this.page.getByTestId('call-icrc1-transfer-button').click();

    await this.#walletPage?.approveCallCanisterPermission();

    await this.#walletPage?.assertConsentMessageLoading();

    await this.#walletPage?.assertConsentMessage({
      partyUserId,
      tokenSymbol: 'ICP',
      tokenName: 'Internet Computer',
      fn: mockConsentMessageIcrc1Transfer,
      level: 'Ok'
    });
  }

  async approvePermissionsConsentMessageIcrc2Approve(): Promise<void> {
    const partyUserId = await this.getUserId();

    await expect(this.page.getByTestId('call-icrc2-approve-button')).toBeVisible();

    await this.page.getByTestId('call-icrc2-approve-button').click();

    await this.#walletPage?.approveCallCanisterPermission();

    await this.#walletPage?.assertConsentMessageLoading();

    await this.#walletPage?.assertConsentMessage({
      partyUserId,
      tokenSymbol: 'ICP',
      tokenName: 'Internet Computer',
      fn: mockConsentMessageIcrc2Approve,
      level: 'Ok'
    });
  }

  async approveConsentMessageIcrc2TransferFrom(): Promise<void> {
    const partyUserId = await this.getUserId();

    await expect(this.page.getByTestId('call-icrc2-transfer-from-button')).toBeVisible();

    await this.page.getByTestId('call-icrc2-transfer-from-button').click();

    await this.#walletPage?.assertConsentMessageLoading();

    await this.#walletPage?.assertConsentMessage({
      partyUserId,
      tokenSymbol: 'ICP',
      tokenName: 'Internet Computer',
      fn: mockConsentMessageIcrc2TransferFrom,
      level: 'Ok'
    });
  }

  async approvePermissionsBuildConsentMessageIcrc1Transfer(): Promise<void> {
    const partyUserId = await this.getUserId();

    await expect(this.page.getByTestId('build-icrc1-transfer-button')).toBeVisible();

    await this.page.getByTestId('build-icrc1-transfer-button').click();

    await this.#walletPage?.approveCallCanisterPermission();

    await this.#walletPage?.assertConsentMessageLoading();

    await this.#walletPage?.assertConsentMessage({
      partyUserId,
      tokenSymbol: 'TKN',
      tokenName: 'Token',
      fn: mockConsentMessageIcrc1Transfer,
      level: 'Warning'
    });
  }

  async approvePermissionsBuildConsentMessageIcrc2Approve(): Promise<void> {
    const partyUserId = await this.getUserId();

    await expect(this.page.getByTestId('build-icrc2-approve-button')).toBeVisible();

    await this.page.getByTestId('build-icrc2-approve-button').click();

    await this.#walletPage?.approveCallCanisterPermission();

    await this.#walletPage?.assertConsentMessageLoading();

    await this.#walletPage?.assertConsentMessage({
      partyUserId,
      tokenSymbol: 'TKN',
      tokenName: 'Token',
      fn: mockConsentMessageIcrc2Approve,
      level: 'Warning'
    });
  }

  async icrc1Transfer(): Promise<void> {
    await this.#walletPage?.getICP();

    await this.#walletPage?.assertBalance('55.0001');

    await this.#walletPage?.approveConsentMessage();

    await this.#walletPage?.assertBalance('54.5000');

    await this.assertBalance('0.5000');
  }

  async icrc2Approve(): Promise<void> {
    await this.#walletPage?.approveConsentMessage();

    await this.assertBalance('0.5000');
  }

  async icrc2TransferFrom(): Promise<void> {
    await this.#walletPage?.assertBalance('54.4998');

    await this.#walletPage?.approveConsentMessage();

    await this.#walletPage?.assertBalance('54.2497');

    await this.assertBalance('0.2500');
  }

  async closeWalletWindow(): Promise<void> {
    await this.#walletPage?.close();
  }
}
