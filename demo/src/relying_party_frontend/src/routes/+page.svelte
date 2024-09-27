<script lang="ts">
	import UserId from '$core/components/UserId.svelte';
	import Balance from '$core/components/Balance.svelte';
	import GetICP from '$lib/components/GetICP.svelte';
	import SendICP from '$lib/components/SendICP.svelte';
</script>

<p class="dark:text-white mb-4">
	Get and send 0.05 ICP (minus fees) to your Oisy Wallet using the signer standards.
</p>

<UserId shorten />

<Balance />

<div class="flex mt-4 gap-4">
	<GetICP />

	<SendICP />
</div>
