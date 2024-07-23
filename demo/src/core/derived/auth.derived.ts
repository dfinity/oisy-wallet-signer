import { authStore } from '$core/stores/auth.store';
import { nonNullish } from '@dfinity/utils';
import { derived, type Readable } from 'svelte/store';

export const signedIn: Readable<boolean> = derived(authStore, ({ identity }) =>
	nonNullish(identity)
);

export const notSignedIn: Readable<boolean> = derived(signedIn, ($signedIn) => !$signedIn);
