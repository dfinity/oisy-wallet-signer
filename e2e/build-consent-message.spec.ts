import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII.skip(
  'should requests permissions and present consent message build by the library',
  async () => {
    const partyPage = getPartyPage();

    await partyPage.approvePermissionsAccounts();

    await partyPage.approvePermissionsBuildConsentMessage();
  }
);
