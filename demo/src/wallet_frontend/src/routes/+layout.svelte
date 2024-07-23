<script lang="ts">
	import Layout from '$core/components/Layout.svelte';
	import '$core/styles/app.scss';
	import { WALLET_POPUP_HEIGHT, WALLET_POPUP_WIDTH } from '$core/constants/app.constants';
	import type { Snippet } from 'svelte';

	const size = {
		width: WALLET_POPUP_WIDTH,
		height: WALLET_POPUP_HEIGHT
	};

	type Props = {
		children: Snippet;
	};

	let { children } = $props<Props>();
</script>

{#snippet title()}
	Wallet 👛
{/snippet}

<Layout {title} {size}>
	{@render children()}
</Layout>
