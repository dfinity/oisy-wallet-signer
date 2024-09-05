import type { IcrcAccounts } from '@dfinity/oisy-wallet-signer';
import { writable } from 'svelte/store';

export const accountsStore = writable<IcrcAccounts | undefined | null>(undefined);
