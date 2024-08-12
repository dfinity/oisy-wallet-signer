<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import {
		ICRC25_REQUEST_PERMISSIONS,
		type IcrcScope,
		type RpcId
	} from '@dfinity/oisy-wallet-signer';
	import Button from '$core/components/Button.svelte';

	type Props = {
		signer: Signer | undefined;
	};

	let { signer }: Props = $props();

	let scopes: IcrcScope[] | undefined = $state(undefined);
	let id: RpcId | undefined = $state(undefined);

	$effect(() => {
		if (isNullish(signer)) {
			return;
		}

		signer.on({
			method: ICRC25_REQUEST_PERMISSIONS,
			callback: ({
				scopes: scopesToApprove,
				id: requestId
			}: {
				id: RpcId;
				scopes: IcrcScope[];
			}) => {
				scopes = scopesToApprove;
				id = requestId;
			}
		});
	});

	const onsubmit = ($event: SubmitEvent) => {
		$event.preventDefault();

		// TODO: alert errors

		signer?.approvePermissions({
			id: $state.snapshot(id)!,
			scopes: $state.snapshot(scopes)!
		});

		// TODO: reset
	};

	const onToggle = (scope: IcrcScope) => {
		scopes = [
			...(scopes ?? []).filter(({ scope: { method } }) => method !== scope.scope.method),
			{
				...scope,
				state: scope.state === 'denied' ? 'granted' : 'denied'
			}
		];
	};
</script>

{#if nonNullish(scopes)}
	<form {onsubmit} method="POST" class="bg-grey rounded-md px-4 py-6 mt-4 max-w-xl" in:fade>
		<p class="font-bold">Grant Permissions</p>

		<ul class="mt-2 mb-4 text-sm">
			{#each scopes as scope}
				<li>
					<input type="checkbox" onchange={() => onToggle(scope)} class="mr-1" />
					{scope.scope.method}
				</li>
			{/each}
		</ul>

		<Button type="submit" testId="grant-permissions-button">Grant permissions</Button>
	</form>
{/if}
