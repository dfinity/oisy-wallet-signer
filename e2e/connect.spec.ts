import {testWithII} from '@dfinity/internet-identity-playwright';
import {PartyPage} from './page-objects/party.page';

testWithII.describe.configure({mode: 'serial'});

let partyPage: PartyPage;

testWithII.beforeAll(async ({playwright}) => {
  const browser = await playwright.chromium.launch();

  const context = await browser.newContext();
  const page = await context.newPage();

  partyPage = new PartyPage({
    page,
    context,
    browser
  });

  await partyPage.waitReady();

  await partyPage.goto();
});

testWithII.afterAll(async () => {
  await partyPage.close();
});

testWithII('should sign-in relying-party with a new user', async () => {
  await partyPage.signIn();
});

testWithII('should connect the wallet', async () => {
  await partyPage.connect();

  await partyPage.assertConnected();
});

testWithII('should list supported standards', async () => {
  await partyPage.assertSupportedStandards();
});
