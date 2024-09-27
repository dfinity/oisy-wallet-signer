<script lang="ts">
	import UserId from '$core/components/UserId.svelte';
	import Balance from '$core/components/Balance.svelte';
	import GetICP from '$lib/components/GetICP.svelte';
</script>

<UserId />

<Balance />

<div class="flex mt-4 gap-4">
	<GetICP />
</div>
