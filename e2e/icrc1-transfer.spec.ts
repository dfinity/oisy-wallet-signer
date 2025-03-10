import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII('should call canister to transfer some ICP', async () => {
  const partyPage = getPartyPage();

  await partyPage.approvePermissionsAccounts();

  await partyPage.approvePermissionsConsentMessageIcrc1Transfer();

  await partyPage.icrc1Transfer();
});
