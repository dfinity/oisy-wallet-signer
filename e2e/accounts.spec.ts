import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII.skip('should requests permissions and list accounts', async () => {
  const partyPage = getPartyPage();

  await partyPage.approvePermissionsAccounts();
});

testWithII.skip('should not requests permissions and list accounts', async () => {
  const partyPage = getPartyPage();

  await partyPage.resetAccounts();

  await partyPage.accounts();
});
