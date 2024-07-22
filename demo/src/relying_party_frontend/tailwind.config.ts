import { tailwindConfig } from '../../tailwind.config';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}', '../core/components/**/*.{html,js,svelte,ts}'],
	...tailwindConfig
};
