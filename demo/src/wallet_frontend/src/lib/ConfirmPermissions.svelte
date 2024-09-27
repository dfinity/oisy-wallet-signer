<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { ICRC25_REQUEST_PERMISSIONS, type IcrcScope } from '@dfinity/oisy-wallet-signer';
	import Button from '$core/components/Button.svelte';
	import Article from '$core/components/Article.svelte';
	import type {
		PermissionsConfirmation,
		PermissionsPromptPayload
	} from '@dfinity/oisy-wallet-signer';

	type Props = {
		signer: Signer | undefined;
	};

	let { signer }: Props = $props();

	let scopes = $state<IcrcScope[] | undefined>(undefined);
	let confirm = $state<PermissionsConfirmation | undefined>(undefined);

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
			prompt: ({ confirm: confirmScopes, requestedScopes }: PermissionsPromptPayload) => {
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
	<Article>
		<form {onsubmit} method="POST" in:fade data-tid="requested-permissions">
			<p class="font-bold dark:text-white">Requested Permissions</p>

			<ul class="mt-2 mb-4 dark:text-white" data-tid="requested-permissions-list">
				{#each scopes as scope}
					<li>
						<input type="checkbox" onchange={() => onToggle(scope)} class="mr-1" />
						{scope.scope.method}
					</li>
				{/each}
			</ul>

			<Button type="submit" testId="submit-permissions-button">Submit</Button>

			<p class="mt-4"><small>{countApproved} permissions approved</small></p>
		</form>
	</Article>
{/if}
