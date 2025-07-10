<script lang="ts">
	import { isNullish } from '@dfinity/utils';
	import type { Snippet } from 'svelte';
	import IconChevronDown from '$core/components/IconChevronDown.svelte';

	interface Props {
		value: Option<string>;
		disabled?: boolean;
		onchange?: () => void;
		children: Snippet;
		name: string;
	}

	let { value = $bindable(), disabled = false, onchange, children, name }: Props = $props();
</script>

<div class="relative w-fit md:w-96" class:opacity-20={disabled}>
	<select
		bind:value
		{onchange}
		class:text-gray-400={isNullish(value)}
		{disabled}
		{name}
		class="transition-all w-full h-8 pr-12 pl-2 outline-none border-black dark:border-lavender-blue-500 border-[3px] rounded bg-white dark:bg-black dark:text-white hover:text-white hover:bg-lavender-blue-600 dark:hover:bg-lavender-blue-300 dark:hover:text-black active:bg-lavender-blue-400 dark:active:bg-lavender-blue-500"
	>
		{@render children()}
	</select>

	<div class="absolute top-[50%] -translate-y-1/2 right-0 p-5 pointer-events-none">
		<IconChevronDown size="32px" />
	</div>
</div>
