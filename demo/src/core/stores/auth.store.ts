import {
	AUTH_MAX_TIME_TO_LIVE,
	AUTH_POPUP_HEIGHT,
	AUTH_POPUP_WIDTH,
	LOCAL_REPLICA_HOST,
	LOCAL_REPLICA_URL
} from '$core/constants/app.constants';
import type { OptionIdentity } from '$core/types/identity';
import { createAuthClient } from '$core/utils/auth.utils';
import { popupCenter } from '$core/utils/window.utils';
import { nonNullish } from '@dfinity/utils';
import type { AuthClient } from '@icp-sdk/auth/client';
import { writable, type Readable } from 'svelte/store';

export interface AuthStoreData {
	identity: OptionIdentity;
}

let authClient: AuthClient | undefined | null;

export interface AuthSignInParams {
	domain?: 'ic0.app' | 'internetcomputer.org';
	size?: {
		width: number;
		height: number;
	};
}

export interface AuthStore extends Readable<AuthStoreData> {
	sync: () => Promise<void>;
	signIn: (params: AuthSignInParams) => Promise<void>;
	signOut: () => Promise<void>;
}

const initAuthStore = (): AuthStore => {
	const { subscribe, set, update } = writable<AuthStoreData>({
		identity: undefined
	});

	return {
		subscribe,

		sync: async () => {
			authClient = authClient ?? (await createAuthClient());
			const isAuthenticated: boolean = await authClient.isAuthenticated();

			set({
				identity: isAuthenticated ? authClient.getIdentity() : null
			});
		},

		signIn: ({ domain, size }: AuthSignInParams) =>
			// eslint-disable-next-line no-async-promise-executor
			new Promise<void>(async (resolve, reject) => {
				authClient = authClient ?? (await createAuthClient());

				// Juno Docker Container
				const container = import.meta.env.VITE_CONTAINER;
				const iiId = import.meta.env.VITE_INTERNET_IDENTITY_ID;

				const identityProvider =
					nonNullish(container) && nonNullish(iiId)
						? /apple/i.test(navigator?.vendor)
							? `${LOCAL_REPLICA_URL}?canisterId=${iiId}`
							: `http://${iiId}.${LOCAL_REPLICA_HOST}`
						: `https://identity.${domain ?? 'ic0.app'}`;

				await authClient?.login({
					maxTimeToLive: AUTH_MAX_TIME_TO_LIVE,
					onSuccess: () => {
						update((state: AuthStoreData) => ({
							...state,
							identity: authClient?.getIdentity()
						}));

						resolve();
					},
					onError: reject,
					identityProvider,
					windowOpenerFeatures: popupCenter({
						width: size?.width ?? AUTH_POPUP_WIDTH,
						height: size?.height ?? AUTH_POPUP_HEIGHT
					})
				});
			}),

		signOut: async () => {
			const client: AuthClient = authClient ?? (await createAuthClient());

			await client.logout();

			// This fix a "sign in -> sign out -> sign in again" flow without window reload.
			authClient = null;

			update((state: AuthStoreData) => ({
				...state,
				identity: null
			}));
		}
	};
};

export const authStore = initAuthStore();

export const authRemainingTimeStore = writable<number | undefined>(undefined);
