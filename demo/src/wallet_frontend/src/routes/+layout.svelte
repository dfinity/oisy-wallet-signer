<script lang="ts">
	import { DEFAULT_SIGNER_WINDOW_SIZE } from '@dfinity/oisy-wallet-signer';
	import type { Snippet } from 'svelte';
	import Layout from '$core/components/Layout.svelte';
	import '$core/styles/app.scss';

	const size = DEFAULT_SIGNER_WINDOW_SIZE;

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

{#snippet title()}
	Wallet
{/snippet}

{#snippet description()}
	A demo wallet that uses the Oisy Wallet Signer library to sign messages.
{/snippet}

<Layout {title} {description} {size}>
	{@render children()}
</Layout>
