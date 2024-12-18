<script lang="ts">
	import { createAgent, isNullish } from '@dfinity/utils';
	import { AccountIdentifier, LedgerCanister } from '@dfinity/ledger-icp';
	import { formatE8sICP } from '../utils/icp.utils';
	import { AnonymousIdentity } from '@dfinity/agent';
	import type { Principal } from '@dfinity/principal';
	import Value from '$core/components/Value.svelte';
	import { DEV, LOCAL_REPLICA_URL } from '$core/constants/app.constants';

	type Props = {
		owner: Principal | undefined | null;
	};

	let { owner }: Props = $props();

	let balance = $state(0n);

	const loadBalance = async (owner: Principal | undefined | null) => {
		if (isNullish(owner)) {
			balance = 0n;
			return;
		}

		const agent = await createAgent({
			identity: new AnonymousIdentity(),
			...(DEV && { host: LOCAL_REPLICA_URL, fetchRootKey: true })
		});

		const { accountBalance } = LedgerCanister.create({
			agent
		});

		balance = await accountBalance({
			accountIdentifier: AccountIdentifier.fromPrincipal({ principal: owner }),
			certified: false
		});
	};

	$effect(() => {
		(async () => {
			await loadBalance(owner);
		})();
	});

	export const onoisyDemoReloadBalance = async () => {
		await loadBalance(owner);
	};
</script>

<svelte:window {onoisyDemoReloadBalance} />

<Value id="icp-balance-section" title="Balance">
	<output data-tid="icp-balance">{formatE8sICP(balance)} ICP</output>
</Value>
