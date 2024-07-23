import {InternetIdentityPage, testWithII} from '@dfinity/internet-identity-playwright';
import {expect} from '@playwright/test';

testWithII.beforeEach(async ({iiPage, browser}) => {
  const REPLICA_URL = 'http://localhost:4943';
  const INTERNET_IDENTITY_ID = 'rdmx6-jaaaa-aaaaa-aaadq-cai';

  await iiPage.waitReady({url: REPLICA_URL, canisterId: INTERNET_IDENTITY_ID});
});

const RELYING_PARTY_URL = 'http://localhost:5173';

testWithII(
  'should sign-in relying-party with a new user',
  async ({page: partyPage, iiPage: partyIIPage, context, browser}) => {
    await partyPage.goto(RELYING_PARTY_URL);

    const identity = await partyIIPage.signInWithNewIdentity();

    await expect(partyPage.getByTestId('connect-wallet-button')).toBeVisible();

    const walletPagePromise = context.waitForEvent('page');

    await partyPage.getByTestId('connect-wallet-button').click();

    const walletPage = await walletPagePromise;
    await expect(walletPage).toHaveTitle('Wallet');

    await expect(walletPage.getByTestId('login-button')).toBeVisible();

    const walletIIPage = new InternetIdentityPage({
      page: walletPage,
      context,
      browser
    });

    await walletIIPage.signInWithIdentity({identity});
  }
);
