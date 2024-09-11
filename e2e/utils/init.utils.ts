import {testWithII} from '@dfinity/internet-identity-playwright';
import {PartyPage} from '../page-objects/party.page';

export const initTestSuite = (): (() => PartyPage) => {
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

    await partyPage.signIn();
  });

  testWithII.afterAll(async () => {
    await partyPage.close();
  });

  return (): PartyPage => partyPage;
};
