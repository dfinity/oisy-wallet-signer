import { WALLET_DEFAULT_URL } from '$core/constants/app.constants';
import { writable } from 'svelte/store';

export const walletUrlStore = writable<string>(WALLET_DEFAULT_URL);
