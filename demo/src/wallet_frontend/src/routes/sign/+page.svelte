<script lang="ts">
	import { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish } from '@dfinity/utils';
	import Balance from '$core/components/Balance.svelte';
	import UserId from '$core/components/UserId.svelte';
	import { LOCAL_REPLICA_URL, PROD } from '$core/constants/app.constants';
	import { notSignedIn } from '$core/derived/auth.derived';
	import { authStore } from '$core/stores/auth.store';
	import CallCanister from '$lib/CallCanister.svelte';
	import ConfirmAccounts from '$lib/ConfirmAccounts.svelte';
	import ConfirmPermissions from '$lib/ConfirmPermissions.svelte';
	import ConsentMessage from '$lib/ConsentMessage.svelte';
	import GetICP from '$lib/GetICP.svelte';

	let signer = $state<Signer | undefined>(undefined);

	$effect(() => {
		if ($notSignedIn) {
			signer?.disconnect();
			return;
		}

		if (isNullish($authStore.identity)) {
			signer?.disconnect();
			return;
		}

		signer = Signer.init({
			owner: $authStore.identity,
			...(!PROD && { host: LOCAL_REPLICA_URL })
		});

		return () => {
			signer?.disconnect();
		};
	});
</script>

<UserId user={$authStore?.identity?.getPrincipal()} />

<Balance owner={$authStore.identity?.getPrincipal()} />

<GetICP />

<ConfirmPermissions {signer} />

<ConfirmAccounts {signer} />

<ConsentMessage {signer} />

<CallCanister {signer} />
