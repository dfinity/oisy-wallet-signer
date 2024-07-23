import {testWithII} from '@dfinity/internet-identity-playwright';

testWithII.beforeEach(async ({iiPage, browser}) => {
  const REPLICA_URL = 'http://localhost:4943';
  const INTERNET_IDENTITY_ID = 'rdmx6-jaaaa-aaaaa-aaadq-cai';

  await iiPage.waitReady({url: REPLICA_URL, canisterId: INTERNET_IDENTITY_ID});
});

const RELYING_PARTY_URL = 'http://localhost:5173';

testWithII('should sign-in relying-party with a new user', async ({page, iiPage}) => {
  await page.goto(RELYING_PARTY_URL);

  await iiPage.signInWithNewIdentity();
});
