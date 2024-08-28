import {Principal} from '@dfinity/principal';
import type {IcrcAccounts} from '../types/icrc-accounts';

export const mockPrincipalText = 'xlmdg-vkosz-ceopx-7wtgu-g3xmd-koiyc-awqaq-7modz-zf6r6-364rh-oqe';

export const mockAccounts: IcrcAccounts = [
  {owner: mockPrincipalText},
  {owner: Principal.anonymous().toText(), subaccount: new Uint8Array(32)}
];
