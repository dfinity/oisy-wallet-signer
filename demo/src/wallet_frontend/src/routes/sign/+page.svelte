<script lang="ts">
	import { notSignedIn } from '$core/derived/auth.derived';
	import { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import UserId from '$core/components/UserId.svelte';
	import Balance from '$core/components/Balance.svelte';
	import ConfirmPermissions from '$lib/ConfirmPermissions.svelte';
	import { authStore } from '$core/stores/auth.store';
	import { isNullish } from '@dfinity/utils';
	import ConfirmAccounts from '$lib/ConfirmAccounts.svelte';
	import ConsentMessage from '$lib/ConsentMessage.svelte';
	import GetICP from '$lib/GetICP.svelte';
	import CallCanister from '$lib/CallCanister.svelte';
	import { LOCAL_REPLICA_URL } from '$core/constants/app.constants';

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
			host: LOCAL_REPLICA_URL
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
