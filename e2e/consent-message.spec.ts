import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII('should requests permissions and present consent message', async () => {
  const partyPage = getPartyPage();

  await partyPage.approvePermissionsAccounts();

  await partyPage.approvePermissionsConsentMessageIcrc1Transfer();
});
