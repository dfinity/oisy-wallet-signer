<script lang="ts">
	import { browser } from '$app/environment';
	import { authStore } from '../stores/auth.store';
	import { signedIn } from '$core/derived/auth.derived';
	import SignIn from '$core/components/SignIn.svelte';
	import SignOut from '$core/components/SignOut.svelte';
	import { fade } from 'svelte/transition';

	type Props = {
		size?: {
			width: number;
			height: number;
		};
	};

	let { size } = $props<Props>();

	const init = async () => await Promise.all([syncAuthStore()]);

	const syncAuthStore = async () => {
		if (!browser) {
			return;
		}

		try {
			await authStore.sync();
		} catch (err: unknown) {
			console.error('Cannot sync authentication.', err);
		}
	};
</script>

<svelte:window on:storage={syncAuthStore} />

<main class="w-[100%] h-[100%] p-8">
	<h1 class="text-4xl pb-4 underline underline-offset-8"><slot name="title" /></h1>

	{#await init()}
		<p class="animate-pulse text-sm">Loading...</p>
	{:then _}
		{#if $signedIn}
			<div in:fade>
				<slot />

				<SignOut />
			</div>
		{:else}
			<div in:fade>
				<SignIn {size} />
			</div>
		{/if}
	{/await}
</main>
