import {Principal} from '@dfinity/principal';
import type {IcrcAccounts} from '../types/icrc-accounts';
import {uint8ArrayToBase64} from '../utils/base64.utils';

export const mockCanisterId = 'doked-biaaa-aaaar-qag2a-cai';

export const mockPrincipalText = 'xlmdg-vkosz-ceopx-7wtgu-g3xmd-koiyc-awqaq-7modz-zf6r6-364rh-oqe';

export const mockAccounts: IcrcAccounts = [
  {owner: mockPrincipalText},
  {owner: Principal.anonymous().toText(), subaccount: uint8ArrayToBase64(new Uint8Array(32))}
];
