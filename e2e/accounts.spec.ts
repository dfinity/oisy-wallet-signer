import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII('should requests permissions and list accounts', async () => {
  const partyPage = getPartyPage();

  await partyPage.accounts();
});

testWithII('should not requests permissions and list accounts', async () => {
  // TODO
});
