import {testWithII} from '@dfinity/internet-identity-playwright';
import {PartyPage} from '../page-objects/party.page';

export const initTestSuite = (): (() => PartyPage) => {
  testWithII.describe.configure({mode: 'serial'});

  let partyPage: PartyPage;

  testWithII.beforeAll(async ({playwright}) => {
    testWithII.setTimeout(120000);

    const browser = await playwright.chromium.launch();

    // Recent Chrome versions block the scripts of the Internet Identity served by the Juno
    // emulator under that page's own CSP. These tests don't check CSP, so they bypass it.
    const context = await browser.newContext({bypassCSP: true});
    const page = await context.newPage();

    partyPage = new PartyPage({
      page,
      context,
      browser
    });

    await partyPage.waitReady();

    await partyPage.goto();

    await partyPage.signIn();

    await partyPage.connect();
  });

  testWithII.afterAll(async () => {
    await partyPage.close();
  });

  return (): PartyPage => partyPage;
};
