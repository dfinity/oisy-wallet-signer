import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII('should request permissions', async () => {
  const partyPage = getPartyPage();

  await partyPage.requestPermissions();
});
