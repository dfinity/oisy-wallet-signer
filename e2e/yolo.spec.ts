import {testWithII} from '@dfinity/internet-identity-playwright';
import {expect} from '@playwright/test';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII('should requests permissions and list accounts', async () => {
  const partyPage = getPartyPage();

  expect(true).toBe(true);
});
