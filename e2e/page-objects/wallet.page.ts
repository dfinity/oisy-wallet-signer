import {InternetIdentityPage} from '@dfinity/internet-identity-playwright';
import {assertNonNullish} from '@dfinity/utils';
import {expect} from '@playwright/test';
import {mockConsentMessage} from '../mocks/consent-message.mocks';
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

  async approveRequestedPermissions(): Promise<void> {
    await this.approvePermissions({countPermissions: 2});
  }

  async approveAccountsPermission(): Promise<void> {
    await this.approvePermissions({countPermissions: 1});
  }

  async approveCallCanisterPermission(): Promise<void> {
    await this.approvePermissions({countPermissions: 1});
  }

  private async approvePermissions({countPermissions}: {countPermissions: number}): Promise<void> {
    await expect(this.page.getByTestId('requested-permissions')).toBeVisible();

    const ul = this.page.getByTestId('requested-permissions-list');

    const checkboxes = ul.locator('input');

    expect(await checkboxes.count()).toBe(countPermissions);

    await checkboxes.nth(0).click();

    const block = this.page.getByTestId('requested-permissions');
    await expect(block.getByText('1 permissions approved')).toBeVisible();

    await this.page.getByTestId('submit-permissions-button').click();
  }

  async assertConsentMessageLoading(): Promise<void> {
    await expect(this.page.getByTestId('loading-consent-message')).toBeVisible();
  }

  async assertConsentMessage(partyUserId: string): Promise<void> {
    const walletUserId = await this.getUserId();

    await expect(this.page.getByTestId('consent-message')).toBeVisible();

    const p = this.page.getByTestId('consent-message');

    await expect(p).toContainText(
      mockConsentMessage({
        partyUserId,
        walletUserId
      })
    );
  }

  async getICP(): Promise<void> {
    await expect(this.page.getByTestId('get-icp-button')).toBeVisible();

    await this.page.getByTestId('get-icp-button').click();
  }

  async approveConsentMessage(): Promise<void> {
    await expect(this.page.getByTestId('approve-consent-message-button')).toBeVisible();

    await this.page.getByTestId('approve-consent-message-button').click();

    await expect(this.page.getByTestId('result-call-canister')).toBeVisible();
  }
}
