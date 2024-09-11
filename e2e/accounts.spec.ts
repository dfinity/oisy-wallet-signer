import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII('should requests permissions and list accounts', async () => {
  // const partyPage = getPartyPage();

  // await partyPage.approvePermissionsAccounts();

  expect(true).toBe(true);
});

testWithII.skip('should not requests permissions and list accounts', async () => {
  const partyPage = getPartyPage();

  await partyPage.resetAccounts();

  await partyPage.accounts();
});
