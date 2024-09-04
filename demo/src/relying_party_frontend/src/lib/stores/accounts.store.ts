import {writable} from "svelte/store";
import type {IcrcAccounts} from "@dfinity/oisy-wallet-signer";

export const accountsStore = writable<IcrcAccounts | undefined | null>(undefined);