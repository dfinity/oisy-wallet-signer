import {testWithII} from '@dfinity/internet-identity-playwright';
import {PartyPage} from './page-objects/party.page';

testWithII.beforeEach(async ({iiPage, browser}) => {
  const REPLICA_URL = 'http://localhost:4943';
  const INTERNET_IDENTITY_ID = 'rdmx6-jaaaa-aaaaa-aaadq-cai';

  await iiPage.waitReady({url: REPLICA_URL, canisterId: INTERNET_IDENTITY_ID});
});

testWithII(
  'should sign-in relying-party with a new user',
  async ({page, iiPage, context, browser}) => {
    const partyPage = new PartyPage({
      page,
      iiPage,
      context,
      browser
    });

    await partyPage.goto();

    await partyPage.signInWithNewIdentity();

    await partyPage.connect();
  }
);
