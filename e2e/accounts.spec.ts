import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

testWithII.describe.configure({mode: 'serial'});

const getPartyPage = initTestSuite();

testWithII('should requests permissions and list accounts', async () => {
  const partyPage = getPartyPage();

  await partyPage.approvePermissionsAccounts();
});

testWithII('should not requests permissions and list accounts', async () => {
  const partyPage = getPartyPage();

  await partyPage.resetAccounts();

  await partyPage.accounts();
});
