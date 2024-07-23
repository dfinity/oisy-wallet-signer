<script lang="ts">
	import { authStore } from '$core/stores/auth.store';
	import IconSignOut from '$core/components/IconSignOut.svelte';

	const onclick = async () => {
		await authStore.signOut();
	};
</script>

<button {onclick} class="flex gap-1 items-center my-12 text-sm" data-tid="logout-button"
	><IconSignOut /> Sign-out</button
>
