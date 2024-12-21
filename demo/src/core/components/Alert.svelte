<script lang="ts">
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { fly } from 'svelte/transition';
	import { alertStore } from '$core/stores/alert.store';

	$effect(() => {
		if (isNullish($alertStore)) {
			return;
		}

		if ($alertStore.type !== 'success') {
			return;
		}

		if (isNullish($alertStore.duration) || $alertStore.duration === 0) {
			return;
		}

		setTimeout(alertStore.reset, $alertStore.duration);
	});
</script>

{#if nonNullish($alertStore)}
	<div
		role="alert"
		class={`alert alert-${$alertStore.type} absolute w-full max-w-lg left-1/2 transform -translate-x-1/2 top-6 z-10 border-black dark:border-lavender-blue-500 border-[3px] rounded-sm py-1 px-3 my-2 text-white bg-lavender-blue-500 dark:bg-black shadow-[5px_5px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_#7888ff]`}
		transition:fly={{ y: -20, duration: 300 }}
	>
		<div class="flex justify-between items-center">
			<div class="flex gap-4">
				{#if $alertStore.type === 'error'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current mr-2"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				{:else if $alertStore.type === 'success'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				{/if}
				<span>{$alertStore.message}</span>
			</div>
			<button onclick={alertStore.reset} class="ml-4 text-xl font-bold cursor-pointer"
				>&times;</button
			>
		</div>
	</div>
{/if}
