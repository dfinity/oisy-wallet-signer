import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII('should call canister to request an approval of some ICP', async () => {
  const partyPage = getPartyPage();

  await partyPage.approvePermissionsAccounts();

  await partyPage.approvePermissionsConsentMessageIcrc2Approve();

  await partyPage.icrc2Approve();
});
