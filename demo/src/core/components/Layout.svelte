<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import { authStore } from '../stores/auth.store';
	import { browser } from '$app/environment';
	import Alert from '$core/components/Alert.svelte';
	import Footer from '$core/components/Footer.svelte';
	import SignIn from '$core/components/SignIn.svelte';
	import SignOut from '$core/components/SignOut.svelte';
	import { signedIn } from '$core/derived/auth.derived';

	interface Props {
		size?: {
			width: number;
			height: number;
		};
		children: Snippet;
		title: Snippet;
		ambient?: Snippet;
		description: Snippet;
	}

	let { size, children, title, description, ambient }: Props = $props();

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

		{@render ambient?.()}

		{@render children()}
	</main>

	<Footer />

	<Alert />
</div>
