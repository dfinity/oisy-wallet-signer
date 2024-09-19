import {testWithII} from '@dfinity/internet-identity-playwright';
import {
  ICRC25_PERMISSION_ASK_ON_USE,
  ICRC25_PERMISSION_DENIED,
  ICRC25_PERMISSION_GRANTED,
  ICRC27_ACCOUNTS,
  ICRC49_CALL_CANISTER
} from '../src';
import {initTestSuite} from './utils/init.utils';

const getPartyPage = initTestSuite();

testWithII('should get ask_on_use permissions by default', async () => {
  const partyPage = getPartyPage();

  await partyPage.assertPermissions({
    [`${ICRC27_ACCOUNTS}`]: ICRC25_PERMISSION_ASK_ON_USE,
    [`${ICRC49_CALL_CANISTER}`]: ICRC25_PERMISSION_ASK_ON_USE
  });
});

testWithII('should get the permissions set by the user', async () => {
  const partyPage = getPartyPage();

  await partyPage.requestPermissions();

  await partyPage.assertPermissions({
    [`${ICRC27_ACCOUNTS}`]: ICRC25_PERMISSION_GRANTED,
    [`${ICRC49_CALL_CANISTER}`]: ICRC25_PERMISSION_DENIED
  });
});
