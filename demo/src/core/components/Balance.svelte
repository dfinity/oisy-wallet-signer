<script lang="ts">
    import {createAgent, isNullish} from '@dfinity/utils';
	import { AccountIdentifier, LedgerCanister } from '@dfinity/ledger-icp';
	import { ICP_LEDGER_CANISTER_ID } from '../constants/app.constants';
	import { formatE8sICP } from '../utils/icp.utils';
	import { AnonymousIdentity } from '@dfinity/agent';
    import type {Principal} from "@dfinity/principal";
    import { authStore } from '../stores/auth.store';

	let balance = $state(0n);

	const loadBalance = async (owner: Principal | undefined | null) => {
        if (isNullish(owner)) {
            balance = 0n;
            return
        }

        const agent = await createAgent({
			identity: new AnonymousIdentity(),
			host: 'http://localhost:4943',
			fetchRootKey: true
		});

		const { accountBalance } = LedgerCanister.create({
			agent,
			canisterId: ICP_LEDGER_CANISTER_ID
		});

		balance = await accountBalance({ accountIdentifier: AccountIdentifier.fromPrincipal({principal: owner}), certified: false });
	};

	$effect(() => {
		(async () => {
            await loadBalance($authStore.identity.getPrincipal());
		})();
	});

	export const reload = async () => {
		await loadBalance($authStore.identity.getPrincipal());
	};
</script>

<p class="font-bold text-sm mt-3">Current balance:</p>
<p class="text-sm mb-2 break-words"><output>{formatE8sICP(balance)} ICP</output></p>
