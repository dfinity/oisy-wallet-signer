import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII.skip(
  'should requests permissions and present consent message for icrc1 transfer build by the library',
  async () => {
    const partyPage = getPartyPage();

    await partyPage.approvePermissionsAccounts();

    await partyPage.approvePermissionsBuildConsentMessageIcrc1Transfer();
  }
);

testWithII.skip(
  'should requests permissions and present consent message for icrc2 approve build by the library',
  async () => {
    const partyPage = getPartyPage();

    await partyPage.approvePermissionsAccounts();

    await partyPage.approvePermissionsBuildConsentMessageIcrc2Approve();
  }
);
