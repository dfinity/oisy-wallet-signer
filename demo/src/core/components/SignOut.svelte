<script lang="ts">
	import { authStore } from '$core/stores/auth.store';
	import IconSignOut from '$core/components/IconSignOut.svelte';

	const onclick = async () => {
		await authStore.signOut();
	};
</script>

<button
		data-tid="logout-button"
		type="button"
		{onclick}
		class="dark:text-white flex items-center gap-2 mt-24 hover:text-lavender-blue-500 active:text-lavender-blue-400"
>
	<svg
			xmlns="http://www.w3.org/2000/svg"
			height="24"
			viewBox="0 -960 960 960"
			width="24"
			fill="currentColor"
	>
		<path
				d="M120-120v-720h360v80H200v560h280v80H120Zm520-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"
		/>
	</svg>
	<span>
		Logout
	</span>
</button>