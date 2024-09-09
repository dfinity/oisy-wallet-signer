<script lang="ts">
	import Layout from '$core/components/Layout.svelte';
	import '$core/styles/app.scss';
	import type { Snippet } from 'svelte';
	import {DEFAULT_SIGNER_WINDOW_SIZE} from "@dfinity/oisy-wallet-signer";

	const size = DEFAULT_SIGNER_WINDOW_SIZE;

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

{#snippet title()}
	Wallet 👛
{/snippet}

<Layout {title} {size}>
	{@render children()}
</Layout>
