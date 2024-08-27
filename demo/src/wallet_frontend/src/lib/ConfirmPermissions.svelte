<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { ICRC25_REQUEST_PERMISSIONS, type IcrcScope } from '@dfinity/oisy-wallet-signer';
	import Button from '$core/components/Button.svelte';
	import type {
		PermissionsConfirmation,
		PermissionsPromptPayload
	} from '@dfinity/oisy-wallet-signer/types/signer-prompts';

	type Props = {
		signer: Signer | undefined;
	};

	let { signer }: Props = $props();

	let scopes: IcrcScope[] | undefined = $state(undefined);
	let confirm: PermissionsConfirmation | undefined = $state(undefined);

	const sortScope = (
		{ scope: { method: methodA } }: IcrcScope,
		{ scope: { method: methodB } }: IcrcScope
	): number => methodA.localeCompare(methodB);

	const resetPrompt = () => {
		confirm = undefined;
		scopes = undefined;
	};

	$effect(() => {
		if (isNullish(signer)) {
			resetPrompt();
			return;
		}

		signer.register({
			method: ICRC25_REQUEST_PERMISSIONS,
			prompt: ({ confirmScopes, requestedScopes }: PermissionsPromptPayload) => {
				confirm = confirmScopes;
				scopes = requestedScopes;
			}
		});
	});

	const onsubmit = async ($event: SubmitEvent) => {
		$event.preventDefault();

		// TODO: alert errors

		confirm?.($state.snapshot(scopes)!);

		resetPrompt();
	};

	const onToggle = (scope: IcrcScope) => {
		scopes = [
			...(scopes ?? []).filter(({ scope: { method } }) => method !== scope.scope.method),
			{
				...scope,
				state: scope.state === 'denied' ? 'granted' : 'denied'
			} as IcrcScope
		].sort(sortScope);
	};

	let countApproved = $derived((scopes ?? []).filter(({ state }) => state === 'granted').length);
</script>

{#if nonNullish(scopes)}
	<form
		{onsubmit}
		method="POST"
		class="bg-grey rounded-md px-4 py-6 mt-4 max-w-xl"
		in:fade
		data-tid="requested-permissions"
	>
		<p class="font-bold">Requested Permissions</p>

		<ul class="mt-2 mb-4 text-sm" data-tid="requested-permissions-list">
			{#each scopes as scope}
				<li>
					<input type="checkbox" onchange={() => onToggle(scope)} class="mr-1" />
					{scope.scope.method}
				</li>
			{/each}
		</ul>

		<Button type="submit" testId="submit-permissions-button">Submit</Button>

		<p><small>{countApproved} permissions approved</small></p>
	</form>
{/if}
