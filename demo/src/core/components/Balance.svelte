<script lang="ts">
	import { createAgent, isNullish } from '@dfinity/utils';
	import { AccountIdentifier, IcpLedgerCanister } from '@icp-sdk/canisters/ledger/icp';
	import { AnonymousIdentity } from '@icp-sdk/core/agent';
	import type { Principal } from '@icp-sdk/core/principal';
	import { formatE8sICP } from '../utils/icp.utils';
	import Value from '$core/components/Value.svelte';
	import { DEV, LOCAL_REPLICA_URL } from '$core/constants/app.constants';

	interface Props {
		owner: Principal | undefined | null;
	}

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

		const { accountBalance } = IcpLedgerCanister.create({
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
