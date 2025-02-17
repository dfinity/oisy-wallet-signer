<script lang="ts">
	import { browser } from '$app/environment';
	import { authStore } from '../stores/auth.store';
	import { signedIn } from '$core/derived/auth.derived';
	import SignIn from '$core/components/SignIn.svelte';
	import SignOut from '$core/components/SignOut.svelte';
	import { fade } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import Footer from '$core/components/Footer.svelte';
	import Alert from '$core/components/Alert.svelte';

	type Props = {
		size?: {
			width: number;
			height: number;
		};
		children: Snippet;
		title: Snippet;
		description: Snippet;
	};

	let { size, children, title, description }: Props = $props();

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

<div class="relative isolate min-h-[100dvh]">
	<main
		class="mx-auto max-w-(--breakpoint-2xl) py-16 px-8 md:px-24 [@media(min-height:800px)]:min-h-[calc(100dvh-128px)]"
	>
		<h1 class="dark:text-white text-5xl md:text-6xl font-bold tracking-tight md:pt-12 pb-4">
			{@render title()}
		</h1>

		{#await init()}
			<p class="animate-pulse dark:text-white py-4 md:max-w-lg">Loading...</p>
		{:then _}
			{#if $signedIn}
				<div in:fade>
					{@render children()}

					<SignOut />
				</div>
			{:else}
				<div in:fade>
					<p class="dark:text-white pb-4 md:max-w-lg">
						{@render description()}
					</p>

					<SignIn {size} />
				</div>
			{/if}
		{/await}
	</main>

	<Footer />

	<Alert />
</div>
