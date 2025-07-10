// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

/* eslint-disable */

declare module 'svelte/elements' {
	interface HTMLAttributes<T> {
		onoisyDemoReloadPermissions?: (event: CustomEvent<any>) => void;
		onoisyDemoReloadBalance?: (event: CustomEvent<any>) => void;
	}
}

/* eslint-enable */

export {};
